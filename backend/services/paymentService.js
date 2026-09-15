const crypto = require('crypto');

const Payment = require('../models/Payment');
const Order = require('../models/Order');

const ApiError = require('../utils/ApiError');
const razorpayService = require('./razorpayService');
const { notifyAdmin, notifyStudent } = require('./notificationService');

const {
  PAYMENT_STATUS,
  ORDER_STATUS,
} = require('../config/constants');

/**
 * ---------------------------------------------------------
 * MARK ORDER AS PAID
 * ---------------------------------------------------------
 *
 * Shared function used by:
 *
 * 1. Checkout verification
 * 2. Razorpay webhook
 *
 * This prevents duplicated payment/order update logic.
 */
const markOrderAsPaid = async (payment, razorpayPaymentId, io, source = 'Razorpay') => {
  const order = await Order.findById(payment.order);

  if (!order) {
    throw new ApiError(404, 'Order associated with payment was not found');
  }

  /*
   * Idempotency:
   * If the order is already paid, don't perform the
   * payment/order transition again.
   */
  const alreadyPaid =
    order.paymentStatus === PAYMENT_STATUS.PAID &&
    payment.status === 'captured';

  if (alreadyPaid) {
    return {
      order,
      alreadyProcessed: true,
    };
  }

  // Update payment
  payment.status = 'captured';

  if (razorpayPaymentId) {
    payment.razorpayPaymentId = razorpayPaymentId;
  }

  await payment.save();

  // Update application order
  order.paymentStatus = PAYMENT_STATUS.PAID;

  if (order.status === ORDER_STATUS.PENDING) {
    order.status = ORDER_STATUS.CONFIRMED;

    if (!Array.isArray(order.statusHistory)) {
      order.statusHistory = [];
    }

    order.statusHistory.push({
      status: ORDER_STATUS.CONFIRMED,
      changedAt: new Date(),
    });
  }

  await order.save();

  // Socket.IO real-time event emission
  if (io) {
    try {
      io.to('admin-room').emit('order:update', {
        orderId: order._id,
        order,
        paymentStatus: PAYMENT_STATUS.PAID,
        status: order.status,
      });
      io.to('admin-room').emit('payment:success', {
        orderId: order._id,
        order,
        paymentStatus: PAYMENT_STATUS.PAID,
      });
      if (order.student) {
        io.to(`student-${order.student}`).emit('order:update', {
          orderId: order._id,
          order,
          paymentStatus: PAYMENT_STATUS.PAID,
          status: order.status,
        });
      }
    } catch (socketErr) {
      console.error('[Payment] Socket emission error:', socketErr.message);
    }
  }

  // Notify admin and student
  try {
    await notifyAdmin(io, {
      type: 'PAYMENT_SUCCESS',
      category: 'payments',
      priority: 'high',
      relatedEntity: 'Order',
      relatedEntityId: order._id,
      title: '💳 Payment Successful',
      message: `Payment of ₹${order.totalAmount} for order #${order.orderId} was successfully received via ${source}.`,
      actionUrl: '/admin/online-orders',
    });

    if (order.student) {
      await notifyStudent(io, order.student, {
        type: 'PAYMENT_SUCCESS',
        category: 'payments',
        priority: 'high',
        relatedEntity: 'Order',
        relatedEntityId: order._id,
        title: '💳 Payment Successful',
        message: `Your payment of ₹${order.totalAmount} for order #${order.orderId} was successful.`,
        actionUrl: '/my-orders',
      });
    }
  } catch (notificationError) {
    /*
     * Notification failure should NOT turn a successful
     * payment into a failed payment.
     */
    console.error(
      '[Payment] Notification error:',
      notificationError.message
    );
  }

  return {
    order,
    alreadyProcessed: false,
  };
};


/**
 * ---------------------------------------------------------
 * VERIFY RAZORPAY CHECKOUT PAYMENT
 * ---------------------------------------------------------
 *
 * Called immediately after Razorpay Checkout succeeds.
 *
 * Required data:
 *
 * orderId
 * razorpayOrderId
 * razorpayPaymentId
 * razorpaySignature
 *
 * The signature is verified on the server.
 */
