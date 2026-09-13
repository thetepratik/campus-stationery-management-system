const Product = require('../models/Product');
const Category = require('../models/Category');
const productService = require('./productService');
const { serializeProducts, serializeDocument } = require('../utils/imageUtils');

/**
 * Homepage payload: featured products, trending (best-selling), recently
 * added, active offers (discounted items), and the active category list.
 * All queries are scoped to active products only — this is public-facing.
 */
const getHomeData = async () => {
  const [featured, trending, recentlyAdded, offers, categories] = await Promise.all([
    Product.find({ status: 'active', isFeatured: true })
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .limit(8),
    Product.find({ status: 'active' })
      .populate('category', 'name slug')
      .sort({ soldCount: -1 })
      .limit(8),
    Product.find({ status: 'active' })
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .limit(8),
    Product.find({ status: 'active', discountPercent: { $gt: 0 } })
      .populate('category', 'name slug')
      .sort({ discountPercent: -1 })
      .limit(8),
    Category.find({ isActive: true }).sort({ name: 1 }),
  ]);

  return {
    featured: serializeProducts(featured),
    trending: serializeProducts(trending),
    recentlyAdded: serializeProducts(recentlyAdded),
    offers: serializeProducts(offers),
    categories: categories.map((category) => serializeDocument(category)),
  };
};

/**
 * Public product listing — always forces status:'active' regardless of what
 * the caller passes, since this powers the student-facing catalog and must
 * never leak inactive/discontinued products by relying on the frontend to
 * remember to filter them out.
 */
const getStoreProducts = async (query) => {
  return productService.listProducts({ ...query, status: 'active' });
};

/**
 * Public product detail — 404s (not just "inactive") if the product isn't
 * active, so a direct link to a discontinued product doesn't leak its
 * existence to students.
 */
const getStoreProductById = async (id) => {
  const product = await productService.getProductById(id);
  if (product.status !== 'active') {
    const ApiError = require('../utils/ApiError');
    throw new ApiError(404, 'Product not found');
  }
  return product;
};

/**
 * A handful of related products from the same category, for the product
 * detail page's "you might also like" section.
 */
const getRelatedProducts = async (productId, categoryId, limit = 4) => {
  const related = await Product.find({ status: 'active', category: categoryId, _id: { $ne: productId } })
    .sort({ soldCount: -1 })
    .limit(limit)
    .lean();
  return serializeProducts(related);
};

module.exports = { getHomeData, getStoreProducts, getStoreProductById, getRelatedProducts };
