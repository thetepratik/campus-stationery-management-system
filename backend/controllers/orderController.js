const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const orderService = require('../services/orderService');

const ApiError = require('../utils/ApiError');

/**
 * POST /api/orders/checkout — Cash on Pickup has been deprecated for student checkout.
 * Only Razorpay online payments are supported.
 */
const checkoutCash = asyncHandler(async (req, res) => {
  throw new ApiError(
    400,
    'Cash on Pickup / offline payment is not supported for student checkout. Please pay online via Razorpay.'
  );
});

const checkoutRazorpay = asyncHandler(async (req, res) => {
  const io = req.app.get('io');
  const result = await orderService.createRazorpayOrder(req.user._id, req.body, io);
  success(res, 201, 'Razorpay order created — complete payment to confirm', result);
});

const getMyOrder = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderForStudent(req.user._id, req.params.id);
  success(res, 200, 'Order fetched', { order });
});

const listMyOrders = asyncHandler(async (req, res) => {
  const orders = await orderService.listOrdersForStudent(req.user._id);
  success(res, 200, 'Orders fetched', { orders });
});

module.exports = { checkoutCash, checkoutRazorpay, getMyOrder, listMyOrders };
