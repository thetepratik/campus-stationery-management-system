const mongoose = require('mongoose');
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const ApiError = require('../utils/ApiError');
const { getPagination } = require('../utils/pagination');
const { INVENTORY_MOVEMENT_TYPE } = require('../config/constants');
const inventoryService = require('./inventoryService');
const { notifyAdmin } = require('./notificationService');
const { serializeDocument, serializeImage } = require('../utils/imageUtils');

/**
 * Generates the next sequential sale ID (S0001, S0002, ...) based on the most
 * recently inserted Sale document, so IDs stay human-readable and ordered
 * regardless of how createdAt timestamps are backdated (e.g. by the seeder).
 */
const generateNextSaleId = async () => {
  const lastSale = await Sale.findOne().sort({ _id: -1 }).select('saleId').lean();
  let nextNum = 1;
  if (lastSale?.saleId) {
    const match = lastSale.saleId.match(/(\d+)$/);
    if (match) nextNum = parseInt(match[1], 10) + 1;
  }
  return `S${String(nextNum).padStart(4, '0')}`;
};

/**
 * Creates an offline POS sale: validates stock availability for every line
 * item up front (so we never partially commit), snapshots product name/price
 * at time of sale, deducts stock + increments soldCount per item via the
 * shared inventory ledger, and fires low/out-of-stock notifications as needed.
 *
 * The double-confirmation ("did you receive payment?" / "reduce stock
 * permanently?") happens entirely client-side before this endpoint is ever
 * called — by the time this runs, both confirmations have already happened,
 * which is why `paymentConfirmed` must be explicitly `true` in the payload.
 */
const createSale = async (data, adminId, io) => {
  const { items, paymentMethod, customerName, rollNumber, department, remarks } = data;

  // Pass 1: validate every product exists and has enough stock before writing anything.
  const products = new Map();
  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product) throw new ApiError(404, `Product not found (id: ${item.productId})`);
    if (product.status !== 'active') throw new ApiError(400, `${product.name} is not currently active for sale`);
    if (product.currentStock < item.quantity) {
      throw new ApiError(400, `Insufficient stock for ${product.name} (available: ${product.currentStock}, requested: ${item.quantity})`);
    }
    products.set(item.productId, product);
  }

  const saleItems = items.map((item) => {
    const product = products.get(item.productId);
    const subtotal = product.sellingPrice * item.quantity;
    return {
      product: product._id,
      name: product.name,
      quantity: item.quantity,
      unitPrice: product.sellingPrice,
      gstPercent: product.gstPercent,
      subtotal,
    };
  });

  const totalAmount = saleItems.reduce((sum, i) => sum + i.subtotal, 0);
  const saleId = await generateNextSaleId();

  const sale = await Sale.create({
    saleId,
    items: saleItems,
    totalAmount,
    customerName: customerName || '',
    rollNumber: rollNumber || '',
    department: department || '',
    remarks: remarks || '',
    paymentMethod,
    paymentConfirmed: true,
    soldBy: adminId,
    status: 'completed',
  });

  // Pass 2: apply stock deductions now that the sale record exists (reference for the ledger).
  for (const item of items) {
    const product = products.get(item.productId);
    const { product: updated } = await inventoryService.applyStockChange({
      productId: item.productId,
      type: INVENTORY_MOVEMENT_TYPE.SALE_OFFLINE,
      quantityChange: -item.quantity,
      reference: sale._id,
      note: `Offline sale ${saleId}`,
      performedBy: adminId,
    });

    await Product.updateOne({ _id: item.productId }, { $inc: { soldCount: item.quantity } });

    if (updated.currentStock <= 0) {
      await notifyAdmin(io, {
        type: 'stock',
        title: 'Out of stock',
        message: `${product.name} is now out of stock after sale ${saleId}`,
        link: '/admin/inventory',
      });
    } else if (updated.currentStock <= updated.minStock) {
      await notifyAdmin(io, {
        type: 'stock',
        title: 'Low stock alert',
        message: `${product.name} is running low (${updated.currentStock} left) after sale ${saleId}`,
        link: '/admin/inventory',
      });
    }
  }

  await notifyAdmin(io, {
    type: 'payment',
    title: 'Offline sale recorded',
    message: `Sale ${saleId} recorded for Rs.${totalAmount} via ${paymentMethod.toUpperCase()}`,
    link: '/admin/sales-history',
  });

  return sale;
};

