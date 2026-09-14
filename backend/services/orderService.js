const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Product = require('../models/Product');
const Payment = require('../models/Payment');
const Student = require('../models/Student');

const ApiError = require('../utils/ApiError');

const cartService = require('./cartService');
const couponService = require('./couponService');
const inventoryService = require('./inventoryService');
const razorpayService = require('./razorpayService');

const {
  notifyAdmin,
  notifyStudent,
} = require('./notificationService');

const {
  INVENTORY_MOVEMENT_TYPE,
  ORDER_STATUS,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
} = require('../config/constants');

const {
  serializeImages,
  serializeImage,
} = require('../utils/imageUtils');


/* =========================================================
   ORDER ID GENERATION
========================================================= */


/**
 * Generate the next order ID.
 *
 * Example:
 * ORD1001
 * ORD1002
 * ORD1003
 */
const generateNextOrderId = async () => {
  const lastOrder = await Order.findOne()
    .sort({ _id: -1 })
    .select('orderId')
    .lean();

  let nextNum = 1001;

  if (lastOrder?.orderId) {
    const match =
      lastOrder.orderId.match(/(\d+)$/);

    if (match) {
      nextNum =
        parseInt(match[1], 10) + 1;
    }
  }

  return `ORD${nextNum}`;
};


/* =========================================================
   ORDER SERIALIZATION
========================================================= */


/**
 * Convert an Order document into a frontend-safe object.
 *
 * OrderItem.image is already stored as a serialized
 * image in buildOrderFromCart, but serializeImage()
 * safely handles both:
 *
 * - Base64 strings
 * - Buffers
 * - MongoDB Binary
 * - image objects
 */
const serializeOrder = (orderDoc) => {
  if (!orderDoc) {
    return orderDoc;
  }

  const plain =
    typeof orderDoc.toObject === 'function'
      ? orderDoc.toObject()
      : { ...orderDoc };

  if (Array.isArray(plain.items)) {
    plain.items = plain.items.map(
      (item) => {
        const plainItem =
          typeof item.toObject === 'function'
            ? item.toObject()
            : { ...item };

        plainItem.image =
          serializeImage(
            plainItem.image
          );

        return plainItem;
      }
    );
  }

  return plain;
};


/* =========================================================
   BUILD ORDER FROM CART
========================================================= */


/**
 * Shared order-building logic used by:
 *
 * 1. Cash on Pickup
 * 2. Razorpay
 *
 * Responsibilities:
 *
 * - Get current cart
 * - Re-check product availability
 * - Re-check stock
 * - Re-check coupon
 * - Calculate final amount
 * - Create Order
 * - Create OrderItems
 * - Deduct inventory
 * - Increase soldCount
 * - Notify admin about stock
 * - Consume coupon
 * - Clear cart
 *
 * Stock is reserved immediately when an order
 * is created to prevent overselling.
 */
