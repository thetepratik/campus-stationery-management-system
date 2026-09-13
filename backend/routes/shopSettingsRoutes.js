const express = require('express');
const router = express.Router();

const settingsController = require('../controllers/settingsController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');
const { uploadSingleImage } = require('../middlewares/uploadMiddleware');

// GET /api/shop-settings (Retrieve shop details)
router.get('/', settingsController.getShopSettings);

// Update shop details (Admin only)
router.patch('/', verifyToken, requireRole('admin'), uploadSingleImage, settingsController.updateShopSettings);
router.put('/', verifyToken, requireRole('admin'), uploadSingleImage, settingsController.updateShopSettings);

module.exports = router;
