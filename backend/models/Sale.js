const mongoose = require('mongoose');
const { OFFLINE_PAYMENT_METHOD } = require('../config/constants');

const saleItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    gstPercent: { type: Number, default: 0 },
    subtotal: { type: Number, required: true },
  },
  { _id: false }
);

const saleSchema = new mongoose.Schema(
  {
    saleId: { type: String, required: true, unique: true },
    items: { type: [saleItemSchema], required: true },
    totalAmount: { type: Number, required: true },
    customerName: { type: String, default: '' },
    rollNumber: { type: String, default: '' },
    department: { type: String, default: '' },
    remarks: { type: String, default: '' },
    paymentMethod: { type: String, enum: Object.values(OFFLINE_PAYMENT_METHOD), required: true },
    paymentConfirmed: { type: Boolean, default: false },
    soldBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  },
  { timestamps: true }
);

saleSchema.index({ createdAt: -1 });
saleSchema.index({ rollNumber: 1 });

module.exports = mongoose.model('Sale', saleSchema);
