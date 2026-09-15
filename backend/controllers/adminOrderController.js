const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const adminOrderService = require('../services/adminOrderService');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const ShopSettings = require('../models/ShopSettings');
const { streamOrderInvoice } = require('../services/invoicePdfService');
const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');

const listOrders = asyncHandler(async (req, res) => {
  const { items, meta } = await adminOrderService.listAllOrders(req.query);
  success(res, 200, 'Orders fetched', { orders: items }, meta);
});

const getOrder = asyncHandler(async (req, res) => {
  const { order, payment } = await adminOrderService.getOrderById(req.params.id);
  success(res, 200, 'Order fetched', { order, payment });
});

const updateStatus = asyncHandler(async (req, res) => {
  const io = req.app.get('io');
  const order = await adminOrderService.updateOrderStatus(req.params.id, req.body.status, req.user._id, io);
  success(res, 200, `Order status updated to "${order.status}"`, { order });
});

const cancelOrder = asyncHandler(async (req, res) => {
  const io = req.app.get('io');
  const order = await adminOrderService.cancelOrder(req.params.id, req.user._id, req.body.reason, io);
  success(res, 200, `Order ${order.orderId} cancelled`, { order });
});

const deleteOrder = asyncHandler(async (req, res) => {
  const result = await adminOrderService.deleteOrder(req.params.id, req.user._id);
  success(res, 200, `Order ${result.orderId} removed successfully`, result);
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

  const [payment, shopSettings] = await Promise.all([
    Payment.findOne({ order: order._id }).lean(),
    ShopSettings.findOne().lean(),
  ]);

  streamOrderInvoice(order, payment, res, shopSettings);
});

module.exports = {
  listOrders,
  getOrder,
  updateStatus,
  cancelOrder,
  deleteOrder,
  downloadInvoice,
};
