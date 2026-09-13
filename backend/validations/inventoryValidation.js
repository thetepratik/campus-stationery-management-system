const { body, query } = require('express-validator');

const restockValidation = [
  body('productId').isMongoId().withMessage('A valid product is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
  body('note').optional().trim(),
];

const adjustStockValidation = [
  body('productId').isMongoId().withMessage('A valid product is required'),
  body('newStock').isInt({ min: 0 }).withMessage('New stock must be a non-negative integer'),
  body('note').notEmpty().withMessage('A note/reason is required for manual stock adjustments'),
];

const historyQueryValidation = [
  query('product').optional().isMongoId(),
  query('type').optional().isIn(['restock', 'sale-offline', 'sale-online', 'adjustment', 'return']),
  query('from').optional().isISO8601(),
  query('to').optional().isISO8601(),
];

module.exports = { restockValidation, adjustStockValidation, historyQueryValidation };
