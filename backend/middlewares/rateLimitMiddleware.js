const rateLimit = require('express-rate-limit');

const windowMin = Number(process.env.RATE_LIMIT_WINDOW_MIN) || 15;

/**
 * Strict limiter for auth endpoints (login, register, forgot-password, otp)
 * to slow down brute-force / credential-stuffing attempts.
 */
const authLimiter = rateLimit({
  windowMs: windowMin * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again later.', errors: [] },
});

/**
 * General API limiter, applied globally in app.js.
 */
const apiLimiter = rateLimit({
  windowMs: windowMin * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please slow down.', errors: [] },
});

module.exports = { authLimiter, apiLimiter };
