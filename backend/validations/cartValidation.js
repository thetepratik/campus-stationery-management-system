const { body, param } = require('express-validator');

const addItemValidation = [
  body('productId').isMongoId().withMessage('A valid product is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
];

const updateItemValidation = [
  param('productId').isMongoId().withMessage('Invalid product'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
];

const applyCouponValidation = [body('code').trim().notEmpty().withMessage('Coupon code is required')];

module.exports = { addItemValidation, updateItemValidation, applyCouponValidation };
