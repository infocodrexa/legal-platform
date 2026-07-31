const { google } = require("googleapis");
const env = require("./env");

let calendarClient = null;

function getCalendarClient() {
  if (calendarClient) return calendarClient;

  if (
    !env.GOOGLE_CALENDAR_CLIENT_ID ||
    !env.GOOGLE_CALENDAR_CLIENT_SECRET ||
    !env.GOOGLE_CALENDAR_REFRESH_TOKEN
  ) {
    throw new Error(
      "Google Calendar is not configured. Set GOOGLE_CALENDAR_CLIENT_ID / _CLIENT_SECRET / _REFRESH_TOKEN."
    );
  }

  const oauth2Client = new google.auth.OAuth2(
    env.GOOGLE_CALENDAR_CLIENT_ID,
    env.GOOGLE_CALENDAR_CLIENT_SECRET,
    env.GOOGLE_CALENDAR_REDIRECT_URI
  );
  oauth2Client.setCredentials({ refresh_token: env.GOOGLE_CALENDAR_REFRESH_TOKEN });

  calendarClient = google.calendar({ version: "v3", auth: oauth2Client });
  return calendarClient;
}

module.exports = { getCalendarClient };
