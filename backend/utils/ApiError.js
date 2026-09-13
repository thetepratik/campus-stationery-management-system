/**
 * Custom error class that carries an HTTP status code, so services/controllers
 * can `throw new ApiError(404, 'Product not found')` and errorMiddleware
 * translates it directly into the right response — no string-matching errors.
 */
class ApiError extends Error {
  constructor(statusCode, message, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;
