const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Sale = require('../models/Sale');
const Order = require('../models/Order');
const Notification = require('../models/Notification');
const { ORDER_STATUS, PAYMENT_METHOD, OFFLINE_PAYMENT_METHOD } = require('../config/constants');
const { serializeProducts, serializeDocument } = require('../utils/imageUtils');

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const startOfMonth = () => {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
};

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
};


const getSummary = async () => {
  const today = startOfToday();
  const monthStart = startOfMonth();

  const [
    totalProducts,
    totalCategories,
    stockAgg,
    lowStockCount,
    outOfStockCount,
    todayOfflineSalesAgg,
    todayOnlineOrdersAgg,
    monthlyRevenueAgg,
    orderStatusCounts,
    inventoryValueAgg,
  ] = await Promise.all([
    Product.countDocuments({ status: 'active' }),
    Category.countDocuments({ isActive: true }),
    Product.aggregate([{ $group: { _id: null, totalStock: { $sum: '$currentStock' } } }]),
    Product.countDocuments({ $expr: { $and: [{ $gt: ['$currentStock', 0] }, { $lte: ['$currentStock', '$minStock'] }] } }),
    Product.countDocuments({ currentStock: { $lte: 0 } }),
    Sale.aggregate([
      { $match: { createdAt: { $gte: today }, paymentConfirmed: true, status: { $ne: 'reversed' } } },
      { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: today }, paymentStatus: 'paid' } },
      { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
    ]),
    (async () => {
      const [offline, online] = await Promise.all([
        Sale.aggregate([
          { $match: { createdAt: { $gte: monthStart }, paymentConfirmed: true, status: { $ne: 'reversed' } } },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } },
        ]),
        Order.aggregate([
          { $match: { createdAt: { $gte: monthStart }, paymentStatus: 'paid' } },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } },
        ]),
      ]);
      return (offline[0]?.total || 0) + (online[0]?.total || 0);
    })(),
    Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Product.aggregate([
      { $group: { _id: null, value: { $sum: { $multiply: ['$currentStock', '$purchasePrice'] } } } },
    ]),
  ]);

  const statusMap = orderStatusCounts.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {});

  return {
    totalProducts,
    totalCategories,
    availableStock: stockAgg[0]?.totalStock || 0,
    lowStockCount,
    outOfStockCount,
    todayOfflineSalesCount: todayOfflineSalesAgg[0]?.count || 0,
    todayOfflineRevenue: todayOfflineSalesAgg[0]?.revenue || 0,
    todayOnlineOrdersCount: todayOnlineOrdersAgg[0]?.count || 0,
    todayOnlineRevenue: todayOnlineOrdersAgg[0]?.revenue || 0,
    todayTotalRevenue: (todayOfflineSalesAgg[0]?.revenue || 0) + (todayOnlineOrdersAgg[0]?.revenue || 0),
    monthlyRevenue: monthlyRevenueAgg,
    pendingOrders: statusMap[ORDER_STATUS.PENDING] || 0,
    completedOrders: statusMap[ORDER_STATUS.COMPLETED] || 0,
    cancelledOrders: statusMap[ORDER_STATUS.CANCELLED] || 0,
    inventoryValue: inventoryValueAgg[0]?.value || 0,
  };
};

/**
 * Sales overview chart: total transactions per day, offline + online combined,
 * for the last N days (default 30).
 */
const getSalesChart = async (rangeDays = 30) => {
  const from = daysAgo(rangeDays - 1);

  const [offlineDaily, onlineDaily] = await Promise.all([
    Sale.aggregate([
      { $match: { createdAt: { $gte: from }, paymentConfirmed: true, status: { $ne: 'reversed' } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: from }, paymentStatus: 'paid' } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
    ]),
  ]);

  const offlineMap = new Map(offlineDaily.map((d) => [d._id, d.count]));
  const onlineMap = new Map(onlineDaily.map((d) => [d._id, d.count]));

  const labels = [];
  const data = [];
  for (let i = rangeDays - 1; i >= 0; i--) {
    const d = daysAgo(i);
    const key = d.toISOString().slice(0, 10);
    labels.push(key);
    data.push((offlineMap.get(key) || 0) + (onlineMap.get(key) || 0));
  }

  return { labels, data };
};

/**
 * Revenue overview chart: revenue per day, offline + online combined.
 */
