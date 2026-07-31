const env = require("../config/env");

function isConfigured() {
  return !!(env.WHATSAPP_ENABLED && env.WHATSAPP_BUSINESS_TOKEN && env.WHATSAPP_PHONE_NUMBER_ID);
}

// Normalizes to E.164-ish digits-only for the Graph API's `to` field
// (accepts "+91XXXXXXXXXX" or "91XXXXXXXXXX" or bare 10-digit Indian numbers).
function normalizePhone(phone) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

// Sends a pre-approved template message — required for any business-initiated
// message outside the 24-hour customer-service window (which is effectively
// every notification this platform sends: appointment/payment/document
// events). `components` follows Meta's template-components shape, e.g.:
//   [{ type: "body", parameters: [{ type: "text", text: "..." }] }]
async function sendTemplateMessage({ to, templateName, languageCode = "en", components = [] }) {
  if (!isConfigured()) {
    console.log(`[whatsapp:disabled] would send template "${templateName}" to ${to}`);
    return { skipped: true };
  }

  const url = `https://graph.facebook.com/${env.WHATSAPP_API_VERSION}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
  const body = {
    messaging_product: "whatsapp",
    to: normalizePhone(to),
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode },
      components,
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.WHATSAPP_BUSINESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const json = await res.json();
  if (!res.ok) {
    const message = json?.error?.message || `WhatsApp API error (status ${res.status})`;
    throw new Error(message);
  }
  return json;
}

module.exports = { isConfigured, normalizePhone, sendTemplateMessage };
