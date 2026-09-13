/**
 * Seeds realistic sample data so the Admin Dashboard (and every phase after it)
 * has real numbers to render instead of zeros. Safe to re-run — it wipes and
 * recreates the collections it touches.
 *
 * Usage: npm run seed   (from /backend)
 */
require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const connectDB = require('../config/db');

const Admin = require('../models/Admin');
const Student = require('../models/Student');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Notification = require('../models/Notification');
const Inventory = require('../models/Inventory');
const Coupon = require('../models/Coupon');

const { PAYMENT_METHOD, OFFLINE_PAYMENT_METHOD, ORDER_STATUS, INVENTORY_MOVEMENT_TYPE } = require('../config/constants');

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[rand(0, arr.length - 1)];
const daysAgoDate = (n, hour = rand(9, 18)) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, rand(0, 59), 0, 0);
  return d;
};

// ---------- Real sample images (stored directly in MongoDB) ----------
// Sourced from backend/uploads/{products,Categories}/. Matched by product/
// category name; anything without a real match falls back to a valid 1x1
// JPEG placeholder so every seeded product always has *some* image.
const PRODUCTS_IMG_DIR = path.join(__dirname, '..', 'uploads', 'products');
const CATEGORIES_IMG_DIR = path.join(__dirname, '..', 'uploads', 'Categories');

const PLACEHOLDER_IMAGE_BASE64 =
  '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8VAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=';
const placeholderBuffer = Buffer.from(PLACEHOLDER_IMAGE_BASE64, 'base64');

const PRODUCT_IMAGE_MAP = {
  'Ruled Notebook 200 Pages': 'Classmate Ruled Notebook 200 Pages.jpg',
  'Long Notebook 172 Pages': 'Camlin Long Notebook.jpg',
  'Graph Notebook': 'notebooks_1.jpg',
  'Blue Ball Pen (Pack of 5)': 'pen.jpg',
  'Black Gel Pen': 'pen.jpg',
  'Fluorescent Highlighter Set': 'pencil.png',
  'Plastic File Folder': 'file and folder.jpg',
  'Ring Binder File': 'file and folder.jpg',
  'Scientific Calculator FX-991': 'calculator.jpg',
  'Geometry Box': 'geometry box.jpg',
  'Sketch Book A4': 'Classmate Ruled Notebook 100 Pages.jpg',
  'Whitener Pen': 'pen.jpg',
  'White Eraser Pack of 3': 'eraser.jpg',
  'HB Pencil (Pack of 10)': 'pencil.png',
  'Classmate Notebook 100 Pages': 'Classmate Ruled Notebook 100 Pages.jpg',
};

const CATEGORY_IMAGE_MAP = {
  Books: 'classmate notebook.jpg',
  Pens: 'pen.jpg',
  Files: 'file and folder.jpg',
  Accessories: 'office supplies.jpg',
  Drawing: 'arts and crafts.jpg',
};

const contentTypeFor = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  return 'image/jpeg';
};

const loadImageBuffer = (dir, filename) => {
  const filePath = path.join(dir, filename);
  return fs.existsSync(filePath) ? fs.readFileSync(filePath) : null;
};

const buildImageDoc = (buffer, contentType, fileName) => ({
  data: buffer,
  contentType,
  fileName,
  size: buffer.length,
  uploadedAt: new Date(),
});

/** Resolves the real photo for a name, or the placeholder if none exists. */
const resolveImageDoc = (dir, imageMap, name, fallbackFileName) => {
  const mappedFile = imageMap[name];
  const buffer = mappedFile ? loadImageBuffer(dir, mappedFile) : null;
  if (buffer) return buildImageDoc(buffer, contentTypeFor(mappedFile), mappedFile);
  return buildImageDoc(placeholderBuffer, 'image/jpeg', fallbackFileName);
};

const CATEGORY_DEFS = [
  { name: 'Books', description: 'Notebooks, registers and academic books' },
  { name: 'Pens', description: 'Ball pens, gel pens and markers' },
  { name: 'Files', description: 'Files, folders and binders' },
  { name: 'Accessories', description: 'Calculators, geometry boxes and desk accessories' },
  { name: 'Drawing', description: 'Chart paper, sketch books and art supplies' },
];

