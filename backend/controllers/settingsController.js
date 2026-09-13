const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const settingsService = require('../services/settingsService');

/**
 * GET /api/admin/profile
 */
const getAdminProfile = asyncHandler(async (req, res) => {
  const profile = await settingsService.getAdminProfile(req.user._id);
  success(res, 200, 'Admin profile retrieved successfully', { profile });
});

/**
 * PATCH or PUT /api/admin/profile
 */
const updateAdminProfile = asyncHandler(async (req, res) => {
  const profile = await settingsService.updateAdminProfile(req.user._id, req.body, req.file);
  success(res, 200, 'Profile updated successfully', { profile });
});

/**
 * POST /api/admin/profile/change-password
 */
const changeAdminPassword = asyncHandler(async (req, res) => {
  const result = await settingsService.changeAdminPassword(req.user._id, req.body);
  success(res, 200, 'Password changed successfully', result);
});

/**
 * GET /api/shop-settings
 */
const getShopSettings = asyncHandler(async (req, res) => {
  const settings = await settingsService.getShopSettings();
  success(res, 200, 'Shop settings retrieved successfully', { settings });
});

/**
 * PATCH or PUT /api/shop-settings
 */
const updateShopSettings = asyncHandler(async (req, res) => {
  const settings = await settingsService.updateShopSettings(req.body, req.file);
  success(res, 200, 'Shop information updated successfully', { settings });
});

module.exports = {
  getAdminProfile,
  updateAdminProfile,
  changeAdminPassword,
  getShopSettings,
  updateShopSettings,
};
