const cron = require("node-cron");
const prisma = require("../config/db");
const env = require("../config/env");
const notificationService = require("./notification.service");

// Finds ACCEPTED appointments starting within the next REMINDER_LEAD_MINUTES
// that haven't been reminded yet, notifies both parties, and stamps
// reminderSentAt so the same appointment is never reminded twice even if
// this job overlaps itself or restarts.
async function sendDueReminders() {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + env.REMINDER_LEAD_MINUTES * 60 * 1000);

  const dueAppointments = await prisma.appointment.findMany({
    where: {
      status: "ACCEPTED",
      reminderSentAt: null,
      scheduledStart: { gte: now, lte: windowEnd },
    },
    include: {
      user: true,
      lawyerProfile: { select: { user: true } },
    },
    take: 100,
  });

  for (const appointment of dueAppointments) {
    // Claim it first (idempotent guard) so a slow send can't cause a
    // second cron tick to also pick it up.
    const claimed = await prisma.appointment.updateMany({
      where: { id: appointment.id, reminderSentAt: null },
      data: { reminderSentAt: new Date() },
    });
    if (claimed.count === 0) continue; // another tick already claimed it

    const data = { scheduledStart: appointment.scheduledStart, meetLink: appointment.googleMeetLink };
    await Promise.all([
      notificationService
        .notify({ user: appointment.user, type: "APPOINTMENT_REMINDER", data, channels: ["EMAIL", "WHATSAPP"] })
        .catch((err) => console.error(`[reminder] failed to notify user for appointment ${appointment.id}:`, err.message)),
      notificationService
        .notify({ user: appointment.lawyerProfile.user, type: "APPOINTMENT_REMINDER", data, channels: ["EMAIL", "WHATSAPP"] })
        .catch((err) => console.error(`[reminder] failed to notify lawyer for appointment ${appointment.id}:`, err.message)),
    ]);
  }

  if (dueAppointments.length > 0) {
    console.log(`[reminder] sent ${dueAppointments.length} appointment reminder(s)`);
  }
}

let task = null;

function startReminderCron() {
  if (task) return task;
  task = cron.schedule(env.REMINDER_CRON_SCHEDULE, () => {
    sendDueReminders().catch((err) => console.error("[reminder] cron tick failed:", err));
  });
  console.log(`[reminder] cron scheduled: ${env.REMINDER_CRON_SCHEDULE}`);
  return task;
}

function stopReminderCron() {
  if (task) {
    task.stop();
    task = null;
  }
}

module.exports = { startReminderCron, stopReminderCron, sendDueReminders };
