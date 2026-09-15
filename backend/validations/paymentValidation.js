const { body } = require('express-validator');

const verifyPaymentValidation = [
  body('orderId').isMongoId().withMessage('A valid order is required'),
  body().custom((value, { req }) => {
    const razorpayOrderId = req.body?.razorpay_order_id || req.body?.razorpayOrderId;
    const razorpayPaymentId = req.body?.razorpay_payment_id || req.body?.razorpayPaymentId;
    const razorpaySignature = req.body?.razorpay_signature || req.body?.razorpaySignature;

    if (!razorpayOrderId || typeof razorpayOrderId !== 'string' || !razorpayOrderId.trim()) {
      throw new Error('Razorpay order ID is required');
    }
    if (!razorpayPaymentId || typeof razorpayPaymentId !== 'string' || !razorpayPaymentId.trim()) {
      throw new Error('Razorpay payment ID is required');
    }
    if (!razorpaySignature || typeof razorpaySignature !== 'string' || !razorpaySignature.trim()) {
      throw new Error('Razorpay signature is required');
    }
    return true;
  }),
];

module.exports = { verifyPaymentValidation };