const buildOrderFromCart = async (
  studentId,
  {
    pickupTime,
    paymentMethod,
  },
  io
) => {

  /* ---------------------------------------------------------
     GET CART
  --------------------------------------------------------- */

  const summary =
    await cartService.getCartSummary(
      studentId
    );

  if (
    !summary.items ||
    !summary.items.length
  ) {
    throw new ApiError(
      400,
      'Your cart is empty'
    );
  }


  /* ---------------------------------------------------------
     REVALIDATE PRODUCTS AND STOCK
  --------------------------------------------------------- */

  const products = new Map();

  for (const item of summary.items) {
    const product =
      await Product.findById(
        item.product._id
      );

    if (
      !product ||
      product.status !== 'active'
    ) {
      throw new ApiError(
        400,
        `${item.product.name} is no longer available`
      );
    }

    if (
      product.currentStock <
      item.quantity
    ) {
      throw new ApiError(
        400,
        `Only ${product.currentStock} units of ${product.name} are available now`
      );
    }

    products.set(
      item.product._id.toString(),
      product
    );
  }


  /* ---------------------------------------------------------
     COUPON
  --------------------------------------------------------- */

  let discountAmount =
    summary.discountAmount || 0;

  if (summary.couponCode) {
    const {
      discountAmount: freshDiscount,
    } =
      await couponService.validateCoupon(
        summary.couponCode,
        summary.subtotal
      );

    discountAmount =
      freshDiscount;
  }


  /* ---------------------------------------------------------
     TOTAL
  --------------------------------------------------------- */

  const totalAmount =
    Math.max(
      0,
      Math.round(
        (
          summary.subtotal +
          summary.gstAmount -
          discountAmount
        ) * 100
      ) / 100
    );


  /* ---------------------------------------------------------
     ORDER ID
  --------------------------------------------------------- */

  const orderId =
    await generateNextOrderId();


  /* ---------------------------------------------------------
     CREATE ORDER
  --------------------------------------------------------- */

  const order =
    await Order.create({
      orderId,

      student: studentId,

      items: [],

      itemsCount:
        summary.items.reduce(
          (sum, item) =>
            sum + item.quantity,
          0
        ),

      totalAmount,

      gstAmount:
        summary.gstAmount,

      discountAmount,

      couponCode:
        summary.couponCode || '',

      paymentMethod,

      paymentStatus:
        PAYMENT_STATUS.PENDING,

      status:
        ORDER_STATUS.PENDING,

      pickupTime:
        new Date(pickupTime),

      statusHistory: [
        {
          status:
            ORDER_STATUS.PENDING,
          changedAt:
            new Date(),
        },
      ],
    });


  /* ---------------------------------------------------------
     CREATE ORDER ITEMS
  --------------------------------------------------------- */

  const orderItemDocs =
    summary.items.map((item) => {

      /*
       * Convert product images to Base64.
       *
       * We store only the first image
       * in OrderItem.image.
       */
      const serializedProductImages =
        serializeImages(
          item.product.images || []
        );

      const image =
        serializedProductImages[0] || '';

      return {
        order: order._id,

        product:
          item.product._id,

        name:
          item.product.name,

        image,

        quantity:
          item.quantity,

        unitPrice:
          item.unitPrice,

        subtotal:
          item.subtotal,
      };
    });


  const createdItems =
    await OrderItem.insertMany(
      orderItemDocs
    );


  /* ---------------------------------------------------------
     ATTACH ORDER ITEMS
  --------------------------------------------------------- */

  order.items =
    createdItems.map(
      (item) => item._id
    );

  await order.save();


  /* ---------------------------------------------------------
     UPDATE INVENTORY
  --------------------------------------------------------- */

  for (const item of summary.items) {

    const product =
      products.get(
        item.product._id.toString()
      );

    const {
      product: updated,
    } =
      await inventoryService.applyStockChange({
        productId:
          item.product._id,

        type:
          INVENTORY_MOVEMENT_TYPE.SALE_ONLINE,

        quantityChange:
          -item.quantity,

        reference:
          order._id,

        note:
          `Online order ${orderId}`,
      });


    /* -------------------------------------------------------
       UPDATE SOLD COUNT
    ------------------------------------------------------- */

    await Product.updateOne(
      {
        _id:
          item.product._id,
      },
      {
        $inc: {
          soldCount:
            item.quantity,
        },
      }
    );


    /* -------------------------------------------------------
       STOCK ALERT
    ------------------------------------------------------- */

    if (
      updated.currentStock <= 0
    ) {

      await notifyAdmin(io, {
        type: 'stock',

        title:
          'Out of stock',

        message:
          `${product.name} is now out of stock after order ${orderId}`,

        link:
          '/admin/inventory',
      });

    } else if (
      updated.currentStock <=
      updated.minStock
    ) {

      await notifyAdmin(io, {
        type: 'stock',

        title:
          'Low stock alert',

        message:
          `${product.name} is running low (${updated.currentStock} left) after order ${orderId}`,

        link:
          '/admin/inventory',
      });
    }
  }


  /* ---------------------------------------------------------
     COUPON USAGE
  --------------------------------------------------------- */

  if (summary.couponCode) {
    await couponService.incrementCouponUsage(
      summary.couponCode
    );
  }


  /* ---------------------------------------------------------
     CLEAR CART
  --------------------------------------------------------- */

  await cartService.clearCart(
    studentId
  );


  return {
    order,
    totalAmount,
    orderId,
  };
};


