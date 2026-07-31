const prisma = require("../config/db");
const { ApiError } = require("../utils/apiResponse");
const lawyerService = require("./lawyer.service");
const googleMeetService = require("./googleMeet.service");
const notificationService = require("./notification.service");

const OPEN_STATUSES = new Set(["REQUESTED", "ACCEPTED"]);

// Every place we return an Appointment with its participants attached must
// use this — never `include: { user: true }`, which would leak
// passwordHash and (via a bare LawyerProfile include) private S3 document
// keys straight into the API response.
const SAFE_PARTICIPANTS_INCLUDE = {
  user: { select: { id: true, name: true, email: true, phone: true } },
  lawyerProfile: {
    select: {
      id: true,
      barCouncilId: true,
      consultationCharge: true,
      user: { select: { id: true, name: true, email: true, phone: true } },
    },
  },
};

async function assertOwnsLawyerProfile(userId, lawyerProfileId) {
  const profile = await lawyerService.getProfileByUserId(userId);
  if (profile.id !== lawyerProfileId) {
    throw new ApiError(403, "This appointment does not belong to you");
  }
  return profile;
}

async function getAppointmentOr404(appointmentId, tx = prisma) {
  const appointment = await tx.appointment.findUnique({ where: { id: appointmentId } });
  if (!appointment) throw new ApiError(404, "Appointment not found");
  return appointment;
}

// Books an open slot. Only slots belonging to a KYC-VERIFIED lawyer are
// bookable, since an unverified lawyer shouldn't yet be taking client work.
async function bookAppointment({ userId, slotId }) {
  const { appointment, lawyerUser, bookingUser } = await prisma.$transaction(async (tx) => {
    const slot = await tx.availabilitySlot.findUnique({
      where: { id: slotId },
      include: { lawyerProfile: { select: { kycStatus: true, consultationCharge: true, user: true } } },
    });
    if (!slot) throw new ApiError(404, "Slot not found");
    if (slot.isBooked) throw new ApiError(409, "This slot has already been booked");
    if (slot.startTime < new Date()) throw new ApiError(400, "Cannot book a slot in the past");
    if (slot.lawyerProfile.kycStatus !== "VERIFIED") {
      throw new ApiError(409, "This lawyer is not yet accepting bookings");
    }

    const updatedSlot = await tx.availabilitySlot.updateMany({
      where: { id: slotId, isBooked: false },
      data: { isBooked: true },
    });
    if (updatedSlot.count === 0) {
      // Lost a race with another booking request.
      throw new ApiError(409, "This slot has already been booked");
    }

    const created = await tx.appointment.create({
      data: {
        userId,
        lawyerId: slot.lawyerProfileId,
        slotId: slot.id,
        scheduledStart: slot.startTime,
        scheduledEnd: slot.endTime,
        status: "REQUESTED",
        consultationCharge: slot.lawyerProfile.consultationCharge,
      },
    });

    const requester = await tx.user.findUnique({ where: { id: userId } });
    return { appointment: created, lawyerUser: slot.lawyerProfile.user, bookingUser: requester };
  });

  notificationService
    .notify({
      user: lawyerUser,
      type: "APPOINTMENT_REQUESTED",
      data: { counterpartyName: bookingUser.name, scheduledStart: appointment.scheduledStart },
      channels: ["EMAIL", "WHATSAPP"],
    })
    .catch((err) => console.error(`[appointment] notify failed for booking ${appointment.id}:`, err.message));

  return appointment;
}

async function listUserAppointments({ userId, status, page, limit }) {
  const where = { userId, ...(status && { status }) };
  const [items, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      orderBy: { scheduledStart: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: SAFE_PARTICIPANTS_INCLUDE,
    }),
    prisma.appointment.count({ where }),
  ]);
  return { items, total, page, limit };
}

