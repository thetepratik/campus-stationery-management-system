const ApiError = require('../utils/ApiError');

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const EMAIL_TIMEOUT_MS = 8000;

/**
 * Check if Brevo credentials are provided
 */
const isBrevoConfigured = () => {
  return Boolean(process.env.BREVO_API_KEY && process.env.BREVO_SENDER_EMAIL);
};

/**
 * Send an email via Brevo REST API over HTTPS
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject line
 * @param {string} options.html - HTML content
 * @returns {Promise<Object>}
 */
const sendEmail = async ({ to, subject, html }) => {
  if (!to || !subject || !html) {
    throw new ApiError(400, 'Recipient email, subject, and content are required.');
  }

  if (!isBrevoConfigured()) {
    // In development mode without Brevo credentials, log to console
    if (process.env.NODE_ENV !== 'production') {
      console.warn('\n[EMAIL] ⚠️ Brevo credentials missing in .env (BREVO_API_KEY / BREVO_SENDER_EMAIL).');
      console.warn('[EMAIL] Falling back to console log (Dev Mode).');
      console.log(`[EMAIL] To     : ${to}`);
      console.log(`[EMAIL] Subject: ${subject}`);
      console.log('----------------------------------------');
      console.log(html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
      console.log('----------------------------------------\n');
      return { devMode: true };
    }

    console.error('[EMAIL] ❌ Brevo credentials missing in production environment.');
    throw new ApiError(500, 'Email service is not configured. Please contact administration.');
  }

  console.log('[EMAIL] Sending OTP email via Brevo');
  console.log(`[EMAIL] Recipient: ${to}`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), EMAIL_TIMEOUT_MS);

  try {
    const payload = {
      sender: {
        name: process.env.BREVO_SENDER_NAME || 'Campus Stationery Shop',
        email: process.env.BREVO_SENDER_EMAIL,
      },
      to: [
        {
          email: to,
        },
      ],
      subject,
      htmlContent: html,
    };

    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData?.message) {
          errorMessage = errorData.message;
        }
      } catch (_) {
        // Response wasn't JSON
      }

      console.error(`[EMAIL] Brevo email failed: ${errorMessage}`);
      throw new ApiError(500, 'Unable to send verification OTP. Please try again.');
    }

    const data = await response.json();
    console.log('[EMAIL] OTP email sent successfully');
    return data;
  } catch (err) {
    clearTimeout(timeoutId);

    if (err.name === 'AbortError') {
      console.error('[EMAIL] Brevo email failed: Connection timed out after 8s');
      throw new ApiError(504, 'Email service timed out. Please try again.');
    }

    if (err instanceof ApiError) {
      throw err;
    }

    console.error(`[EMAIL] Brevo email failed: ${err.message}`);
    throw new ApiError(500, 'Unable to send verification OTP. Please try again.');
  }
};

/**
 * OTP Email Template
 */
const otpEmailTemplate = (name, otp) => `
<div style="font-family: Arial, sans-serif; padding: 20px; background: #f8fafc;">
  <div style="max-width: 560px; margin: 0 auto; background: #ffffff; padding: 32px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
    <div style="text-align: center; margin-bottom: 24px;">
      <h1 style="color: #4F46E5; margin: 0; font-size: 24px;">Campus Stationery</h1>
      <p style="color: #64748b; margin-top: 4px; font-size: 14px;">Campus Inventory & Store System</p>
    </div>

    <p style="font-size: 16px; color: #1e293b;">Hello <strong>${name || 'Student'}</strong>,</p>
    <p style="font-size: 15px; color: #475569; line-height: 1.5;">
      Your one-time verification code (OTP) for your Campus Stationery account is:
    </p>

    <div style="background: #eef2ff; border: 1px dashed #6366f1; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; color: #4F46E5; padding: 18px 0; margin: 24px 0;">
      ${otp}
    </div>

    <p style="font-size: 14px; color: #64748b; line-height: 1.5;">
      ⏰ This code will expire in <strong>10 minutes</strong>.
    </p>
    <p style="font-size: 14px; color: #94a3b8; line-height: 1.4;">
      If you did not request this verification code, you can safely disregard this email.
    </p>

    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />

    <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">
      Campus Stationery Management System • Built for College Campuses
    </p>
  </div>
</div>
`;

/**
 * Password Reset Email Template
 */
const resetPasswordEmailTemplate = (name, resetUrl) => `
<div style="font-family: Arial, sans-serif; padding: 20px; background: #f8fafc;">
  <div style="max-width: 560px; margin: 0 auto; background: #ffffff; padding: 32px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
    <div style="text-align: center; margin-bottom: 24px;">
      <h1 style="color: #4F46E5; margin: 0; font-size: 24px;">Campus Stationery</h1>
    </div>

    <p style="font-size: 16px; color: #1e293b;">Hello <strong>${name}</strong>,</p>
    <p style="font-size: 15px; color: #475569; line-height: 1.5;">
      Click the button below to reset your password. This link will expire in 30 minutes:
    </p>

    <div style="text-align: center; margin: 28px 0;">
      <a href="${resetUrl}" style="display: inline-block; padding: 14px 28px; background: #4F46E5; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
        Reset Password
      </a>
    </div>

    <p style="font-size: 13px; color: #94a3b8;">
      If you did not request a password reset, please ignore this email.
    </p>

    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />

    <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">
      Campus Stationery Management System
    </p>
  </div>
</div>
`;

/**
 * Send OTP Email convenience wrapper
 * @param {string} recipientEmail
 * @param {string} otp
 * @param {string} [name='Student']
 */
const sendOTPEmail = async (recipientEmail, otp, name = 'Student') => {
  return sendEmail({
    to: recipientEmail,
    subject: 'Your Campus Stationery Verification OTP',
    html: otpEmailTemplate(name, otp),
  });
};

module.exports = {
  sendEmail,
  sendOTPEmail,
  otpEmailTemplate,
  resetPasswordEmailTemplate,
};