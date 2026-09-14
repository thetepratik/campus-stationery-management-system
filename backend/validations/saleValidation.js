const { body, query } = require('express-validator');
const { OFFLINE_PAYMENT_METHOD } = require('../config/constants');

const saleCreateValidation = [
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.productId').isMongoId().withMessage('Each item needs a valid product'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Each item quantity must be at least 1'),
  body('paymentMethod')
    .isIn(Object.values(OFFLINE_PAYMENT_METHOD))
    .withMessage('Invalid payment method'),
  body('customerName').optional().trim(),
  body('rollNumber').optional().trim(),
  body('department').optional().trim(),
  body('remarks').optional().trim(),
  body('paymentConfirmed')
    .custom((value) => value === true || value === 'true')
    .withMessage('Payment must be confirmed before recording a sale'),
];

const saleListQueryValidation = [
  query('from').optional().isISO8601(),
  query('to').optional().isISO8601(),
  query('paymentMethod').optional().isIn(Object.values(OFFLINE_PAYMENT_METHOD)),
  query('status').optional().isIn(['completed', 'reversed', '']),
];

module.exports = { saleCreateValidation, saleListQueryValidation };
