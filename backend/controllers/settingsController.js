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

/**
 * GET /api/shop-settings/logo
 */
const getShopLogo = asyncHandler(async (req, res) => {
  const result = await settingsService.getShopLogo();
  if (!result) {
    return res.status(404).json({ success: false, message: 'Shop settings not found' });
  }

  const { logoImage, logo } = result;

  if (logoImage && logoImage.data) {
    res.set('Content-Type', logoImage.contentType || 'image/png');
    res.set('Cache-Control', 'public, max-age=86400, must-revalidate');
    const buffer = Buffer.isBuffer(logoImage.data)
      ? logoImage.data
      : Buffer.from(logoImage.data.buffer || logoImage.data);
    return res.send(buffer);
  }

  if (logo && typeof logo === 'string' && logo.startsWith('data:')) {
    const matches = logo.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      res.set('Content-Type', matches[1]);
      res.set('Cache-Control', 'public, max-age=86400, must-revalidate');
      return res.send(Buffer.from(matches[2], 'base64'));
    }
  }

  return res.status(404).json({ success: false, message: 'Shop logo not found' });
});

module.exports = {
  getAdminProfile,
  updateAdminProfile,
  changeAdminPassword,
  getShopSettings,
  getShopLogo,
  updateShopSettings,
};
