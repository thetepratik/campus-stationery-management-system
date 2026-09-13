const express = require('express');
const router = express.Router();

const paymentController = require('../controllers/paymentController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');
const validate = require('../middlewares/validateMiddleware');
const { verifyPaymentValidation } = require('../validations/paymentValidation');

// Note: POST /api/payments/webhook is mounted directly in app.js (needs raw
// body for signature verification, so it can't go through this router,
// which sits behind the global express.json() parser).

router.post(
  '/verify',
  verifyToken,
  requireRole('student'),
  verifyPaymentValidation,
  validate,
  paymentController.verifyPayment
);

module.exports = router;
