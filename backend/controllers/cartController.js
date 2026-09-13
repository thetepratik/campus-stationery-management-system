const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const cartService = require('../services/cartService');

const getCart = asyncHandler(async (req, res) => {
  const summary = await cartService.getCartSummary(req.user._id);
  success(res, 200, 'Cart fetched', summary);
});

const addItem = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;
  const summary = await cartService.addItem(req.user._id, productId, quantity);
  success(res, 200, 'Item added to cart', summary);
});

const updateItem = asyncHandler(async (req, res) => {
  const summary = await cartService.updateItemQuantity(req.user._id, req.params.productId, req.body.quantity);
  success(res, 200, 'Cart updated', summary);
});

const removeItem = asyncHandler(async (req, res) => {
  const summary = await cartService.removeItem(req.user._id, req.params.productId);
  success(res, 200, 'Item removed from cart', summary);
});

const applyCoupon = asyncHandler(async (req, res) => {
  const summary = await cartService.applyCoupon(req.user._id, req.body.code);
  success(res, 200, 'Coupon applied', summary);
});

const removeCoupon = asyncHandler(async (req, res) => {
  const summary = await cartService.removeCoupon(req.user._id);
  success(res, 200, 'Coupon removed', summary);
});

module.exports = { getCart, addItem, updateItem, removeItem, applyCoupon, removeCoupon };
