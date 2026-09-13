const Review = require('../models/Review');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const { getPagination } = require('../utils/pagination');

/**
 * Recomputes and persists a product's ratingAverage/ratingCount from its
 * actual review documents, so the cached fields on Product never drift.
 */
const recomputeProductRating = async (productId) => {
  const agg = await Review.aggregate([
    { $match: { product: productId } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  const ratingAverage = agg[0] ? Math.round(agg[0].avg * 10) / 10 : 0;
  const ratingCount = agg[0]?.count || 0;

  await Product.updateOne({ _id: productId }, { ratingAverage, ratingCount });
  return { ratingAverage, ratingCount };
};

const createReview = async (productId, studentId, { rating, comment }) => {
  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, 'Product not found');

  const existing = await Review.findOne({ product: productId, student: studentId });
  if (existing) {
    throw new ApiError(409, 'You have already reviewed this product. You can edit your existing review instead.');
  }

  const review = await Review.create({ product: productId, student: studentId, rating, comment });
  await recomputeProductRating(productId);

  return Review.findById(review._id).populate('student', 'name');
};

const updateReview = async (reviewId, studentId, { rating, comment }) => {
  const review = await Review.findOne({ _id: reviewId, student: studentId });
  if (!review) throw new ApiError(404, 'Review not found');

  review.rating = rating;
  review.comment = comment;
  await review.save();
  await recomputeProductRating(review.product);

  return review.populate('student', 'name');
};

const deleteReview = async (reviewId, studentId) => {
  const review = await Review.findOneAndDelete({ _id: reviewId, student: studentId });
  if (!review) throw new ApiError(404, 'Review not found');
  await recomputeProductRating(review.product);
};

const listReviewsForProduct = async (productId, query) => {
  const { skip, limit, buildMeta } = getPagination(query, 10, 50);

  const [items, totalCount] = await Promise.all([
    Review.find({ product: productId })
      .populate('student', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Review.countDocuments({ product: productId }),
  ]);

  return { items, meta: buildMeta(totalCount) };
};

module.exports = { createReview, updateReview, deleteReview, listReviewsForProduct };