const getSaleById = async (id) => {
  const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { saleId: id };
  const sale = await Sale.findOne(query)
    .populate('soldBy', 'name')
    .populate('reversedBy', 'name')
    .populate('items.product', 'name sku images');
  if (!sale) throw new ApiError(404, 'Sale not found');

  const plainSale = sale.toObject();
  plainSale.items = (plainSale.items || []).map((item) => {
    const plainItem = item.toObject ? item.toObject() : item;
    return {
      ...plainItem,
      product: item.product ? serializeDocument(item.product) : item.product,
    };
  });

  return plainSale;
};

const listSales = async (query) => {
  const { skip, limit, buildMeta } = getPagination(query, 20, 100);
  const conditions = [{ paymentConfirmed: true }];

  if (query.search) {
    conditions.push({
      $or: [
        { saleId: { $regex: query.search, $options: 'i' } },
        { customerName: { $regex: query.search, $options: 'i' } },
        { rollNumber: { $regex: query.search, $options: 'i' } },
      ],
    });
  }

  if (query.paymentMethod) {
    conditions.push({ paymentMethod: query.paymentMethod });
  }

  if (query.status) {
    if (query.status === 'completed') {
      conditions.push({ status: { $ne: 'reversed' } });
    } else if (query.status === 'reversed') {
      conditions.push({ status: 'reversed' });
    }
  }

  if (query.from || query.to) {
    const dateFilter = {};
    if (query.from) dateFilter.$gte = new Date(query.from);
    if (query.to) dateFilter.$lte = new Date(query.to);
    conditions.push({ createdAt: dateFilter });
  }

  const filter = conditions.length === 1 ? conditions[0] : { $and: conditions };

  // For active revenue total calculation, exclude reversed sales
  const revenueConditions = [...conditions, { status: { $ne: 'reversed' } }];
  const revenueFilter = { $and: revenueConditions };

  const [items, totalCount, totalAgg] = await Promise.all([
    Sale.find(filter)
      .populate('soldBy', 'name')
      .populate('reversedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Sale.countDocuments(filter),
    Sale.aggregate([{ $match: revenueFilter }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
  ]);

  return { items, meta: { ...buildMeta(totalCount), totalRevenue: totalAgg[0]?.total || 0 } };
};

/**
 * Undoes / reverses an offline sale.
 * 1. Verifies the sale exists and status === 'completed'.
 * 2. Restores exact sold quantity back to inventory ledger and product stock.
 * 3. Decreases product soldCount by the exact quantity.
 * 4. Marks sale status as 'reversed' and stores reversedAt, reversedBy, reversalReason.
 * 5. Prevents double reversal via atomic update.
 */
const undoSale = async (id, adminId, reason = '', io) => {
  const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { saleId: id };
  const sale = await Sale.findOne(query);
  if (!sale) throw new ApiError(404, 'Sale not found');

  if (sale.status === 'reversed') {
    throw new ApiError(400, `Sale ${sale.saleId} has already been reversed`);
  }

  // Atomically claim reversal to guard against concurrent double-reversal
  const updatedSale = await Sale.findOneAndUpdate(
    { _id: sale._id, status: { $ne: 'reversed' } },
    {
      $set: {
        status: 'reversed',
        reversedAt: new Date(),
        reversedBy: adminId,
        reversalReason: reason || '',
      },
    },
    { new: true }
  )
    .populate('soldBy', 'name')
    .populate('reversedBy', 'name');

  if (!updatedSale) {
    throw new ApiError(400, `Sale ${sale.saleId} has already been reversed`);
  }

  // Restore inventory & decrease product soldCount
  for (const item of sale.items) {
    await inventoryService.applyStockChange({
      productId: item.product,
      type: INVENTORY_MOVEMENT_TYPE.RETURN,
      quantityChange: item.quantity,
      reference: sale._id,
      note: `Offline sale reversal ${sale.saleId}${reason ? ': ' + reason : ''}`,
      performedBy: adminId,
    });

    await Product.updateOne(
      { _id: item.product },
      { $inc: { soldCount: -item.quantity } }
    );
  }

  if (io) {
    await notifyAdmin(io, {
      type: 'payment',
      title: 'Offline sale reversed',
      message: `Sale ${sale.saleId} was reversed. ₹${sale.totalAmount} reversed from revenue and stock restored.`,
      link: '/admin/sales-history',
    });
  }

  return updatedSale;
};

module.exports = { createSale, getSaleById, listSales, generateNextSaleId, undoSale };
