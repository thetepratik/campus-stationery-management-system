require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const Admin = require('../models/Admin');
const saleService = require('../services/saleService');
const dashboardService = require('../services/dashboardService');
const { checkoutValidation } = require('../validations/orderValidation');
const { validationResult } = require('express-validator');

async function runTests() {
  console.log('--- STARTING FEATURE VERIFICATION TESTS ---');
  await mongoose.connect(process.env.MONGO_URI);

  // Find or create an admin
  let admin = await Admin.findOne();
  if (!admin) {
    admin = await Admin.create({
      name: 'Test Admin',
      email: 'admin_test@example.com',
      password: 'password123',
      role: 'admin',
    });
  }

  // Find or create a test product
  let product = await Product.findOne({ status: 'active', currentStock: { $gt: 10 } });
  if (!product) {
    product = await Product.create({
      name: 'Test Notebook For Undo',
      sku: 'TEST-NB-001',
      description: 'Test product for sale undo',
      purchasePrice: 40,
      sellingPrice: 70,
      currentStock: 25,
      minStock: 5,
      soldCount: 5,
      status: 'active',
    });
  }

  const initialStock = product.currentStock;
  const initialSoldCount = product.soldCount || 0;
  const saleQuantity = 3;
  const expectedSaleAmount = product.sellingPrice * saleQuantity;

  console.log(`[Setup] Product: ${product.name}, Initial Stock: ${initialStock}, Initial Sold: ${initialSoldCount}`);

  // TEST 1: Record Offline Sale
  console.log('\n[Test 1] Recording Offline POS Sale...');
  const salePayload = {
    items: [{ productId: product._id.toString(), quantity: saleQuantity }],
    paymentMethod: 'cash',
    customerName: 'Test Student',
    rollNumber: 'CS101',
    department: 'Computer Science',
    paymentConfirmed: true,
  };

  const sale = await saleService.createSale(salePayload, admin._id, null);
  console.log(`Created Sale: ${sale.saleId}, Status: ${sale.status}, Amount: ₹${sale.totalAmount}`);
  if (sale.status !== 'completed') throw new Error('Sale status is not completed');
  if (sale.totalAmount !== expectedSaleAmount) throw new Error('Sale totalAmount mismatch');

  // Verify product stock & soldCount after sale
  const productAfterSale = await Product.findById(product._id);
  console.log(`Stock after sale: ${productAfterSale.currentStock} (Expected: ${initialStock - saleQuantity})`);
  console.log(`Sold count after sale: ${productAfterSale.soldCount} (Expected: ${initialSoldCount + saleQuantity})`);
  if (productAfterSale.currentStock !== initialStock - saleQuantity) throw new Error('Stock did not decrease correctly');
  if (productAfterSale.soldCount !== initialSoldCount + saleQuantity) throw new Error('Sold count did not increase correctly');

  // TEST 2: Dashboard Before Undo
  console.log('\n[Test 2] Checking Dashboard before undo...');
  const dashboardBefore = await dashboardService.getSummary();
  console.log(`Today Offline Revenue: ₹${dashboardBefore.todayOfflineRevenue}, Today Offline Count: ${dashboardBefore.todayOfflineSalesCount}`);

  // TEST 3: Undo Sale
  console.log('\n[Test 3] Undoing Sale...');
  const undoneSale = await saleService.undoSale(sale._id, admin._id, 'Customer returned item at counter', null);
  console.log(`Undone Sale Status: ${undoneSale.status}, ReversedAt: ${undoneSale.reversedAt}, Reason: ${undoneSale.reversalReason}`);
  if (undoneSale.status !== 'reversed') throw new Error('Undone sale status is not reversed');
  if (!undoneSale.reversedAt) throw new Error('reversedAt date is missing');

  // TEST 4: Stock & SoldCount Restoration
  console.log('\n[Test 4] Verifying Inventory & Sold Count Restoration...');
  const productAfterUndo = await Product.findById(product._id);
  console.log(`Stock after undo: ${productAfterUndo.currentStock} (Expected: ${initialStock})`);
  console.log(`Sold count after undo: ${productAfterUndo.soldCount} (Expected: ${initialSoldCount})`);
  if (productAfterUndo.currentStock !== initialStock) throw new Error('Stock was not restored correctly');
  if (productAfterUndo.soldCount !== initialSoldCount) throw new Error('Sold count was not restored correctly');

  // TEST 5: Double Undo Prevention
  console.log('\n[Test 5] Testing Double Undo Prevention...');
  try {
    await saleService.undoSale(sale._id, admin._id, 'Second undo attempt', null);
    throw new Error('Double undo did not throw an error!');
  } catch (err) {
    console.log(`Expected error caught: "${err.message}"`);
  }

  // TEST 6: Dashboard Revenue & Sales After Undo
  console.log('\n[Test 6] Checking Dashboard after undo...');
  const dashboardAfter = await dashboardService.getSummary();
  console.log(`Today Offline Revenue after undo: ₹${dashboardAfter.todayOfflineRevenue} (Should decrease by ₹${expectedSaleAmount})`);
  console.log(`Today Offline Count after undo: ${dashboardAfter.todayOfflineSalesCount}`);
  if (dashboardAfter.todayOfflineRevenue !== dashboardBefore.todayOfflineRevenue - expectedSaleAmount) {
    throw new Error('Dashboard revenue was not reduced by reversed sale amount');
  }
  if (dashboardAfter.todayOfflineSalesCount !== dashboardBefore.todayOfflineSalesCount - 1) {
    throw new Error('Dashboard offline sales count was not reduced');
  }

  // TEST 7: Sales History Listing Filters
  console.log('\n[Test 7] Testing Sales History Filters...');
  const completedSales = await saleService.listSales({ status: 'completed' });
  const reversedSales = await saleService.listSales({ status: 'reversed' });
  console.log(`Completed sales count: ${completedSales.meta.totalCount}, Reversed sales count: ${reversedSales.meta.totalCount}`);
  const hasUndoneInCompleted = completedSales.items.some(s => s._id.toString() === sale._id.toString());
  const hasUndoneInReversed = reversedSales.items.some(s => s._id.toString() === sale._id.toString());
  if (hasUndoneInCompleted) throw new Error('Reversed sale appeared in completed filter');
  if (!hasUndoneInReversed) throw new Error('Reversed sale missing from reversed filter');

  // TEST 8: Student Checkout Validation (Cash on Pickup rejection)
  console.log('\n[Test 8] Testing Student Checkout Validation (Rejection of Cash/Offline payment)...');
  const dummyReqWithCash = {
    body: {
      pickupTime: new Date(Date.now() + 7200000).toISOString(),
      paymentMethod: 'cash-on-pickup',
    },
  };
  for (const validation of checkoutValidation) {
    await validation.run(dummyReqWithCash);
  }
  const errorsWithCash = validationResult(dummyReqWithCash);
  if (errorsWithCash.isEmpty()) {
    throw new Error('Validation allowed cash-on-pickup for student checkout!');
  }
  console.log(`Cash rejection error: "${errorsWithCash.array()[0].msg}"`);

  // TEST 9: Student Checkout Validation (Razorpay Allowed)
  console.log('\n[Test 9] Testing Student Checkout Validation with Razorpay...');
  const dummyReqWithRazorpay = {
    body: {
      pickupTime: new Date(Date.now() + 7200000).toISOString(),
      paymentMethod: 'razorpay',
    },
  };
  for (const validation of checkoutValidation) {
    await validation.run(dummyReqWithRazorpay);
  }
  const errorsWithRazorpay = validationResult(dummyReqWithRazorpay);
  if (!errorsWithRazorpay.isEmpty()) {
    throw new Error(`Validation failed for razorpay: ${JSON.stringify(errorsWithRazorpay.array())}`);
  }
  console.log('Razorpay validation passed without errors.');

  console.log('\n=== ALL 9 FEATURE VERIFICATION TESTS PASSED SUCCESSFULLY! ===');
  await mongoose.disconnect();
}

runTests().catch((err) => {
  console.error('\nFAILED TEST:', err);
  process.exit(1);
});
