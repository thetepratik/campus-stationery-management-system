const Wishlist = require('../models/Wishlist');
const { serializeProducts } = require('../utils/imageUtils');

const getOrCreateWishlist = async (studentId) => {
  let wishlist = await Wishlist.findOne({ student: studentId });
  if (!wishlist) {
    wishlist = await Wishlist.create({ student: studentId, products: [] });
  }
  return wishlist;
};

const getWishlist = async (studentId) => {
  const wishlist = await Wishlist.findOne({ student: studentId }).populate({
    path: 'products',
    match: { status: 'active' },
    select: 'name slug images sellingPrice discountPercent currentStock ratingAverage ratingCount',
  });
  const products = wishlist?.products || [];
  return serializeProducts(products);
};

/**
 * Adds the product if absent, removes it if present. Returns the updated
 * product list plus whether it ended up added or removed.
 */
const toggleWishlist = async (studentId, productId) => {
  const wishlist = await getOrCreateWishlist(studentId);
  const index = wishlist.products.findIndex((p) => p.toString() === productId);

  let added;
  if (index >= 0) {
    wishlist.products.splice(index, 1);
    added = false;
  } else {
    wishlist.products.push(productId);
    added = true;
  }

  await wishlist.save();
  return { added, products: wishlist.products };
};

module.exports = { getWishlist, toggleWishlist };
