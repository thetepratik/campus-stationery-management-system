const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

/**
 * Place after a validation chain array: router.post('/x', [...chain, validate], handler)
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg);
    throw new ApiError(400, 'Validation failed', messages);
  }
  next();
};

module.exports = validate;
