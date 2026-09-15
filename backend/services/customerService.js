const mongoose = require('mongoose');
const Student = require('../models/Student');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Sale = require('../models/Sale');
const ApiError = require('../utils/ApiError');
const notificationService = require('./notificationService');

/**
 * Calculate global customer summary for top statistics cards:
 * 1. Total Customers
 * 2. Active Customers
 * 3. New Customers This Month
 * 4. Total Orders
 * 5. Total Customer Spending
 */
const getGlobalCustomerSummary = async () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalCustomers,
    activeCustomers,
    newThisMonth,
    onlineStats,
    studentRolls,
  ] = await Promise.all([
    Student.countDocuments(),
    Student.countDocuments({ status: { $ne: 'blocked' } }),
    Student.countDocuments({ createdAt: { $gte: startOfMonth } }),
    Order.aggregate([
      { $match: { status: { $nin: ['cancelled', 'refunded'] } } },
      { $group: { _id: null, count: { $sum: 1 }, spent: { $sum: '$totalAmount' } } },
    ]),
    Student.distinct('rollNumber'),
  ]);

  const validRolls = (studentRolls || []).filter(Boolean);
  let offlineCount = 0;
  let offlineSpent = 0;

  if (validRolls.length > 0) {
    const offlineStats = await Sale.aggregate([
      {
        $match: {
          rollNumber: {
            $in: validRolls.map((r) => new RegExp(`^${r.trim()}$`, 'i')),
          },
          status: { $ne: 'reversed' },
        },
      },
      { $group: { _id: null, count: { $sum: 1 }, spent: { $sum: '$totalAmount' } } },
    ]);

    if (offlineStats[0]) {
      offlineCount = offlineStats[0].count;
      offlineSpent = offlineStats[0].spent;
    }
  }

  const totalOrders = (onlineStats[0]?.count || 0) + offlineCount;
  const totalSpent = (onlineStats[0]?.spent || 0) + offlineSpent;

  return {
    totalCustomers,
    activeCustomers,
    newThisMonth,
    totalOrders,
    totalSpent,
  };
};

/**
 * Get paginated list of customers with search, department/status/purchaseType/date filtering,
 * and aggregated online/offline order metrics.
 */
