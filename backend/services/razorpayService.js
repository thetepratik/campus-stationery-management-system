const crypto = require('crypto');

const razorpay = require('../config/razorpay');
const ApiError = require('../utils/ApiError');

/**
 * =========================================================
 * ENVIRONMENT VALIDATION
 * =========================================================
 */

const getRequiredEnv = (name) => {
  const value = process.env[name];

  if (!value || !value.trim()) {
    throw new ApiError(
      500,
      `${name} is not configured in the server environment.`
    );
  }

  return value.trim();
};


/**
 * =========================================================
 * CREATE RAZORPAY ORDER
 * =========================================================
 *
 * Razorpay expects amount in PAISE.
 *
 * Example:
 *
 * ₹100
 *   ↓
 * 10000 paise
 *
 * ₹250.50
 *   ↓
 * 25050 paise
 */
const createRazorpayOrder = async (
  amountInRupees,
  receipt
) => {
  try {
    // -----------------------------------------------------
    // Validate amount
    // -----------------------------------------------------

    const amount = Number(amountInRupees);

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new ApiError(
        400,
        'Invalid Razorpay payment amount.'
      );
    }

    // -----------------------------------------------------
    // Validate receipt
    // -----------------------------------------------------

    if (!receipt || typeof receipt !== 'string') {
      throw new ApiError(
        400,
        'A valid Razorpay receipt is required.'
      );
    }

    // -----------------------------------------------------
    // Convert Rupees → Paise
    // -----------------------------------------------------

    const amountInPaise = Math.round(
      amount * 100
    );

    // -----------------------------------------------------
    // Create Razorpay Order
    // -----------------------------------------------------

    const razorpayOrder =
      await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt,

        // Automatically capture successful payments.
        payment_capture: 1,
      });

    return razorpayOrder;
  } catch (err) {
    // Don't convert our own ApiError into a 502 error.
    if (err instanceof ApiError) {
      throw err;
    }

    const message =
      err?.error?.description ||
      err?.error?.reason ||
      err?.message ||
      'Failed to create Razorpay order.';

    console.error(
      '[Razorpay] Order creation failed:',
      message
    );

    throw new ApiError(
      502,
      `Razorpay error: ${message}`
    );
  }
};


/**
 * =========================================================
 * VERIFY RAZORPAY CHECKOUT SIGNATURE
 * =========================================================
 *
 * Razorpay Checkout returns:
 *
 * razorpay_order_id
 * razorpay_payment_id
 * razorpay_signature
 *
 * Signature formula:
 *
 * HMAC-SHA256(
 *   razorpay_order_id + "|" + razorpay_payment_id,
 *   RAZORPAY_KEY_SECRET
 * )
 *
 * IMPORTANT:
 *
 * Never trust the frontend response without this
 * server-side verification.
 */
const verifyPaymentSignature = ({
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
}) => {
  try {
    // -----------------------------------------------------
    // Validate input
    // -----------------------------------------------------

    if (
      !razorpayOrderId ||
      !razorpayPaymentId ||
      !razorpaySignature
    ) {
      return false;
    }

    // -----------------------------------------------------
    // Get Razorpay secret
    // -----------------------------------------------------

    const keySecret =
      getRequiredEnv('RAZORPAY_KEY_SECRET');

    // -----------------------------------------------------
    // Generate expected signature
    // -----------------------------------------------------

    const generatedSignature =
      crypto
        .createHmac('sha256', keySecret)
        .update(
          `${razorpayOrderId}|${razorpayPaymentId}`,
          'utf8'
        )
        .digest('hex');

    // -----------------------------------------------------
    // Timing-safe comparison
    // -----------------------------------------------------
    //
    // Both values must have the same length before
    // timingSafeEqual() can be used.
    //

    const expectedBuffer =
      Buffer.from(generatedSignature, 'utf8');

    const receivedBuffer =
      Buffer.from(
        String(razorpaySignature),
        'utf8'
      );

    if (
      expectedBuffer.length !==
      receivedBuffer.length
    ) {
      return false;
    }

    return crypto.timingSafeEqual(
      expectedBuffer,
      receivedBuffer
    );
  } catch (err) {
    console.error(
      '[Razorpay] Payment signature verification error:',
      err.message
    );

    return false;
  }
};


/**
 * =========================================================
 * VERIFY RAZORPAY WEBHOOK SIGNATURE
 * =========================================================
 *
 * IMPORTANT:
 *
 * rawBody MUST be the original Buffer received from
 * Razorpay.
 *
 * DO NOT use:
 *
 * JSON.stringify(req.body)
 *
 * because even a small change in the serialized JSON
 * can cause signature verification to fail.
 *
 * Signature formula:
 *
 * HMAC-SHA256(
 *   raw_request_body,
 *   RAZORPAY_WEBHOOK_SECRET
 * )
 */
const verifyWebhookSignature = (
  rawBody,
  signature
) => {
  try {
    // -----------------------------------------------------
    // Validate body
    // -----------------------------------------------------

    if (!Buffer.isBuffer(rawBody)) {
      return false;
    }

    // -----------------------------------------------------
    // Validate signature
    // -----------------------------------------------------

    if (!signature) {
      return false;
    }

    // -----------------------------------------------------
    // Get webhook secret
    // -----------------------------------------------------

    const webhookSecret =
      getRequiredEnv(
        'RAZORPAY_WEBHOOK_SECRET'
      );

    // -----------------------------------------------------
    // Generate expected signature
    // -----------------------------------------------------

    const generatedSignature =
      crypto
        .createHmac(
          'sha256',
          webhookSecret
        )
        .update(rawBody)
        .digest('hex');

    // -----------------------------------------------------
    // Timing-safe comparison
    // -----------------------------------------------------

    const expectedBuffer =
      Buffer.from(
        generatedSignature,
        'utf8'
      );

    const receivedBuffer =
      Buffer.from(
        String(signature),
        'utf8'
      );

    if (
      expectedBuffer.length !==
      receivedBuffer.length
    ) {
      return false;
    }

    return crypto.timingSafeEqual(
      expectedBuffer,
      receivedBuffer
    );
  } catch (err) {
    console.error(
      '[Razorpay] Webhook signature verification error:',
      err.message
    );

    return false;
  }
};


/**
 * =========================================================
 * EXPORT
 * =========================================================
 */

module.exports = {
  createRazorpayOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
};