const verifyCheckoutPayment = async (
  studentId,
  {
    orderId,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  },
  io
) => {
  // Validate required fields
  if (
    !orderId ||
    !razorpayOrderId ||
    !razorpayPaymentId ||
    !razorpaySignature
  ) {
    throw new ApiError(
      400,
      'Incomplete payment verification information'
    );
  }

  /*
   * Find the application order belonging to the
   * authenticated student.
   */
  const order = await Order.findOne({
    _id: orderId,
    student: studentId,
  });

  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  /*
   * Find the payment record created when the
   * Razorpay order was created.
   */
  const payment = await Payment.findOne({
    order: order._id,
    razorpayOrderId,
  });

  if (!payment) {
    throw new ApiError(
      404,
      'Payment record not found for this order'
    );
  }

  /*
   * If already captured or paid, don't process again.
   */
  if (payment.status === 'captured' || payment.status === 'paid') {
    return order;
  }

  /*
   * Verify Razorpay signature.
   *
   * The signature is:
   *
   * HMAC-SHA256(
   *   razorpayOrderId + "|" + razorpayPaymentId,
   *   RAZORPAY_KEY_SECRET
   * )
   *
   * Razorpay requires server-side signature verification
   * before fulfilment. 
   */
  const isValid =
    razorpayService.verifyPaymentSignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

  if (!isValid) {
    payment.status = 'failed';
    await payment.save();

    try {
      await notifyStudent(io, order.student, {
        type: 'PAYMENT_FAILED',
        category: 'payments',
        priority: 'critical',
        relatedEntity: 'Order',
        relatedEntityId: order._id,
        title: '⚠ Payment Failed',
        message: `Your payment for order #${order.orderId} could not be completed.`,
        actionUrl: '/my-orders',
      });

      await notifyAdmin(io, {
        type: 'PAYMENT_FAILED',
        category: 'payments',
        priority: 'critical',
        relatedEntity: 'Order',
        relatedEntityId: order._id,
        title: '⚠ Payment Failed',
        message: `Payment for order #${order.orderId} failed.`,
        actionUrl: '/admin/online-orders',
      });
    } catch (notifErr) {
      console.error('[Payment] Failure notification error:', notifErr.message);
    }

    throw new ApiError(
      400,
      'Payment verification failed. The Razorpay signature did not match.'
    );
  }

  /*
   * Store Razorpay payment information for audit.
   */
  payment.razorpayPaymentId = razorpayPaymentId;
  payment.razorpaySignature = razorpaySignature;

  await payment.save();

  /*
   * Mark payment + order as paid.
   */
  const result = await markOrderAsPaid(
    payment,
    razorpayPaymentId,
    io,
    'Razorpay Checkout'
  );

  return result.order;
};


/**
 * ---------------------------------------------------------
 * RAZORPAY WEBHOOK
 * ---------------------------------------------------------
 *
 * rawBody MUST be the original Buffer received from Razorpay.
 *
 * The signature is calculated against the exact raw request
 * body, not JSON.stringify(parsedBody).
 */
