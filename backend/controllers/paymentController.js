const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const ApiError = require('../utils/ApiError');
const paymentService = require('../services/paymentService');

/**
 * =========================================================
 * VERIFY RAZORPAY CHECKOUT PAYMENT
 * =========================================================
 *
 * Called by the React frontend after Razorpay Checkout
 * successfully returns the payment details.
 *
 * Razorpay sends:
 *
 *   razorpay_payment_id
 *   razorpay_order_id
 *   razorpay_signature
 *
 * Our application also needs:
 *
 *   orderId
 *
 * orderId = MongoDB Order _id
 *
 * IMPORTANT:
 * The browser response is NOT trusted directly.
 * paymentService.verifyCheckoutPayment() verifies the
 * Razorpay HMAC signature on the backend.
 */
const verifyPayment = asyncHandler(async (req, res) => {
  const io = req.app.get('io');

  // -------------------------------------------------------
  // Authentication check
  // -------------------------------------------------------

  if (!req.user || !req.user._id) {
    throw new ApiError(
      401,
      'Authenticated user not found.'
    );
  }

  // -------------------------------------------------------
  // Get data sent by React
  // -------------------------------------------------------

  const orderId = req.body?.orderId;
  const razorpayPaymentId = req.body?.razorpay_payment_id || req.body?.razorpayPaymentId;
  const razorpayOrderId = req.body?.razorpay_order_id || req.body?.razorpayOrderId;
  const razorpaySignature = req.body?.razorpay_signature || req.body?.razorpaySignature;

  // -------------------------------------------------------
  // Validate required fields
  // -------------------------------------------------------

  if (!orderId) {
    throw new ApiError(
      400,
      'Application order ID is required.'
    );
  }

  if (!razorpayPaymentId) {
    throw new ApiError(
      400,
      'Razorpay payment ID is required.'
    );
  }

  if (!razorpayOrderId) {
    throw new ApiError(
      400,
      'Razorpay order ID is required.'
    );
  }

  if (!razorpaySignature) {
    throw new ApiError(
      400,
      'Razorpay payment signature is required.'
    );
  }

  // -------------------------------------------------------
  // Verify payment through payment service
  // -------------------------------------------------------

  const order =
    await paymentService.verifyCheckoutPayment(
      req.user._id,
      {
        orderId,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      },
      io
    );

  // -------------------------------------------------------
  // Response
  // -------------------------------------------------------

  success(
    res,
    200,
    'Payment verified successfully',
    {
      order,
    }
  );
});


/**
 * =========================================================
 * RAZORPAY WEBHOOK
 * =========================================================
 *
 * Razorpay calls this endpoint directly.
 *
 * This endpoint DOES NOT use student/admin JWT
 * authentication.
 *
 * Authentication is performed using:
 *
 *   X-Razorpay-Signature
 *
 * and:
 *
 *   RAZORPAY_WEBHOOK_SECRET
 *
 * IMPORTANT:
 *
 * app.js MUST mount this endpoint using:
 *
 * express.raw({ type: 'application/json' })
 *
 * BEFORE express.json().
 */
const webhook = asyncHandler(async (req, res) => {
  const io = req.app.get('io');

  // -------------------------------------------------------
  // Get Razorpay webhook signature
  // -------------------------------------------------------

  const signature =
    req.headers['x-razorpay-signature'];

  if (!signature) {
    throw new ApiError(
      400,
      'Missing Razorpay webhook signature.'
    );
  }

  // -------------------------------------------------------
  // Validate raw body
  // -------------------------------------------------------
  //
  // Razorpay signs the exact raw request body.
  // Therefore req.body must be a Buffer.
  //

  if (!Buffer.isBuffer(req.body)) {
    throw new ApiError(
      400,
      'Invalid webhook body. Raw request body is required.'
    );
  }

  // -------------------------------------------------------
  // Razorpay Event ID
  // -------------------------------------------------------
  //
  // Useful for identifying duplicate webhook deliveries.
  //

  const eventId =
    req.headers['x-razorpay-event-id'] || null;

  // -------------------------------------------------------
  // Process webhook
  // -------------------------------------------------------

  const result =
    await paymentService.handleWebhook(
      req.body,
      signature,
      io,
      eventId
    );

  // -------------------------------------------------------
  // Always return successful response when processed
  // -------------------------------------------------------

  return res.status(200).json({
    success: true,
    message: 'Webhook processed successfully',
    data: result,
  });
});


module.exports = {
  verifyPayment,
  webhook,
};