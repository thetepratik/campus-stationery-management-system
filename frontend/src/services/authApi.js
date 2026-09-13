import api from './api';


/* =========================================================
   AUTH API
========================================================= */

export const authApi = {


  /* =======================================================
     ADMIN
  ======================================================= */


  /**
   * Admin Login
   *
   * POST /api/auth/admin/login
   */
  adminLogin: (data) =>
    api.post(
      '/auth/admin/login',
      data
    ),


  /**
   * Admin Logout
   *
   * POST /api/auth/admin/logout
   */
  adminLogout: () =>
    api.post(
      '/auth/admin/logout'
    ),


  /**
   * Get Current Admin
   *
   * GET /api/auth/admin/me
   */
  adminMe: () =>
    api.get(
      '/auth/admin/me'
    ),


  /**
   * Admin Forgot Password
   *
   * POST /api/auth/admin/forgot-password
   */
  adminForgotPassword: (email) =>
    api.post(
      '/auth/admin/forgot-password',
      {
        email,
      }
    ),


  /**
   * Admin Reset Password
   *
   * POST /api/auth/admin/reset-password
   */
  adminResetPassword: (
    token,
    password
  ) =>
    api.post(
      '/auth/admin/reset-password',
      {
        token,
        password,
      }
    ),


  /**
   * Admin Change Password
   *
   * POST /api/auth/admin/change-password
   */
  adminChangePassword: (
    currentPassword,
    newPassword
  ) =>
    api.post(
      '/auth/admin/change-password',
      {
        currentPassword,
        newPassword,
      }
    ),



  /* =======================================================
     STUDENT
  ======================================================= */


  /**
   * Student Registration
   *
   * POST /api/auth/student/register
   */
  studentRegister: (data) =>
    api.post(
      '/auth/student/register',
      data
    ),


  /**
   * Student OTP Verification
   *
   * POST /api/auth/student/verify-otp
   */
  studentVerifyOtp: (
    email,
    otp
  ) =>
    api.post(
      '/auth/student/verify-otp',
      {
        email,
        otp,
      }
    ),


  /**
   * Resend Student OTP
   *
   * POST /api/auth/student/resend-otp
   */
  studentResendOtp: (email) =>
    api.post(
      '/auth/student/resend-otp',
      {
        email,
      }
    ),


  /**
   * Student Login
   *
   * POST /api/auth/student/login
   */
  studentLogin: (data) =>
    api.post(
      '/auth/student/login',
      data
    ),


  /**
   * Student Logout
   *
   * POST /api/auth/student/logout
   */
  studentLogout: () =>
    api.post(
      '/auth/student/logout'
    ),


  /**
   * Get Current Student
   *
   * GET /api/auth/student/me
   */
  studentMe: () =>
    api.get(
      '/auth/student/me'
    ),


  /**
   * Update Student Profile
   *
   * PUT /api/auth/student/profile
   *
   * Example:
   *
   * {
   *   name: "Pratik Thete",
   *   mobile: "9876543210",
   *   department: "AI & Data Science",
   *   avatar: "",
   *   addresses: [...]
   * }
   */
  studentUpdateProfile: (
    data
  ) =>
    api.put(
      '/auth/student/profile',
      data
    ),


  /**
   * Student Forgot Password
   *
   * POST /api/auth/student/forgot-password
   */
  studentForgotPassword: (
    email
  ) =>
    api.post(
      '/auth/student/forgot-password',
      {
        email,
      }
    ),


  /**
   * Student Reset Password
   *
   * POST /api/auth/student/reset-password
   */
  studentResetPassword: (
    token,
    password
  ) =>
    api.post(
      '/auth/student/reset-password',
      {
        token,
        password,
      }
    ),
};


export default authApi;