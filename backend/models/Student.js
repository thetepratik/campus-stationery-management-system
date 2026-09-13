// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');
// const crypto = require('crypto');

// const addressSchema = new mongoose.Schema(
//   {
//     label: { type: String, default: 'Hostel' },
//     line1: { type: String },
//     hostel: { type: String },
//     room: { type: String },
//     isDefault: { type: Boolean, default: false },
//   },
//   { _id: true }
// );

// const studentSchema = new mongoose.Schema(
//   {
//     name: { type: String, required: [true, 'Name is required'], trim: true },
//     email: {
//       type: String,
//       required: [true, 'Email is required'],
//       unique: true,
//       lowercase: true,
//       trim: true,
//       match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
//     },
//     password: { type: String, required: [true, 'Password is required'], minlength: 6, select: false },
//     rollNumber: { type: String, required: [true, 'Roll number is required'], unique: true, uppercase: true, trim: true },
//     department: { type: String, default: '' },
//     mobile: { type: String, default: '' },
//     avatar: { type: String, default: '' },
//     addresses: [addressSchema],
//     isVerified: { type: Boolean, default: false },
//     otp: { type: String, select: false },
//     otpExpires: { type: Date, select: false },
//     resetPasswordToken: { type: String, select: false },
//     resetPasswordExpires: { type: Date, select: false },
//   },
//   { timestamps: true }
// );

// studentSchema.pre('save', async function (next) {
//   if (!this.isModified('password')) return next();
//   const salt = await bcrypt.genSalt(12);
//   this.password = await bcrypt.hash(this.password, salt);
//   next();
// });

// studentSchema.methods.comparePassword = async function (candidatePassword) {
//   return bcrypt.compare(candidatePassword, this.password);
// };

// // 6-digit OTP, stored hashed, 10 min expiry
// studentSchema.methods.generateOtp = function () {
//   const otp = Math.floor(100000 + Math.random() * 900000).toString();
//   this.otp = crypto.createHash('sha256').update(otp).digest('hex');
//   this.otpExpires = Date.now() + 10 * 60 * 1000;
//   return otp;
// };

// studentSchema.methods.verifyOtp = function (candidateOtp) {
//   if (!this.otp || !this.otpExpires) return false;
//   if (this.otpExpires < Date.now()) return false;
//   const hashed = crypto.createHash('sha256').update(candidateOtp).digest('hex');
//   return hashed === this.otp;
// };

// studentSchema.methods.generatePasswordResetToken = function () {
//   const resetToken = crypto.randomBytes(32).toString('hex');
//   this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
//   this.resetPasswordExpires = Date.now() + 30 * 60 * 1000;
//   return resetToken;
// };

// studentSchema.methods.toSafeObject = function () {
//   return {
//     id: this._id,
//     name: this.name,
//     email: this.email,
//     rollNumber: this.rollNumber,
//     department: this.department,
//     mobile: this.mobile,
//     avatar: this.avatar,
//     isVerified: this.isVerified,
//     role: 'student',
//   };
// };

// module.exports = mongoose.model('Student', studentSchema);

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

/* =========================================================
   ADDRESS SCHEMA
========================================================= */

const addressSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      default: 'Hostel',
      trim: true,
    },

    line1: {
      type: String,
      default: '',
      trim: true,
    },

    hostel: {
      type: String,
      default: '',
      trim: true,
    },

    room: {
      type: String,
      default: '',
      trim: true,
    },

    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: true,
  }
);


/* =========================================================
   STUDENT SCHEMA
========================================================= */

