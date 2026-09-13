const { body } = require('express-validator');

const productCreateValidation = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('category').isMongoId().withMessage('A valid category is required'),
  body('purchasePrice').isFloat({ min: 0 }).withMessage('Purchase price must be a positive number'),
  body('sellingPrice').isFloat({ min: 0 }).withMessage('Selling price must be a positive number'),
  body('openingStock').isInt({ min: 0 }).withMessage('Opening stock must be a non-negative integer'),
  body('discountPercent').optional().isFloat({ min: 0, max: 100 }).withMessage('Discount must be between 0-100'),
  body('gstPercent').optional().isFloat({ min: 0 }).withMessage('GST % must be a positive number'),
  body('minStock').optional().isInt({ min: 0 }),
  body('maxStock').optional().isInt({ min: 0 }),
];

const productUpdateValidation = [
  body('name').optional().trim().notEmpty().withMessage('Product name cannot be empty'),
  body('category').optional().isMongoId().withMessage('A valid category is required'),
  body('purchasePrice').optional().isFloat({ min: 0 }).withMessage('Purchase price must be a positive number'),
  body('sellingPrice').optional().isFloat({ min: 0 }).withMessage('Selling price must be a positive number'),
  body('discountPercent').optional().isFloat({ min: 0, max: 100 }),
  body('gstPercent').optional().isFloat({ min: 0 }),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status'),
];

const bulkPriceUpdateValidation = [
  body('productIds').isArray({ min: 1 }).withMessage('productIds must be a non-empty array'),
  body('productIds.*').isMongoId().withMessage('Each productId must be valid'),
  body('mode').isIn(['percent-increase', 'percent-decrease', 'set-price']).withMessage('Invalid update mode'),
  body('value').isFloat({ min: 0 }).withMessage('Value must be a positive number'),
];

const bulkDeleteValidation = [
  body('productIds').isArray({ min: 1 }).withMessage('productIds must be a non-empty array'),
  body('productIds.*').isMongoId().withMessage('Each productId must be valid'),
];

const bulkStatusUpdateValidation = [
  body('productIds').isArray({ min: 1 }).withMessage('productIds must be a non-empty array'),
  body('productIds.*').isMongoId().withMessage('Each productId must be valid'),
  body('status').isIn(['active', 'inactive']).withMessage('Invalid status'),
];

module.exports = {
  productCreateValidation,
  productUpdateValidation,
  bulkPriceUpdateValidation,
  bulkDeleteValidation,
  bulkStatusUpdateValidation,
};
