const { body } = require('express-validator');
const { PAYMENT_METHOD } = require('../config/constants');

const checkoutValidation = [
  body('pickupTime').isISO8601().withMessage('A valid pickup time is required'),
  body('paymentMethod')
    .optional()
    .custom((value) => {
      if (value && value !== PAYMENT_METHOD.RAZORPAY) {
        throw new Error('Offline/cash payment methods are not supported for student checkout. Only online payment via Razorpay is accepted.');
      }
      return true;
    }),
];

module.exports = { checkoutValidation };
