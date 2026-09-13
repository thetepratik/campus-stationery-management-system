const mongoose = require('mongoose');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const ApiError = require('../utils/ApiError');
const { getPagination } = require('../utils/pagination');
const { INVENTORY_MOVEMENT_TYPE } = require('../config/constants');
const { notifyAdmin } = require('./notificationService');
const { serializeProducts, serializeDocument } = require('../utils/imageUtils');

/**
 * Writes a ledger entry and updates the cached currentStock on the product in
 * one place, so every stock-changing flow in the app (restock, adjustment,
 * and later — offline sale, online sale, returns) stays consistent.
 */
const applyStockChange = async ({ productId, type, quantityChange, reference = null, note = '', performedBy = null }) => {
  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, 'Product not found');

  const stockBefore = product.currentStock;
  const stockAfter = stockBefore + quantityChange;

  if (stockAfter < 0) {
    throw new ApiError(400, `Cannot reduce stock below zero (current: ${stockBefore}, change: ${quantityChange})`);
  }

  product.currentStock = stockAfter;
  await product.save();

  const ledgerEntry = await Inventory.create({
    product: productId,
    type,
    quantityChange,
    stockBefore,
    stockAfter,
    reference,
    note,
    performedBy,
  });

  return { product, ledgerEntry };
};

const restockProduct = async ({ productId, quantity, note }, adminId, io) => {
  const { product, ledgerEntry } = await applyStockChange({
    productId,
    type: INVENTORY_MOVEMENT_TYPE.RESTOCK,
    quantityChange: Math.abs(quantity),
    note: note || 'Manual restock',
    performedBy: adminId,
  });

  await notifyAdmin(io, {
    type: 'stock',
    title: 'Product restocked',
    message: `${product.name} restocked by ${quantity} units (now ${product.currentStock} in stock)`,
    link: `/admin/inventory`,
  });

  return { product, ledgerEntry };
};

const adjustStock = async ({ productId, newStock, note }, adminId, io) => {
  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, 'Product not found');

  const quantityChange = Number(newStock) - product.currentStock;
  if (quantityChange === 0) {
    throw new ApiError(400, 'New stock value is the same as current stock — nothing to adjust');
  }

  const { ledgerEntry } = await applyStockChange({
    productId,
    type: INVENTORY_MOVEMENT_TYPE.ADJUSTMENT,
    quantityChange,
    note,
    performedBy: adminId,
  });

  const updated = await Product.findById(productId);

  if (updated.currentStock <= 0) {
    await notifyAdmin(io, {
      type: 'stock',
      title: 'Out of stock',
      message: `${updated.name} is now out of stock after a manual adjustment`,
      link: `/admin/inventory`,
    });
  } else if (updated.currentStock <= updated.minStock) {
    await notifyAdmin(io, {
      type: 'stock',
      title: 'Low stock alert',
      message: `${updated.name} is running low (${updated.currentStock} left)`,
      link: `/admin/inventory`,
    });
  }

  return { product: updated, ledgerEntry };
};

/**
 * Paginated product stock levels — reuses Product directly (not the ledger)
 * since this represents current state, filterable by availability bucket.
 */
const getStockLevels = async (query) => {
  const { skip, limit, buildMeta } = getPagination(query, 20, 100);
  const filter = {};

  if (query.search) {
    filter.$or = [{ name: { $regex: query.search, $options: 'i' } }, { sku: { $regex: query.search, $options: 'i' } }];
  }
  if (query.category) filter.category = query.category;

  if (query.availability === 'in-stock') filter.currentStock = { $gt: 0 };
  else if (query.availability === 'out-of-stock') filter.currentStock = { $lte: 0 };
  else if (query.availability === 'low-stock') {
    filter.$expr = { $and: [{ $gt: ['$currentStock', 0] }, { $lte: ['$currentStock', '$minStock'] }] };
  }

  const sort = query.availability ? { currentStock: 1 } : { name: 1 };

  const [items, totalCount] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name')
      .select('name sku images category currentStock minStock maxStock purchasePrice sellingPrice status')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ]);

  return { items, meta: buildMeta(totalCount) };
};

/**
 * Paginated stock movement ledger (audit trail), optionally filtered by
 * product, movement type, and date range.
 */
const getStockHistory = async (query) => {
  const { skip, limit, buildMeta } = getPagination(query, 20, 100);
  const filter = {};

  if (query.product) filter.product = new mongoose.Types.ObjectId(query.product);
  if (query.type) filter.type = query.type;
  if (query.from || query.to) {
    filter.createdAt = {};
    if (query.from) filter.createdAt.$gte = new Date(query.from);
    if (query.to) filter.createdAt.$lte = new Date(query.to);
  }

  const [items, totalCount] = await Promise.all([
    Inventory.find(filter)
      .populate('product', 'name sku images')
      .populate('performedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Inventory.countDocuments(filter),
  ]);

  return { items, meta: buildMeta(totalCount) };
};

/**
 * Inventory valuation: total value (currentStock × purchasePrice) overall
 * and broken down by category, plus a summary of stock health counts.
 */
const getInventoryValueReport = async () => {
  const [totalAgg, byCategoryAgg, healthCounts] = await Promise.all([
    Product.aggregate([
      {
        $group: {
          _id: null,
          totalValue: { $sum: { $multiply: ['$currentStock', '$purchasePrice'] } },
          totalUnits: { $sum: '$currentStock' },
          totalSkus: { $sum: 1 },
        },
      },
    ]),
    Product.aggregate([
      {
        $group: {
          _id: '$category',
          value: { $sum: { $multiply: ['$currentStock', '$purchasePrice'] } },
          units: { $sum: '$currentStock' },
        },
      },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
      { $unwind: '$category' },
      { $project: { _id: 0, name: '$category.name', value: 1, units: 1 } },
      { $sort: { value: -1 } },
    ]),
    Promise.all([
      Product.countDocuments({ currentStock: { $gt: 0 }, $expr: { $gt: ['$currentStock', '$minStock'] } }),
      Product.countDocuments({ $expr: { $and: [{ $gt: ['$currentStock', 0] }, { $lte: ['$currentStock', '$minStock'] }] } }),
      Product.countDocuments({ currentStock: { $lte: 0 } }),
    ]),
  ]);

  const [inStockCount, lowStockCount, outOfStockCount] = healthCounts;

  return {
    totalValue: totalAgg[0]?.totalValue || 0,
    totalUnits: totalAgg[0]?.totalUnits || 0,
    totalSkus: totalAgg[0]?.totalSkus || 0,
    byCategory: byCategoryAgg,
    health: { inStockCount, lowStockCount, outOfStockCount },
  };
};

module.exports = {
  applyStockChange,
  restockProduct,
  adjustStock,
  getStockLevels,
  getStockHistory,
  getInventoryValueReport,
};
