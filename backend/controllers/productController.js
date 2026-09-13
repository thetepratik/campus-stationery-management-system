const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const productService = require('../services/productService');
const { notifyAdmin } = require('../services/notificationService');

const listProducts = asyncHandler(async (req, res) => {
  const { items, meta } = await productService.listProducts(req.query);
  success(res, 200, 'Products fetched', { products: items }, meta);
});

const getProduct = asyncHandler(async (req, res) => {
  const product = await productService.getProductById(req.params.id);
  success(res, 200, 'Product fetched', { product });
});

const createProduct = asyncHandler(async (req, res) => {
    const product = await productService.createProduct(req.body, req.files);

    const io = req.app.get('io');
    try {
      await notifyAdmin(io, {
        type: 'NEW_PRODUCT',
        category: 'inventory',
        priority: 'normal',
        relatedEntity: 'Product',
        relatedEntityId: product._id,
        title: '📦 Product Added',
        message: `${product.name} was added to the product catalog.`,
        actionUrl: '/admin/products',
      });
    } catch (notifErr) {
      console.error('[Product] Notification error:', notifErr.message);
    }

    success(res,201,"Product created successfully",{product});
});

const updateProduct = asyncHandler(async (req, res) => {
  const product = await productService.updateProduct(req.params.id, req.body, req.files);
  success(res, 200, 'Product updated successfully', { product });
});

const deleteProduct = asyncHandler(async (req, res) => {
  await productService.deleteProduct(req.params.id);
  success(res, 200, 'Product deleted successfully');
});

const bulkDelete = asyncHandler(async (req, res) => {
  const count = await productService.bulkDelete(req.body.productIds);
  success(res, 200, `${count} product(s) deleted successfully`);
});

const bulkUpdateStatus = asyncHandler(async (req, res) => {
  const count = await productService.bulkUpdateStatus(req.body.productIds, req.body.status);
  success(res, 200, `${count} product(s) updated successfully`);
});

const bulkPriceUpdate = asyncHandler(async (req, res) => {
  const count = await productService.bulkPriceUpdate(req.body.productIds, req.body.mode, Number(req.body.value));
  success(res, 200, `${count} product(s) price updated successfully`);
});

module.exports = {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkDelete,
  bulkUpdateStatus,
  bulkPriceUpdate,
};
