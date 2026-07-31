"use client";

function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Couldn't load the payment SDK. Check your connection and try again."));
    document.body.appendChild(script);
  });
}

// Opens Razorpay Checkout for an already-created order (see
// paymentApi.createOrder — matches backend/src/controllers/payment.controller.js
// exactly: { orderId, amount, currency, razorpayKeyId, paymentId }). Resolves
// with the raw Razorpay success payload on success, rejects on
// cancellation/failure so callers can show an error state.
export async function openRazorpayCheckout({ order, prefill = {}, appointmentLabel }) {
  await loadRazorpayScript();

  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: order.razorpayKeyId,
      amount: order.amount,
      currency: order.currency || "INR",
      order_id: order.orderId,
      name: "NyayaSetu",
      description: appointmentLabel || "Legal consultation",
      prefill,
      theme: { color: "#a13d2b" }, // matches the design system's seal accent
      handler: (response) => resolve(response),
      modal: {
        ondismiss: () => reject(new Error("Payment cancelled.")),
      },
    });
    rzp.on("payment.failed", (response) => {
      reject(new Error(response.error?.description || "Payment failed. Please try again."));
    });
    rzp.open();
  });
}
