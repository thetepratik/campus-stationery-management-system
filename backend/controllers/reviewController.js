const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const reviewService = require('../services/reviewService');

const createReview = asyncHandler(async (req, res) => {
  const { productId, rating, comment } = req.body;
  const review = await reviewService.createReview(productId, req.user._id, { rating, comment });
  success(res, 201, 'Review submitted successfully', { review });
});

const updateReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const review = await reviewService.updateReview(req.params.id, req.user._id, { rating, comment });
  success(res, 200, 'Review updated successfully', { review });
});

const deleteReview = asyncHandler(async (req, res) => {
  await reviewService.deleteReview(req.params.id, req.user._id);
  success(res, 200, 'Review deleted successfully');
});

const listForProduct = asyncHandler(async (req, res) => {
  const { items, meta } = await reviewService.listReviewsForProduct(req.params.productId, req.query);
  success(res, 200, 'Reviews fetched', { reviews: items }, meta);
});

module.exports = { createReview, updateReview, deleteReview, listForProduct };
