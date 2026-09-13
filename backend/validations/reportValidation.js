const { query } = require('express-validator');

const salesReportQueryValidation = [
  query('fromDate')
    .optional()
    .isISO8601()
    .withMessage('fromDate must be a valid ISO8601 date'),
  query('toDate')
    .optional()
    .isISO8601()
    .withMessage('toDate must be a valid ISO8601 date')
    .custom((toDate, { req }) => {
      if (req.query.fromDate && toDate) {
        if (new Date(req.query.fromDate) > new Date(toDate)) {
          throw new Error('fromDate cannot be after toDate');
        }
      }
      return true;
    }),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 200 })
    .withMessage('Limit must be between 1 and 200'),
  query('saleType')
    .optional()
    .isIn(['all', 'offline', 'online'])
    .withMessage('saleType must be all, offline, or online'),
  query('paymentStatus')
    .optional()
    .isString(),
  query('paymentMethod')
    .optional()
    .isString(),
  query('category')
    .optional()
    .isString(),
  query('sortBy')
    .optional()
    .isIn(['date', 'createdAt', 'totalAmount', 'revenue', 'quantity', 'product', 'paymentMethod'])
    .withMessage('Invalid sortBy field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc', '1', '-1'])
    .withMessage('sortOrder must be asc or desc'),
];

module.exports = {
  salesReportQueryValidation,
};
