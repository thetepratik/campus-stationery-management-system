const { body } = require('express-validator');

const reviewCreateValidation = [
  body('productId').isMongoId().withMessage('A valid product is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().trim().isLength({ max: 1000 }).withMessage('Comment is too long'),
];

const reviewUpdateValidation = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().trim().isLength({ max: 1000 }).withMessage('Comment is too long'),
];

module.exports = { reviewCreateValidation, reviewUpdateValidation };
