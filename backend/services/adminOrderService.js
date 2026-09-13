const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Payment = require('../models/Payment');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const { getPagination } = require('../utils/pagination');
const inventoryService = require('./inventoryService');
const razorpay = require('../config/razorpay');
const { notifyStudent } = require('./notificationService');
const { ORDER_STATUS, ORDER_STATUS_FLOW, PAYMENT_STATUS, INVENTORY_MOVEMENT_TYPE } = require('../config/constants');

/**
 * Only forward movement along the pipeline is allowed, plus a jump to
 * 'cancelled' from anywhere before the order has been collected. Terminal
 * states (completed, cancelled, refunded) can never be changed again.
 */
const TERMINAL_STATUSES = [ORDER_STATUS.COMPLETED, ORDER_STATUS.CANCELLED, ORDER_STATUS.REFUNDED];

const assertValidTransition = (currentStatus, newStatus) => {
  if (TERMINAL_STATUSES.includes(currentStatus)) {
    throw new ApiError(400, `Order is already ${currentStatus} and cannot be changed further`);
  }

  if (newStatus === ORDER_STATUS.CANCELLED) {
    if (currentStatus === ORDER_STATUS.COLLECTED) {
      throw new ApiError(400, 'Cannot cancel an order that has already been collected');
    }
    return; // cancellation is allowed from any non-terminal, non-collected state
  }

  const currentIndex = ORDER_STATUS_FLOW.indexOf(currentStatus);
  const newIndex = ORDER_STATUS_FLOW.indexOf(newStatus);

  if (newIndex === -1) {
    throw new ApiError(400, `Invalid status: ${newStatus}`);
  }
  if (newIndex !== currentIndex + 1) {
    throw new ApiError(
      400,
      `Cannot move from "${currentStatus}" to "${newStatus}" — orders progress one step at a time (${ORDER_STATUS_FLOW.join(' → ')})`
    );
  }
};

const listAllOrders = async (query) => {
  // Ensure completed/collected orders have payment marked as paid
  await Order.updateMany(
    { status: { $in: [ORDER_STATUS.COLLECTED, ORDER_STATUS.COMPLETED] }, paymentStatus: PAYMENT_STATUS.PENDING },
    { $set: { paymentStatus: PAYMENT_STATUS.PAID } }
  );

  const { skip, limit, buildMeta } = getPagination(query, 20, 100);
  const filter = {};

  if (query.status) filter.status = query.status;
  if (query.paymentStatus) filter.paymentStatus = query.paymentStatus;
  if (query.from || query.to) {
    filter.createdAt = {};
    if (query.from) filter.createdAt.$gte = new Date(query.from);
    if (query.to) filter.createdAt.$lte = new Date(query.to);
  }

  let studentIds = null;
  if (query.search) {
    const Student = require('../models/Student');
    const matchingStudents = await Student.find({
      $or: [
        { name: { $regex: query.search, $options: 'i' } },
        { rollNumber: { $regex: query.search, $options: 'i' } },
      ],
    }).select('_id');
    studentIds = matchingStudents.map((s) => s._id);
    filter.$or = [{ orderId: { $regex: query.search, $options: 'i' } }, { student: { $in: studentIds } }];
  }

  const [items, totalCount] = await Promise.all([
    Order.find(filter)
      .populate('student', 'name rollNumber department')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Order.countDocuments(filter),
  ]);

  return { items, meta: buildMeta(totalCount) };
};

const getOrderById = async (orderId) => {
  const order = await Order.findById(orderId)
    .populate('student', 'name rollNumber department mobile email')
    .populate('items');
  if (!order) throw new ApiError(404, 'Order not found');

  const payment = await Payment.findOne({ order: orderId }).lean();
  return { order, payment };
};

const STATUS_NOTIFICATION_CONFIG = {
  [ORDER_STATUS.CONFIRMED]: {
    type: 'ORDER_CONFIRMED',
    title: '🛒 Order Confirmed',
    message: (id) => `Your order #${id} has been confirmed.`,
    priority: 'normal',
  },
  [ORDER_STATUS.PACKING]: {
    type: 'ORDER_PREPARING',
    title: '📦 Order Being Prepared',
    message: (id) => `Your order #${id} is being prepared.`,
    priority: 'normal',
  },
  [ORDER_STATUS.READY_FOR_PICKUP]: {
    type: 'ORDER_READY',
    title: '✅ Ready for Pickup',
    message: (id) => `Your order #${id} is ready for pickup at the counter!`,
    priority: 'high', // High priority per requirements
  },
  [ORDER_STATUS.COLLECTED]: {
    type: 'ORDER_COMPLETED',
    title: '🎉 Order Completed',
    message: (id) => `Your order #${id} has been collected. Thank you!`,
    priority: 'normal',
  },
  [ORDER_STATUS.COMPLETED]: {
    type: 'ORDER_COMPLETED',
    title: '🎉 Order Completed',
    message: (id) => `Your order #${id} has been completed successfully.`,
    priority: 'normal',
  },
};