const PRODUCT_DEFS = [
  { name: 'Ruled Notebook 200 Pages', category: 'Books', brand: 'Classmate', purchasePrice: 45, sellingPrice: 80, gstPercent: 12, stock: 450, minStock: 50 },
  { name: 'Long Notebook 172 Pages', category: 'Books', brand: 'Classmate', purchasePrice: 38, sellingPrice: 65, gstPercent: 12, stock: 320, minStock: 40 },
  { name: 'Graph Notebook', category: 'Books', brand: 'Navneet', purchasePrice: 42, sellingPrice: 75, gstPercent: 12, stock: 6, minStock: 20 },
  { name: 'Blue Ball Pen (Pack of 5)', category: 'Pens', brand: 'Cello', purchasePrice: 25, sellingPrice: 50, discountPercent: 15, gstPercent: 18, stock: 620, minStock: 60 },
  { name: 'Black Gel Pen', category: 'Pens', brand: 'Reynolds', purchasePrice: 8, sellingPrice: 15, gstPercent: 18, stock: 4, minStock: 30 },
  { name: 'Fluorescent Highlighter Set', category: 'Pens', brand: 'Camlin', purchasePrice: 45, sellingPrice: 80, gstPercent: 18, stock: 220, minStock: 25 },
  { name: 'Plastic File Folder', category: 'Files', brand: 'Solo', purchasePrice: 20, sellingPrice: 40, gstPercent: 12, stock: 300, minStock: 30 },
  { name: 'Ring Binder File', category: 'Files', brand: 'Solo', purchasePrice: 60, sellingPrice: 110, gstPercent: 12, stock: 0, minStock: 20 },
  { name: 'Scientific Calculator FX-991', category: 'Accessories', brand: 'Casio', purchasePrice: 780, sellingPrice: 1050, discountPercent: 10, gstPercent: 18, stock: 180, minStock: 15 },
  { name: 'Geometry Box', category: 'Accessories', brand: 'Camlin', purchasePrice: 55, sellingPrice: 95, gstPercent: 12, stock: 2, minStock: 20 },
  { name: 'Stapler Small', category: 'Accessories', brand: 'Kangaro', purchasePrice: 60, sellingPrice: 100, gstPercent: 18, stock: 220, minStock: 20 },
  { name: 'A3 Chart Paper (Pack of 10)', category: 'Drawing', brand: 'Navneet', purchasePrice: 90, sellingPrice: 150, discountPercent: 20, gstPercent: 12, stock: 90, minStock: 15 },
  { name: 'Sketch Book A4', category: 'Drawing', brand: 'Camlin', purchasePrice: 65, sellingPrice: 110, gstPercent: 12, stock: 160, minStock: 20 },
  { name: 'Watercolor Set 12 Shades', category: 'Drawing', brand: 'Camlin', purchasePrice: 95, sellingPrice: 160, discountPercent: 12, gstPercent: 18, stock: 130, minStock: 15 },
  { name: 'Whitener Pen', category: 'Pens', brand: 'Cello', purchasePrice: 18, sellingPrice: 30, gstPercent: 18, stock: 260, minStock: 25 },
  { name: 'White Eraser Pack of 3', category: 'Accessories', brand: 'Natraj', purchasePrice: 12, sellingPrice: 25, gstPercent: 12, stock: 340, minStock: 30 },
  { name: 'HB Pencil (Pack of 10)', category: 'Pens', brand: 'Natraj', purchasePrice: 22, sellingPrice: 40, discountPercent: 10, gstPercent: 12, stock: 410, minStock: 40 },
  { name: 'Classmate Notebook 100 Pages', category: 'Books', brand: 'Classmate', purchasePrice: 32, sellingPrice: 55, gstPercent: 12, stock: 280, minStock: 35 },
];

const STUDENT_DEFS = [
  { name: 'Rahul Sharma', rollNumber: '23CS345', department: 'Computer Science', email: 'rahul.sharma@vit.edu' },
  { name: 'Ankit Verma', rollNumber: '23ME112', department: 'Mechanical Engineering', email: 'ankit.verma@vit.edu' },
  { name: 'Priya Singh', rollNumber: '23EC221', department: 'Electronics', email: 'priya.singh@vit.edu' },
  { name: 'Neha Patel', rollNumber: '23AI089', department: 'AI & Data Science', email: 'neha.patel@vit.edu' },
  { name: 'Mohit Kumar', rollNumber: '23CE156', department: 'Civil Engineering', email: 'mohit.kumar@vit.edu' },
];

