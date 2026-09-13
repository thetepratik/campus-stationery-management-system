const Product = require('../models/Product');
const Category = require('../models/Category');
const ApiError = require('../utils/ApiError');
const { getPagination } = require('../utils/pagination');
const { slugify, generateSku, generateBarcode } = require('../utils/generateId');
const { serializeDocument } = require('../utils/imageUtils');

const ALLOWED_SORT_FIELDS = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  'name-asc': { name: 1 },
  'name-desc': { name: -1 },
  'price-asc': { sellingPrice: 1 },
  'price-desc': { sellingPrice: -1 },
  'stock-asc': { currentStock: 1 },
  'stock-desc': { currentStock: -1 },
  'sold-desc': { soldCount: -1 },
};

/**
 * Builds the Mongo filter object from query params: search, category, status,
 * availability (in-stock/low-stock/out-of-stock).
 */
const buildFilter = (query) => {
  const filter = {};

  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: 'i' } },
      { brand: { $regex: query.search, $options: 'i' } },
      { sku: { $regex: query.search, $options: 'i' } },
    ];
  }

  if (query.category) filter.category = query.category;
  if (query.status && ['active', 'inactive'].includes(query.status)) filter.status = query.status;

  if (query.availability === 'in-stock') filter.currentStock = { $gt: 0 };
  else if (query.availability === 'out-of-stock') filter.currentStock = { $lte: 0 };
  else if (query.availability === 'low-stock') {
    filter.$expr = { $and: [{ $gt: ['$currentStock', 0] }, { $lte: ['$currentStock', '$minStock'] }] };
  }

  return filter;
};

const listProducts = async (query) => {
  const { skip, limit, buildMeta } = getPagination(query, 20, 100);
  const filter = buildFilter(query);
  const sort = ALLOWED_SORT_FIELDS[query.sort] || ALLOWED_SORT_FIELDS.newest;

  const [products, totalCount] = await Promise.all([
    Product.find(filter)
      .populate("category", "name slug")
      .sort(sort)
      .skip(skip)
      .limit(limit),

    Product.countDocuments(filter),
  ]);

  const items = products.map((product) => serializeDocument(product));

  return {
    items,
    meta: buildMeta(totalCount),
  };
};

const getProductById = async (id) => {
  const product = await Product.findById(id).populate("category", "name slug");

  // console.log("========== BEFORE ==========");
  // console.dir(product.images, { depth: null });

  const serialized = serializeDocument(product);

  // console.log("========== AFTER ==========");
  // console.dir(serialized.images, { depth: null });

  if (!product) throw new ApiError(404, "Product not found");

  return serialized;
};

const validateCategory = async (categoryId) => {
  const category = await Category.findById(categoryId);
  if (!category) throw new ApiError(400, 'Selected category does not exist');
  return category;
};

const createProduct = async (data, files) => {

  await validateCategory(data.category);

  const slug = `${slugify(data.name)}-${Date.now().toString(36)}`;
  const sku = data.sku?.trim() || generateSku();
  const barcode = data.barcode?.trim() || generateBarcode();

  const existingBarcode = await Product.findOne({ barcode });
  if (existingBarcode) {
    throw new ApiError(409, "Barcode already exists");
  }

  const existingSku = await Product.findOne({ sku });
  if (existingSku) {
    throw new ApiError(409, "A product with this SKU already exists");
  }

  let images = [];

  if (files && files.length) {
    images = files.map((file) => ({
      data: file.buffer,
      contentType: file.mimetype,
      fileName: file.originalname,
      size: file.size,
    }));
  }

  // console.log("Images before save:", images);

  const openingStock = Number(data.openingStock);

  const product = await Product.create({
    name: data.name,
    slug,
    description: data.description || "",
    category: data.category,
    brand: data.brand || "",
    supplier: data.supplier || "",
    images,
    sku,
    barcode,
    purchasePrice: Number(data.purchasePrice),
    sellingPrice: Number(data.sellingPrice),
    discountPercent: Number(data.discountPercent) || 0,
    gstPercent: Number(data.gstPercent) || 0,
    openingStock,
    currentStock: openingStock,
    minStock: Number(data.minStock) || 10,
    maxStock: Number(data.maxStock) || 500,
    status: data.status === "inactive" ? "inactive" : "active",
    isFeatured: data.isFeatured === true || data.isFeatured === "true",
  });

  // console.log("Images after save:", product.images);

  return serializeDocument(product);
};

