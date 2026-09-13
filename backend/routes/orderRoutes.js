const express = require('express');
const router = express.Router();

const orderController = require('../controllers/orderController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');
const validate = require('../middlewares/validateMiddleware');
const { checkoutValidation } = require('../validations/orderValidation');

router.use(verifyToken, requireRole('student'));

router.post('/checkout', checkoutValidation, validate, orderController.checkoutCash);
router.post('/checkout/razorpay', checkoutValidation, validate, orderController.checkoutRazorpay);
router.get('/', orderController.listMyOrders);
router.get('/:id', orderController.getMyOrder);

module.exports = router;
