// Each template renders channel-specific content from the same `data`
// object, so a single trigger call (see notification.service.js) can fan
// out to every channel consistently. WhatsApp template names below are
// placeholders — Meta requires templates to be pre-approved in Business
// Manager before they can actually be sent; register these exact names
// there (or rename here to match) before flipping WHATSAPP_ENABLED=true.

const fmt = (d) => new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

const templates = {
  APPOINTMENT_REQUESTED: {
    email: (d) => ({
      subject: "New consultation request",
      text: `You have a new consultation request from ${d.counterpartyName} for ${fmt(d.scheduledStart)}.`,
    }),
    whatsapp: (d) => ({
      templateName: "appointment_requested",
      components: [{ type: "body", parameters: [{ type: "text", text: d.counterpartyName }, { type: "text", text: fmt(d.scheduledStart) }] }],
    }),
  },
  APPOINTMENT_ACCEPTED: {
    email: (d) => ({
      subject: "Your consultation was accepted",
      text: `Your consultation with ${d.counterpartyName} on ${fmt(d.scheduledStart)} was accepted.${d.meetLink ? ` Join: ${d.meetLink}` : ""}`,
    }),
    whatsapp: (d) => ({
      templateName: "appointment_accepted",
      components: [{ type: "body", parameters: [{ type: "text", text: d.counterpartyName }, { type: "text", text: fmt(d.scheduledStart) }] }],
    }),
  },
  APPOINTMENT_REJECTED: {
    email: (d) => ({
      subject: "Your consultation request was declined",
      text: `Your consultation request for ${fmt(d.scheduledStart)} was declined.${d.reason ? ` Reason: ${d.reason}` : ""}`,
    }),
    whatsapp: (d) => ({
      templateName: "appointment_rejected",
      components: [{ type: "body", parameters: [{ type: "text", text: fmt(d.scheduledStart) }] }],
    }),
  },
  APPOINTMENT_CANCELLED: {
    email: (d) => ({
      subject: "Consultation cancelled",
      text: `Your consultation scheduled for ${fmt(d.scheduledStart)} has been cancelled.${d.reason ? ` Reason: ${d.reason}` : ""}`,
    }),
    whatsapp: (d) => ({
      templateName: "appointment_cancelled",
      components: [{ type: "body", parameters: [{ type: "text", text: fmt(d.scheduledStart) }] }],
    }),
  },
  APPOINTMENT_RESCHEDULED: {
    email: (d) => ({
      subject: "Consultation rescheduled",
      text: `Your consultation has been rescheduled to ${fmt(d.scheduledStart)}.`,
    }),
    whatsapp: (d) => ({
      templateName: "appointment_rescheduled",
      components: [{ type: "body", parameters: [{ type: "text", text: fmt(d.scheduledStart) }] }],
    }),
  },
  APPOINTMENT_REMINDER: {
    email: (d) => ({
      subject: `Reminder: upcoming consultation at ${fmt(d.scheduledStart)}`,
      text: `This is a reminder that you have a consultation scheduled at ${fmt(d.scheduledStart)}.${d.meetLink ? ` Join: ${d.meetLink}` : ""}`,
    }),
    whatsapp: (d) => ({
      templateName: "appointment_reminder",
      components: [{ type: "body", parameters: [{ type: "text", text: fmt(d.scheduledStart) }] }],
    }),
  },
  DOCUMENT_STATUS_CHANGED: {
    email: (d) => ({
      subject: `Document ${d.status.toLowerCase().replace("_", " ")}`,
      text: `Your ${d.category} document is now ${d.status}.${d.remarks ? ` Remarks: ${d.remarks}` : ""}`,
    }),
    whatsapp: (d) => ({
      templateName: "document_status_changed",
      components: [{ type: "body", parameters: [{ type: "text", text: d.category }, { type: "text", text: d.status }] }],
    }),
  },
  KYC_STATUS_CHANGED: {
    email: (d) => ({
      subject: `KYC ${d.status.toLowerCase()}`,
      text: `Your lawyer KYC status is now ${d.status}.${d.remarks ? ` Remarks: ${d.remarks}` : ""}`,
    }),
    whatsapp: (d) => ({
      templateName: "kyc_status_changed",
      components: [{ type: "body", parameters: [{ type: "text", text: d.status }] }],
    }),
  },
  PAYMENT_CAPTURED: {
    email: (d) => ({
      subject: "Payment received",
      text: `We've received your payment of ${d.currency} ${d.amount}. Your invoice is available in your dashboard.`,
    }),
    whatsapp: (d) => ({
      templateName: "payment_captured",
      components: [{ type: "body", parameters: [{ type: "text", text: `${d.currency} ${d.amount}` }] }],
    }),
  },
  PAYMENT_FAILED: {
    email: (d) => ({
      subject: "Payment failed",
      text: `Your payment of ${d.currency} ${d.amount} could not be completed. Please try again.`,
    }),
    whatsapp: (d) => ({
      templateName: "payment_failed",
      components: [{ type: "body", parameters: [{ type: "text", text: `${d.currency} ${d.amount}` }] }],
    }),
  },
  REFUND_REQUESTED: {
    email: (d) => ({
      subject: "Refund request received",
      text: `Your refund request for ${d.currency} ${d.amount} has been received and is under review.`,
    }),
    whatsapp: (d) => ({
      templateName: "refund_requested",
      components: [{ type: "body", parameters: [{ type: "text", text: `${d.currency} ${d.amount}` }] }],
    }),
  },
  REFUND_PROCESSED: {
    email: (d) => ({
      subject: "Refund processed",
      text: `Your refund of ${d.currency} ${d.amount} has been processed and should reflect in 5-7 business days.`,
    }),
    whatsapp: (d) => ({
      templateName: "refund_processed",
      components: [{ type: "body", parameters: [{ type: "text", text: `${d.currency} ${d.amount}` }] }],
    }),
  },
  CHAT_MESSAGE_RECEIVED: {
    email: (d) => ({
      subject: `New message from ${d.senderName}`,
      text: `You have a new message from ${d.senderName}: "${d.preview}"`,
    }),
    // Chat pings are intentionally BROWSER + EMAIL only (see notification
    // trigger sites) — WhatsApp isn't fired per-message to avoid spamming
    // outside the 24h window for something this frequent.
  },
};

function render(type, channel, data) {
  const template = templates[type];
  if (!template || !template[channel]) return null;
  return template[channel](data);
}

module.exports = { render };
