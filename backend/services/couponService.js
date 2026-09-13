const Coupon = require('../models/Coupon');
const ApiError = require('../utils/ApiError');

/**
 * Validates a coupon code against a cart subtotal and returns the coupon
 * doc + computed discount amount. Throws with a clear message for every
 * failure case (not found, inactive, expired, usage cap hit, minimum not met).
 * Does NOT increment usedCount — that only happens when an order is actually
 * placed (see orderService), so previewing a coupon in the cart never
 * consumes it.
 */
const validateCoupon = async (code, subtotal) => {
  if (!code) throw new ApiError(400, 'Coupon code is required');

  const coupon = await Coupon.findOne({ code: code.toUpperCase() });
  if (!coupon) throw new ApiError(404, 'Invalid coupon code');
  if (!coupon.isActive) throw new ApiError(400, 'This coupon is no longer active');
  if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new ApiError(400, 'This coupon has expired');
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    throw new ApiError(400, 'This coupon has reached its usage limit');
  }
  if (subtotal < coupon.minOrderAmount) {
    throw new ApiError(400, `This coupon requires a minimum order of ₹${coupon.minOrderAmount}`);
  }

  const discountAmount =
    coupon.discountType === 'percent'
      ? Math.round(((subtotal * coupon.discountValue) / 100) * 100) / 100
      : Math.min(coupon.discountValue, subtotal);

  return { coupon, discountAmount };
};

const incrementCouponUsage = async (code) => {
  await Coupon.updateOne({ code: code.toUpperCase() }, { $inc: { usedCount: 1 } });
};

module.exports = { validateCoupon, incrementCouponUsage };