const getCustomers = async ({
  page = 1,
  limit = 10,
  search = '',
  department = '',
  status = '',
  purchaseType = 'all',
  from = '',
  to = '',
  sortBy = 'createdAt',
  sortOrder = 'desc',
}) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  // Student match conditions
  const matchStage = {};

  if (search && search.trim()) {
    const q = search.trim();
    const regex = new RegExp(q, 'i');
    matchStage.$or = [
      { name: regex },
      { rollNumber: regex },
      { email: regex },
      { mobile: regex },
    ];
  }

  if (department && department !== 'all') {
    matchStage.department = new RegExp(`^${department.trim()}$`, 'i');
  }

  if (status && status !== 'all') {
    if (status === 'active') {
      matchStage.$or = [
        { status: 'active' },
        { status: { $exists: false } },
        { status: null },
      ];
    } else {
      matchStage.status = status;
    }
  }

  if (from || to) {
    matchStage.createdAt = {};
    if (from) matchStage.createdAt.$gte = new Date(from);
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      matchStage.createdAt.$lte = toDate;
    }
  }

  // Build aggregation pipeline
  const pipeline = [
    { $match: matchStage },

    // Lookup Online Orders
    {
      $lookup: {
        from: 'orders',
        let: { studentId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$student', '$$studentId'] },
                  { $not: { $in: ['$status', ['cancelled', 'refunded']] } },
                ],
              },
            },
          },
          {
            $group: {
              _id: null,
              count: { $sum: 1 },
              spent: { $sum: '$totalAmount' },
              lastDate: { $max: '$createdAt' },
            },
          },
        ],
        as: 'orderMetrics',
      },
    },

    // Lookup Offline Sales via rollNumber
    {
      $lookup: {
        from: 'sales',
        let: { studentRoll: '$rollNumber' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $ne: ['$$studentRoll', ''] },
                  { $eq: [{ $toUpper: '$rollNumber' }, { $toUpper: '$$studentRoll' }] },
                  { $ne: ['$status', 'reversed'] },
                ],
              },
            },
          },
          {
            $group: {
              _id: null,
              count: { $sum: 1 },
              spent: { $sum: '$totalAmount' },
              lastDate: { $max: '$createdAt' },
            },
          },
        ],
        as: 'saleMetrics',
      },
    },

    // Compute aggregated metrics
    {
      $addFields: {
        onlineOrders: { $ifNull: [{ $arrayElemAt: ['$orderMetrics.count', 0] }, 0] },
        onlineSpent: { $ifNull: [{ $arrayElemAt: ['$orderMetrics.spent', 0] }, 0] },
        lastOnlineDate: { $arrayElemAt: ['$orderMetrics.lastDate', 0] },

        offlineOrders: { $ifNull: [{ $arrayElemAt: ['$saleMetrics.count', 0] }, 0] },
        offlineSpent: { $ifNull: [{ $arrayElemAt: ['$saleMetrics.spent', 0] }, 0] },
        lastOfflineDate: { $arrayElemAt: ['$saleMetrics.lastDate', 0] },

        totalOrders: {
          $add: [
            { $ifNull: [{ $arrayElemAt: ['$orderMetrics.count', 0] }, 0] },
            { $ifNull: [{ $arrayElemAt: ['$saleMetrics.count', 0] }, 0] },
          ],
        },
        totalSpent: {
          $add: [
            { $ifNull: [{ $arrayElemAt: ['$orderMetrics.spent', 0] }, 0] },
            { $ifNull: [{ $arrayElemAt: ['$saleMetrics.spent', 0] }, 0] },
          ],
        },
        lastPurchase: {
          $max: [
            { $arrayElemAt: ['$orderMetrics.lastDate', 0] },
            { $arrayElemAt: ['$saleMetrics.lastDate', 0] },
          ],
        },
        status: { $ifNull: ['$status', 'active'] },
      },
    },
  ];

  // Filter by purchaseType if requested
  if (purchaseType === 'online') {
    pipeline.push({ $match: { onlineOrders: { $gt: 0 } } });
  } else if (purchaseType === 'offline') {
    pipeline.push({ $match: { offlineOrders: { $gt: 0 } } });
  }

  // Determine sort criteria
  const sortDirection = sortOrder === 'asc' ? 1 : -1;
  const sortStage = {};
  if (sortBy === 'totalSpent') {
    sortStage.totalSpent = sortDirection;
  } else if (sortBy === 'totalOrders') {
    sortStage.totalOrders = sortDirection;
  } else if (sortBy === 'lastPurchase') {
    sortStage.lastPurchase = sortDirection;
  } else if (sortBy === 'name') {
    sortStage.name = sortDirection;
  } else {
    sortStage.createdAt = sortDirection;
  }
  pipeline.push({ $sort: sortStage });

  // Facet for pagination
  pipeline.push({
    $facet: {
      data: [
        { $skip: skip },
        { $limit: limitNum },
        {
          $project: {
            password: 0,
            otp: 0,
            otpExpires: 0,
            resetPasswordToken: 0,
            resetPasswordExpires: 0,
            orderMetrics: 0,
            saleMetrics: 0,
          },
        },
      ],
      totalCount: [{ $count: 'count' }],
    },
  });

  const [result] = await Student.aggregate(pipeline);
  const customers = result?.data || [];
  const total = result?.totalCount[0]?.count || 0;
  const totalPages = Math.ceil(total / limitNum) || 1;

  // Retrieve distinct departments for dynamic filter options
  const existingDepartments = await Student.distinct('department');
  const distinctDepartments = existingDepartments
    .filter(Boolean)
    .map((d) => d.trim())
    .filter((d, i, arr) => arr.indexOf(d) === i);

  return {
    customers,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages,
    },
    departments: distinctDepartments,
  };
};

