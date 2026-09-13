const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const orderService = require('../services/orderService');

/**
 * POST /api/orders/checkout — Cash on Pickup only. Razorpay checkout goes
 * through POST /api/orders/checkout/razorpay instead, since it returns a
 * different payload shape (razorpayOrderId + key for the Checkout widget).
 */
const checkoutCash = asyncHandler(async (req, res) => {
  const io = req.app.get('io');
  const order = await orderService.createCashOrder(req.user._id, req.body, io);
  success(res, 201, `Order ${order.orderId} placed successfully`, { order });
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
