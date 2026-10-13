const mongoose = require('mongoose');

const shopSettingsSchema = new mongoose.Schema(
  {
    shopName: {
      type: String,
      required: [true, 'Shop name is required'],
      trim: true,
      default: 'Campus Stationery Shop',
    },
    tagline: {
      type: String,
      trim: true,
      default: 'Your Stationery, Your Priority',
    },
    description: {
      type: String,
      trim: true,
      default: 'Your one-stop campus supply shop for notebooks, pens, calculators, and study essentials.',
    },
    collegeName: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      trim: true,
      default: '',
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    logo: {
      type: String,
      default: '',
    },
    logoImage: {
      data: { type: Buffer },
      contentType: { type: String },
      fileName: { type: String },
      size: { type: Number, default: 0 },
      uploadedAt: { type: Date },
    },
    openingTime: {
      type: String,
      trim: true,
      default: '09:00',
    },
    closingTime: {
      type: String,
      trim: true,
      default: '18:00',
    },
    weeklyHoliday: {
      type: String,
      enum: [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday',
        'None',
        '',
      ],
      default: 'Sunday',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ShopSettings', shopSettingsSchema);