async function listLawyerAppointments({ userId, status, page, limit }) {
  const profile = await lawyerService.getProfileByUserId(userId);
  const where = { lawyerId: profile.id, ...(status && { status }) };
  const [items, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      orderBy: { scheduledStart: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: SAFE_PARTICIPANTS_INCLUDE,
    }),
    prisma.appointment.count({ where }),
  ]);
  return { items, total, page, limit };
}

async function getAppointmentDetail({ appointmentId, actorUserId, actorRole }) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      user: { select: { id: true, name: true, email: true } },
      lawyerProfile: { select: { id: true, userId: true, barCouncilId: true, consultationCharge: true } },
    },
  });
  if (!appointment) throw new ApiError(404, "Appointment not found");

  const isOwnerUser = appointment.userId === actorUserId;
  const isOwnerLawyer = appointment.lawyerProfile.userId === actorUserId;
  const isPrivileged = ["ADMIN", "SUPER_ADMIN"].includes(actorRole);

  if (!isOwnerUser && !isOwnerLawyer && !isPrivileged) {
    throw new ApiError(403, "You do not have access to this appointment");
  }
  return appointment;
}

async function getAdminAppointmentDetail({
  appointmentId,
  actorUserId,
  actorRole,
}) {
  const appointment = await prisma.appointment.findUnique({
    where: {
      id: appointmentId,
    },

    include: SAFE_PARTICIPANTS_INCLUDE,
  });

  if (!appointment) {
    throw new ApiError(404, "Appointment not found");
  }

  const isOwnerUser =
    appointment.userId === actorUserId;

  const isOwnerLawyer =
    appointment.lawyerProfile?.user?.id === actorUserId;

  const isPrivileged = [
    "ADMIN",
    "SUPER_ADMIN",
  ].includes(actorRole);

  if (
    !isOwnerUser &&
    !isOwnerLawyer &&
    !isPrivileged
  ) {
    throw new ApiError(
      403,
      "You do not have access to this appointment"
    );
  }

  return appointment;
}

// Lawyer accepts or rejects a REQUESTED appointment. Rejecting frees the slot.
// On ACCEPTED, a Google Meet link is created via the Calendar API. That call
// happens *after* the DB transaction commits (it's an external network call
// and shouldn't hold a DB transaction open) and is best-effort: if Calendar
// isn't configured or the call fails, the appointment stays ACCEPTED and the
// link can be attached later rather than failing the whole accept flow.
async function respondToRequest({ appointmentId, lawyerUserId, decision, reason }) {
  const updated = await prisma.$transaction(async (tx) => {
    const appointment = await getAppointmentOr404(appointmentId, tx);
    await assertOwnsLawyerProfile(lawyerUserId, appointment.lawyerId);

    if (appointment.status !== "REQUESTED") {
      throw new ApiError(409, `Appointment is not pending a response (status: ${appointment.status})`);
    }

    if (decision === "REJECTED" && appointment.slotId) {
      await tx.availabilitySlot.update({ where: { id: appointment.slotId }, data: { isBooked: false } });
    }

    return tx.appointment.update({
  where: { id: appointmentId },
  data: {
    status: decision,

    ...(decision === "REJECTED" && {
      slotId: null,
      cancelReason: reason || null,
      cancelledByRole: "LAWYER",
    }),
  },
  include: SAFE_PARTICIPANTS_INCLUDE,
});
  });

  const notifyClient = () =>
    notificationService
      .notify({
        user: updated.user,
        type: decision === "ACCEPTED" ? "APPOINTMENT_ACCEPTED" : "APPOINTMENT_REJECTED",
        data: {
          counterpartyName: updated.lawyerProfile.user.name,
          scheduledStart: updated.scheduledStart,
          reason,
          meetLink: updated.googleMeetLink,
        },
        channels: ["EMAIL", "WHATSAPP"],
      })
      .catch((err) => console.error(`[appointment] notify failed for ${appointmentId}:`, err.message));

  if (decision !== "ACCEPTED") {
    await notifyClient();
    return updated;
  }

  try {
    const { eventId, meetLink } = await googleMeetService.createMeetingForAppointment({
      appointment: updated,
      userEmail: updated.user.email,
      lawyerEmail: updated.lawyerProfile.user.email,
    });
    const withMeet = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { googleEventId: eventId, googleMeetLink: meetLink },
      include: SAFE_PARTICIPANTS_INCLUDE,
    });
    await notificationService
      .notify({
        user: withMeet.user,
        type: "APPOINTMENT_ACCEPTED",
        data: {
          counterpartyName: withMeet.lawyerProfile.user.name,
          scheduledStart: withMeet.scheduledStart,
          meetLink: withMeet.googleMeetLink,
        },
        channels: ["EMAIL", "WHATSAPP"],
      })
      .catch((err) => console.error(`[appointment] notify failed for ${appointmentId}:`, err.message));
    return withMeet;
  } catch (err) {
    console.error(`[appointment] Google Meet link creation failed for ${appointmentId}:`, err.message);
    await notifyClient(); // still tell the client it was accepted, just without a link yet
    return updated;
  }
}

