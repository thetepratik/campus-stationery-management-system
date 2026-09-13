const Cart = require('../models/Cart');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const couponService = require('./couponService');
const { serializeDocument } = require('../utils/imageUtils');

const getOrCreateCart = async (studentId) => {
  let cart = await Cart.findOne({ student: studentId });
  if (!cart) {
    cart = await Cart.create({ student: studentId, items: [] });
  }
  return cart;
};

/**
 * Builds the full priced cart view: each line item with live product data
 * (name/image/price may have changed since it was added), subtotal, GST,
 * any applied coupon discount, and the grand total. This is the single
 * source of truth both the Cart page and Checkout page read from.
 */
const getCartSummary = async (studentId) => {
  const cart = await getOrCreateCart(studentId);

  const populated = await Cart.findById(cart._id).populate({
    path: 'items.product',
    select: 'name images sellingPrice discountPercent gstPercent currentStock minStock status',
  });

  // Drop line items whose product was deleted or deactivated since being added.
  const validItems = populated.items.filter((i) => i.product && i.product.status === 'active');

  const lineItems = validItems.map((i) => {
    const product = i.product;
    const unitPrice =
      product.discountPercent > 0
        ? Math.round((product.sellingPrice - (product.sellingPrice * product.discountPercent) / 100) * 100) / 100
        : product.sellingPrice;
    const quantity = Math.min(i.quantity, product.currentStock || 0);
    const subtotal = Math.round(unitPrice * quantity * 100) / 100;
    const gstAmount = Math.round(((subtotal * (product.gstPercent || 0)) / 100) * 100) / 100;

    return {
      product: {
        _id: product._id,
        name: product.name,
        images: serializeDocument(product).images,
        currentStock: product.currentStock,
      },
      quantity,
      requestedQuantity: i.quantity,
      unitPrice,
      subtotal,
      gstAmount,
      stockLimited: quantity < i.quantity,
    };
  });

  const subtotal = lineItems.reduce((sum, i) => sum + i.subtotal, 0);
  const gstAmount = lineItems.reduce((sum, i) => sum + i.gstAmount, 0);

  let discountAmount = 0;
  let couponError = null;
  if (cart.couponCode) {
    try {
      const { discountAmount: d } = await couponService.validateCoupon(cart.couponCode, subtotal);
      discountAmount = d;
    } catch (err) {
      couponError = err.message;
      discountAmount = 0;
    }
  }

  const totalAmount = Math.round((subtotal + gstAmount - discountAmount) * 100) / 100;

  return {
    items: lineItems,
    itemsCount: lineItems.reduce((sum, i) => sum + i.quantity, 0),
    subtotal: Math.round(subtotal * 100) / 100,
    gstAmount: Math.round(gstAmount * 100) / 100,
    couponCode: cart.couponCode || null,
    discountAmount,
    couponError,
    totalAmount: Math.max(0, totalAmount),
  };
};

const addItem = async (studentId, productId, quantity) => {
  const product = await Product.findById(productId);
  if (!product || product.status !== 'active') throw new ApiError(404, 'Product not found');
  if (product.currentStock < quantity) {
    throw new ApiError(400, `Only ${product.currentStock} units of ${product.name} are available`);
  }

  const cart = await getOrCreateCart(studentId);
  const existing = cart.items.find((i) => i.product.toString() === productId);

  if (existing) {
    const newQty = existing.quantity + quantity;
    if (newQty > product.currentStock) {
      throw new ApiError(400, `Only ${product.currentStock} units of ${product.name} are available`);
    }
    existing.quantity = newQty;
  } else {
    cart.items.push({ product: productId, quantity });
  }

  await cart.save();
  return getCartSummary(studentId);
};

const updateItemQuantity = async (studentId, productId, quantity) => {
  const cart = await getOrCreateCart(studentId);
  const item = cart.items.find((i) => i.product.toString() === productId);
  if (!item) throw new ApiError(404, 'Item not found in cart');

  const product = await Product.findById(productId);
  if (product && quantity > product.currentStock) {
    throw new ApiError(400, `Only ${product.currentStock} units of ${product.name} are available`);
  }

  item.quantity = quantity;
  await cart.save();
  return getCartSummary(studentId);
};

const removeItem = async (studentId, productId) => {
  const cart = await getOrCreateCart(studentId);
  cart.items = cart.items.filter((i) => i.product.toString() !== productId);
  await cart.save();
  return getCartSummary(studentId);
};

const applyCoupon = async (studentId, code) => {
  const cart = await getOrCreateCart(studentId);
  const summary = await getCartSummary(studentId);

  // Validate before persisting, so a bad code never gets saved onto the cart.
  await couponService.validateCoupon(code, summary.subtotal);

  cart.couponCode = code.toUpperCase();
  await cart.save();
  return getCartSummary(studentId);
};

const removeCoupon = async (studentId) => {
  const cart = await getOrCreateCart(studentId);
  cart.couponCode = '';
  await cart.save();
  return getCartSummary(studentId);
};

const clearCart = async (studentId) => {
  const cart = await getOrCreateCart(studentId);
  cart.items = [];
  cart.couponCode = '';
  await cart.save();
};

module.exports = {
  getOrCreateCart,
  getCartSummary,
  addItem,
  updateItemQuantity,
  removeItem,
  applyCoupon,
  removeCoupon,
  clearCart,
};
