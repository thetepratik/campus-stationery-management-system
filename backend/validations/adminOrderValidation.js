const { body } = require('express-validator');
const { ORDER_STATUS } = require('../config/constants');

const updateStatusValidation = [
  body('status').isIn(Object.values(ORDER_STATUS)).withMessage('Invalid order status'),
];

const cancelOrderValidation = [body('reason').optional().trim().isLength({ max: 500 })];

module.exports = { updateStatusValidation, cancelOrderValidation };
