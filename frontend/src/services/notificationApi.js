import api from './api';

export const notificationApi = {
  /**
   * Get paginated notifications with optional category and search filters
   */
  getNotifications: async ({ category = 'all', page = 1, limit = 20, search = '' } = {}) => {
    const params = new URLSearchParams();
    if (category && category !== 'all') params.append('category', category);
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    if (search) params.append('search', search);

    const query = params.toString() ? `?${params.toString()}` : '';
    return api.get(`/notifications${query}`);
  },

  /**
   * Get unread notification count
   */
  getUnreadCount: async () => {
    return api.get('/notifications/unread-count');
  },

  /**
   * Mark a single notification as read
   */
  markAsRead: async (id) => {
    return api.patch(`/notifications/${id}/read`);
  },

  /**
   * Mark all notifications as read for current user
   */
  markAllAsRead: async () => {
    return api.patch('/notifications/read-all');
  },

  /**
   * Delete a notification
   */
  deleteNotification: async (id) => {
    return api.delete(`/notifications/${id}`);
  },

  /**
   * Clear notifications (read by default, or all if all=true)
   */
  clearAll: async (all = false) => {
    return api.delete(`/notifications${all ? '?all=true' : ''}`);
  },
};
