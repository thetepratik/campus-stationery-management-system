const { body } = require('express-validator');

const verifyPaymentValidation = [
  body('orderId').isMongoId().withMessage('A valid order is required'),
  body('razorpayOrderId').notEmpty().withMessage('Razorpay order ID is required'),
  body('razorpayPaymentId').notEmpty().withMessage('Razorpay payment ID is required'),
  body('razorpaySignature').notEmpty().withMessage('Razorpay signature is required'),
];

module.exports = { verifyPaymentValidation };