/**
 * Get customer profile by ID (excluding password, OTP, tokens).
 */
const getCustomerById = async (customerId) => {
  if (!mongoose.Types.ObjectId.isValid(customerId)) {
    throw new ApiError(400, 'Invalid customer ID format');
  }

  const student = await Student.findById(customerId).select(
    '-password -otp -otpExpires -resetPasswordToken -resetPasswordExpires'
  );

  if (!student) {
    throw new ApiError(404, 'Customer not found');
  }

  return student;
};

/**
 * Get unified purchase history (combining real Online Orders and Offline Sales).
 */
const getCustomerPurchases = async (customerId, { page = 1, limit = 20, type = 'all' }) => {
  const student = await getCustomerById(customerId);
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

  let onlineOrders = [];
  let offlineSales = [];

  // Fetch online orders if applicable
  if (type === 'all' || type === 'online') {
    onlineOrders = await Order.find({ student: student._id })
      .populate('items')
      .sort({ createdAt: -1 })
      .lean();
  }

  // Fetch offline sales if applicable and rollNumber is set
  if ((type === 'all' || type === 'offline') && student.rollNumber) {
    offlineSales = await Sale.find({
      rollNumber: new RegExp(`^${student.rollNumber.trim()}$`, 'i'),
    })
      .sort({ createdAt: -1 })
      .lean();
  }

  // Map online orders to unified format
  const mappedOnline = onlineOrders.map((o) => {
    const itemsList = (o.items || []).map((i) => ({
      name: i.name,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      subtotal: i.subtotal,
    }));

    return {
      id: o._id,
      displayId: o.orderId,
      type: 'online',
      items: itemsList,
      itemsCount: o.itemsCount || itemsList.reduce((acc, i) => acc + i.quantity, 0),
      totalAmount: o.totalAmount,
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      status: o.status,
      pickupTime: o.pickupTime,
      createdAt: o.createdAt,
    };
  });

  // Map offline sales to unified format
  const mappedOffline = offlineSales.map((s) => {
    const itemsList = (s.items || []).map((i) => ({
      name: i.name,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      subtotal: i.subtotal,
    }));

    return {
      id: s._id,
      displayId: s.saleId,
      type: 'offline',
      items: itemsList,
      itemsCount: itemsList.reduce((acc, i) => acc + i.quantity, 0),
      totalAmount: s.totalAmount,
      paymentMethod: s.paymentMethod,
      paymentStatus: s.paymentConfirmed ? 'paid' : 'pending',
      status: s.status || (s.paymentConfirmed ? 'completed' : 'pending'),
      createdAt: s.createdAt,
    };
  });

  // Combine and sort descending by date
  const combined = [...mappedOnline, ...mappedOffline].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  const total = combined.length;
  const totalPages = Math.ceil(total / limitNum) || 1;
  const startIndex = (pageNum - 1) * limitNum;
  const paginatedPurchases = combined.slice(startIndex, startIndex + limitNum);

  return {
    purchases: paginatedPurchases,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages,
    },
    counts: {
      totalPurchases: total,
      onlineCount: mappedOnline.length,
      offlineCount: mappedOffline.length,
    },
  };
};

/**
 * Get detailed customer purchase statistics & analytics:
 * - Total orders, items purchased, total spent, average order value
 * - Online vs offline split
 * - Last purchase date
 * - Top 5 most purchased products
 * - Monthly spending history
 */
