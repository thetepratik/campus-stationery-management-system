const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const orderService = require('../services/orderService');
const ApiError = require('../utils/ApiError');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const ShopSettings = require('../models/ShopSettings');
const { streamOrderInvoice } = require('../services/invoicePdfService');
const mongoose = require('mongoose');

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
  success(res, 200, 'Order retrieved successfully', { order });
});

const listMyOrders = asyncHandler(async (req, res) => {
  const orders = await orderService.listOrdersForStudent(req.user._id);
  success(res, 200, 'Orders retrieved successfully', { orders });
});

const downloadInvoice = asyncHandler(async (req, res) => {
  const query = mongoose.Types.ObjectId.isValid(req.params.id)
    ? { _id: req.params.id }
    : { orderId: req.params.id };

  const order = await Order.findOne(query)
    .populate('student', 'name rollNumber department mobile email')
    .populate('items');

  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  // Student authorization / ownership check
  if (order.student?._id?.toString() !== req.user._id?.toString()) {
    throw new ApiError(403, 'Not authorized to access this invoice');
  }

  const [payment, shopSettings] = await Promise.all([
    Payment.findOne({ order: order._id }).lean(),
    ShopSettings.findOne().lean(),
  ]);

  streamOrderInvoice(order, payment, res, shopSettings);
});

module.exports = {
  checkoutCash,
  checkoutRazorpay,
  getMyOrder,
  listMyOrders,
  downloadInvoice,
};
