const { randomUUID } = require("crypto");
const { getCalendarClient } = require("../config/googleCalendar");
const env = require("../config/env");

// Called on appointment ACCEPTED. Intentionally never throws out of this
// function's public surface for the "not configured" case — callers decide
// whether a missing Meet link should block the accept flow (it shouldn't;
// the appointment is still valid, the link can be attached later).
async function createMeetingForAppointment({ appointment, userEmail, lawyerEmail, summary }) {
  const calendar = getCalendarClient();

  const event = await calendar.events.insert({
    calendarId: env.GOOGLE_CALENDAR_ID,
    conferenceDataVersion: 1,
    requestBody: {
      summary: summary || "Legal Consultation",
      description: `Consultation booked via Legal Platform. Appointment ID: ${appointment.id}`,
      start: { dateTime: new Date(appointment.scheduledStart).toISOString() },
      end: { dateTime: new Date(appointment.scheduledEnd).toISOString() },
      attendees: [{ email: userEmail }, { email: lawyerEmail }],
      conferenceData: {
        createRequest: {
          requestId: randomUUID(),
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
      reminders: { useDefault: true },
    },
  });

  const meetLink = event.data.conferenceData?.entryPoints?.find((p) => p.entryPointType === "video")
    ?.uri;

  return { eventId: event.data.id, meetLink: meetLink || null };
}

async function cancelMeeting(eventId) {
  if (!eventId) return;
  const calendar = getCalendarClient();
  await calendar.events.delete({ calendarId: env.GOOGLE_CALENDAR_ID, eventId }).catch((err) => {
    // Event may already be gone — cancellation should never throw.
    console.error(`[googleMeet] failed to delete event ${eventId}:`, err.message);
  });
}

module.exports = { createMeetingForAppointment, cancelMeeting };
