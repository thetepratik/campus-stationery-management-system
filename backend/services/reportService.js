const mongoose = require('mongoose');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

const Sale = require('../models/Sale');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Payment = require('../models/Payment');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Student = require('../models/Student');
const Admin = require('../models/Admin');

const { serializeDocument } = require('../utils/imageUtils');
const { getPagination } = require('../utils/pagination');

/**
 * Normalizes payment method names into clean human-readable labels.
 */
const normalizePaymentMethod = (method) => {
  if (!method) return 'Unknown';
  const m = String(method).toLowerCase();
  switch (m) {
    case 'cash':
    case 'cash-on-pickup':
      return 'Cash';
    case 'upi':
      return 'UPI';
    case 'gpay':
    case 'googlepay':
      return 'Google Pay';
    case 'phonepe':
      return 'PhonePe';
    case 'paytm':
      return 'Paytm';
    case 'bhim':
      return 'BHIM UPI';
    case 'card':
      return 'Debit / Credit Card';
    case 'netbanking':
      return 'Net Banking';
    case 'wallet':
      return 'Wallet';
    case 'razorpay':
      return 'Razorpay';
    default:
      return method.charAt(0).toUpperCase() + method.slice(1);
  }
};

/**
 * Computes start/end Date objects from query strings.
 */
const parseDateRange = (fromDate, toDate) => {
  let from;
  let to;

  if (fromDate) {
    from = new Date(fromDate);
    from.setHours(0, 0, 0, 0);
  } else {
    from = new Date();
    from.setDate(1);
    from.setHours(0, 0, 0, 0);
  }

  if (toDate) {
    to = new Date(toDate);
    to.setHours(23, 59, 59, 999);
  } else {
    to = new Date();
    to.setHours(23, 59, 59, 999);
  }

  return { from, to };
};

/**
 * Generates the complete Sales Report data aggregating from existing collections.
 */
