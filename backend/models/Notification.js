const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipientType: {
      type: String,
      enum: ['admin', 'student'],
      required: true,
      index: true,
    },
    recipientRole: {
      type: String,
      enum: ['admin', 'student'],
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      index: true,
      default: null,
    },
    type: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['orders', 'payments', 'inventory', 'system', 'offers'],
      default: 'system',
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'critical'],
      default: 'normal',
    },
    relatedEntity: {
      type: String,
      default: '',
    },
    relatedEntityId: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    link: {
      type: String,
      default: '',
      trim: true,
    },
    actionUrl: {
      type: String,
      default: '',
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Pre-save hook to keep link & actionUrl, and recipientType & recipientRole in sync
notificationSchema.pre('save', function (next) {
  if (!this.actionUrl && this.link) {
    this.actionUrl = this.link;
  }
  if (!this.link && this.actionUrl) {
    this.link = this.actionUrl;
  }
  if (!this.recipientRole && this.recipientType) {
    this.recipientRole = this.recipientType;
  }
  if (!this.recipientType && this.recipientRole) {
    this.recipientType = this.recipientRole;
  }
  next();
});

// Indexes for high performance querying and filtering
notificationSchema.index({ recipientType: 1, recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipientType: 1, recipient: 1, category: 1, createdAt: -1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);