const handleWebhook = async (
  rawBody,
  signatureHeader,
  io,
  eventId = null
) => {
  if (!Buffer.isBuffer(rawBody)) {
    throw new ApiError(
      400,
      'Invalid webhook body. Raw Buffer is required.'
    );
  }

  if (!signatureHeader) {
    throw new ApiError(
      400,
      'Missing Razorpay webhook signature'
    );
  }

  /*
   * Verify webhook signature.
   */
  const isValid =
    razorpayService.verifyWebhookSignature(
      rawBody,
      signatureHeader
    );

  if (!isValid) {
    throw new ApiError(
      400,
      'Invalid webhook signature'
    );
  }

  let payload;

  try {
    payload = JSON.parse(rawBody.toString('utf8'));
  } catch (error) {
    throw new ApiError(
      400,
      'Invalid Razorpay webhook JSON'
    );
  }

  const event = payload.event;

  /*
   * Razorpay recommends using x-razorpay-event-id to
   * identify duplicate webhook deliveries.
   *
   * We receive it from the controller and log it here.
   */
  if (eventId) {
    console.log(
      `[Razorpay Webhook] Event ID: ${eventId}`
    );
  }

  console.log(
    `[Razorpay Webhook] Event: ${event}`
  );


  /**
   * -------------------------------------------------------
   * PAYMENT EVENTS
   * -------------------------------------------------------
   */

  if (
    event === 'payment.captured' ||
    event === 'payment.failed' ||
    event === 'payment.authorized'
  ) {
    const paymentEntity =
      payload.payload?.payment?.entity;

    if (!paymentEntity) {
      return {
        received: true,
        ignored: true,
        reason: 'No payment entity in webhook',
      };
    }

    const razorpayOrderId =
      paymentEntity.order_id;

    if (!razorpayOrderId) {
      return {
        received: true,
        ignored: true,
        reason: 'No Razorpay order ID in payment',
      };
    }

    const payment = await Payment.findOne({
      razorpayOrderId,
    });

    if (!payment) {
      /*
       * This can happen if Razorpay sends a webhook for
       * an order that does not belong to this application.
       */
      return {
        received: true,
        ignored: true,
        reason: 'No matching payment record',
      };
    }

    /*
     * Store complete webhook payload for audit/debugging.
     */
    payment.rawWebhookPayload = payload;

    /**
     * payment.authorized
     *
     * IMPORTANT:
     *
     * Authorized does NOT necessarily mean captured.
     * Do not mark the application order as paid here.
     */
    if (event === 'payment.authorized') {
      await payment.save();

      return {
        received: true,
        event,
        status: 'authorized',
      };
    }


    /**
     * payment.failed
     */
    if (event === 'payment.failed') {
      payment.status = 'failed';

      if (paymentEntity.id) {
        payment.razorpayPaymentId =
          paymentEntity.id;
      }

      await payment.save();

      return {
        received: true,
        event,
        status: 'failed',
      };
    }


    /**
     * payment.captured
     */
    if (event === 'payment.captured') {
      /*
       * Already captured?
       * Safe no-op.
       */
      if (payment.status === 'captured') {
        await payment.save();

        return {
          received: true,
          event,
          idempotent: true,
        };
      }

      payment.method =
        paymentEntity.method ||
        payment.method ||
        'unknown';

      payment.razorpayPaymentId =
        paymentEntity.id;

      const result = await markOrderAsPaid(
        payment,
        paymentEntity.id,
        io,
        'Razorpay Webhook'
      );

      /*
       * Save raw payload after successful processing.
       */
      payment.rawWebhookPayload = payload;
      await payment.save();

      return {
        received: true,
        event,
        orderId: result.order.orderId,
      };
    }
  }


  /**
   * -------------------------------------------------------
   * ORDER.PAID
   * -------------------------------------------------------
   *
   * Razorpay also sends order.paid when the payment associated
   * with the Razorpay order has been captured.
   *
   * We support it so the application remains synchronized
   * even if this webhook arrives instead of / before the
   * payment.captured event.
   */
  if (event === 'order.paid') {
    const paymentEntity =
      payload.payload?.payment?.entity;

    const orderEntity =
      payload.payload?.order?.entity;

    const razorpayOrderId =
      orderEntity?.id ||
      paymentEntity?.order_id;

    if (!razorpayOrderId) {
      return {
        received: true,
        ignored: true,
        reason: 'No Razorpay order ID in order.paid',
      };
    }

    const payment = await Payment.findOne({
      razorpayOrderId,
    });

    if (!payment) {
      return {
        received: true,
        ignored: true,
        reason: 'No matching payment record',
      };
    }

    /*
     * Duplicate protection.
     */
    if (payment.status === 'captured') {
      payment.rawWebhookPayload = payload;
      await payment.save();

      return {
        received: true,
        event,
        idempotent: true,
      };
    }

    payment.rawWebhookPayload = payload;

    const paymentId =
      paymentEntity?.id ||
      payment.razorpayPaymentId;

    if (paymentEntity?.method) {
      payment.method =
        paymentEntity.method;
    }

    const result = await markOrderAsPaid(
      payment,
      paymentId,
      io,
      'Razorpay order.paid Webhook'
    );

    return {
      received: true,
      event,
      orderId: result.order.orderId,
    };
  }


  /**
   * -------------------------------------------------------
   * UNKNOWN / OTHER EVENT
   * -------------------------------------------------------
   *
   * Don't fail the webhook simply because your application
   * doesn't currently use that event.
   */
  return {
    received: true,
    ignored: true,
    event,
  };
};


module.exports = {
  verifyCheckoutPayment,
  handleWebhook,
};