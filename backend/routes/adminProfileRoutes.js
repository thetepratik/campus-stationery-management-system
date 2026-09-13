const express = require('express');
const router = express.Router();

const settingsController = require('../controllers/settingsController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');
const { uploadSingleImage } = require('../middlewares/uploadMiddleware');

// Protect all admin profile routes
router.use(verifyToken, requireRole('admin'));

// GET /api/admin/profile
router.get('/', settingsController.getAdminProfile);

// PATCH /api/admin/profile & PUT /api/admin/profile
router.patch('/', uploadSingleImage, settingsController.updateAdminProfile);
router.put('/', uploadSingleImage, settingsController.updateAdminProfile);

// POST /api/admin/profile/change-password
router.post('/change-password', settingsController.changeAdminPassword);

module.exports = router;