async function cancelAppointment({ appointmentId, actorUserId, actorRole, reason }) {
  const cancelled = await prisma.$transaction(async (tx) => {
    const appointment = await getAppointmentOr404(appointmentId, tx);

    const isOwnerUser = appointment.userId === actorUserId;
    const isPrivileged = ["ADMIN", "SUPER_ADMIN"].includes(actorRole);
    let isOwnerLawyer = false;
    if (!isOwnerUser && !isPrivileged) {
      const profile = await lawyerService.getProfileByUserId(actorUserId).catch(() => null);
      isOwnerLawyer = !!profile && profile.id === appointment.lawyerId;
    }
    if (!isOwnerUser && !isOwnerLawyer && !isPrivileged) {
      throw new ApiError(403, "You do not have access to this appointment");
    }

    if (!OPEN_STATUSES.has(appointment.status)) {
      throw new ApiError(409, `Cannot cancel an appointment with status ${appointment.status}`);
    }

    if (appointment.slotId) {
      await tx.availabilitySlot.update({ where: { id: appointment.slotId }, data: { isBooked: false } });
    }

    return tx.appointment.update({
  where: { id: appointmentId },
  data: {
    status: "CANCELLED",
    slotId: null,
    cancelReason: reason || null,
    cancelledByRole: isPrivileged
      ? actorRole
      : isOwnerUser
        ? "USER"
        : "LAWYER",
  },
  include: SAFE_PARTICIPANTS_INCLUDE,
});
  });

  if (cancelled.googleEventId) {
    await googleMeetService.cancelMeeting(cancelled.googleEventId);
  }

  // Notify whichever party didn't initiate the cancellation.
  const cancellerWasUser = cancelled.cancelledByRole === "USER";
  const recipient = cancellerWasUser ? cancelled.lawyerProfile.user : cancelled.user;
  const counterpartyName = cancellerWasUser ? cancelled.user.name : cancelled.lawyerProfile.user.name;
  notificationService
    .notify({
      user: recipient,
      type: "APPOINTMENT_CANCELLED",
      data: { counterpartyName, scheduledStart: cancelled.scheduledStart, reason: cancelled.cancelReason },
      channels: ["EMAIL", "WHATSAPP"],
    })
    .catch((err) => console.error(`[appointment] notify failed for cancel ${appointmentId}:`, err.message));

  return cancelled;
}

async function completeAppointment({ appointmentId, lawyerUserId }) {
  return prisma.$transaction(async (tx) => {
    const appointment = await getAppointmentOr404(appointmentId, tx);
    await assertOwnsLawyerProfile(lawyerUserId, appointment.lawyerId);

    if (appointment.status !== "ACCEPTED") {
      throw new ApiError(409, `Only an ACCEPTED appointment can be completed (status: ${appointment.status})`);
    }

    return tx.appointment.update({ where: { id: appointmentId }, data: { status: "COMPLETED" } });
  });
}