const getRevenueChart = async (rangeDays = 30) => {
  const from = daysAgo(rangeDays - 1);

  const [offlineDaily, onlineDaily] = await Promise.all([
    Sale.aggregate([
      { $match: { createdAt: { $gte: from }, paymentConfirmed: true, status: { $ne: 'reversed' } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$totalAmount' } } },
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: from }, paymentStatus: 'paid' } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$totalAmount' } } },
    ]),
  ]);

  const offlineMap = new Map(offlineDaily.map((d) => [d._id, d.revenue]));
  const onlineMap = new Map(onlineDaily.map((d) => [d._id, d.revenue]));

  const labels = [];
  const data = [];
  for (let i = rangeDays - 1; i >= 0; i--) {
    const d = daysAgo(i);
    const key = d.toISOString().slice(0, 10);
    labels.push(key);
    data.push(Math.round(((offlineMap.get(key) || 0) + (onlineMap.get(key) || 0)) * 100) / 100);
  }

  return { labels, data };
};

/**
 * Payment method breakdown (offline sales) — feeds the pie chart.
 */
const getPaymentMethodChart = async () => {
  const results = await Sale.aggregate([
    { $match: { paymentConfirmed: true, status: { $ne: 'reversed' } } },
    { $group: { _id: '$paymentMethod', count: { $sum: 1 } } },
  ]);

  const allMethods = Object.values(OFFLINE_PAYMENT_METHOD);
  const map = new Map(results.map((r) => [r._id, r.count]));

  return {
    labels: allMethods,
    data: allMethods.map((m) => map.get(m) || 0),
  };
};

/**
 * Category-wise product distribution — feeds the category chart.
 */
const getCategoryChart = async () => {
  const results = await Product.aggregate([
    { $match: { status: 'active' } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
    { $unwind: '$category' },
    { $project: { _id: 0, name: '$category.name', count: 1 } },
    { $sort: { count: -1 } },
  ]);

  return {
    labels: results.map((r) => r.name),
    data: results.map((r) => r.count),
  };
};

const getTopSellingProducts = async (limit = 5) => {
  const products = await Product.find({ status: 'active' })
    .sort({ soldCount: -1 })
    .limit(limit)
    .select('name soldCount sellingPrice images currentStock');
  return products.map((p) => serializeDocument(p));
};

const getLeastSellingProducts = async (limit = 5) => {
  return Product.find({ status: 'active' })
    .sort({ soldCount: 1 })
    .limit(limit)
    .select('name soldCount sellingPrice images currentStock')
    .lean();
};

const getLowStockAlerts = async (limit = 10) => {
  const products = await Product.find({ $expr: { $and: [{ $gt: ['$currentStock', 0] }, { $lte: ['$currentStock', '$minStock'] }] } })
    .sort({ currentStock: 1 })
    .limit(limit)
    .select('name currentStock minStock images');
  return products.map((p) => serializeDocument(p));
};

const getOutOfStockAlerts = async (limit = 10) => {
  const products = await Product.find({ currentStock: { $lte: 0 } })
    .sort({ updatedAt: -1 })
    .limit(limit)
    .select('name currentStock images');
  return products.map((p) => serializeDocument(p));
};

const getRecentOrders = async (limit = 8) => {
  return Order.find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('student', 'name rollNumber')
    .select('orderId student totalAmount paymentStatus status createdAt itemsCount')
    .lean();
};

const getRecentSales = async (limit = 8) => {
  return Sale.find({ paymentConfirmed: true })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('saleId items totalAmount customerName paymentMethod status createdAt')
    .lean();
};

const getRecentNotifications = async (limit = 10) => {
  return Notification.find({ recipientType: 'admin' })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

/**
 * Aggregates everything the dashboard page needs into a single payload so the
 * frontend can render the full view with one request.
 */
const getFullDashboard = async () => {
  const [
    summary,
    salesChart,
    revenueChart,
    paymentMethodChart,
    categoryChart,
    topSelling,
    leastSelling,
    lowStockAlerts,
    outOfStockAlerts,
    recentOrders,
    recentSales,
    recentNotifications,
  ] = await Promise.all([
    getSummary(),
    getSalesChart(30),
    getRevenueChart(30),
    getPaymentMethodChart(),
    getCategoryChart(),
    getTopSellingProducts(5),
    getLeastSellingProducts(5),
    getLowStockAlerts(10),
    getOutOfStockAlerts(10),
    getRecentOrders(8),
    getRecentSales(8),
    getRecentNotifications(10),
  ]);

  return {
    summary,
    charts: { salesChart, revenueChart, paymentMethodChart, categoryChart },
    products: { topSelling, leastSelling },
    inventoryAlerts: { lowStock: lowStockAlerts, outOfStock: outOfStockAlerts },
    recent: { orders: recentOrders, sales: recentSales, notifications: recentNotifications },
  };
};

module.exports = {
  getSummary,
  getSalesChart,
  getRevenueChart,
  getPaymentMethodChart,
  getCategoryChart,
  getTopSellingProducts,
  getLeastSellingProducts,
  getLowStockAlerts,
  getOutOfStockAlerts,
  getRecentOrders,
  getRecentSales,
  getRecentNotifications,
  getFullDashboard,
};
