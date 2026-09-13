/**
 * Standard success response shape used across every controller.
 */
const success = (res, statusCode, message, data = null, meta = null) => {
  const body = { success: true, message };
  if (data !== null) body.data = data;
  if (meta !== null) body.meta = meta;
  return res.status(statusCode).json(body);
};

/**
 * Standard error response shape. Prefer throwing errors and letting
 * errorMiddleware handle them; use this only for early-return validation cases.
 */
const failure = (res, statusCode, message, errors = []) => {
  return res.status(statusCode).json({ success: false, message, errors });
};

module.exports = { success, failure };