const getCustomerStatistics = async (customerId) => {
  const student = await getCustomerById(customerId);

  // Fetch online orders and offline sales
  const [onlineOrders, offlineSales] = await Promise.all([
    Order.find({
      student: student._id,
      status: { $nin: ['cancelled', 'refunded'] },
    })
      .populate('items')
      .lean(),
    student.rollNumber
      ? Sale.find({
          rollNumber: new RegExp(`^${student.rollNumber.trim()}$`, 'i'),
          status: { $ne: 'reversed' },
        }).lean()
      : [],
  ]);

  let totalSpent = 0;
  let totalItemsCount = 0;
  let lastPurchaseDate = null;

  const productPurchaseMap = {};
  const monthlySpendingMap = {};

  // Process online orders
  onlineOrders.forEach((o) => {
    totalSpent += o.totalAmount || 0;
    const orderDate = new Date(o.createdAt);
    if (!lastPurchaseDate || orderDate > lastPurchaseDate) {
      lastPurchaseDate = orderDate;
    }

    const monthKey = orderDate.toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });
    monthlySpendingMap[monthKey] = (monthlySpendingMap[monthKey] || 0) + (o.totalAmount || 0);

    (o.items || []).forEach((item) => {
      const qty = item.quantity || 1;
      totalItemsCount += qty;
      const prodName = item.name || 'Stationery Item';
      productPurchaseMap[prodName] = (productPurchaseMap[prodName] || 0) + qty;
    });
  });

  // Process offline sales
  offlineSales.forEach((s) => {
    totalSpent += s.totalAmount || 0;
    const saleDate = new Date(s.createdAt);
    if (!lastPurchaseDate || saleDate > lastPurchaseDate) {
      lastPurchaseDate = saleDate;
    }

    const monthKey = saleDate.toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });
    monthlySpendingMap[monthKey] = (monthlySpendingMap[monthKey] || 0) + (s.totalAmount || 0);

    (s.items || []).forEach((item) => {
      const qty = item.quantity || 1;
      totalItemsCount += qty;
      const prodName = item.name || 'Stationery Item';
      productPurchaseMap[prodName] = (productPurchaseMap[prodName] || 0) + qty;
    });
  });

  const totalOrders = onlineOrders.length + offlineSales.length;
  const averageOrderValue = totalOrders > 0 ? Math.round(totalSpent / totalOrders) : 0;

  // Most purchased products (sorted descending, top 5)
  const mostPurchasedProducts = Object.entries(productPurchaseMap)
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  // Monthly spending breakdown: last 6 calendar months
  const monthlySpending = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    monthlySpending.push({
      month: key,
      spent: Math.round(monthlySpendingMap[key] || 0),
    });
  }

  return {
    totalOrders,
    totalItemsPurchased: totalItemsCount,
    totalSpent: Math.round(totalSpent),
    averageOrderValue,
    onlineOrdersCount: onlineOrders.length,
    offlinePurchasesCount: offlineSales.length,
    lastPurchase: lastPurchaseDate,
    mostPurchasedProducts,
    monthlySpending,
  };
};

/**
 * Update customer status (active, inactive, blocked)
 * If status is set to blocked, send high-priority notification to the student.
 */
const updateCustomerStatus = async (customerId, { status, reason }, adminUser) => {
  if (!['active', 'inactive', 'blocked'].includes(status)) {
    throw new ApiError(400, 'Invalid status. Must be active, inactive, or blocked.');
  }

  const student = await Student.findById(customerId);
  if (!student) {
    throw new ApiError(404, 'Customer not found');
  }

  const previousStatus = student.status || 'active';
  student.status = status;
  await student.save();

  // If customer is blocked, dispatch notification
  if (status === 'blocked' && previousStatus !== 'blocked') {
    await notificationService.createNotification({
      recipientType: 'student',
      recipient: student._id,
      type: 'system',
      title: 'Account Restricted',
      message:
        reason ||
        'Your campus stationery account has been temporarily restricted by the administrator.',
      priority: 'high',
      category: 'system',
    });
  } else if (status === 'active' && previousStatus === 'blocked') {
    await notificationService.createNotification({
      recipientType: 'student',
      recipient: student._id,
      type: 'system',
      title: 'Account Restored',
      message: 'Your campus stationery account has been restored and is now active.',
      priority: 'normal',
      category: 'system',
    });
  }

  return student.toSafeObject();
};

module.exports = {
  getGlobalCustomerSummary,
  getCustomers,
  getCustomerById,
  getCustomerPurchases,
  getCustomerStatistics,
  updateCustomerStatus,
};
