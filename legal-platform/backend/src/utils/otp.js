const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const env = require("../config/env");

// Generates a numeric OTP of configured length, e.g. "482913".
function generateOtp(length = env.OTP_LENGTH) {
  const digits = "0123456789";
  let otp = "";
  for (let i = 0; i < length; i++) {
    otp += digits[crypto.randomInt(0, digits.length)];
  }
  return otp;
}

async function hashOtp(otp) {
  return bcrypt.hash(otp, env.BCRYPT_SALT_ROUNDS);
}

async function compareOtp(otp, otpHash) {
  return bcrypt.compare(otp, otpHash);
}

module.exports = { generateOtp, hashOtp, compareOtp };
