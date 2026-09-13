const crypto = require('crypto');

const Admin = require('../models/Admin');
const Student = require('../models/Student');

const ApiError = require('../utils/ApiError');

const {
  sendEmail,
  otpEmailTemplate,
  resetPasswordEmailTemplate,
} = require('./emailService');


/* =========================================================
   ADMIN
========================================================= */


/**
 * Admin Login
 */
const adminLogin = async (email, password) => {
  const admin = await Admin.findOne({ email }).select('+password');

  if (!admin || !(await admin.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  admin.lastLoginAt = new Date();

  await admin.save({
    validateBeforeSave: false,
  });

  return admin;
};


/**
 * Admin Forgot Password
 */
const adminForgotPassword = async (email) => {
  const admin = await Admin.findOne({ email });

  // Do not reveal whether the account exists.
  if (!admin) {
    return;
  }

  const resetToken = admin.generatePasswordResetToken();

  await admin.save({
    validateBeforeSave: false,
  });

  const resetUrl =
    `${process.env.CLIENT_URL}/admin/reset-password/${resetToken}`;

  await sendEmail({
    to: admin.email,
    subject: 'Reset your Campus Stationery admin password',
    html: resetPasswordEmailTemplate(
      admin.name,
      resetUrl
    ),
  });
};


/**
 * Admin Reset Password
 */
const adminResetPassword = async (token, newPassword) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const admin = await Admin.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: {
      $gt: Date.now(),
    },
  }).select(
    '+resetPasswordToken +resetPasswordExpires'
  );

  if (!admin) {
    throw new ApiError(
      400,
      'Reset token is invalid or has expired'
    );
  }

  admin.password = newPassword;
  admin.resetPasswordToken = undefined;
  admin.resetPasswordExpires = undefined;

  await admin.save();

  return admin;
};


/**
 * Admin Change Password
 */
const adminChangePassword = async (
  adminId,
  currentPassword,
  newPassword
) => {
  const admin = await Admin.findById(adminId)
    .select('+password');

  if (!admin) {
    throw new ApiError(404, 'Admin not found');
  }

  const matches =
    await admin.comparePassword(currentPassword);

  if (!matches) {
    throw new ApiError(
      401,
      'Current password is incorrect'
    );
  }

  admin.password = newPassword;

  await admin.save();

  return admin;
};


/* =========================================================
   STUDENT REGISTRATION
========================================================= */


/**
 * Student Registration
 *
 * Creates a student account and sends OTP.
 */
const studentRegister = async ({
  name,
  email,
  password,
  rollNumber,
  department,
  mobile,
}) => {
  const normalizedEmail =
    String(email || '').trim().toLowerCase();

  const normalizedRollNumber =
    String(rollNumber || '').trim().toUpperCase();

  const existing = await Student.findOne({
    $or: [
      {
        email: normalizedEmail,
      },
      {
        rollNumber: normalizedRollNumber,
      },
    ],
  });

  if (existing) {
    throw new ApiError(
      409,
      'A student with this email or roll number already exists'
    );
  }

  const student = new Student({
    name: String(name || '').trim(),
    email: normalizedEmail,
    password,
    rollNumber: normalizedRollNumber,
    department: department || '',
    mobile: mobile || '',
  });

  const otp = student.generateOtp();

  await student.save();

  await sendEmail({
    to: student.email,
    subject: 'Verify your Campus Stationery account',
    html: otpEmailTemplate(
      student.name,
      otp
    ),
  });

  return student;
};


/* =========================================================
   STUDENT OTP
========================================================= */


/**
 * Verify Student OTP
 */
const studentVerifyOtp = async (
  email,
  otp
) => {
  const normalizedEmail =
    String(email || '').trim().toLowerCase();

  const student = await Student.findOne({
    email: normalizedEmail,
  }).select('+otp +otpExpires');

  if (!student) {
    throw new ApiError(
      404,
      'Student not found'
    );
  }

  if (student.isVerified) {
    throw new ApiError(
      400,
      'Account is already verified'
    );
  }

  if (!student.verifyOtp(otp)) {
    throw new ApiError(
      400,
      'OTP is invalid or has expired'
    );
  }

  student.isVerified = true;
  student.otp = undefined;
  student.otpExpires = undefined;

  await student.save();

  return student;
};


/**
 * Resend Student OTP
 */
const studentResendOtp = async (email) => {
  const normalizedEmail =
    String(email || '').trim().toLowerCase();

  const student = await Student.findOne({
    email: normalizedEmail,
  });

  if (!student) {
    throw new ApiError(
      404,
      'Student not found'
    );
  }

  if (student.isVerified) {
    throw new ApiError(
      400,
      'Account is already verified'
    );
  }

  const otp = student.generateOtp();

  await student.save();

  await sendEmail({
    to: student.email,
    subject: 'Your new Campus Stationery OTP',
    html: otpEmailTemplate(
      student.name,
      otp
    ),
  });
};


/* =========================================================
   STUDENT LOGIN
========================================================= */


/**
 * Student Login
 */
const studentLogin = async (
  email,
  password
) => {
  const normalizedEmail =
    String(email || '').trim().toLowerCase();

  const student = await Student.findOne({
    email: normalizedEmail,
  }).select('+password');

  if (
    !student ||
    !(await student.comparePassword(password))
  ) {
    throw new ApiError(
      401,
      'Invalid email or password'
    );
  }

  if (!student.isVerified) {
    throw new ApiError(
      403,
      'Please verify your account with the OTP sent to your email before logging in'
    );
  }

  if (student.status === 'blocked') {
    throw new ApiError(
      403,
      'Your account has been temporarily restricted. Please contact shop administration.'
    );
  }

  return student;
};


