const Razorpay = require("razorpay");
const env = require("./env");

let instance = null;

// Lazily constructed so the app can still boot (e.g. in dev) without
// Razorpay keys set; any actual payment call will throw a clear error.
function getRazorpay() {
  if (instance) return instance;

  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay is not configured. Set RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET.");
  }

  instance = new Razorpay({ key_id: env.RAZORPAY_KEY_ID, key_secret: env.RAZORPAY_KEY_SECRET });
  return instance;
}

module.exports = { getRazorpay };