const slugify = (str) =>
  str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const run = async () => {
  await connectDB();
  console.log('[Seed] Connected. Wiping existing sample collections...');

  const Cart = require('../models/Cart');
  const Wishlist = require('../models/Wishlist');
  const Review = require('../models/Review');
  await Promise.all([
    Category.deleteMany({}),
    Product.deleteMany({}),
    Sale.deleteMany({}),
    Order.deleteMany({}),
    OrderItem.deleteMany({}),
    Notification.deleteMany({}),
    Inventory.deleteMany({}),
    Student.deleteMany({}),
    Coupon.deleteMany({}),
    Cart.deleteMany({}),
    Wishlist.deleteMany({}),
    Review.deleteMany({}),
  ]);

  // --- Admin (idempotent — keep existing if present) ---
  let admin = await Admin.findOne({ email: 'admin@campusstationery.com' });
  if (!admin) {
    admin = await Admin.create({
      name: 'Admin',
      email: 'admin@campusstationery.com',
      password: 'Admin@123',
      shopName: 'Campus Stationery',
    });
    console.log('[Seed] Created admin login: admin@campusstationery.com / Admin@123');
  }

  // --- Categories ---
  const categories = await Category.insertMany(
    CATEGORY_DEFS.map((c) => ({
      ...c,
      slug: slugify(c.name),
      image: resolveImageDoc(CATEGORIES_IMG_DIR, CATEGORY_IMAGE_MAP, c.name, `${slugify(c.name)}-placeholder.jpg`),
    }))
  );
  const categoryByName = Object.fromEntries(categories.map((c) => [c.name, c._id]));
  console.log(`[Seed] Created ${categories.length} categories`);

  // --- Products ---
  const products = [];
  for (const [i, p] of PRODUCT_DEFS.entries()) {
    const product = await Product.create({
      name: p.name,
      slug: `${slugify(p.name)}-${i}`,
      category: categoryByName[p.category],
      brand: p.brand,
      supplier: `${p.brand} Distributors Pvt Ltd`,
      sku: `SKU-${1000 + i}`,
      barcode: `890${1000000 + i}`,
      purchasePrice: p.purchasePrice,
      sellingPrice: p.sellingPrice,
      discountPercent: p.discountPercent || 0,
      gstPercent: p.gstPercent,
      openingStock: p.stock,
      currentStock: p.stock,
      minStock: p.minStock,
      soldCount: 0,
      status: 'active',
      isFeatured: i < 4,
      images: [resolveImageDoc(PRODUCTS_IMG_DIR, PRODUCT_IMAGE_MAP, p.name, `${slugify(p.name)}-${i}-placeholder.jpg`)],
    });
    products.push(product);
  }
  console.log(`[Seed] Created ${products.length} products`);

  // --- Students ---
  const students = [];
  for (const s of STUDENT_DEFS) {
    const student = await Student.create({
      name: s.name,
      email: s.email,
      password: 'Student@123',
      rollNumber: s.rollNumber,
      department: s.department,
      mobile: `9${rand(100000000, 999999999)}`,
      isVerified: true,
    });
    students.push(student);
  }
  console.log(`[Seed] Created ${students.length} students (password: Student@123)`);

  // Running stock tracker so sales never oversell and each line item can emit
  // a correct before/after Inventory ledger entry.
  const stockLevel = new Map(products.map((p) => [p._id.toString(), p.currentStock]));
  const soldCount = new Map(products.map((p) => [p._id.toString(), 0]));
  const inventoryLedgerDocs = [];

  const pickAvailableProduct = () => {
    const available = products.filter((p) => stockLevel.get(p._id.toString()) > 0);
    if (!available.length) return null;
    return pick(available);
  };

  // --- Offline Sales, spread over the last 30 days ---
  let saleCounter = 1;
  const offlinePaymentMethods = Object.values(OFFLINE_PAYMENT_METHOD);
  const sales = [];
  for (let day = 29; day >= 0; day--) {
    const salesToday = rand(1, 6);
    for (let s = 0; s < salesToday; s++) {
      const numItems = rand(1, 3);
      const items = [];
      let totalAmount = 0;
      const chosenProducts = new Set();
      const createdAt = daysAgoDate(day);

      for (let n = 0; n < numItems; n++) {
        let product = pickAvailableProduct();
        if (!product) break;
        let tries = 0;
        while (chosenProducts.has(product._id.toString()) && tries < 5) {
          product = pickAvailableProduct();
          if (!product) break;
          tries++;
        }
        if (!product || chosenProducts.has(product._id.toString())) continue;
        chosenProducts.add(product._id.toString());

        const key = product._id.toString();
        const available = stockLevel.get(key);
        const quantity = Math.min(rand(1, 4), available);
        if (quantity <= 0) continue;

        const subtotal = product.sellingPrice * quantity;
        totalAmount += subtotal;
        items.push({
          product: product._id,
          name: product.name,
          quantity,
          unitPrice: product.sellingPrice,
          gstPercent: product.gstPercent,
          subtotal,
        });

        const stockBefore = stockLevel.get(key);
        const stockAfter = stockBefore - quantity;
        stockLevel.set(key, stockAfter);
        soldCount.set(key, soldCount.get(key) + quantity);
        inventoryLedgerDocs.push({
          product: product._id,
          type: INVENTORY_MOVEMENT_TYPE.SALE_OFFLINE,
          quantityChange: -quantity,
          stockBefore,
          stockAfter,
          note: 'Offline POS sale',
          performedBy: admin._id,
          createdAt,
        });
      }

      if (!items.length) continue;

      const sale = await Sale.create({
        saleId: `S${String(saleCounter).padStart(4, '0')}`,
        items,
        totalAmount,
        customerName: Math.random() > 0.3 ? pick(STUDENT_DEFS).name : '',
        rollNumber: Math.random() > 0.3 ? pick(STUDENT_DEFS).rollNumber : '',
        department: Math.random() > 0.3 ? pick(STUDENT_DEFS).department : '',
        paymentMethod: pick(offlinePaymentMethods),
        paymentConfirmed: true,
        soldBy: admin._id,
        createdAt,
      });
      await Sale.updateOne({ _id: sale._id }, { createdAt });
      sales.push(sale);
      saleCounter++;
    }
  }
  console.log(`[Seed] Created ${sales.length} offline sales across the last 30 days`);

  // --- Online Orders, spread over the last 15 days ---
  let orderCounter = 1001;
  const statuses = [
    ORDER_STATUS.PENDING,
    ORDER_STATUS.CONFIRMED,
    ORDER_STATUS.READY_FOR_PICKUP,
    ORDER_STATUS.COMPLETED,
    ORDER_STATUS.COMPLETED,
    ORDER_STATUS.CANCELLED,
  ];
  const orders = [];
  for (let day = 14; day >= 0; day--) {
    const ordersToday = rand(0, 3);
    for (let o = 0; o < ordersToday; o++) {
      const student = pick(students);
      const numItems = rand(1, 3);
      const chosenProducts = new Set();
      const orderItemDocs = [];
      let totalAmount = 0;
      const createdAt = daysAgoDate(day);
      const status = pick(statuses);
      const isCancelled = status === ORDER_STATUS.CANCELLED;

      for (let n = 0; n < numItems; n++) {
        let product = pickAvailableProduct();
        if (!product) break;
        let tries = 0;
        while (chosenProducts.has(product._id.toString()) && tries < 5) {
          product = pickAvailableProduct();
          if (!product) break;
          tries++;
        }
        if (!product || chosenProducts.has(product._id.toString())) continue;
        chosenProducts.add(product._id.toString());

        const key = product._id.toString();
        const available = stockLevel.get(key);
        const quantity = Math.min(rand(1, 3), available);
        if (quantity <= 0) continue;

        const subtotal = product.sellingPrice * quantity;
        totalAmount += subtotal;
        orderItemDocs.push({ product: product._id, name: product.name, quantity, unitPrice: product.sellingPrice, subtotal });

        // Cancelled orders never actually left the shelf.
        if (!isCancelled) {
          const stockBefore = stockLevel.get(key);
          const stockAfter = stockBefore - quantity;
          stockLevel.set(key, stockAfter);
          soldCount.set(key, soldCount.get(key) + quantity);
          inventoryLedgerDocs.push({
            product: product._id,
            type: INVENTORY_MOVEMENT_TYPE.SALE_ONLINE,
            quantityChange: -quantity,
            stockBefore,
            stockAfter,
            note: 'Online store order',
            performedBy: admin._id,
            createdAt,
          });
        }
      }

      if (!orderItemDocs.length) continue;

      const paymentStatus = isCancelled ? 'failed' : 'paid';

      const order = await Order.create({
        orderId: `ORD${orderCounter}`,
        student: student._id,
        items: [],
        itemsCount: orderItemDocs.length,
        totalAmount,
        gstAmount: Math.round(totalAmount * 0.12 * 100) / 100,
        paymentMethod: pick([PAYMENT_METHOD.RAZORPAY, PAYMENT_METHOD.CASH_ON_PICKUP]),
        paymentStatus,
        status,
        statusHistory: [{ status, changedAt: createdAt, changedBy: admin._id }],
        createdAt,
      });

      const createdItems = await OrderItem.insertMany(
        orderItemDocs.map((i) => ({ ...i, order: order._id }))
      );
      order.items = createdItems.map((i) => i._id);
      await order.save();
      await Order.updateOne({ _id: order._id }, { createdAt });

      orders.push(order);
      orderCounter++;
    }
  }
  console.log(`[Seed] Created ${orders.length} online orders across the last 15 days`);

  // --- Restock ledger entries, spread across the last 20 days (before sales began depleting stock) ---
  for (const product of products.slice(0, 8)) {
    const restockDate = daysAgoDate(rand(20, 28));
    const restockQty = rand(50, 150);
    inventoryLedgerDocs.push({
      product: product._id,
      type: INVENTORY_MOVEMENT_TYPE.RESTOCK,
      quantityChange: restockQty,
      stockBefore: product.openingStock,
      stockAfter: product.openingStock + restockQty,
      note: 'Bulk restock from supplier',
      performedBy: admin._id,
      createdAt: restockDate,
    });
  }

  // Persist final stock + soldCount, and write every ledger entry generated above.
  for (const product of products) {
    const key = product._id.toString();
    await Product.updateOne(
      { _id: product._id },
      { currentStock: stockLevel.get(key), soldCount: soldCount.get(key) }
    );
  }
  if (inventoryLedgerDocs.length) {
    await Inventory.insertMany(inventoryLedgerDocs);
  }
  console.log(`[Seed] Created ${inventoryLedgerDocs.length} inventory ledger entries (restocks + sale deductions)`);

  // --- Notifications ---
  const notifDefs = [
    { type: 'order', title: 'New online order received', message: `Order ${orders[orders.length - 1]?.orderId || 'ORD1001'} placed` },
    { type: 'payment', title: 'Payment received', message: 'Payment confirmed via UPI' },
    { type: 'stock', title: 'Low stock alert', message: 'Graph Notebook is running low' },
    { type: 'stock', title: 'Out of stock', message: 'Ring Binder File is out of stock' },
    { type: 'system', title: 'New product added', message: 'Watercolor Set 12 Shades added to catalog' },
  ];
  await Notification.insertMany(
    notifDefs.map((n, i) => ({
      recipientType: 'admin',
      recipient: admin._id,
      ...n,
      isRead: i > 2,
      createdAt: daysAgoDate(i),
    }))
  );
  console.log(`[Seed] Created ${notifDefs.length} notifications`);

  // --- Coupons ---
  await Coupon.insertMany([
    {
      code: 'WELCOME10',
      discountType: 'percent',
      discountValue: 10,
      minOrderAmount: 100,
      maxUses: null,
      isActive: true,
    },
    {
      code: 'FLAT50',
      discountType: 'flat',
      discountValue: 50,
      minOrderAmount: 300,
      maxUses: 100,
      isActive: true,
    },
  ]);
  console.log('[Seed] Created 2 coupons: WELCOME10 (10% off, min ₹100), FLAT50 (₹50 off, min ₹300)');

  console.log('\n[Seed] Done! Login with:');
  console.log('  Admin:   admin@campusstationery.com / Admin@123');
  console.log('  Student: rahul.sharma@vit.edu / Student@123 (any seeded student email works)\n');

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error('[Seed] Failed:', err);
  process.exit(1);
});