/* =========================================================
   STUDENT PROFILE
========================================================= */


/**
 * Get Student Profile
 *
 * This is optional because your /student/me route already
 * returns the authenticated student.
 */
const getStudentProfile = async (studentId) => {
  const student = await Student.findById(studentId);

  if (!student) {
    throw new ApiError(
      404,
      'Student not found'
    );
  }

  return student;
};


/**
 * Update Student Profile
 *
 * Editable fields:
 * - name
 * - department
 * - mobile
 * - avatar
 * - addresses
 *
 * Protected fields:
 * - email
 * - rollNumber
 * - password
 * - isVerified
 * - OTP fields
 * - reset password fields
 */
const studentUpdateProfile = async (
  studentId,
  data
) => {
  const student = await Student.findById(studentId);

  if (!student) {
    throw new ApiError(
      404,
      'Student not found'
    );
  }


  /* ---------------------------------------------------------
     BASIC PROFILE INFORMATION
  --------------------------------------------------------- */

  if (data.name !== undefined) {
    const name = String(data.name).trim();

    if (!name) {
      throw new ApiError(
        400,
        'Name cannot be empty'
      );
    }

    student.name = name;
  }


  if (data.department !== undefined) {
    student.department =
      String(data.department || '').trim();
  }


  if (data.mobile !== undefined) {
    student.mobile =
      String(data.mobile || '').trim();
  }


  if (data.avatar !== undefined) {
    student.avatar =
      String(data.avatar || '').trim();
  }


  /* ---------------------------------------------------------
     ADDRESSES
  --------------------------------------------------------- */

  if (data.addresses !== undefined) {
    let addresses = data.addresses;

    /*
     * Because the frontend may send JSON inside a
     * multipart/form-data request, support both:
     *
     * [
     *   {...}
     * ]
     *
     * and
     *
     * "[{...}]"
     */
    if (typeof addresses === 'string') {
      try {
        addresses = JSON.parse(addresses);
      } catch (error) {
        throw new ApiError(
          400,
          'Invalid addresses format'
        );
      }
    }

    if (!Array.isArray(addresses)) {
      throw new ApiError(
        400,
        'Addresses must be an array'
      );
    }


    /*
     * Limit address count to prevent accidental
     * excessive data.
     */
    if (addresses.length > 10) {
      throw new ApiError(
        400,
        'You can save a maximum of 10 addresses'
      );
    }


    const cleanedAddresses = addresses.map(
      (address) => ({
        label:
          String(
            address?.label || 'Hostel'
          ).trim(),

        line1:
          String(
            address?.line1 || ''
          ).trim(),

        hostel:
          String(
            address?.hostel || ''
          ).trim(),

        room:
          String(
            address?.room || ''
          ).trim(),

        isDefault:
          Boolean(address?.isDefault),
      })
    );


    /*
     * Make sure only ONE address is default.
     */
    let defaultFound = false;

    cleanedAddresses.forEach(
      (address) => {
        if (address.isDefault) {
          if (!defaultFound) {
            defaultFound = true;
          } else {
            address.isDefault = false;
          }
        }
      }
    );


    /*
     * If there is no default address but addresses exist,
     * make the first address default.
     */
    if (
      cleanedAddresses.length > 0 &&
      !defaultFound
    ) {
      cleanedAddresses[0].isDefault = true;
    }


    student.addresses = cleanedAddresses;
  }


  /* ---------------------------------------------------------
     SAVE
  --------------------------------------------------------- */

  await student.save();

  return student;
};


/* =========================================================
   STUDENT FORGOT PASSWORD
========================================================= */


/**
 * Student Forgot Password
 */
const studentForgotPassword = async (
  email
) => {
  const normalizedEmail =
    String(email || '').trim().toLowerCase();

  const student = await Student.findOne({
    email: normalizedEmail,
  });

  /*
   * Do not reveal whether the email exists.
   */
  if (!student) {
    return;
  }

  const resetToken =
    student.generatePasswordResetToken();

  await student.save({
    validateBeforeSave: false,
  });

  const resetUrl =
    `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  await sendEmail({
    to: student.email,
    subject: 'Reset your Campus Stationery password',
    html: resetPasswordEmailTemplate(
      student.name,
      resetUrl
    ),
  });
};


/**
 * Student Reset Password
 */
const studentResetPassword = async (
  token,
  newPassword
) => {
  const hashedToken =
    crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

  const student =
    await Student.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: {
        $gt: Date.now(),
      },
    }).select(
      '+resetPasswordToken +resetPasswordExpires'
    );

  if (!student) {
    throw new ApiError(
      400,
      'Reset token is invalid or has expired'
    );
  }

  student.password = newPassword;

  student.resetPasswordToken = undefined;
  student.resetPasswordExpires = undefined;

  await student.save();

  return student;
};


/* =========================================================
   EXPORTS
========================================================= */

module.exports = {

  /* Admin */
  adminLogin,
  adminForgotPassword,
  adminResetPassword,
  adminChangePassword,

  /* Student */
  studentRegister,
  studentVerifyOtp,
  studentResendOtp,
  studentLogin,

  /* Student Profile */
  getStudentProfile,
  studentUpdateProfile,

  /* Student Password */
  studentForgotPassword,
  studentResetPassword,
};