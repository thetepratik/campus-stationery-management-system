const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    // -----------------------------------------------------
    // Application Order
    // -----------------------------------------------------
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      unique: true,
      index: true,
    },

    // -----------------------------------------------------
    // Student
    // -----------------------------------------------------
    // Keeping this reference makes it easier to find
    // payments belonging to a particular student.
    //
    // If your existing Order already contains student and
    // you don't want duplicate data, this field can be
    // removed. It is useful for reporting, however.
    //
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      index: true,
    },

    // -----------------------------------------------------
    // Razorpay Order
    // -----------------------------------------------------
    razorpayOrderId: {
      type: String,
      trim: true,
      index: true,
      sparse: true,
    },

    // -----------------------------------------------------
    // Razorpay Payment
    // -----------------------------------------------------
    razorpayPaymentId: {
      type: String,
      trim: true,
      index: true,
      sparse: true,
    },

    // -----------------------------------------------------
    // Razorpay Signature
    // -----------------------------------------------------
    razorpaySignature: {
      type: String,
      trim: true,
    },

    // -----------------------------------------------------
    // Amount
    // -----------------------------------------------------
    // Store amount in INR as a decimal number in the
    // application database.
    //
    // Example:
    // ₹250.50 -> 250.50
    //
    // Razorpay itself uses paise when creating an order.
    amount: {
      type: Number,
      required: true,
      min: [0, 'Payment amount cannot be negative'],
    },

    // -----------------------------------------------------
    // Currency
    // -----------------------------------------------------
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
      trim: true,
    },

    // -----------------------------------------------------
    // Payment Source
    // -----------------------------------------------------
    paymentType: {
      type: String,
      enum: [
        'online',
        'offline',
      ],
      default: 'online',
      index: true,
    },

    // -----------------------------------------------------
    // Payment Method
    // -----------------------------------------------------
    //
    // Online Razorpay:
    //   upi
    //   card
    //   netbanking
    //   wallet
    //
    // Offline:
    //   cash
    //   phonepe
    //   googlepay
    //   paytm
    //   bhim
    //   other
    //
    // "unknown" is useful while receiving webhook events
    // where the payment method may not be available.
    //
    method: {
      type: String,
      enum: [
        'upi',
        'card',
        'netbanking',
        'wallet',

        // Offline methods
        'cash',
        'phonepe',
        'googlepay',
        'paytm',
        'bhim',
        'other',

        'unknown',
      ],
      default: 'unknown',
      index: true,
    },

    // -----------------------------------------------------
    // Payment Status
    // -----------------------------------------------------
    status: {
      type: String,
      enum: [
        'created',
        'pending',
        'authorized',
        'captured',
        'failed',
        'refunded',
      ],
      default: 'created',
      index: true,
    },

    // -----------------------------------------------------
    // Payment Failure Information
    // -----------------------------------------------------
    failureReason: {
      type: String,
      default: '',
      trim: true,
    },

    failureCode: {
      type: String,
      default: '',
      trim: true,
    },

    // -----------------------------------------------------
    // Refund Information
    // -----------------------------------------------------
    refundId: {
      type: String,
      default: '',
      trim: true,
    },

    refundedAt: {
      type: Date,
      default: null,
    },

    // -----------------------------------------------------
    // Razorpay Webhook Information
    // -----------------------------------------------------
    webhookEvent: {
      type: String,
      default: '',
      trim: true,
    },

    webhookEventId: {
      type: String,
      default: '',
      trim: true,
      index: true,
      sparse: true,
    },

    lastWebhookAt: {
      type: Date,
      default: null,
    },

    // -----------------------------------------------------
    // Complete Razorpay Webhook Payload
    // -----------------------------------------------------
    //
    // Useful for:
    // - debugging
    // - payment audit
    // - checking Razorpay events
    // - development/testing
    //
    rawWebhookPayload: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    // -----------------------------------------------------
    // Payment Notes
    // -----------------------------------------------------
    notes: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);


// =========================================================
// INDEXES
// =========================================================

// Quickly find payments by order
// paymentSchema.index({
//   order: 1,
// });

// Quickly find Razorpay orders
// paymentSchema.index({
//   razorpayOrderId: 1,
// });

// Quickly find Razorpay payments
// paymentSchema.index({
//   razorpayPaymentId: 1,
// });

// Useful for admin payment reports
paymentSchema.index({
  status: 1,
  createdAt: -1,
});

// Useful for payment method reports
paymentSchema.index({
  method: 1,
  createdAt: -1,
});

// Useful for student payment history
paymentSchema.index({
  student: 1,
  createdAt: -1,
});


// =========================================================
// EXPORT
// =========================================================

module.exports = mongoose.model(
  'Payment',
  paymentSchema
);