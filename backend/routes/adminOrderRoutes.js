const express = require('express');
const router = express.Router();

const adminOrderController = require('../controllers/adminOrderController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');
const validate = require('../middlewares/validateMiddleware');
const { updateStatusValidation, cancelOrderValidation } = require('../validations/adminOrderValidation');

router.use(verifyToken, requireRole('admin'));

router.get('/', adminOrderController.listOrders);
router.get('/:id', adminOrderController.getOrder);
router.get('/:id/invoice', adminOrderController.downloadInvoice);
router.patch('/:id/status', updateStatusValidation, validate, adminOrderController.updateStatus);
router.patch('/:id/cancel', cancelOrderValidation, validate, adminOrderController.cancelOrder);
router.delete('/:id', adminOrderController.deleteOrder);

module.exports = router;
