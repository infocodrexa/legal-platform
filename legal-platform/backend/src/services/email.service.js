const nodemailer = require("nodemailer");
const env = require("../config/env");

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    // In dev, allow the app to boot without SMTP configured — emails will
    // just be logged instead of sent. Fail loudly in production.
    if (env.NODE_ENV === "production") {
      throw new Error("SMTP is not configured. Set SMTP_HOST/SMTP_USER/SMTP_PASS.");
    }
    return null;
  }

  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT || 587,
    secure: !!env.SMTP_SECURE,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });

  return transporter;
}

async function sendMail({ to, subject, html, text }) {
  const t = getTransporter();

  if (!t) {
    console.log(`[email:dev-mode] to=${to} subject="${subject}"\n${text || html}`);
    return { devMode: true };
  }

  return t.sendMail({
    from: env.SMTP_FROM || env.SMTP_USER,
    to,
    subject,
    html,
    text,
  });
}

async function sendOtpEmail(to, otp, purpose) {
  const purposeLabel = {
    REGISTER: "verify your account",
    LOGIN: "log in",
    RESET_PASSWORD: "reset your password",
    PHONE_VERIFY: "verify your phone number",
  }[purpose] || "continue";

  return sendMail({
    to,
    subject: `Your OTP code: ${otp}`,
    text: `Use the code ${otp} to ${purposeLabel}. It expires in ${env.OTP_EXPIRY_MINUTES} minutes. Do not share this code with anyone.`,
    html: `<p>Use the code <strong>${otp}</strong> to ${purposeLabel}.</p><p>This code expires in ${env.OTP_EXPIRY_MINUTES} minutes. Do not share this code with anyone.</p>`,
  });
}

async function sendPasswordResetConfirmation(to) {
  return sendMail({
    to,
    subject: "Your password was changed",
    text: "Your account password was just changed. If this wasn't you, contact support immediately.",
    html: "<p>Your account password was just changed. If this wasn't you, contact support immediately.</p>",
  });
}

module.exports = { sendMail, sendOtpEmail, sendPasswordResetConfirmation };
