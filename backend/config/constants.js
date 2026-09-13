/**
 * Central enum definitions — imported by models, controllers, validators,
 * and (via a mirrored frontend copy) the React UI, so status strings never
 * drift between layers across the 14 build phases.
 */

const ROLES = Object.freeze({
  ADMIN: 'admin',
  STUDENT: 'student',
});

const ORDER_STATUS = Object.freeze({
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PACKING: 'packing',
  READY_FOR_PICKUP: 'ready-for-pickup',
  COLLECTED: 'collected',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
});

const ORDER_STATUS_FLOW = [
  ORDER_STATUS.PENDING,
  ORDER_STATUS.CONFIRMED,
  ORDER_STATUS.PACKING,
  ORDER_STATUS.READY_FOR_PICKUP,
  ORDER_STATUS.COLLECTED,
  ORDER_STATUS.COMPLETED,
];

const PAYMENT_STATUS = Object.freeze({
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
});

const PAYMENT_METHOD = Object.freeze({
  RAZORPAY: 'razorpay',
  CASH_ON_PICKUP: 'cash-on-pickup',
});

const OFFLINE_PAYMENT_METHOD = Object.freeze({
  CASH: 'cash',
  UPI: 'upi',
  GPAY: 'gpay',
  PHONEPE: 'phonepe',
  PAYTM: 'paytm',
});

const PRODUCT_STATUS = Object.freeze({
  ACTIVE: 'active',
  INACTIVE: 'inactive',
});

const STOCK_AVAILABILITY = Object.freeze({
  IN_STOCK: 'in-stock',
  LOW_STOCK: 'low-stock',
  OUT_OF_STOCK: 'out-of-stock',
});

const INVENTORY_MOVEMENT_TYPE = Object.freeze({
  RESTOCK: 'restock',
  SALE_OFFLINE: 'sale-offline',
  SALE_ONLINE: 'sale-online',
  ADJUSTMENT: 'adjustment',
  RETURN: 'return',
});

const NOTIFICATION_TYPE = Object.freeze({
  ORDER: 'order',
  PAYMENT: 'payment',
  STOCK: 'stock',
  SYSTEM: 'system',
});

const REPORT_CATEGORY = Object.freeze({
  SALES: 'sales',
  INVENTORY: 'inventory',
  PAYMENT: 'payment',
  CUSTOMER: 'customer',
  PRODUCT: 'product',
});

module.exports = {
  ROLES,
  ORDER_STATUS,
  ORDER_STATUS_FLOW,
  PAYMENT_STATUS,
  PAYMENT_METHOD,
  OFFLINE_PAYMENT_METHOD,
  PRODUCT_STATUS,
  STOCK_AVAILABILITY,
  INVENTORY_MOVEMENT_TYPE,
  NOTIFICATION_TYPE,
  REPORT_CATEGORY,
};
