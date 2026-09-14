const express = require('express');
const router = express.Router();

const saleController = require('../controllers/saleController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');
const validate = require('../middlewares/validateMiddleware');
const { saleCreateValidation, saleListQueryValidation } = require('../validations/saleValidation');

router.use(verifyToken, requireRole('admin'));

router.get('/', saleListQueryValidation, validate, saleController.listSales);
router.post('/', saleCreateValidation, validate, saleController.createSale);
router.get('/:id', saleController.getSale);
router.get('/:id/invoice', saleController.downloadInvoice);
router.patch('/:id/undo', saleController.undoSale);

module.exports = router;