const studentSchema = new mongoose.Schema(
  {
    /* -----------------------------------------
       PERSONAL INFORMATION
    ----------------------------------------- */

    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\S+@\S+\.\S+$/,
        'Please enter a valid email',
      ],
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },


    /* -----------------------------------------
       ACADEMIC INFORMATION
    ----------------------------------------- */

    rollNumber: {
      type: String,
      required: [true, 'Roll number is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },

    department: {
      type: String,
      default: '',
      trim: true,
    },


    /* -----------------------------------------
       CONTACT INFORMATION
    ----------------------------------------- */

    mobile: {
      type: String,
      default: '',
      trim: true,
    },


    /* -----------------------------------------
       PROFILE IMAGE
    ----------------------------------------- */

    avatar: {
      type: String,
      default: '',
      trim: true,
    },


    /* -----------------------------------------
       ADDRESSES
    ----------------------------------------- */

    addresses: {
      type: [addressSchema],
      default: [],
    },


    /* -----------------------------------------
       ACCOUNT STATUS
    ----------------------------------------- */

    isVerified: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ['active', 'inactive', 'blocked'],
      default: 'active',
      index: true,
    },


    /* -----------------------------------------
       OTP
    ----------------------------------------- */

    otp: {
      type: String,
      select: false,
    },

    otpExpires: {
      type: Date,
      select: false,
    },


    /* -----------------------------------------
       PASSWORD RESET
    ----------------------------------------- */

    resetPasswordToken: {
      type: String,
      select: false,
    },

    resetPasswordExpires: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);


/* =========================================================
   PASSWORD HASHING
========================================================= */

studentSchema.pre(
  'save',
  async function (next) {
    if (!this.isModified('password')) {
      return next();
    }

    const salt = await bcrypt.genSalt(12);

    this.password = await bcrypt.hash(
      this.password,
      salt
    );

    next();
  }
);


/* =========================================================
   PASSWORD COMPARISON
========================================================= */

studentSchema.methods.comparePassword =
  async function (candidatePassword) {
    return bcrypt.compare(
      candidatePassword,
      this.password
    );
  };


/* =========================================================
   OTP GENERATION
========================================================= */

studentSchema.methods.generateOtp =
  function () {
    const otp = Math.floor(
      100000 +
        Math.random() * 900000
    ).toString();

    this.otp = crypto
      .createHash('sha256')
      .update(otp)
      .digest('hex');

    this.otpExpires =
      Date.now() + 10 * 60 * 1000;

    return otp;
  };


/* =========================================================
   OTP VERIFICATION
========================================================= */

studentSchema.methods.verifyOtp =
  function (candidateOtp) {
    if (
      !this.otp ||
      !this.otpExpires
    ) {
      return false;
    }

    if (
      this.otpExpires < Date.now()
    ) {
      return false;
    }

    const hashed = crypto
      .createHash('sha256')
      .update(candidateOtp)
      .digest('hex');

    return hashed === this.otp;
  };


/* =========================================================
   PASSWORD RESET TOKEN
========================================================= */

studentSchema.methods.generatePasswordResetToken =
  function () {
    const resetToken =
      crypto.randomBytes(32).toString('hex');

    this.resetPasswordToken =
      crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    this.resetPasswordExpires =
      Date.now() + 30 * 60 * 1000;

    return resetToken;
  };


/* =========================================================
   SAFE STUDENT OBJECT
========================================================= */

/**
 * This object is returned to the frontend.
 *
 * Sensitive fields such as:
 * - password
 * - otp
 * - resetPasswordToken
 *
 * are intentionally NOT returned.
 */

studentSchema.methods.toSafeObject =
  function () {
    return {
      id: this._id,

      name: this.name,

      email: this.email,

      rollNumber: this.rollNumber,

      department: this.department,

      mobile: this.mobile,

      avatar: this.avatar,

      addresses: this.addresses || [],

      isVerified: this.isVerified,

      status: this.status || 'active',

      createdAt: this.createdAt,

      updatedAt: this.updatedAt,

      role: 'student',
    };
  };

studentSchema.index({ department: 1 });
studentSchema.index({ createdAt: -1 });

/* =========================================================
   EXPORT
========================================================= */

module.exports =
  mongoose.model(
    'Student',
    studentSchema
  );