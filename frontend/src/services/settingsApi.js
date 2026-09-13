import api from './api';

export const settingsApi = {
  /**
   * Get current admin profile
   */
  getAdminProfile: async () => {
    return api.get('/admin/profile');
  },

  /**
   * Update current admin profile (supports FormData for multipart image upload or JSON object)
   */
  updateAdminProfile: async (data, file = null) => {
    if (file) {
      const formData = new FormData();
      if (data.name !== undefined) formData.append('name', data.name);
      if (data.email !== undefined) formData.append('email', data.email);
      if (data.phone !== undefined) formData.append('phone', data.phone);
      if (data.mobile !== undefined) formData.append('mobile', data.mobile);
      formData.append('image', file);
      return api.patch('/admin/profile', formData);
    }
    return api.patch('/admin/profile', data);
  },

  /**
   * Change admin password securely
   */
  changePassword: async ({ currentPassword, newPassword, confirmPassword }) => {
    return api.post('/admin/profile/change-password', {
      currentPassword,
      newPassword,
      confirmPassword,
    });
  },

  /**
   * Get singleton shop information
   */
  getShopInformation: async () => {
    return api.get('/shop-settings');
  },

  /**
   * Update shop information (supports FormData for multipart logo upload or JSON object)
   */
  updateShopInformation: async (data, file = null) => {
    if (file) {
      const formData = new FormData();
      Object.keys(data).forEach((key) => {
        if (data[key] !== undefined && data[key] !== null) {
          formData.append(key, data[key]);
        }
      });
      formData.append('image', file);
      return api.patch('/shop-settings', formData);
    }
    return api.patch('/shop-settings', data);
  },
};

export default settingsApi;
