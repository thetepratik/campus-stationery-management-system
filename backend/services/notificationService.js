const Notification = require('../models/Notification');

/**
 * Maps raw event types to appropriate category if omitted
 */
const inferCategory = (type = '') => {
  const t = String(type).toLowerCase();
  if (t.includes('order')) return 'orders';
  if (t.includes('payment') || t.includes('refund')) return 'payments';
  if (t.includes('stock') || t.includes('inventory') || t.includes('product') || t.includes('restock')) return 'inventory';
  if (t.includes('offer') || t.includes('coupon') || t.includes('discount')) return 'offers';
  return 'system';
};

/**
 * Maps raw event types to appropriate priority if omitted
 */
const inferPriority = (type = '') => {
  const t = String(type).toUpperCase();
  if (t.includes('OUT_OF_STOCK') || t.includes('PAYMENT_FAIL') || t.includes('CRITICAL')) {
    return 'critical';
  }
  if (
    t.includes('ORDER_READY') ||
    t.includes('READY_FOR_PICKUP') ||
    t.includes('NEW_ORDER') ||
    t.includes('PAYMENT_SUCCESS') ||
    t.includes('LOW_STOCK') ||
    t.includes('REFUND')
  ) {
    return 'high';
  }
  return 'normal';
};

/**
 * Central notification creation service with duplicate prevention and Socket.IO emission
 */
const createNotification = async ({
  recipientType = 'admin',
  recipientRole = null,
  recipient = null,
  type = 'system',
  title = '',
  message = '',
  category = null,
  priority = null,
  relatedEntity = '',
  relatedEntityId = null,
  actionUrl = '',
  link = '',
  io = null,
}) => {
  const targetRecipientType = recipientRole || recipientType;
  const targetCategory = category || inferCategory(type);
  const targetPriority = priority || inferPriority(type);
  const targetUrl = actionUrl || link || '';

  // Duplicate prevention: check for identical event within last 2 minutes
  if (relatedEntityId) {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    const existing = await Notification.findOne({
      recipientType: targetRecipientType,
      recipient: recipient || null,
      type,
      relatedEntityId,
      createdAt: { $gte: twoMinutesAgo },
    });

    if (existing) {
      return existing;
    }
  }

  const notification = await Notification.create({
    recipientType: targetRecipientType,
    recipientRole: targetRecipientType,
    recipient: recipient || null,
    type,
    title,
    message,
    category: targetCategory,
    priority: targetPriority,
    relatedEntity,
    relatedEntityId,
    link: targetUrl,
    actionUrl: targetUrl,
    isRead: false,
    readAt: null,
  });

  const payload = {
    _id: notification._id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    category: notification.category,
    priority: notification.priority,
    relatedEntity: notification.relatedEntity,
    relatedEntityId: notification.relatedEntityId,
    actionUrl: notification.actionUrl,
    link: notification.link,
    isRead: false,
    createdAt: notification.createdAt,
  };

  if (io) {
    try {
      if (targetRecipientType === 'admin') {
        io.to('admin-room').emit('notification:new', payload);
      } else if (recipient) {
        io.to(`student-${recipient}`).emit('notification:new', payload);
      }
    } catch (err) {
      console.error('[NotificationService] Socket emission error:', err.message);
    }
  }

  return notification;
};

/**
 * Creates an admin notification and pushes to admin-room
 */
const notifyAdmin = async (io, params) => {
  return createNotification({
    ...params,
    recipientType: 'admin',
    io,
  });
};

/**
 * Creates a student notification and pushes to specific student room
 */
const notifyStudent = async (io, studentId, params) => {
  return createNotification({
    ...params,
    recipientType: 'student',
    recipient: studentId,
    io,
  });
};

module.exports = {
  createNotification,
  notifyAdmin,
  notifyStudent,
};

