const express = require('express');
const router = express.Router();

const categoryController = require('../controllers/categoryController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');
const validate = require('../middlewares/validateMiddleware');
const { uploadSingleImage } = require('../middlewares/uploadMiddleware');
const { categoryCreateValidation, categoryUpdateValidation } = require('../validations/categoryValidation');

// Public read (student storefront needs categories too — Phase 7)
router.get('/', categoryController.listCategories);
router.get('/:id', categoryController.getCategory);

// Admin-only writes
router.post(
  '/',
  verifyToken,
  requireRole('admin'),
  uploadSingleImage,
  categoryCreateValidation,
  validate,
  categoryController.createCategory
);
router.put(
  '/:id',
  verifyToken,
  requireRole('admin'),
  uploadSingleImage,
  categoryUpdateValidation,
  validate,
  categoryController.updateCategory
);
router.delete('/:id', verifyToken, requireRole('admin'), categoryController.deleteCategory);

module.exports = router;
