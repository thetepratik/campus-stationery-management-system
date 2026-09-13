const express = require('express');

const router = express.Router();

const authController = require('../controllers/authController');

const validate = require('../middlewares/validateMiddleware');

const {
  verifyToken,
} = require('../middlewares/authMiddleware');

const {
  requireRole,
} = require('../middlewares/roleMiddleware');

const {
  authLimiter,
} = require('../middlewares/rateLimitMiddleware');

const {
  adminLoginValidation,
  adminForgotPasswordValidation,
  adminResetPasswordValidation,
  adminChangePasswordValidation,

  studentRegisterValidation,
  studentLoginValidation,
  studentVerifyOtpValidation,
  studentForgotPasswordValidation,
  studentResetPasswordValidation,
} = require('../validations/authValidation');


/* =========================================================
   ADMIN AUTHENTICATION
========================================================= */

/**
 * Admin Login
 *
 * POST /api/auth/admin/login
 */
router.post(
  '/admin/login',
  authLimiter,
  adminLoginValidation,
  validate,
  authController.adminLogin
);


/**
 * Admin Logout
 *
 * POST /api/auth/admin/logout
 */
router.post(
  '/admin/logout',
  authController.adminLogout
);


/**
 * Get Current Admin
 *
 * GET /api/auth/admin/me
 */
router.get(
  '/admin/me',
  verifyToken,
  requireRole('admin'),
  authController.adminMe
);


/**
 * Admin Forgot Password
 *
 * POST /api/auth/admin/forgot-password
 */
router.post(
  '/admin/forgot-password',
  authLimiter,
  adminForgotPasswordValidation,
  validate,
  authController.adminForgotPassword
);


/**
 * Admin Reset Password
 *
 * POST /api/auth/admin/reset-password
 */
router.post(
  '/admin/reset-password',
  authLimiter,
  adminResetPasswordValidation,
  validate,
  authController.adminResetPassword
);


/**
 * Admin Change Password
 *
 * POST /api/auth/admin/change-password
 */
router.post(
  '/admin/change-password',
  verifyToken,
  requireRole('admin'),
  adminChangePasswordValidation,
  validate,
  authController.adminChangePassword
);


/* =========================================================
   STUDENT AUTHENTICATION
========================================================= */

/**
 * Student Registration
 *
 * POST /api/auth/student/register
 */
router.post(
  '/student/register',
  authLimiter,
  studentRegisterValidation,
  validate,
  authController.studentRegister
);


/**
 * Student OTP Verification
 *
 * POST /api/auth/student/verify-otp
 */
router.post(
  '/student/verify-otp',
  authLimiter,
  studentVerifyOtpValidation,
  validate,
  authController.studentVerifyOtp
);


/**
 * Resend Student OTP
 *
 * POST /api/auth/student/resend-otp
 */
router.post(
  '/student/resend-otp',
  authLimiter,
  authController.studentResendOtp
);


/**
 * Student Login
 *
 * POST /api/auth/student/login
 */
router.post(
  '/student/login',
  authLimiter,
  studentLoginValidation,
  validate,
  authController.studentLogin
);


/**
 * Student Logout
 *
 * POST /api/auth/student/logout
 */
router.post(
  '/student/logout',
  authController.studentLogout
);


/**
 * Get Current Student
 *
 * GET /api/auth/student/me
 *
 * Used by AuthContext to restore
 * the student session after page refresh.
 */
router.get(
  '/student/me',
  verifyToken,
  requireRole('student'),
  authController.studentMe
);


/* =========================================================
   STUDENT PROFILE
========================================================= */

/**
 * Update Student Profile
 *
 * PUT /api/auth/student/profile
 *
 * Requires:
 * - Valid student authentication
 * - Student role
 *
 * Editable:
 * - name
 * - mobile
 * - department
 * - avatar
 * - addresses
 *
 * Not editable:
 * - email
 * - rollNumber
 * - password
 * - isVerified
 */
router.put(
  '/student/profile',
  verifyToken,
  requireRole('student'),
  authController.studentUpdateProfile
);


/**
 * Student Forgot Password
 *
 * POST /api/auth/student/forgot-password
 */
router.post(
  '/student/forgot-password',
  authLimiter,
  studentForgotPasswordValidation,
  validate,
  authController.studentForgotPassword
);


/**
 * Student Reset Password
 *
 * POST /api/auth/student/reset-password
 */
router.post(
  '/student/reset-password',
  authLimiter,
  studentResetPasswordValidation,
  validate,
  authController.studentResetPassword
);

module.exports = router;