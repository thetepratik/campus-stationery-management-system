const { body } = require('express-validator');
const { PAYMENT_METHOD } = require('../config/constants');

const checkoutValidation = [
  body('pickupTime').isISO8601().withMessage('A valid pickup time is required'),
  body('paymentMethod').isIn(Object.values(PAYMENT_METHOD)).withMessage('Invalid payment method'),
];

module.exports = { checkoutValidation };
