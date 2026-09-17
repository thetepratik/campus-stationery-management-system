const express = require('express');
const router = express.Router();

const productController = require('../controllers/productController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');
const validate = require('../middlewares/validateMiddleware');
const { uploadMultipleImages } = require('../middlewares/uploadMiddleware');
const {
  productCreateValidation,
  productUpdateValidation,
  bulkPriceUpdateValidation,
  bulkDeleteValidation,
  bulkStatusUpdateValidation,
} = require('../validations/productValidation');

// Public read (student storefront — Phase 7)
router.get('/', productController.listProducts);

// Bulk routes MUST be declared before '/:id' to avoid Express matching 'bulk-x' as an id
router.post(
  '/bulk-delete',
  verifyToken,
  requireRole('admin'),
  bulkDeleteValidation,
  validate,
  productController.bulkDelete
);
router.post(
  '/bulk-status',
  verifyToken,
  requireRole('admin'),
  bulkStatusUpdateValidation,
  validate,
  productController.bulkUpdateStatus
);
router.post(
  '/bulk-price',
  verifyToken,
  requireRole('admin'),
  bulkPriceUpdateValidation,
  validate,
  productController.bulkPriceUpdate
);

router.get('/brands', productController.getBrands);
router.get('/:id', productController.getProduct);

router.post(
  '/',
  verifyToken,
  requireRole('admin'),
  uploadMultipleImages,
  productCreateValidation,
  validate,
  productController.createProduct
);
router.put(
  '/:id',
  verifyToken,
  requireRole('admin'),
  uploadMultipleImages,
  productUpdateValidation,
  validate,
  productController.updateProduct
);
router.delete('/:id', verifyToken, requireRole('admin'), productController.deleteProduct);

module.exports = router;