/* =========================================================
   CASH ON PICKUP
========================================================= */


/**
 * Create Cash on Pickup order — DEPRECATED / REJECTED.
 * Student checkout only supports online payment via Razorpay.
 */
const createCashOrder = async () => {
  throw new ApiError(
    400,
    'Offline/cash payment methods are not supported for student online orders. Only online payment via Razorpay is accepted.'
  );
};


/* =========================================================
   RAZORPAY ORDER
========================================================= */


/**
 * Create Razorpay checkout order.
 *
 * Flow:
 *
 * React
 *   ↓
 * POST /orders/checkout
 *   ↓
 * Create local Order
 *   ↓
 * Reserve stock
 *   ↓
 * Create Razorpay Order
 *   ↓
 * Create Payment record
 *   ↓
 * Return Razorpay details
 *   ↓
 * React opens Razorpay Checkout
 */
const createRazorpayOrder = async (
  studentId,
  { pickupTime },
  io
) => {

  if (!pickupTime) {
    throw new ApiError(
      400,
      'Please choose a pickup time'
    );
  }


  /* ---------------------------------------------------------
     CREATE LOCAL ORDER
  --------------------------------------------------------- */

  const {
    order,
    orderId,
    totalAmount,
  } =
    await buildOrderFromCart(
      studentId,
      {
        pickupTime,

        paymentMethod:
          PAYMENT_METHOD.RAZORPAY,
      },
      io
    );


  /* ---------------------------------------------------------
     CREATE RAZORPAY ORDER
  --------------------------------------------------------- */

  const razorpayOrder =
    await razorpayService.createRazorpayOrder(
      totalAmount,
      orderId
    );


  /* ---------------------------------------------------------
     CREATE PAYMENT RECORD
  --------------------------------------------------------- */

  await Payment.create({
    order:
      order._id,

    razorpayOrderId:
      razorpayOrder.id,

    amount:
      totalAmount,

    status:
      'created',
  });


  /* ---------------------------------------------------------
     FETCH ORDER ITEMS
  --------------------------------------------------------- */

  const populatedOrder =
    await Order.findById(
      order._id
    ).populate('items');


  /* ---------------------------------------------------------
     RETURN CHECKOUT DATA
  --------------------------------------------------------- */

  return {
    order:
      serializeOrder(
        populatedOrder
      ),

    razorpayOrderId:
      razorpayOrder.id,

    razorpayKeyId:
      process.env.RAZORPAY_KEY_ID,

    amount:
      totalAmount,
  };
};


/* =========================================================
   GET SINGLE STUDENT ORDER
========================================================= */


/**
 * Fetch a specific order belonging
 * to the authenticated student.
 */
const getOrderForStudent = async (
  studentId,
  orderId
) => {

  const order =
    await Order.findOne({
      _id: orderId,
      student: studentId,
    }).populate('items');


  if (!order) {
    throw new ApiError(
      404,
      'Order not found'
    );
  }


  return serializeOrder(
    order
  );
};


/* =========================================================
   LIST STUDENT ORDERS
========================================================= */


/**
 * Get all orders for a student.
 */
const listOrdersForStudent = async (
  studentId
) => {

  const orders =
    await Order.find({
      student: studentId,
    })
      .sort({
        createdAt: -1,
      })
      .lean();


  return orders.map(
    (order) => {

      const items =
        Array.isArray(order.items)
          ? order.items.map(
              (item) => ({
                ...item,

                image:
                  serializeImage(
                    item.image
                  ),
              })
            )
          : [];


      return {
        ...order,
        items,
      };
    }
  );
};


/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  createCashOrder,
  createRazorpayOrder,
  getOrderForStudent,
  listOrdersForStudent,
  generateNextOrderId,
};