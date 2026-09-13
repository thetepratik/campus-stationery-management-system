const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const storeService = require('../services/storeService');

const getHome = asyncHandler(async (req, res) => {
  const data = await storeService.getHomeData();
  success(res, 200, 'Storefront home data fetched', data);
});

const listProducts = asyncHandler(async (req, res) => {
  const { items, meta } = await storeService.getStoreProducts(req.query);
  success(res, 200, 'Products fetched', { products: items }, meta);
});

const getProduct = asyncHandler(async (req, res) => {
  const product = await storeService.getStoreProductById(req.params.id);
  const related = await storeService.getRelatedProducts(product._id, product.category._id || product.category);
  success(res, 200, 'Product fetched', { product, related });
});

module.exports = { getHome, listProducts, getProduct };
