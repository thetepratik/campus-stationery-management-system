const nodemailer = require("nodemailer");

let transporter = null;

/**
 * Create SMTP transporter
 */
const getTransporter = () => {
  if (transporter) return transporter;

  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_PORT ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS
  ) {
    console.warn("⚠ SMTP credentials are missing in .env");
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false, // true only for port 465
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 15000,
  });

  // Verify SMTP connection
  transporter.verify((error, success) => {
    if (error) {
      console.error("\n==============================");
      console.error("❌ SMTP CONNECTION FAILED");
      console.error("==============================");
      console.error(error);
      console.error("==============================\n");
    } else {
      console.log("\n==============================");
      console.log("✅ SMTP Connected Successfully");
      console.log("==============================\n");
    }
  });

  return transporter;
};

/**
 * Send Email
 */
const sendEmail = async ({ to, subject, html }) => {
  const t = getTransporter();

  // Development mode
  if (!t) {
    console.log("\n========== EMAIL (DEV MODE) ==========");
    console.log("To      :", to);
    console.log("Subject :", subject);
    console.log("--------------------------------------");
    console.log(html.replace(/<[^>]+>/g, " "));
    console.log("======================================\n");

    return { devMode: true };
  }

  try {
    const info = await t.sendMail({
      from: `"Campus Stationery" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });

    console.log("\n==============================");
    console.log("✅ EMAIL SENT SUCCESSFULLY");
    console.log("==============================");
    console.log("To       :", to);
    console.log("Subject  :", subject);
    console.log("MessageID:", info.messageId);
    console.log("Response :", info.response);
    console.log("==============================\n");

    return info;
  } catch (err) {
    console.error("\n==============================");
    console.error("❌ EMAIL SENDING FAILED");
    console.error("==============================");
    console.error(err);
    console.error("==============================\n");

    throw err;
  }
};

/**
 * OTP Email Template
 */
const otpEmailTemplate = (name, otp) => `
<div style="font-family:Arial,sans-serif;padding:20px;background:#f5f5f5;">
  <div style="max-width:600px;margin:auto;background:white;padding:30px;border-radius:10px;">
      <h2 style="color:#4F46E5;">Campus Stationery</h2>

      <p>Hello <strong>${name}</strong>,</p>

      <p>Your OTP for verifying your account is:</p>

      <div
        style="
        font-size:34px;
        font-weight:bold;
        letter-spacing:6px;
        text-align:center;
        color:#4F46E5;
        margin:25px 0;
      ">
        ${otp}
      </div>

      <p>This OTP is valid for <strong>10 minutes</strong>.</p>

      <p>If you did not request this verification, you can safely ignore this email.</p>

      <hr>

      <small>
      Campus Stationery Inventory & Sales Management System
      </small>
  </div>
</div>
`;

/**
 * Password Reset Email
 */
const resetPasswordEmailTemplate = (name, resetUrl) => `
<div style="font-family:Arial,sans-serif;padding:20px;background:#f5f5f5;">
<div style="max-width:600px;margin:auto;background:white;padding:30px;border-radius:10px;">

<h2 style="color:#4F46E5;">
Campus Stationery
</h2>

<p>Hello <strong>${name}</strong>,</p>

<p>
Click the button below to reset your password.
This link will expire in 30 minutes.
</p>

<a
href="${resetUrl}"
style="
display:inline-block;
padding:14px 22px;
background:#4F46E5;
color:white;
text-decoration:none;
border-radius:8px;
font-weight:bold;
">
Reset Password
</a>

<p style="margin-top:20px;">
If you did not request this password reset,
please ignore this email.
</p>

<hr>

<small>
Campus Stationery Inventory & Sales Management System
</small>

</div>
</div>
`;

module.exports = {
  sendEmail,
  otpEmailTemplate,
  resetPasswordEmailTemplate,
};