const mongoose = require("mongoose");
const {
  PRODUCT_STATUS,
  STOCK_AVAILABILITY,
} = require("../config/constants");

const imageSchema = new mongoose.Schema(
  {
    data: {
      type: Buffer,
      required: true,
    },
    contentType: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      default: 0,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    description: {
      type: String,
      default: "",
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },

    brand: {
      type: String,
      default: "",
      trim: true,
    },

    supplier: {
      type: String,
      default: "",
      trim: true,
    },

    // Store images directly inside MongoDB
    images: {
      type: [imageSchema],
      default: [],
    },

    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    barcode: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },

    purchasePrice: {
      type: Number,
      required: true,
      min: 0,
    },

    sellingPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    discountPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    gstPercent: {
      type: Number,
      default: 0,
      min: 0,
    },

    openingStock: {
      type: Number,
      required: true,
      min: 0,
    },

    currentStock: {
      type: Number,
      required: true,
      min: 0,
      index: true,
    },

    minStock: {
      type: Number,
      default: 10,
    },

    maxStock: {
      type: Number,
      default: 500,
    },

    soldCount: {
      type: Number,
      default: 0,
      index: true,
    },

    ratingAverage: {
      type: Number,
      default: 0,
    },

    ratingCount: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: Object.values(PRODUCT_STATUS),
      default: PRODUCT_STATUS.ACTIVE,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  }
);

productSchema.virtual("availability").get(function () {
  if (this.currentStock <= 0) {
    return STOCK_AVAILABILITY.OUT_OF_STOCK;
  }

  if (this.currentStock <= this.minStock) {
    return STOCK_AVAILABILITY.LOW_STOCK;
  }

  return STOCK_AVAILABILITY.IN_STOCK;
});

productSchema.virtual("finalPrice").get(function () {
  const discount = (this.sellingPrice * this.discountPercent) / 100;
  return Math.round((this.sellingPrice - discount) * 100) / 100;
});

productSchema.index({
  category: 1,
  status: 1,
});

productSchema.index({
  name: "text",
  brand: "text",
});

module.exports = mongoose.model("Product", productSchema);