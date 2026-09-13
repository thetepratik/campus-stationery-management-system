const { body } = require('express-validator');

const adminLoginValidation = [
  body('email').isEmail().withMessage('Enter a valid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const adminForgotPasswordValidation = [
  body('email').isEmail().withMessage('Enter a valid email').normalizeEmail(),
];

const adminResetPasswordValidation = [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const adminChangePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
];

const studentRegisterValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Enter a valid email').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('rollNumber').trim().notEmpty().withMessage('Roll number is required'),
  body('department').optional().trim(),
  body('mobile')
    .optional({ checkFalsy: true })
    .matches(/^[0-9]{10}$/)
    .withMessage('Mobile number must be 10 digits'),
];

const studentLoginValidation = [
  body('email').isEmail().withMessage('Enter a valid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const studentVerifyOtpValidation = [
  body('email').isEmail().withMessage('Enter a valid email').normalizeEmail(),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
];

const studentForgotPasswordValidation = [
  body('email').isEmail().withMessage('Enter a valid email').normalizeEmail(),
];

const studentResetPasswordValidation = [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

module.exports = {
  adminLoginValidation,
  adminForgotPasswordValidation,
  adminResetPasswordValidation,
  adminChangePasswordValidation,
  studentRegisterValidation,
  studentLoginValidation,
  studentVerifyOtpValidation,
  studentForgotPasswordValidation,
  studentResetPasswordValidation,
};