// Reschedule = cancel the old slot/appointment, book the new one, and link
// them via rescheduledFromId/rescheduledTo so the history is traceable.
async function rescheduleAppointment({ appointmentId, actorUserId, actorRole, newSlotId }) {
  return prisma.$transaction(async (tx) => {
    const appointment = await getAppointmentOr404(appointmentId, tx);

    const isOwnerUser = appointment.userId === actorUserId;
    const isPrivileged = ["ADMIN", "SUPER_ADMIN"].includes(actorRole);
    let isOwnerLawyer = false;
    if (!isOwnerUser && !isPrivileged) {
      const profile = await lawyerService.getProfileByUserId(actorUserId).catch(() => null);
      isOwnerLawyer = !!profile && profile.id === appointment.lawyerId;
    }
    if (!isOwnerUser && !isOwnerLawyer && !isPrivileged) {
      throw new ApiError(403, "You do not have access to this appointment");
    }
    if (!OPEN_STATUSES.has(appointment.status)) {
      throw new ApiError(409, `Cannot reschedule an appointment with status ${appointment.status}`);
    }

    const newSlot = await tx.availabilitySlot.findUnique({ where: { id: newSlotId } });
    if (!newSlot) throw new ApiError(404, "New slot not found");
    if (newSlot.lawyerProfileId !== appointment.lawyerId) {
      throw new ApiError(400, "New slot must belong to the same lawyer");
    }
    if (newSlot.isBooked) throw new ApiError(409, "The new slot has already been booked");
    if (newSlot.startTime < new Date()) throw new ApiError(400, "Cannot reschedule into the past");

    const claimed = await tx.availabilitySlot.updateMany({
      where: { id: newSlotId, isBooked: false },
      data: { isBooked: true },
    });
    if (claimed.count === 0) throw new ApiError(409, "The new slot has already been booked");

    if (appointment.slotId) {
      await tx.availabilitySlot.update({ where: { id: appointment.slotId }, data: { isBooked: false } });
    }

   await tx.appointment.update({
  where: { id: appointmentId },
  data: {
    status: "RESCHEDULED",
    slotId: null,
  },
});

    const created = await tx.appointment.create({
      data: {
        userId: appointment.userId,
        lawyerId: appointment.lawyerId,
        slotId: newSlot.id,
        scheduledStart: newSlot.startTime,
        scheduledEnd: newSlot.endTime,
        status: "REQUESTED",
        consultationCharge: appointment.consultationCharge,
        rescheduledFromId: appointment.id,
      },
      include: SAFE_PARTICIPANTS_INCLUDE,
    });

    return { created, oldGoogleEventId: appointment.googleEventId, actorUserId };
  }).then(async ({ created, oldGoogleEventId, actorUserId: initiatorId }) => {
    if (oldGoogleEventId) await googleMeetService.cancelMeeting(oldGoogleEventId);

    const initiatorWasUser = created.userId === initiatorId;
    const recipient = initiatorWasUser ? created.lawyerProfile.user : created.user;
    const counterpartyName = initiatorWasUser ? created.user.name : created.lawyerProfile.user.name;
    notificationService
      .notify({
        user: recipient,
        type: "APPOINTMENT_RESCHEDULED",
        data: { counterpartyName, scheduledStart: created.scheduledStart },
        channels: ["EMAIL", "WHATSAPP"],
      })
      .catch((err) => console.error(`[appointment] notify failed for reschedule ${created.id}:`, err.message));

    return created;
  });
}

module.exports = {
  bookAppointment,
  listUserAppointments,
  listLawyerAppointments,
  getAppointmentDetail,
  getAdminAppointmentDetail,
  respondToRequest,
  cancelAppointment,
  completeAppointment,
  rescheduleAppointment,
};
