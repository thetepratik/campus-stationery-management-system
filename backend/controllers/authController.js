const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const {
  generateTokenAndSetCookie,
  clearAuthCookie,
} = require('../utils/generateToken');
const authService = require('../services/authService');
const ApiError = require('../utils/ApiError');
const { notifyAdmin } = require('../services/notificationService');

/* =========================================================
   ADMIN
========================================================= */

/**
 * Admin Login
 */
const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const admin = await authService.adminLogin(
    email,
    password
  );

  generateTokenAndSetCookie(
    res,
    admin._id,
    'admin'
  );

  success(
    res,
    200,
    'Login successful',
    {
      admin: admin.toSafeObject(),
    }
  );
});


/**
 * Admin Logout
 */
const adminLogout = asyncHandler(async (req, res) => {
  clearAuthCookie(res, 'admin');

  success(
    res,
    200,
    'Logged out successfully'
  );
});


/**
 * Get Current Admin
 */
const adminMe = asyncHandler(async (req, res) => {
  success(
    res,
    200,
    'Current admin fetched',
    {
      admin: req.user.toSafeObject(),
    }
  );
});


/**
 * Admin Forgot Password
 */
const adminForgotPassword = asyncHandler(async (req, res) => {
  await authService.adminForgotPassword(
    req.body.email
  );

  success(
    res,
    200,
    'If an account exists with that email, a reset link has been sent.'
  );
});


/**
 * Admin Reset Password
 */
const adminResetPassword = asyncHandler(async (req, res) => {
  const {
    token,
    password,
  } = req.body;

  await authService.adminResetPassword(
    token,
    password
  );

  success(
    res,
    200,
    'Password has been reset successfully. Please log in.'
  );
});


/**
 * Admin Change Password
 */
const adminChangePassword = asyncHandler(async (req, res) => {
  const {
    currentPassword,
    newPassword,
  } = req.body;

  await authService.adminChangePassword(
    req.user._id,
    currentPassword,
    newPassword
  );

  success(
    res,
    200,
    'Password changed successfully'
  );
});


/* =========================================================
   STUDENT
========================================================= */

/**
 * Student Registration
 */
const studentRegister = asyncHandler(async (req, res) => {
  const student =
    await authService.studentRegister(
      req.body
    );

  success(
    res,
    201,
    'Registration successful. Please verify the OTP sent to your email.',
    {
      email: student.email,
    }
  );
});


/**
 * Student OTP Verification
 */
const studentVerifyOtp = asyncHandler(async (req, res) => {
  const {
    email,
    otp,
  } = req.body;

  const student =
    await authService.studentVerifyOtp(
      email,
      otp
    );

  generateTokenAndSetCookie(
    res,
    student._id,
    'student'
  );

  const io = req.app.get('io');
  try {
    await notifyAdmin(io, {
      type: 'NEW_STUDENT',
      category: 'system',
      priority: 'normal',
      relatedEntity: 'User',
      relatedEntityId: student._id,
      title: '👤 New Student Registered',
      message: `New student ${student.name} has registered.`,
      actionUrl: '/admin/customers',
    });
  } catch (notifErr) {
    console.error('[Auth] New student notification failed:', notifErr.message);
  }

  success(
    res,
    200,
    'Account verified successfully',
    {
      student:
        student.toSafeObject(),
    }
  );
});


/**
 * Resend Student OTP
 */
const studentResendOtp = asyncHandler(async (req, res) => {
  await authService.studentResendOtp(
    req.body.email
  );

  success(
    res,
    200,
    'A new OTP has been sent to your email'
  );
});


/**
 * Student Login
 */
const studentLogin = asyncHandler(async (req, res) => {
  const {
    email,
    password,
  } = req.body;

  const student =
    await authService.studentLogin(
      email,
      password
    );

  generateTokenAndSetCookie(
    res,
    student._id,
    'student'
  );

  success(
    res,
    200,
    'Login successful',
    {
      student:
        student.toSafeObject(),
    }
  );
});


/**
 * Student Logout
 */
const studentLogout = asyncHandler(async (req, res) => {
  clearAuthCookie(
    res,
    'student'
  );

  success(
    res,
    200,
    'Logged out successfully'
  );
});


/**
 * Get Current Student
 */
const studentMe = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(
      401,
      'Authenticated student not found.'
    );
  }

  success(
    res,
    200,
    'Current student fetched',
    {
      student:
        req.user.toSafeObject(),
    }
  );
});


/* =========================================================
   STUDENT PROFILE
========================================================= */

/**
 * Update Student Profile
 *
 * Editable fields:
 * - name
 * - mobile
 * - department
 * - avatar
 * - addresses
 *
 * Email and Roll Number are intentionally NOT updated here.
 */
const studentUpdateProfile = asyncHandler(
  async (req, res) => {

    if (
      !req.user ||
      !req.user._id
    ) {
      throw new ApiError(
        401,
        'Authenticated student not found.'
      );
    }

    const student =
      await authService.studentUpdateProfile(
        req.user._id,
        req.body
      );

    success(
      res,
      200,
      'Profile updated successfully',
      {
        student:
          student.toSafeObject(),
      }
    );
  }
);


/* =========================================================
   STUDENT PASSWORD
========================================================= */

/**
 * Student Forgot Password
 */
const studentForgotPassword = asyncHandler(
  async (req, res) => {

    await authService.studentForgotPassword(
      req.body.email
    );

    success(
      res,
      200,
      'If an account exists with that email, a reset link has been sent.'
    );
  }
);


/**
 * Student Reset Password
 */
const studentResetPassword = asyncHandler(
  async (req, res) => {

    const {
      token,
      password,
    } = req.body;

    await authService.studentResetPassword(
      token,
      password
    );

    success(
      res,
      200,
      'Password has been reset successfully. Please log in.'
    );
  }
);


/* =========================================================
   EXPORTS
========================================================= */

module.exports = {

  // Admin
  adminLogin,
  adminLogout,
  adminMe,
  adminForgotPassword,
  adminResetPassword,
  adminChangePassword,

  // Student authentication
  studentRegister,
  studentVerifyOtp,
  studentResendOtp,
  studentLogin,
  studentLogout,
  studentMe,

  // Student profile
  studentUpdateProfile,

  // Student password
  studentForgotPassword,
  studentResetPassword,
};