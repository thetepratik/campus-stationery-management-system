const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const ApiError = require('../utils/ApiError');
const Notification = require('../models/Notification');

/**
 * Get paginated notifications for authenticated user
 * Supports category tabs, unread count, and pagination
 */
const getNotifications = asyncHandler(async (req, res) => {
  const role = req.userRole;
  const userId = req.user._id;

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const skip = (page - 1) * limit;
  const { category, search } = req.query;

  // Build base recipient filter
  const baseFilter =
    role === 'admin'
      ? { recipientType: 'admin' }
      : { recipientType: 'student', recipient: userId };

  const query = { ...baseFilter };

  if (category && category !== 'all') {
    query.category = category;
  }

  if (search && search.trim()) {
    const s = search.trim();
    query.$or = [
      { title: { $regex: s, $options: 'i' } },
      { message: { $regex: s, $options: 'i' } },
    ];
  }

  // Fetch notifications and counts in parallel
  const [notifications, total, unreadCount, categoryCountsRaw] = await Promise.all([
    Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Notification.countDocuments(query),
    Notification.countDocuments({ ...baseFilter, isRead: false }),
    Notification.aggregate([
      { $match: baseFilter },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]),
  ]);

  const categoryCounts = { all: 0 };
  categoryCountsRaw.forEach((item) => {
    if (item._id) {
      categoryCounts[item._id] = item.count;
      categoryCounts.all += item.count;
    }
  });

  const totalPages = Math.ceil(total / limit) || 1;

  success(res, 200, 'Notifications fetched successfully', {
    notifications,
    unreadCount,
    categoryCounts,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  });
});

/**
 * Quick unread notification count for bells and badges
 */
const getUnreadCount = asyncHandler(async (req, res) => {
  const role = req.userRole;
  const userId = req.user._id;

  const baseFilter =
    role === 'admin'
      ? { recipientType: 'admin', isRead: false }
      : { recipientType: 'student', recipient: userId, isRead: false };

  const unreadCount = await Notification.countDocuments(baseFilter);

  success(res, 200, 'Unread count fetched', { unreadCount });
});

/**
 * Mark a single notification as read
 */
const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const role = req.userRole;
  const userId = req.user._id;

  const notification = await Notification.findById(id);
  if (!notification) {
    throw new ApiError(404, 'Notification not found');
  }

  // Security: check recipient ownership
  if (role === 'admin') {
    if (notification.recipientType !== 'admin') {
      throw new ApiError(403, 'Access denied to this notification');
    }
  } else {
    if (
      notification.recipientType !== 'student' ||
      !notification.recipient ||
      notification.recipient.toString() !== userId.toString()
    ) {
      throw new ApiError(403, 'Access denied to this notification');
    }
  }

  if (!notification.isRead) {
    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();
  }

  success(res, 200, 'Notification marked as read', { notification });
});

/**
 * Mark all notifications as read for current user
 */
const markAllAsRead = asyncHandler(async (req, res) => {
  const role = req.userRole;
  const userId = req.user._id;

  const baseFilter =
    role === 'admin'
      ? { recipientType: 'admin', isRead: false }
      : { recipientType: 'student', recipient: userId, isRead: false };

  const result = await Notification.updateMany(baseFilter, {
    $set: { isRead: true, readAt: new Date() },
  });

  success(res, 200, 'All notifications marked as read', {
    modifiedCount: result.modifiedCount,
  });
});

/**
 * Delete a single notification
 */
const deleteNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const role = req.userRole;
  const userId = req.user._id;

  const notification = await Notification.findById(id);
  if (!notification) {
    throw new ApiError(404, 'Notification not found');
  }

  // Security: verify ownership
  if (role === 'admin') {
    if (notification.recipientType !== 'admin') {
      throw new ApiError(403, 'Access denied to this notification');
    }
  } else {
    if (
      notification.recipientType !== 'student' ||
      !notification.recipient ||
      notification.recipient.toString() !== userId.toString()
    ) {
      throw new ApiError(403, 'Access denied to this notification');
    }
  }

  await Notification.findByIdAndDelete(id);

  success(res, 200, 'Notification deleted successfully');
});

/**
 * Clear notifications for current user
 */
const clearAllNotifications = asyncHandler(async (req, res) => {
  const role = req.userRole;
  const userId = req.user._id;

  const baseFilter =
    role === 'admin'
      ? { recipientType: 'admin' }
      : { recipientType: 'student', recipient: userId };

  // By default clear read notifications unless query specifies all
  const filter = req.query.all === 'true' ? baseFilter : { ...baseFilter, isRead: true };

  const result = await Notification.deleteMany(filter);

  success(res, 200, `${result.deletedCount} notification(s) cleared`, {
    deletedCount: result.deletedCount,
  });
});

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
};
