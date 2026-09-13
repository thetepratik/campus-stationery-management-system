const express = require('express');
const router = express.Router();

const cartController = require('../controllers/cartController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');
const validate = require('../middlewares/validateMiddleware');
const { addItemValidation, updateItemValidation, applyCouponValidation } = require('../validations/cartValidation');

router.use(verifyToken, requireRole('student'));

router.get('/', cartController.getCart);
router.post('/items', addItemValidation, validate, cartController.addItem);
router.put('/items/:productId', updateItemValidation, validate, cartController.updateItem);
router.delete('/items/:productId', cartController.removeItem);
router.post('/coupon', applyCouponValidation, validate, cartController.applyCoupon);
router.delete('/coupon', cartController.removeCoupon);

module.exports = router;