const getSalesReportData = async (query = {}) => {
  const { from, to } = parseDateRange(query.fromDate, query.toDate);

  const offlineMatch = {
    createdAt: { $gte: from, $lte: to },
    paymentConfirmed: true,
    status: { $ne: 'reversed' },
  };

  const onlineMatch = {
    createdAt: { $gte: from, $lte: to },
    paymentStatus: 'paid',
  };

  const refundMatch = {
    createdAt: { $gte: from, $lte: to },
    $or: [{ paymentStatus: 'refunded' }, { status: 'refunded' }],
  };

  const [
    offlineSummaryAgg,
    onlineSummaryAgg,
    refundSummaryAgg,
    offlineDailyAgg,
    onlineDailyAgg,
    offlinePaymentAgg,
    onlinePaymentAgg,
    offlineItemsAgg,
    onlineItemsAgg,
  ] = await Promise.all([
    // 1. Offline summary
    Sale.aggregate([
      { $match: offlineMatch },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalSales: { $sum: 1 },
          totalItemsSold: { $sum: { $sum: '$items.quantity' } },
        },
      },
    ]),

    // 2. Online summary (Paid orders)
    Order.aggregate([
      { $match: onlineMatch },
      {
        $lookup: {
          from: 'orderitems',
          localField: '_id',
          foreignField: 'order',
          as: 'orderItems',
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalSales: { $sum: 1 },
          totalItemsSold: { $sum: { $sum: '$orderItems.quantity' } },
        },
      },
    ]),

    // 3. Refunds summary
    Order.aggregate([
      { $match: refundMatch },
      {
        $group: {
          _id: null,
          totalRefunds: { $sum: '$totalAmount' },
          refundCount: { $sum: 1 },
        },
      },
    ]),

    // 4. Offline daily trend
    Sale.aggregate([
      { $match: offlineMatch },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          sales: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
          itemsSold: { $sum: { $sum: '$items.quantity' } },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    // 5. Online daily trend
    Order.aggregate([
      { $match: onlineMatch },
      {
        $lookup: {
          from: 'orderitems',
          localField: '_id',
          foreignField: 'order',
          as: 'orderItems',
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          sales: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
          itemsSold: { $sum: { $sum: '$orderItems.quantity' } },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    // 6. Offline payment methods
    Sale.aggregate([
      { $match: offlineMatch },
      {
        $group: {
          _id: '$paymentMethod',
          transactions: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
        },
      },
    ]),

    // 7. Online payment methods
    Order.aggregate([
      { $match: onlineMatch },
      {
        $lookup: {
          from: 'payments',
          localField: '_id',
          foreignField: 'order',
          as: 'paymentInfo',
        },
      },
      {
        $unwind: {
          path: '$paymentInfo',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: {
            $ifNull: ['$paymentInfo.method', '$paymentMethod'],
          },
          transactions: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
        },
      },
    ]),

    // 8. Offline product items for category & product analytics
    Sale.aggregate([
      { $match: offlineMatch },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productDoc',
        },
      },
      { $unwind: { path: '$productDoc', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'categories',
          localField: 'productDoc.category',
          foreignField: '_id',
          as: 'categoryDoc',
        },
      },
      { $unwind: { path: '$categoryDoc', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          saleId: '$_id',
          productId: '$items.product',
          name: '$items.name',
          quantity: '$items.quantity',
          unitPrice: '$items.unitPrice',
          subtotal: '$items.subtotal',
          categoryName: { $ifNull: ['$categoryDoc.name', 'General'] },
          categoryId: '$categoryDoc._id',
          productSku: '$productDoc.sku',
          images: '$productDoc.images',
        },
      },
    ]),

    // 9. Online product items for category & product analytics
    Order.aggregate([
      { $match: onlineMatch },
      {
        $lookup: {
          from: 'orderitems',
          localField: '_id',
          foreignField: 'order',
          as: 'items',
        },
      },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productDoc',
        },
      },
      { $unwind: { path: '$productDoc', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'categories',
          localField: 'productDoc.category',
          foreignField: '_id',
          as: 'categoryDoc',
        },
      },
      { $unwind: { path: '$categoryDoc', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          orderId: '$_id',
          productId: '$items.product',
          name: '$items.name',
          quantity: '$items.quantity',
          unitPrice: '$items.unitPrice',
          subtotal: '$items.subtotal',
          categoryName: { $ifNull: ['$categoryDoc.name', 'General'] },
          categoryId: '$categoryDoc._id',
          productSku: '$productDoc.sku',
          images: '$productDoc.images',
        },
      },
    ]),
  ]);

  // -----------------------------------------------------------------
  // SUMMARY CALCULATIONS
  // -----------------------------------------------------------------
  const offlineRev = offlineSummaryAgg[0]?.totalRevenue || 0;
  const offlineSalesCount = offlineSummaryAgg[0]?.totalSales || 0;
  const offlineItems = offlineSummaryAgg[0]?.totalItemsSold || 0;

  const onlineRev = onlineSummaryAgg[0]?.totalRevenue || 0;
  const onlineSalesCount = onlineSummaryAgg[0]?.totalSales || 0;
  const onlineItems = onlineSummaryAgg[0]?.totalItemsSold || 0;

  const totalRevenue = Math.round((offlineRev + onlineRev) * 100) / 100;
  const totalSales = offlineSalesCount + onlineSalesCount;
  const totalItemsSold = offlineItems + onlineItems;
  const averageOrderValue = totalSales > 0 ? Math.round((totalRevenue / totalSales) * 100) / 100 : 0;
  const refunds = Math.round((refundSummaryAgg[0]?.totalRefunds || 0) * 100) / 100;
  const netRevenue = Math.round((totalRevenue - refunds) * 100) / 100;

  const summary = {
    totalRevenue,
    totalSales,
    totalItemsSold,
    averageOrderValue,
    offlineSales: offlineRev,
    onlineSales: onlineRev,
    offlineSalesCount,
    onlineSalesCount,
    refunds,
    refundCount: refundSummaryAgg[0]?.refundCount || 0,
    netRevenue,
    fromDate: from.toISOString(),
    toDate: to.toISOString(),
  };

  // -----------------------------------------------------------------
  // SALES TREND CALCULATION (fill continuous date series)
  // -----------------------------------------------------------------
  const offlineDailyMap = new Map(offlineDailyAgg.map((d) => [d._id, d]));
  const onlineDailyMap = new Map(onlineDailyAgg.map((d) => [d._id, d]));

  const salesTrend = [];
  const curr = new Date(from);
  while (curr <= to) {
    const key = curr.toISOString().slice(0, 10);
    const off = offlineDailyMap.get(key) || { sales: 0, revenue: 0, itemsSold: 0 };
    const on = onlineDailyMap.get(key) || { sales: 0, revenue: 0, itemsSold: 0 };

    salesTrend.push({
      date: key,
      displayDate: curr.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      sales: off.sales + on.sales,
      revenue: Math.round((off.revenue + on.revenue) * 100) / 100,
      itemsSold: off.itemsSold + on.itemsSold,
      offlineRevenue: off.revenue,
      onlineRevenue: on.revenue,
      offlineSales: off.sales,
      onlineSales: on.sales,
    });
    curr.setDate(curr.getDate() + 1);
  }

  // -----------------------------------------------------------------
  // PAYMENT METHODS BREAKDOWN
  // -----------------------------------------------------------------
  const paymentMethodMap = new Map();

  const addPaymentMethod = (rawMethod, txns, rev) => {
    const label = normalizePaymentMethod(rawMethod);
    const existing = paymentMethodMap.get(label) || { method: label, transactions: 0, revenue: 0 };
    existing.transactions += txns;
    existing.revenue += rev;
    paymentMethodMap.set(label, existing);
  };

  offlinePaymentAgg.forEach((p) => addPaymentMethod(p._id, p.transactions, p.revenue));
  onlinePaymentAgg.forEach((p) => addPaymentMethod(p._id, p.transactions, p.revenue));

  const paymentMethods = Array.from(paymentMethodMap.values())
    .map((p) => ({
      ...p,
      revenue: Math.round(p.revenue * 100) / 100,
      percentage: totalRevenue > 0 ? Math.round((p.revenue / totalRevenue) * 100) : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  // -----------------------------------------------------------------
  // CATEGORY SALES BREAKDOWN
  // -----------------------------------------------------------------
  const allLineItems = [...offlineItemsAgg, ...onlineItemsAgg];
  const categoryMap = new Map();

  allLineItems.forEach((item) => {
    const catName = item.categoryName || 'General';
    const existing = categoryMap.get(catName) || {
      category: catName,
      itemsSold: 0,
      revenue: 0,
      saleIds: new Set(),
    };
    existing.itemsSold += item.quantity;
    existing.revenue += item.subtotal;
    if (item.saleId) existing.saleIds.add(`off_${item.saleId}`);
    if (item.orderId) existing.saleIds.add(`on_${item.orderId}`);
    categoryMap.set(catName, existing);
  });

  const categories = Array.from(categoryMap.values())
    .map((c) => ({
      category: c.category,
      itemsSold: c.itemsSold,
      transactions: c.saleIds.size,
      revenue: Math.round(c.revenue * 100) / 100,
      percentage: totalRevenue > 0 ? Math.round((c.revenue / totalRevenue) * 100) : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  // -----------------------------------------------------------------
  // TOP & LEAST SELLING PRODUCTS
  // -----------------------------------------------------------------
  const productMap = new Map();

  allLineItems.forEach((item) => {
    const pid = item.productId ? item.productId.toString() : item.name;
    const existing = productMap.get(pid) || {
      productId: item.productId,
      name: item.name,
      category: item.categoryName || 'General',
      sku: item.productSku || '',
      quantitySold: 0,
      revenue: 0,
      images: item.images || [],
    };
    existing.quantitySold += item.quantity;
    existing.revenue += item.subtotal;
    productMap.set(pid, existing);
  });

  const aggregatedProducts = Array.from(productMap.values()).map((p) => {
    const serialized = serializeDocument({ images: p.images });
    return {
      productId: p.productId,
      name: p.name,
      category: p.category,
      sku: p.sku,
      image: serialized.images?.[0] || '',
      quantitySold: p.quantitySold,
      revenue: Math.round(p.revenue * 100) / 100,
    };
  });

  const topProducts = [...aggregatedProducts]
    .sort((a, b) => b.quantitySold - a.quantitySold || b.revenue - a.revenue)
    .slice(0, 10)
    .map((p, idx) => ({ ...p, rank: idx + 1 }));

  const leastProducts = [...aggregatedProducts]
    .sort((a, b) => a.quantitySold - b.quantitySold || a.revenue - b.revenue)
    .slice(0, 10)
    .map((p, idx) => ({ ...p, rank: idx + 1 }));

  // -----------------------------------------------------------------
  // TRANSACTION LIST WITH SEARCH, FILTERING, SORTING, PAGINATION
  // -----------------------------------------------------------------
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 15;
  const sortBy = query.sortBy || 'date';
  const sortOrder = query.sortOrder === 'asc' || query.sortOrder === '1' ? 1 : -1;

  // Build combined transactions
  const [offlineDocs, onlineDocs] = await Promise.all([
    Sale.find(offlineMatch)
      .populate('items.product', 'name sku images category')
      .populate('soldBy', 'name')
      .lean(),
    Order.find(onlineMatch)
      .populate('student', 'name rollNumber department email mobile')
      .populate({
        path: 'items',
        populate: { path: 'product', select: 'name sku images category' },
      })
      .lean(),
  ]);

  let unifiedTransactions = [];

  // Transform offline sales
  offlineDocs.forEach((s) => {
    const items = (s.items || []).map((i) => {
      const p = i.product || {};
      const ser = serializeDocument(p);
      return {
        product: i.product?._id || i.product,
        name: i.name,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        gstPercent: i.gstPercent || 0,
        subtotal: i.subtotal,
        image: ser?.images?.[0] || '',
        category: p.category?.name || 'General',
      };
    });

    const totalQty = items.reduce((sum, i) => sum + i.quantity, 0);

    unifiedTransactions.push({
      _id: s._id,
      transactionId: s.saleId,
      saleType: 'Offline',
      customerName: s.customerName || 'Walk-in Customer',
      rollNumber: s.rollNumber || '-',
      department: s.department || '-',
      items,
      quantity: totalQty,
      unitPrice: items.length === 1 ? items[0].unitPrice : null,
      discount: 0,
      gst: items.reduce((sum, i) => sum + ((i.subtotal * (i.gstPercent || 0)) / 100), 0),
      totalAmount: s.totalAmount,
      paymentMethod: normalizePaymentMethod(s.paymentMethod),
      rawPaymentMethod: s.paymentMethod,
      paymentStatus: 'paid',
      status: 'completed',
      date: new Date(s.createdAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      time: new Date(s.createdAt).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
      createdAt: s.createdAt,
    });
  });

  // Transform online orders
  onlineDocs.forEach((o) => {
    const items = (o.items || []).map((i) => {
      const p = i.product || {};
      const ser = serializeDocument(p);
      return {
        product: i.product?._id || i.product,
        name: i.name,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        gstPercent: 0,
        subtotal: i.subtotal,
        image: ser?.images?.[0] || '',
        category: p.category?.name || 'General',
      };
    });

    const totalQty = items.reduce((sum, i) => sum + i.quantity, 0);

    unifiedTransactions.push({
      _id: o._id,
      transactionId: o.orderId,
      saleType: 'Online',
      customerName: o.student?.name || 'Student',
      rollNumber: o.student?.rollNumber || '-',
      department: o.student?.department || '-',
      items,
      quantity: totalQty,
      unitPrice: items.length === 1 ? items[0].unitPrice : null,
      discount: o.discountAmount || 0,
      gst: o.gstAmount || 0,
      totalAmount: o.totalAmount,
      paymentMethod: normalizePaymentMethod(o.paymentMethod),
      rawPaymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus || 'paid',
      status: o.status,
      date: new Date(o.createdAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      time: new Date(o.createdAt).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
      createdAt: o.createdAt,
    });
  });

  // Filter unified transactions
  if (query.saleType && query.saleType !== 'all') {
    const type = query.saleType.toLowerCase();
    unifiedTransactions = unifiedTransactions.filter(
      (t) => t.saleType.toLowerCase() === type
    );
  }

  if (query.paymentMethod) {
    const pm = query.paymentMethod.toLowerCase();
    unifiedTransactions = unifiedTransactions.filter(
      (t) =>
        t.rawPaymentMethod?.toLowerCase() === pm ||
        t.paymentMethod?.toLowerCase().includes(pm)
    );
  }

  if (query.paymentStatus) {
    const ps = query.paymentStatus.toLowerCase();
    unifiedTransactions = unifiedTransactions.filter(
      (t) => t.paymentStatus?.toLowerCase() === ps
    );
  }

  if (query.department) {
    const dept = query.department.toLowerCase();
    unifiedTransactions = unifiedTransactions.filter((t) =>
      t.department?.toLowerCase().includes(dept)
    );
  }

  if (query.category) {
    const cat = query.category.toLowerCase();
    unifiedTransactions = unifiedTransactions.filter((t) =>
      t.items.some((i) => i.category?.toLowerCase() === cat)
    );
  }

  if (query.product) {
    const prod = query.product.toLowerCase();
    unifiedTransactions = unifiedTransactions.filter((t) =>
      t.items.some((i) => i.name?.toLowerCase().includes(prod))
    );
  }

  if (query.search) {
    const s = query.search.trim().toLowerCase();
    unifiedTransactions = unifiedTransactions.filter(
      (t) =>
        t.transactionId?.toLowerCase().includes(s) ||
        t.customerName?.toLowerCase().includes(s) ||
        t.rollNumber?.toLowerCase().includes(s) ||
        t.department?.toLowerCase().includes(s) ||
        t.items.some((i) => i.name?.toLowerCase().includes(s))
    );
  }

  // Sort unified transactions
  unifiedTransactions.sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'revenue' || sortBy === 'totalAmount') {
      cmp = a.totalAmount - b.totalAmount;
    } else if (sortBy === 'quantity') {
      cmp = a.quantity - b.quantity;
    } else if (sortBy === 'paymentMethod') {
      cmp = a.paymentMethod.localeCompare(b.paymentMethod);
    } else if (sortBy === 'product') {
      const nameA = a.items[0]?.name || '';
      const nameB = b.items[0]?.name || '';
      cmp = nameA.localeCompare(nameB);
    } else {
      cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    return sortOrder === 1 ? cmp : -cmp;
  });

  const totalFilteredTransactions = unifiedTransactions.length;
  const totalPages = Math.ceil(totalFilteredTransactions / limit) || 1;
  const startIndex = (page - 1) * limit;
  const paginatedTransactions = unifiedTransactions.slice(startIndex, startIndex + limit);

  return {
    summary,
    salesTrend,
    paymentMethods,
    categories,
    topProducts,
    leastProducts,
    transactions: paginatedTransactions,
    allTransactions: unifiedTransactions, // for export
    meta: {
      page,
      limit,
      totalPages,
      totalCount: totalFilteredTransactions,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

/**
 * Generates an Excel workbook for the Sales Report using ExcelJS.
 */
const generateExcelReport = async (reportData, res) => {
  const { summary, salesTrend, paymentMethods, categories, topProducts, leastProducts, allTransactions } = reportData;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Campus Stationery Management System';
  workbook.created = new Date();

  const headerFill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4F46E5' },
  };

  const headerFont = {
    name: 'Arial',
    size: 11,
    bold: true,
    color: { argb: 'FFFFFFFF' },
  };

  const borderStyle = {
    top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  };

  // Helper to format table headers
  const applyHeaderStyles = (row) => {
    row.eachCell((cell) => {
      cell.fill = headerFill;
      cell.font = headerFont;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = borderStyle;
    });
    row.height = 24;
  };

  // -------------------------------------------------------------
  // 1. SUMMARY SHEET
  // -------------------------------------------------------------
  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.columns = [
    { header: 'Metric', key: 'metric', width: 30 },
    { header: 'Value', key: 'value', width: 25 },
  ];

  applyHeaderStyles(summarySheet.getRow(1));

  const summaryRows = [
    { metric: 'Report Period', value: `${new Date(summary.fromDate).toLocaleDateString('en-IN')} – ${new Date(summary.toDate).toLocaleDateString('en-IN')}` },
    { metric: 'Total Revenue', value: `₹${summary.totalRevenue.toLocaleString('en-IN')}` },
    { metric: 'Total Transactions / Sales', value: summary.totalSales },
    { metric: 'Total Items Sold', value: summary.totalItemsSold },
    { metric: 'Average Order Value (AOV)', value: `₹${summary.averageOrderValue.toLocaleString('en-IN')}` },
    { metric: 'Offline Sales Revenue', value: `₹${summary.offlineSales.toLocaleString('en-IN')} (${summary.offlineSalesCount} sales)` },
    { metric: 'Online Orders Revenue', value: `₹${summary.onlineSales.toLocaleString('en-IN')} (${summary.onlineSalesCount} orders)` },
    { metric: 'Refunds', value: `₹${summary.refunds.toLocaleString('en-IN')} (${summary.refundCount} refunds)` },
    { metric: 'Net Revenue', value: `₹${summary.netRevenue.toLocaleString('en-IN')}` },
    { metric: 'Generated On', value: new Date().toLocaleString('en-IN') },
  ];

  summaryRows.forEach((r) => {
    const row = summarySheet.addRow(r);
    row.getCell(1).font = { bold: true };
    row.eachCell((c) => (c.border = borderStyle));
  });

  // -------------------------------------------------------------
  // 2. SALES TRANSACTIONS SHEET
  // -------------------------------------------------------------
  const txnSheet = workbook.addWorksheet('Sales Transactions');
  txnSheet.columns = [
    { header: 'Transaction ID', key: 'transactionId', width: 16 },
    { header: 'Type', key: 'saleType', width: 12 },
    { header: 'Date', key: 'date', width: 14 },
    { header: 'Time', key: 'time', width: 12 },
    { header: 'Customer Name', key: 'customerName', width: 22 },
    { header: 'Roll Number', key: 'rollNumber', width: 14 },
    { header: 'Department', key: 'department', width: 20 },
    { header: 'Items Description', key: 'items', width: 35 },
    { header: 'Total Quantity', key: 'quantity', width: 14 },
    { header: 'Discount (₹)', key: 'discount', width: 14 },
    { header: 'GST (₹)', key: 'gst', width: 12 },
    { header: 'Total Amount (₹)', key: 'totalAmount', width: 16 },
    { header: 'Payment Method', key: 'paymentMethod', width: 18 },
    { header: 'Payment Status', key: 'paymentStatus', width: 15 },
  ];
  applyHeaderStyles(txnSheet.getRow(1));

  allTransactions.forEach((t) => {
    const itemsDesc = t.items.map((i) => `${i.name} (x${i.quantity})`).join(', ');
    const row = txnSheet.addRow({
      transactionId: t.transactionId,
      saleType: t.saleType,
      date: t.date,
      time: t.time,
      customerName: t.customerName,
      rollNumber: t.rollNumber,
      department: t.department,
      items: itemsDesc,
      quantity: t.quantity,
      discount: t.discount,
      gst: Math.round(t.gst * 100) / 100,
      totalAmount: t.totalAmount,
      paymentMethod: t.paymentMethod,
      paymentStatus: t.paymentStatus,
    });
    row.eachCell((c) => (c.border = borderStyle));
  });

  // -------------------------------------------------------------
  // 3. PAYMENT SUMMARY SHEET
  // -------------------------------------------------------------
  const paySheet = workbook.addWorksheet('Payment Summary');
  paySheet.columns = [
    { header: 'Payment Method', key: 'method', width: 25 },
    { header: 'Transactions', key: 'transactions', width: 16 },
    { header: 'Revenue (₹)', key: 'revenue', width: 18 },
    { header: 'Share (%)', key: 'percentage', width: 14 },
  ];
  applyHeaderStyles(paySheet.getRow(1));

  paymentMethods.forEach((p) => {
    const row = paySheet.addRow({
      method: p.method,
      transactions: p.transactions,
      revenue: p.revenue,
      percentage: `${p.percentage}%`,
    });
    row.eachCell((c) => (c.border = borderStyle));
  });

  // -------------------------------------------------------------
  // 4. CATEGORY SUMMARY SHEET
  // -------------------------------------------------------------
  const catSheet = workbook.addWorksheet('Category Summary');
  catSheet.columns = [
    { header: 'Category', key: 'category', width: 25 },
    { header: 'Items Sold', key: 'itemsSold', width: 14 },
    { header: 'Transactions', key: 'transactions', width: 16 },
    { header: 'Revenue (₹)', key: 'revenue', width: 18 },
    { header: 'Share (%)', key: 'percentage', width: 14 },
  ];
  applyHeaderStyles(catSheet.getRow(1));

  categories.forEach((c) => {
    const row = catSheet.addRow({
      category: c.category,
      itemsSold: c.itemsSold,
      transactions: c.transactions,
      revenue: c.revenue,
      percentage: `${c.percentage}%`,
    });
    row.eachCell((c) => (c.border = borderStyle));
  });

  // -------------------------------------------------------------
  // 5. TOP PRODUCTS SHEET
  // -------------------------------------------------------------
  const topSheet = workbook.addWorksheet('Top Products');
  topSheet.columns = [
    { header: 'Rank', key: 'rank', width: 10 },
    { header: 'Product Name', key: 'name', width: 30 },
    { header: 'Category', key: 'category', width: 20 },
    { header: 'Quantity Sold', key: 'quantitySold', width: 16 },
    { header: 'Revenue (₹)', key: 'revenue', width: 18 },
  ];
  applyHeaderStyles(topSheet.getRow(1));

  topProducts.forEach((p) => {
    const row = topSheet.addRow({
      rank: p.rank,
      name: p.name,
      category: p.category,
      quantitySold: p.quantitySold,
      revenue: p.revenue,
    });
    row.eachCell((c) => (c.border = borderStyle));
  });

  // -------------------------------------------------------------
  // 6. LEAST SELLING PRODUCTS SHEET
  // -------------------------------------------------------------
  const leastSheet = workbook.addWorksheet('Least Selling Products');
  leastSheet.columns = [
    { header: 'Rank', key: 'rank', width: 10 },
    { header: 'Product Name', key: 'name', width: 30 },
    { header: 'Category', key: 'category', width: 20 },
    { header: 'Quantity Sold', key: 'quantitySold', width: 16 },
    { header: 'Revenue (₹)', key: 'revenue', width: 18 },
  ];
  applyHeaderStyles(leastSheet.getRow(1));

  leastProducts.forEach((p) => {
    const row = leastSheet.addRow({
      rank: p.rank,
      name: p.name,
      category: p.category,
      quantitySold: p.quantitySold,
      revenue: p.revenue,
    });
    row.eachCell((c) => (c.border = borderStyle));
  });

  // Stream output to res
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="sales-report-${Date.now()}.xlsx"`
  );

  await workbook.xlsx.write(res);
  res.end();
};

/**
 * Generates a styled PDF for the Sales Report using PDFKit.
 */
const generatePdfReport = async (reportData, res) => {
  const { summary, paymentMethods, categories, topProducts, allTransactions } = reportData;

  const doc = new PDFDocument({ size: 'A4', margin: 40, bufferPages: true });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `inline; filename="sales-report-${Date.now()}.pdf"`
  );

  doc.pipe(res);

  const primaryColor = '#4F46E5';
  const textColor = '#0F172A';
  const mutedColor = '#64748B';
  const borderColor = '#CBD5E1';
  const bgLight = '#F8FAFC';

  const fromStr = new Date(summary.fromDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const toStr = new Date(summary.toDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  // Header
  doc.fontSize(20).fillColor(primaryColor).font('Helvetica-Bold').text('Campus Stationery', 40, 40);
  doc.fontSize(9).fillColor(mutedColor).font('Helvetica').text('Inventory & Sales Management System', 40, 64);

  doc.fontSize(16).fillColor(textColor).font('Helvetica-Bold').text('SALES REPORT', 350, 40, { align: 'right' });
  doc.fontSize(9).fillColor(mutedColor).font('Helvetica').text(`Period: ${fromStr} – ${toStr}`, 350, 60, { align: 'right' });
  doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, 350, 72, { align: 'right' });

  doc.moveTo(40, 90).lineTo(555, 90).strokeColor(borderColor).stroke();

  // Summary Tiles Section
  let y = 105;
  doc.fontSize(12).fillColor(textColor).font('Helvetica-Bold').text('Executive Summary', 40, y);
  y += 18;

  const kpis = [
    { label: 'Total Revenue', value: `Rs.${summary.totalRevenue.toLocaleString('en-IN')}` },
    { label: 'Total Transactions', value: String(summary.totalSales) },
    { label: 'Total Items Sold', value: String(summary.totalItemsSold) },
    { label: 'Average Order Value', value: `Rs.${summary.averageOrderValue.toLocaleString('en-IN')}` },
    { label: 'Offline Sales', value: `Rs.${summary.offlineSales.toLocaleString('en-IN')}` },
    { label: 'Online Sales', value: `Rs.${summary.onlineSales.toLocaleString('en-IN')}` },
    { label: 'Refunds', value: `Rs.${summary.refunds.toLocaleString('en-IN')}` },
    { label: 'Net Revenue', value: `Rs.${summary.netRevenue.toLocaleString('en-IN')}` },
  ];

  const cardW = 120;
  const cardH = 44;
  kpis.forEach((kpi, idx) => {
    const row = Math.floor(idx / 4);
    const col = idx % 4;
    const cx = 40 + col * (cardW + 11);
    const cy = y + row * (cardH + 8);

    doc.rect(cx, cy, cardW, cardH).fillAndStroke(bgLight, borderColor);
    doc.fontSize(8).fillColor(mutedColor).font('Helvetica').text(kpi.label, cx + 6, cy + 6, { width: cardW - 12 });
    doc.fontSize(11).fillColor(textColor).font('Helvetica-Bold').text(kpi.value, cx + 6, cy + 22, { width: cardW - 12 });
  });

  y += 2 * (cardH + 8) + 15;

  // Payment Breakdown & Top Categories (Two columns)
  doc.fontSize(11).fillColor(textColor).font('Helvetica-Bold').text('Payment Method Breakdown', 40, y);
  doc.fontSize(11).fillColor(textColor).font('Helvetica-Bold').text('Category Sales', 300, y);
  y += 16;

  // Header lines for split tables
  doc.fontSize(8).font('Helvetica-Bold').fillColor(mutedColor);
  doc.text('Method', 40, y);
  doc.text('Txns', 140, y);
  doc.text('Revenue', 190, y);
  doc.text('Share', 250, y, { align: 'right', width: 35 });

  doc.text('Category', 300, y);
  doc.text('Units', 400, y);
  doc.text('Revenue', 450, y);
  doc.text('Share', 515, y, { align: 'right', width: 40 });

  y += 12;
  doc.moveTo(40, y).lineTo(285, y).strokeColor(borderColor).stroke();
  doc.moveTo(300, y).lineTo(555, y).strokeColor(borderColor).stroke();
  y += 6;

  const maxRows = Math.max(paymentMethods.length, categories.length, 1);
  for (let i = 0; i < Math.min(maxRows, 6); i++) {
    doc.fontSize(8).font('Helvetica').fillColor(textColor);

    if (paymentMethods[i]) {
      const pm = paymentMethods[i];
      doc.text(pm.method, 40, y, { width: 95 });
      doc.text(String(pm.transactions), 140, y);
      doc.text(`Rs.${pm.revenue}`, 190, y);
      doc.text(`${pm.percentage}%`, 250, y, { align: 'right', width: 35 });
    }

    if (categories[i]) {
      const cat = categories[i];
      doc.text(cat.category, 300, y, { width: 95 });
      doc.text(String(cat.itemsSold), 400, y);
      doc.text(`Rs.${cat.revenue}`, 450, y);
      doc.text(`${cat.percentage}%`, 515, y, { align: 'right', width: 40 });
    }

    y += 14;
  }

  y += 15;

  // Top Selling Products Section
  doc.fontSize(11).fillColor(textColor).font('Helvetica-Bold').text('Top Selling Products', 40, y);
  y += 16;

  doc.fontSize(8).font('Helvetica-Bold').fillColor(mutedColor);
  doc.text('#', 40, y);
  doc.text('Product Name', 65, y);
  doc.text('Category', 280, y);
  doc.text('Quantity Sold', 400, y, { align: 'right', width: 65 });
  doc.text('Total Revenue', 485, y, { align: 'right', width: 70 });
  y += 12;
  doc.moveTo(40, y).lineTo(555, y).strokeColor(borderColor).stroke();
  y += 6;

  topProducts.slice(0, 5).forEach((tp) => {
    doc.fontSize(8).font('Helvetica').fillColor(textColor);
    doc.text(String(tp.rank), 40, y);
    doc.text(tp.name, 65, y, { width: 205 });
    doc.text(tp.category, 280, y, { width: 110 });
    doc.text(String(tp.quantitySold), 400, y, { align: 'right', width: 65 });
    doc.text(`Rs.${tp.revenue.toLocaleString('en-IN')}`, 485, y, { align: 'right', width: 70 });
    y += 14;
  });

  // Recent Transactions Table on next page
  doc.addPage();
  let ty = 40;
  doc.fontSize(14).fillColor(primaryColor).font('Helvetica-Bold').text('Sales Transactions Detail', 40, ty);
  ty += 22;

  doc.fontSize(8).font('Helvetica-Bold').fillColor(mutedColor);
  doc.text('ID', 40, ty);
  doc.text('Type', 95, ty);
  doc.text('Date', 135, ty);
  doc.text('Customer', 195, ty);
  doc.text('Qty', 330, ty);
  doc.text('Method', 360, ty);
  doc.text('Status', 440, ty);
  doc.text('Amount', 495, ty, { align: 'right', width: 60 });
  ty += 12;
  doc.moveTo(40, ty).lineTo(555, ty).strokeColor(borderColor).stroke();
  ty += 6;

  allTransactions.slice(0, 40).forEach((txn) => {
    if (ty > 750) {
      doc.addPage();
      ty = 40;
      doc.fontSize(8).font('Helvetica-Bold').fillColor(mutedColor);
      doc.text('ID', 40, ty);
      doc.text('Type', 95, ty);
      doc.text('Date', 135, ty);
      doc.text('Customer', 195, ty);
      doc.text('Qty', 330, ty);
      doc.text('Method', 360, ty);
      doc.text('Status', 440, ty);
      doc.text('Amount', 495, ty, { align: 'right', width: 60 });
      ty += 12;
      doc.moveTo(40, ty).lineTo(555, ty).strokeColor(borderColor).stroke();
      ty += 6;
    }

    doc.fontSize(8).font('Helvetica').fillColor(textColor);
    doc.text(txn.transactionId, 40, ty, { width: 50 });
    doc.text(txn.saleType, 95, ty, { width: 35 });
    doc.text(txn.date, 135, ty, { width: 55 });
    doc.text(txn.customerName, 195, ty, { width: 130 });
    doc.text(String(txn.quantity), 330, ty, { width: 25 });
    doc.text(txn.paymentMethod, 360, ty, { width: 75 });
    doc.text(txn.paymentStatus.toUpperCase(), 440, ty, { width: 50 });
    doc.text(`Rs.${txn.totalAmount.toLocaleString('en-IN')}`, 495, ty, { align: 'right', width: 60 });

    ty += 14;
  });

  // Footer on all pages
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc.fontSize(8).fillColor(mutedColor).font('Helvetica');
    doc.text(
      `Generated by Campus Stationery Management System  |  Page ${i + 1} of ${range.count}`,
      40,
      800,
      { align: 'center', width: 515 }
    );
  }

  doc.end();
};

module.exports = {
  getSalesReportData,
  generateExcelReport,
  generatePdfReport,
};
