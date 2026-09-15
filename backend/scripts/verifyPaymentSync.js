require('dotenv').config();
const crypto = require('crypto');
const mongoose = require('mongoose');

const Product = require('../models/Product');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Student = require('../models/Student');
const Admin = require('../models/Admin');
const Cart = require('../models/Cart');

const orderService = require('../services/orderService');
const paymentService = require('../services/paymentService');
const adminOrderService = require('../services/adminOrderService');
const saleService = require('../services/saleService');
const { PAYMENT_STATUS, ORDER_STATUS } = require('../config/constants');

async function runPaymentSyncVerification() {
  console.log('=== STARTING RAZORPAY PAYMENT SYNCHRONIZATION VERIFICATION ===\n');

  if (!process.env.RAZORPAY_KEY_SECRET) {
    process.env.RAZORPAY_KEY_SECRET = 'test_secret_key_campus_stationery_123';
  }
  if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
    process.env.RAZORPAY_WEBHOOK_SECRET = 'test_webhook_secret_123';
  }

  await mongoose.connect(process.env.MONGO_URI);

  // 1. Setup Student & Product
  let student = await Student.findOne({ email: 'test_student_payment@example.com' });
  if (!student) {
    student = await Student.create({
      name: 'Razorpay Test Student',
      email: 'test_student_payment@example.com',
      password: 'password123',
      rollNumber: 'RZP2026',
      department: 'Computer Science',
      mobile: '9876543210',
    });
  }

  let product = await Product.findOne({ status: 'active', currentStock: { $gt: 10 } });
  if (!product) {
    product = await Product.create({
      name: 'Razorpay Test Notebook',
      sku: 'RZP-NB-001',
      description: 'Notebook for Razorpay sync testing',
      purchasePrice: 30,
      sellingPrice: 50,
      currentStock: 30,
      minStock: 5,
      soldCount: 0,
      status: 'active',
    });
  }

  // Setup student's cart
  await Cart.deleteMany({ student: student._id });
  await Cart.create({
    student: student._id,
    items: [{ product: product._id, quantity: 2, unitPrice: product.sellingPrice }],
  });

  console.log('[Setup] Student and cart ready with 2x ' + product.name);

  // TEST 1: Create Checkout Order (Razorpay)
  console.log('\n--- TEST 1: Creating Razorpay Checkout Order ---');
  const pickupTime = new Date(Date.now() + 7200000).toISOString();
  const checkoutResult = await orderService.createRazorpayOrder(
    student._id,
    { pickupTime },
    null
  );

  const initialOrder = await Order.findById(checkoutResult.order._id);
  const initialPayment = await Payment.findOne({ order: initialOrder._id });

  console.log(`Order created: ${initialOrder.orderId}, Status: ${initialOrder.status}, PaymentStatus: ${initialOrder.paymentStatus}`);
  console.log(`Payment created: ID=${initialPayment._id}, RazorpayOrderId=${initialPayment.razorpayOrderId}, Status=${initialPayment.status}`);

  if (initialOrder.status !== ORDER_STATUS.PENDING) throw new Error('Initial order status must be pending');
  if (initialOrder.paymentStatus !== PAYMENT_STATUS.PENDING) throw new Error('Initial order paymentStatus must be pending');
  if (initialPayment.status !== 'created') throw new Error('Initial payment status must be created');

  // TEST 2: Signature Verification with Invalid Signature (Should Fail & Mark Failed)
  console.log('\n--- TEST 2: Testing Verification with Invalid Signature ---');
  const fakePaymentId = 'pay_fake_' + Date.now();
  const badSignature = 'invalid_bad_signature_value';

  try {
    await paymentService.verifyCheckoutPayment(
      student._id,
      {
        orderId: initialOrder._id.toString(),
        razorpayOrderId: initialPayment.razorpayOrderId,
        razorpayPaymentId: fakePaymentId,
        razorpaySignature: badSignature,
      },
      null
    );
    throw new Error('Invalid signature should have been rejected but passed!');
  } catch (err) {
    console.log(`Expected rejection caught: "${err.message}"`);
  }

  const paymentAfterFail = await Payment.findById(initialPayment._id);
  console.log(`Payment status after invalid signature: ${paymentAfterFail.status} (Expected: failed)`);
  if (paymentAfterFail.status !== 'failed') throw new Error('Payment status was not updated to failed');

  // Reset payment status back to created for next tests
  paymentAfterFail.status = 'created';
  await paymentAfterFail.save();

  // TEST 3: Signature Verification with Valid HMAC-SHA256 Signature
  console.log('\n--- TEST 3: Testing Valid Signature Verification ---');
  const validPaymentId = 'pay_valid_' + Date.now();
  const validSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${initialPayment.razorpayOrderId}|${validPaymentId}`)
    .digest('hex');

  const verifiedOrder = await paymentService.verifyCheckoutPayment(
    student._id,
    {
      orderId: initialOrder._id.toString(),
      razorpayOrderId: initialPayment.razorpayOrderId,
      razorpayPaymentId: validPaymentId,
      razorpaySignature: validSignature,
    },
    null
  );

  const updatedOrder = await Order.findById(initialOrder._id);
  const updatedPayment = await Payment.findById(initialPayment._id);

  console.log(`Verified Order: ${updatedOrder.orderId}, Status: ${updatedOrder.status} (Expected: confirmed), PaymentStatus: ${updatedOrder.paymentStatus} (Expected: paid)`);
  console.log(`Verified Payment: Status: ${updatedPayment.status} (Expected: captured), razorpayPaymentId: ${updatedPayment.razorpayPaymentId}`);

  if (updatedOrder.paymentStatus !== PAYMENT_STATUS.PAID) throw new Error('Order paymentStatus is not paid');
  if (updatedOrder.status !== ORDER_STATUS.CONFIRMED) throw new Error('Order status is not confirmed');
  if (updatedPayment.status !== 'captured') throw new Error('Payment status is not captured');
  if (updatedPayment.razorpayPaymentId !== validPaymentId) throw new Error('Razorpay payment ID was not saved on Payment');

  // TEST 4: Idempotency (Repeating Verification Request)
  console.log('\n--- TEST 4: Testing Verification Idempotency ---');
  const repeatVerifiedOrder = await paymentService.verifyCheckoutPayment(
    student._id,
    {
      orderId: initialOrder._id.toString(),
      razorpayOrderId: initialPayment.razorpayOrderId,
      razorpayPaymentId: validPaymentId,
      razorpaySignature: validSignature,
    },
    null
  );

  if (repeatVerifiedOrder.paymentStatus !== PAYMENT_STATUS.PAID) throw new Error('Repeat verification returned invalid paymentStatus');
  if (repeatVerifiedOrder.status !== ORDER_STATUS.CONFIRMED) throw new Error('Repeat verification returned invalid status');
  console.log('Idempotent verification succeeded without duplicate changes or errors.');

  // TEST 5: Razorpay Webhook Handler
  console.log('\n--- TEST 5: Testing Razorpay Webhook Confirmation ---');
  // Update cart for webhook test
  await Cart.findOneAndUpdate(
    { student: student._id },
    { items: [{ product: product._id, quantity: 1, unitPrice: product.sellingPrice }] },
    { upsert: true }
  );

  const webhookCheckout = await orderService.createRazorpayOrder(student._id, { pickupTime }, null);
  const webhookOrder = await Order.findById(webhookCheckout.order._id);
  const webhookPayment = await Payment.findOne({ order: webhookOrder._id });

  const webhookPaymentId = 'pay_webhook_' + Date.now();
  const webhookPayloadObj = {
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: webhookPaymentId,
          order_id: webhookPayment.razorpayOrderId,
          amount: Math.round(webhookOrder.totalAmount * 100),
          currency: 'INR',
          status: 'captured',
          method: 'upi',
        },
      },
    },
  };

  const rawWebhookBody = Buffer.from(JSON.stringify(webhookPayloadObj), 'utf8');
  const webhookSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawWebhookBody)
    .digest('hex');

  const webhookResult = await paymentService.handleWebhook(
    rawWebhookBody,
    webhookSignature,
    null,
    'evt_test_123'
  );

  console.log('Webhook handled:', webhookResult);
  const orderAfterWebhook = await Order.findById(webhookOrder._id);
  const paymentAfterWebhook = await Payment.findById(webhookPayment._id);

  console.log(`Webhook Order: Status: ${orderAfterWebhook.status} (Expected: confirmed), PaymentStatus: ${orderAfterWebhook.paymentStatus} (Expected: paid)`);
  console.log(`Webhook Payment: Status: ${paymentAfterWebhook.status} (Expected: captured), Method: ${paymentAfterWebhook.method}`);

  if (orderAfterWebhook.paymentStatus !== PAYMENT_STATUS.PAID) throw new Error('Webhook failed to mark order as paid');
  if (orderAfterWebhook.status !== ORDER_STATUS.CONFIRMED) throw new Error('Webhook failed to mark order as confirmed');

  // TEST 6: Admin Orders Table Query Check
  console.log('\n--- TEST 6: Testing Admin Orders Table Query ---');
  const adminOrderList = await adminOrderService.listAllOrders({ search: updatedOrder.orderId });
  const listedOrder = adminOrderList.items.find(o => o.orderId === updatedOrder.orderId);

  console.log(`Admin list result for ${updatedOrder.orderId}: Payment: ${listedOrder.paymentStatus}, Status: ${listedOrder.status}`);
  if (listedOrder.paymentStatus !== PAYMENT_STATUS.PAID) throw new Error('Admin list query did not return paid');
  if (listedOrder.status !== ORDER_STATUS.CONFIRMED) throw new Error('Admin list query did not return confirmed');

  // TEST 7: Verify Offline Sale Remains Functional
  console.log('\n--- TEST 7: Verifying Offline POS Sale Functionality ---');
  let admin = await Admin.findOne();
  if (!admin) {
    admin = await Admin.create({
      name: 'Test Admin',
      email: 'admin_test_offline@example.com',
      password: 'password123',
      role: 'admin',
    });
  }

  const offlineSale = await saleService.createSale(
    {
      items: [{ productId: product._id.toString(), quantity: 1 }],
      paymentMethod: 'cash',
      customerName: 'Walk-in Student',
      paymentConfirmed: true,
    },
    admin._id,
    null
  );

  console.log(`Offline Sale created: ${offlineSale.saleId}, Amount: ₹${offlineSale.totalAmount}, Status: ${offlineSale.status}`);
  if (offlineSale.status !== 'completed') throw new Error('Offline sale failed');

  console.log('\n=== ALL 7 RAZORPAY SYNCHRONIZATION & OFFLINE SALES TESTS PASSED SUCCESSFULLY! ===');
  await mongoose.disconnect();
}

runPaymentSyncVerification().catch((err) => {
  console.error('\nTEST FAILURE:', err);
  process.exit(1);
});