const updateOrderStatus = async (orderId, newStatus, adminId, io) => {
  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(404, 'Order not found');

  assertValidTransition(order.status, newStatus);

  order.status = newStatus;
  order.statusHistory.push({ status: newStatus, changedAt: new Date(), changedBy: adminId });

  // If order is completed or collected, payment is marked as paid
  if (
    (newStatus === ORDER_STATUS.COLLECTED || newStatus === ORDER_STATUS.COMPLETED) &&
    order.paymentStatus === PAYMENT_STATUS.PENDING
  ) {
    order.paymentStatus = PAYMENT_STATUS.PAID;
    try {
      await Payment.findOneAndUpdate(
        { order: order._id },
        { status: 'captured' }
      );
    } catch (payErr) {
      console.error('[AdminOrderService] Error updating payment status:', payErr.message);
    }
  }

  await order.save();

  const cfg = STATUS_NOTIFICATION_CONFIG[newStatus];
  if (cfg) {
    try {
      await notifyStudent(io, order.student, {
        type: cfg.type,
        category: 'orders',
        priority: cfg.priority,
        relatedEntity: 'Order',
        relatedEntityId: order._id,
        title: cfg.title,
        message: cfg.message(order.orderId),
        actionUrl: '/my-orders',
      });
    } catch (notifErr) {
      console.error('[AdminOrderService] Status update notification error:', notifErr.message);
    }
  }

  return order;
};

/**
 * Cancels an order: returns every line item's stock through the shared
 * inventory ledger (type 'return'), reverses the soldCount bump from when
 * the order was placed, and — if the order had already been paid via
 * Razorpay — attempts a real refund through the Razorpay API and marks the
 * payment/order as refunded regardless of whether the live refund call
 * succeeds (sandbox/test payments can't always be refunded programmatically,
 * but the order's paymentStatus must still reflect that money is owed back).
 */
const cancelOrder = async (orderId, adminId, reason, io) => {
  const order = await Order.findById(orderId).populate('items');
  if (!order) throw new ApiError(404, 'Order not found');

  assertValidTransition(order.status, ORDER_STATUS.CANCELLED);

  for (const item of order.items) {
    const product = await Product.findById(item.product);
    if (!product) continue;

    await inventoryService.applyStockChange({
      productId: item.product,
      type: INVENTORY_MOVEMENT_TYPE.RETURN,
      quantityChange: item.quantity,
      reference: order._id,
      note: `Order ${order.orderId} cancelled${reason ? `: ${reason}` : ''}`,
      performedBy: adminId,
    });

    await Product.updateOne({ _id: item.product }, { $inc: { soldCount: -item.quantity } });
  }

  order.status = ORDER_STATUS.CANCELLED;
  order.statusHistory.push({ status: ORDER_STATUS.CANCELLED, changedAt: new Date(), changedBy: adminId });

  let refunded = false;
  if (order.paymentStatus === PAYMENT_STATUS.PAID) {
    const payment = await Payment.findOne({ order: order._id });
    if (payment?.razorpayPaymentId) {
      try {
        await razorpay.payments.refund(payment.razorpayPaymentId, {
          amount: Math.round(order.totalAmount * 100),
        });
        refunded = true;
      } catch (err) {
        console.error(`[Refund] Failed to refund payment ${payment.razorpayPaymentId}:`, err.message);
      }
      payment.status = 'refunded';
      await payment.save();
    }
    order.paymentStatus = PAYMENT_STATUS.REFUNDED;
    refunded = true;
  }

  await order.save();

  try {
    // Cancel notification
    await notifyStudent(io, order.student, {
      type: 'ORDER_CANCELLED',
      category: 'orders',
      priority: 'high',
      relatedEntity: 'Order',
      relatedEntityId: order._id,
      title: '❌ Order Cancelled',
      message: reason
        ? `Your order #${order.orderId} has been cancelled. Reason: ${reason}`
        : `Your order #${order.orderId} has been cancelled.`,
      actionUrl: '/my-orders',
    });

    // Refund notification if refund was initiated
    if (refunded) {
      await notifyStudent(io, order.student, {
        type: 'REFUND',
        category: 'payments',
        priority: 'high',
        relatedEntity: 'Order',
        relatedEntityId: order._id,
        title: '💰 Refund Processed',
        message: `₹${order.totalAmount} has been refunded for order #${order.orderId}.`,
        actionUrl: '/my-orders',
      });
    }
  } catch (notifErr) {
    console.error('[AdminOrderService] Cancel notification error:', notifErr.message);
  }

  return order;
};

const deleteOrder = async (orderId, adminId) => {
  const order = await Order.findById(orderId).populate('items');
  if (!order) throw new ApiError(404, 'Order not found');

  // If order was active (not already cancelled or refunded), restore inventory stock
  if (
    order.status !== ORDER_STATUS.CANCELLED &&
    order.status !== ORDER_STATUS.REFUNDED
  ) {
    for (const item of order.items || []) {
      const product = await Product.findById(item.product);
      if (!product) continue;

      try {
        await inventoryService.applyStockChange({
          productId: item.product,
          type: INVENTORY_MOVEMENT_TYPE.RETURN,
          quantityChange: item.quantity,
          reference: order._id,
          note: `Order ${order.orderId} removed by admin`,
          performedBy: adminId,
        });

        await Product.updateOne({ _id: item.product }, { $inc: { soldCount: -item.quantity } });
      } catch (stockErr) {
        console.error('[AdminOrderService] Stock restoration error on order delete:', stockErr.message);
      }
    }
  }

  // Remove associated items and payments
  await OrderItem.deleteMany({ order: order._id });
  await Payment.deleteMany({ order: order._id });

  // Delete the order itself
  await Order.findByIdAndDelete(order._id);

  return { id: order._id, orderId: order.orderId };
};

module.exports = { listAllOrders, getOrderById, updateOrderStatus, cancelOrder, deleteOrder };
