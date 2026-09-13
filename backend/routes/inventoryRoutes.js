const express = require('express');
const router = express.Router();

const inventoryController = require('../controllers/inventoryController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');
const validate = require('../middlewares/validateMiddleware');
const {
  restockValidation,
  adjustStockValidation,
  historyQueryValidation,
} = require('../validations/inventoryValidation');

router.use(verifyToken, requireRole('admin'));

router.get('/stock-levels', inventoryController.stockLevels);
router.get('/history', historyQueryValidation, validate, inventoryController.stockHistory);
router.get('/value-report', inventoryController.valueReport);
router.post('/restock', restockValidation, validate, inventoryController.restock);
router.post('/adjust', adjustStockValidation, validate, inventoryController.adjust);

module.exports = router;
