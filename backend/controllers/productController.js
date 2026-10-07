const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const productService = require('../services/productService');
const { notifyAdmin } = require('../services/notificationService');

const listProducts = asyncHandler(async (req, res) => {
  const start = performance.now();
  const { items, meta, timings } = await productService.listProducts(req.query);
  const pagination = {
    page: meta.page,
    limit: meta.limit,
    total: meta.totalCount,
    pages: meta.totalPages,
  };
  const totalDuration = Math.round(performance.now() - start);
  console.log(
    `[PERF] GET /api/products ${totalDuration}ms (db: ${timings?.dbDuration || 0}ms, count: ${items.length})`
  );

  res.status(200).json({
    success: true,
    message: 'Products fetched',
    data: {
      products: items,
      pagination,
    },
    pagination,
    meta,
  });
});

const getProduct = asyncHandler(async (req, res) => {
  const product = await productService.getProductById(req.params.id);
  success(res, 200, 'Product fetched', { product });
});

const getProductImage = asyncHandler(async (req, res) => {
  const { id, imageIndex } = req.params;
  const index = parseInt(imageIndex, 10);
  if (isNaN(index) || index < 0) {
    return res.status(400).json({ success: false, message: 'Invalid image index' });
  }

  const image = await productService.getProductImage(id, index);
  if (!image || !image.data) {
    return res.status(404).json({ success: false, message: 'Image not found' });
  }

  res.set('Content-Type', image.contentType || 'image/jpeg');
  res.set('Cache-Control', 'public, max-age=86400, immutable');
  const buffer = Buffer.isBuffer(image.data)
    ? image.data
    : Buffer.from(image.data.buffer || image.data);
  return res.send(buffer);
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

const getBrands = asyncHandler(async (req, res) => {
  const brands = await productService.getAllBrands();
  res.status(200).json({
    success: true,
    message: 'Brands fetched successfully',
    data: { brands },
    brands,
  });
});

module.exports = {
  listProducts,
  getProduct,
  getProductImage,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkDelete,
  bulkUpdateStatus,
  bulkPriceUpdate,
  getBrands,
};

