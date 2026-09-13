const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const wishlistService = require('../services/wishlistService');

const getWishlist = asyncHandler(async (req, res) => {
  const products = await wishlistService.getWishlist(req.user._id);
  success(res, 200, 'Wishlist fetched', { products });
});

const toggleWishlist = asyncHandler(async (req, res) => {
  const { added, products } = await wishlistService.toggleWishlist(req.user._id, req.params.productId);
  success(res, 200, added ? 'Added to wishlist' : 'Removed from wishlist', { added, products });
});

module.exports = { getWishlist, toggleWishlist };