const updateProduct = async (id, data, files) => {
  const product = await Product.findById(id);

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  // Validate category
  if (data.category) {
    await validateCategory(data.category);
    product.category = data.category;
  }

  // Update product name & slug
  if (data.name && data.name !== product.name) {
    product.name = data.name;
    product.slug = `${slugify(data.name)}-${Date.now().toString(36)}`;
  }

  // Update simple text fields
  const simpleFields = [
    "description",
    "brand",
    "supplier",
    "status",
  ];

  simpleFields.forEach((field) => {
    if (data[field] !== undefined) {
      product[field] = data[field];
    }
  });

  // Update numeric fields
  const numericFields = [
    "purchasePrice",
    "sellingPrice",
    "discountPercent",
    "gstPercent",
    "minStock",
    "maxStock",
    "openingStock",
    "currentStock",
  ];

  numericFields.forEach((field) => {
    if (data[field] !== undefined) {
      product[field] = Number(data[field]);
    }
  });

  // Featured Product
  if (data.isFeatured !== undefined) {
    product.isFeatured =
      data.isFeatured === true || data.isFeatured === "true";
  }

  // Update SKU
  if (data.sku && data.sku !== product.sku) {
    const skuExists = await Product.findOne({
      _id: { $ne: id },
      sku: data.sku,
    });

    if (skuExists) {
      throw new ApiError(409, "A product with this SKU already exists");
    }

    product.sku = data.sku;
  }

  // Update Barcode
  if (data.barcode && data.barcode !== product.barcode) {
    const barcodeExists = await Product.findOne({
      _id: { $ne: id },
      barcode: data.barcode,
    });

    if (barcodeExists) {
      throw new ApiError(409, "Barcode already exists");
    }

    product.barcode = data.barcode;
  }

  // Replace images if new images uploaded
  if (files && files.length > 0) {
    product.images = files.map((file) => ({
      data: file.buffer,
      contentType: file.mimetype,
      fileName: file.originalname,
      size: file.size,
    }));
  }

  // Remove all images
  if (data.removeAllImages === "true") {
    product.images = [];
  }

  await product.save();

  return serializeDocument(product);
};

const deleteProduct = async (id) => {
  const product = await Product.findById(id);
  if (!product) throw new ApiError(404, 'Product not found');

  await product.deleteOne();
  return product;
};

const bulkDelete = async (productIds) => {
  const result = await Product.deleteMany({
    _id: { $in: productIds },
  });

  return result.deletedCount;
};

const bulkUpdateStatus = async (productIds, status) => {
  const result = await Product.updateMany({ _id: { $in: productIds } }, { $set: { status } });
  return result.modifiedCount;
};

/**
 * mode: 'percent-increase' | 'percent-decrease' | 'set-price'
 * value: percentage (for increase/decrease) or absolute rupee amount (for set-price)
 */
const bulkPriceUpdate = async (productIds, mode, value) => {
  const products = await Product.find({ _id: { $in: productIds } });

  const bulkOps = products.map((p) => {
    let newPrice;
    if (mode === 'percent-increase') newPrice = p.sellingPrice * (1 + value / 100);
    else if (mode === 'percent-decrease') newPrice = p.sellingPrice * (1 - value / 100);
    else newPrice = value;

    newPrice = Math.max(0, Math.round(newPrice * 100) / 100);

    return {
      updateOne: { filter: { _id: p._id }, update: { $set: { sellingPrice: newPrice } } },
    };
  });

  if (bulkOps.length) await Product.bulkWrite(bulkOps);
  return bulkOps.length;
};

module.exports = {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkDelete,
  bulkUpdateStatus,
  bulkPriceUpdate,
};
