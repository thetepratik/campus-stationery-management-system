const Admin = require('../models/Admin');
const ShopSettings = require('../models/ShopSettings');
const ApiError = require('../utils/ApiError');
const authService = require('./authService');
const { toBase64DataUrl } = require('../utils/imageUtils');

/**
 * Get current admin profile
 */
const getAdminProfile = async (adminId) => {
  const admin = await Admin.findById(adminId);
  if (!admin) {
    throw new ApiError(404, 'Admin not found');
  }
  return admin.toSafeObject();
};

/**
 * Update current admin profile (name, email, phone/mobile, avatar/profileImage)
 */
const updateAdminProfile = async (adminId, data = {}, file = null) => {
  const admin = await Admin.findById(adminId);
  if (!admin) {
    throw new ApiError(404, 'Admin not found');
  }

  // Update Name
  if (data.name !== undefined) {
    const name = String(data.name).trim();
    if (!name) {
      throw new ApiError(400, 'Admin name cannot be empty');
    }
    admin.name = name;
  }

  // Update Email
  if (data.email !== undefined) {
    const email = String(data.email).trim().toLowerCase();
    if (!email) {
      throw new ApiError(400, 'Email address cannot be empty');
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      throw new ApiError(400, 'Please enter a valid email address');
    }

    if (email !== admin.email) {
      const existing = await Admin.findOne({ email, _id: { $ne: adminId } });
      if (existing) {
        throw new ApiError(409, 'Email address is already in use');
      }
      admin.email = email;
    }
  }

  // Update Phone / Mobile
  const phone = data.phone !== undefined ? data.phone : data.mobile;
  if (phone !== undefined) {
    const trimmedPhone = String(phone || '').trim();
    if (trimmedPhone && !/^[0-9+\s\-]{7,15}$/.test(trimmedPhone)) {
      throw new ApiError(400, 'Please enter a valid phone number');
    }
    admin.mobile = trimmedPhone;
  }

  // Update Profile Image / Avatar
  if (file && file.buffer) {
    admin.avatar = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
  } else if (data.avatar !== undefined || data.profileImage !== undefined) {
    const newAvatar = data.avatar !== undefined ? data.avatar : data.profileImage;
    admin.avatar = String(newAvatar || '').trim();
  }

  await admin.save();
  return admin.toSafeObject();
};

/**
 * Change admin password securely
 */
const changeAdminPassword = async (adminId, { currentPassword, newPassword, confirmPassword }) => {
  if (!currentPassword) {
    throw new ApiError(400, 'Current password is required');
  }
  if (!newPassword) {
    throw new ApiError(400, 'New password is required');
  }
  if (newPassword.length < 6) {
    throw new ApiError(400, 'New password must be at least 6 characters');
  }
  if (confirmPassword !== undefined && newPassword !== confirmPassword) {
    throw new ApiError(400, 'Passwords do not match');
  }

  await authService.adminChangePassword(adminId, currentPassword, newPassword);
  return { message: 'Password changed successfully' };
};

/**
 * Get singleton ShopSettings document (or create default if none exists)
 */
const getShopSettings = async () => {
  let settings = await ShopSettings.findOne();
  if (!settings) {
    settings = await ShopSettings.create({
      shopName: 'Campus Stationery Shop',
      collegeName: 'Vishwakarma Institute of Technology',
      address: 'College Campus, Pune, Maharashtra',
      phone: '9876543210',
      email: 'stationery@college.edu',
      openingTime: '09:00',
      closingTime: '18:00',
      weeklyHoliday: 'Sunday',
    });
  }
  return settings;
};

/**
 * Update singleton ShopSettings document
 */
const updateShopSettings = async (data = {}, file = null) => {
  let settings = await ShopSettings.findOne();
  if (!settings) {
    settings = new ShopSettings();
  }

  // Shop Name (Required)
  if (data.shopName !== undefined) {
    const shopName = String(data.shopName).trim();
    if (!shopName) {
      throw new ApiError(400, 'Shop name is required');
    }
    settings.shopName = shopName;
  }

  // College Name
  if (data.collegeName !== undefined) {
    settings.collegeName = String(data.collegeName || '').trim();
  }

  // Address
  if (data.address !== undefined) {
    settings.address = String(data.address || '').trim();
  }

  // Phone
  if (data.phone !== undefined) {
    const phone = String(data.phone || '').trim();
    if (phone && !/^[0-9+\s\-]{7,15}$/.test(phone)) {
      throw new ApiError(400, 'Please enter a valid shop phone number');
    }
    settings.phone = phone;
  }

  // Email
  if (data.email !== undefined) {
    const email = String(data.email || '').trim().toLowerCase();
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      throw new ApiError(400, 'Please enter a valid shop email address');
    }
    settings.email = email;
  }

  // Opening & Closing Times
  if (data.openingTime !== undefined) {
    settings.openingTime = String(data.openingTime || '').trim();
  }
  if (data.closingTime !== undefined) {
    settings.closingTime = String(data.closingTime || '').trim();
  }

  // Weekly Holiday
  if (data.weeklyHoliday !== undefined) {
    settings.weeklyHoliday = String(data.weeklyHoliday || '').trim();
  }

  // Shop Logo
  if (file && file.buffer) {
    settings.logo = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
  } else if (data.logo !== undefined || data.shopLogo !== undefined) {
    const newLogo = data.logo !== undefined ? data.logo : data.shopLogo;
    settings.logo = String(newLogo || '').trim();
  }

  await settings.save();
  return settings;
};

module.exports = {
  getAdminProfile,
  updateAdminProfile,
  changeAdminPassword,
  getShopSettings,
  updateShopSettings,
};
