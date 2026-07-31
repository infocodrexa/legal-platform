/**
 * Seed script — creates demo accounts and realistic sample data so the
 * application looks fully populated after a fresh install.
 *
 * Run with: npx prisma db seed
 * (requires `npx prisma generate` and a real DATABASE_URL first — this
 * was written and reviewed carefully but never executed against a live
 * database in this sandbox; there has never been a reachable Postgres
 * instance available here. Run it against a real dev database and read
 * the console output before trusting it in front of anyone.)
 *
 * All demo passwords: Demo@1234
 */

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();
const SALT_ROUNDS = 12;
const DEMO_PASSWORD = "Demo@1234";

async function hash(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

function daysFromNow(days, hour = 10, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d;
}

async function main() {
  const passwordHash = await hash(DEMO_PASSWORD);

  // ------------------------------------------------------------------
  // Users: Super Admin, Admin, 3 Lawyers, 3 Clients
  // ------------------------------------------------------------------
  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@nyayasetu.demo" },
    // Force these back to the documented demo state on every re-run —
    // update: {} previously meant a stale row from any earlier partial
    // seed attempt (or a manual test signup using this email) would keep
    // its old password forever, causing exactly the "seeded but login
    // still 401s" symptom.
    update: { passwordHash, role: "SUPER_ADMIN", isVerified: true, isBanned: false, phone: "9900000001" },
    create: {
      name: "Ananya Gupta",
      email: "superadmin@nyayasetu.demo",
      phone: "9900000001",
      passwordHash,
      role: "SUPER_ADMIN",
      isVerified: true,
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@nyayasetu.demo" },
    update: { passwordHash, role: "ADMIN", isVerified: true, isBanned: false, phone: "9900000002" },
    create: {
      name: "Rohit Malhotra",
      email: "admin@nyayasetu.demo",
      phone: "9900000002",
      passwordHash,
      role: "ADMIN",
      isVerified: true,
    },
  });

  const lawyerUserData = [
    { name: "Adv. Priya Sharma", email: "lawyer1@nyayasetu.demo", phone: "9900000011", barCouncilId: "BC/BR/2014/1123", specializations: ["Property & Real Estate"], experienceYears: 12, consultationCharge: 1200, kycStatus: "VERIFIED" },
    { name: "Adv. Rajesh Kumar", email: "lawyer2@nyayasetu.demo", phone: "9900000012", barCouncilId: "BC/DL/2017/8890", specializations: ["Family Law"], experienceYears: 9, consultationCharge: 900, kycStatus: "VERIFIED" },
    { name: "Adv. Meera Nair", email: "lawyer3@nyayasetu.demo", phone: "9900000013", barCouncilId: "BC/KA/2019/4521", specializations: ["Contract Review"], experienceYears: 5, consultationCharge: 700, kycStatus: "PENDING" },
  ];

  const lawyers = [];
  for (const l of lawyerUserData) {
    const user = await prisma.user.upsert({
      where: { email: l.email },
      update: { passwordHash, role: "LAWYER", isVerified: true, isBanned: false, phone: l.phone },
      create: { name: l.name, email: l.email, phone: l.phone, passwordHash, role: "LAWYER", isVerified: true },
    });
    const profile = await prisma.lawyerProfile.upsert({
      where: { userId: user.id },
      update: {
        kycStatus: l.kycStatus,
        specializations: l.specializations,
        experienceYears: l.experienceYears,
        consultationCharge: l.consultationCharge,
      },
      create: {
        userId: user.id,
        barCouncilId: l.barCouncilId,
        // Seed-only placeholder keys — no real file exists in S3 for
        // these; a signed-URL preview will 404, which is expected for
        // demo data. Fine for a fresh dev install; not fine to leave in
        // an environment anyone screenshots.
        licenseDocKey: `seed/licenses/${user.id}.pdf`,
        panDocKey: `seed/pan/${user.id}.pdf`,
        kycStatus: l.kycStatus,
        kycReviewedAt: l.kycStatus === "VERIFIED" ? new Date() : null,
        bio: `${l.name} has been practicing ${l.specializations[0].toLowerCase()} for ${l.experienceYears} years.`,
        specializations: l.specializations,
        experienceYears: l.experienceYears,
        consultationCharge: l.consultationCharge,
      },
    });
    lawyers.push({ user, profile });
  }

  const clientUserData = [
    { name: "Ravi Kumar", email: "user1@nyayasetu.demo", phone: "9900000021" },
    { name: "Sunita Devi", email: "user2@nyayasetu.demo", phone: "9900000022" },
    { name: "Arjun Mehta", email: "user3@nyayasetu.demo", phone: "9900000023" },
  ];
  const clients = [];
  for (const c of clientUserData) {
    const user = await prisma.user.upsert({
      where: { email: c.email },
      update: { passwordHash, role: "USER", isVerified: true, isBanned: false, phone: c.phone },
      create: { name: c.name, email: c.email, phone: c.phone, passwordHash, role: "USER", isVerified: true },
    });
    clients.push(user);
  }

  console.log("✓ Users seeded: 1 super admin, 1 admin, 3 lawyers, 3 clients");

  // ------------------------------------------------------------------
  // Working hours + availability slots for the two verified lawyers
  // ------------------------------------------------------------------
  const verifiedLawyers = lawyers.filter((l) => l.profile.kycStatus === "VERIFIED");
  for (const { profile } of verifiedLawyers) {
    for (const day of ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"]) {
      await prisma.workingHour.upsert({
        where: { lawyerProfileId_dayOfWeek_startTime: { lawyerProfileId: profile.id, dayOfWeek: day, startTime: "10:00" } },
        update: {},
        create: { lawyerProfileId: profile.id, dayOfWeek: day, startTime: "10:00", endTime: "18:00", isActive: true },
      });
    }
    // A handful of open future slots so the booking flow has something to show.
    for (let i = 1; i <= 5; i++) {
      const start = daysFromNow(i, 10 + i);
      const end = new Date(start.getTime() + 30 * 60000);
      await prisma.availabilitySlot.upsert({
        where: { lawyerProfileId_startTime: { lawyerProfileId: profile.id, startTime: start } },
        update: {},
        create: { lawyerProfileId: profile.id, startTime: start, endTime: end, isBooked: false },
      });
    }
  }
  console.log("✓ Working hours + open slots seeded for verified lawyers");

  // ------------------------------------------------------------------
  // Documents (varied statuses) + status history
  // ------------------------------------------------------------------
  const documentSeeds = [
    { user: clients[0], category: "PROPERTY_DOCUMENT", fileName: "sale-deed-plot-42.pdf", status: "VERIFIED", reviewer: verifiedLawyers[0] },
    { user: clients[0], category: "IDENTITY_PROOF", fileName: "aadhaar-card.pdf", status: "VERIFIED", reviewer: verifiedLawyers[0] },
    { user: clients[1], category: "CONTRACT", fileName: "employment-offer-letter.pdf", status: "UNDER_REVIEW", reviewer: verifiedLawyers[1] },
    { user: clients[1], category: "FINANCIAL_DOCUMENT", fileName: "loan-agreement-draft.pdf", status: "REUPLOAD_REQUIRED", reviewer: verifiedLawyers[0], remarks: "Page 3 is cut off — please re-upload a complete scan." },
    { user: clients[2], category: "OTHER", fileName: "rental-notice.pdf", status: "PENDING", reviewer: null },
  ];

  for (const d of documentSeeds) {
    const doc = await prisma.document.create({
      data: {
        userId: d.user.id,
        category: d.category,
        fileKey: `seed/documents/${d.user.id}-${d.fileName}`,
        originalFileName: d.fileName,
        mimeType: "application/pdf",
        fileSizeBytes: 240_000,
        status: d.status,
        remarks: d.remarks || null,
        reviewedByLawyerId: d.reviewer?.profile.id || null,
        reviewedAt: d.reviewer ? new Date() : null,
      },
    });
    await prisma.documentStatusHistory.create({
      data: {
        documentId: doc.id,
        fromStatus: null,
        toStatus: "PENDING",
        changedByUserId: d.user.id,
      },
    });
    if (d.status !== "PENDING") {
      await prisma.documentStatusHistory.create({
        data: {
          documentId: doc.id,
          fromStatus: "PENDING",
          toStatus: d.status,
          remarks: d.remarks || null,
          changedByUserId: d.reviewer.user.id,
        },
      });
    }
  }
  console.log("✓ Documents + status history seeded");

  // ------------------------------------------------------------------
  // Appointments + Payments + Reviews
  // ------------------------------------------------------------------
  const completedAppt = await prisma.appointment.create({
    data: {
      userId: clients[0].id,
      lawyerId: verifiedLawyers[0].profile.id,
      scheduledStart: daysFromNow(-7, 11),
      scheduledEnd: daysFromNow(-7, 11, 30),
      status: "COMPLETED",
      consultationCharge: verifiedLawyers[0].profile.consultationCharge,
    },
  });
  const completedPayment = await prisma.payment.create({
    data: {
      userId: clients[0].id,
      lawyerId: verifiedLawyers[0].profile.id,
      appointmentId: completedAppt.id,
      razorpayOrderId: `seed_order_${completedAppt.id}`,
      razorpayPaymentId: `seed_pay_${completedAppt.id}`,
      amount: verifiedLawyers[0].profile.consultationCharge,
      platformCommission: Number(verifiedLawyers[0].profile.consultationCharge) * 0.15,
      lawyerPayout: Number(verifiedLawyers[0].profile.consultationCharge) * 0.85,
      status: "SETTLED",
      capturedAt: daysFromNow(-7, 11),
      settledAt: daysFromNow(-6, 9),
    },
  });
  await prisma.review.create({
    data: {
      appointmentId: completedAppt.id,
      userId: clients[0].id,
      lawyerId: verifiedLawyers[0].profile.id,
      rating: 5,
      comment: "Extremely thorough and explained everything clearly.",
    },
  });

  const acceptedAppt = await prisma.appointment.create({
    data: {
      userId: clients[1].id,
      lawyerId: verifiedLawyers[1].profile.id,
      scheduledStart: daysFromNow(2, 15),
      scheduledEnd: daysFromNow(2, 15, 30),
      status: "ACCEPTED",
      googleMeetLink: "https://meet.google.com/seed-demo-link",
      consultationCharge: verifiedLawyers[1].profile.consultationCharge,
    },
  });
  await prisma.payment.create({
    data: {
      userId: clients[1].id,
      lawyerId: verifiedLawyers[1].profile.id,
      appointmentId: acceptedAppt.id,
      razorpayOrderId: `seed_order_${acceptedAppt.id}`,
      razorpayPaymentId: `seed_pay_${acceptedAppt.id}`,
      amount: verifiedLawyers[1].profile.consultationCharge,
      platformCommission: Number(verifiedLawyers[1].profile.consultationCharge) * 0.15,
      lawyerPayout: Number(verifiedLawyers[1].profile.consultationCharge) * 0.85,
      status: "CAPTURED",
      capturedAt: new Date(),
    },
  });

  await prisma.appointment.create({
    data: {
      userId: clients[2].id,
      lawyerId: verifiedLawyers[0].profile.id,
      scheduledStart: daysFromNow(4, 12),
      scheduledEnd: daysFromNow(4, 12, 30),
      status: "REQUESTED",
      consultationCharge: verifiedLawyers[0].profile.consultationCharge,
    },
  });

  console.log("✓ Appointments, payments, and a review seeded");

  // ------------------------------------------------------------------
  // Support tickets
  // ------------------------------------------------------------------
  const ticket = await prisma.supportTicket.create({
    data: {
      userId: clients[0].id,
      subject: "Refund not showing in my account",
      description: "I cancelled a consultation last week and the refund status still shows Requested.",
      status: "IN_PROGRESS",
      priority: "MEDIUM",
      assignedToUserId: admin.id,
    },
  });
  await prisma.supportTicketReply.create({
    data: { ticketId: ticket.id, authorId: admin.id, content: "Looking into this now, will update within the day." },
  });
  await prisma.supportTicket.create({
    data: {
      userId: clients[1].id,
      subject: "Can't download invoice PDF",
      description: "The invoice link on my payments page returns an error.",
      status: "RESOLVED",
      priority: "LOW",
      resolutionNotes: "Signed URL had expired client-side; refreshing the page resolved it.",
      resolvedAt: new Date(),
    },
  });
  console.log("✓ Support tickets seeded");

  // ------------------------------------------------------------------
  // Notifications (sample)
  // ------------------------------------------------------------------
  await prisma.notification.createMany({
    data: [
      { userId: clients[0].id, channel: "EMAIL", type: "APPOINTMENT_ACCEPTED", status: "SENT", sentAt: daysFromNow(-7) },
      { userId: clients[1].id, channel: "EMAIL", type: "PAYMENT_CAPTURED", status: "SENT", sentAt: new Date() },
      { userId: verifiedLawyers[0].user.id, channel: "BROWSER", type: "DOCUMENT_STATUS_CHANGED", status: "SENT", sentAt: new Date() },
    ],
  });
  console.log("✓ Sample notifications seeded");

  // ------------------------------------------------------------------
  // CMS: Blog, FAQ, Testimonials, Services
  // ------------------------------------------------------------------
  await prisma.blog.upsert({
    where: { slug: "sale-deed-red-flags" },
    update: {},
    create: {
      title: "Five things to check in a sale deed before you sign",
      slug: "sale-deed-red-flags",
      excerpt: "A sale deed error is expensive to fix after the fact. Here's what a property lawyer checks in every review.",
      content: "<p>A sale deed error is expensive to fix after the fact. Here is what a property lawyer checks in every review: the seller's title chain, encumbrance certificate, survey number match, stamp duty calculation, and registration compliance.</p>",
      tags: ["property-law"],
      authorId: verifiedLawyers[0].user.id,
      status: "PUBLISHED",
      publishedAt: daysFromNow(-30),
    },
  });
  await prisma.blog.upsert({
    where: { slug: "employment-contract-clauses" },
    update: {},
    create: {
      title: "The employment contract clauses most people skip past",
      slug: "employment-contract-clauses",
      excerpt: "Non-compete, notice period, and IP assignment clauses are where most disputes start.",
      content: "<p>Non-compete, notice period, and IP assignment clauses are where most disputes start. Here is how to read them before you sign.</p>",
      tags: ["contract-review"],
      authorId: verifiedLawyers[1].user.id,
      status: "PUBLISHED",
      publishedAt: daysFromNow(-15),
    },
  });
  console.log("✓ Blog posts seeded");

  const faqSeeds = [
    { question: "Is my document safe once I upload it?", answer: "Yes. Every document is stored in private, encrypted file storage and only ever reachable through a short-lived, signed link.", category: "Documents", displayOrder: 1 },
    { question: "How are lawyers verified before joining?", answer: "Every lawyer submits their Bar Council enrollment ID and license for review before their profile goes live.", category: "Lawyers", displayOrder: 2 },
    { question: "What happens if I need a refund?", answer: "You can request a refund from your dashboard. Refunds are reviewed and processed within a few business days.", category: "Payments", displayOrder: 3 },
  ];
  for (const f of faqSeeds) {
    const existing = await prisma.faq.findFirst({ where: { question: f.question } });
    if (!existing) await prisma.faq.create({ data: f });
  }
  console.log("✓ FAQs seeded");

  const testimonialSeeds = [
    { authorName: "Sunita Devi", authorRole: "Property buyer, Muzaffarpur", quote: "My property sale deed had an error I never would have caught. The lawyer flagged it in a day.", rating: 5, displayOrder: 1 },
    { authorName: "Arjun Mehta", authorRole: "Software engineer, Pune", quote: "Booked a slot, paid online, done within the week.", rating: 5, displayOrder: 2 },
  ];
  for (const t of testimonialSeeds) {
    const existing = await prisma.testimonial.findFirst({ where: { authorName: t.authorName, quote: t.quote } });
    if (!existing) await prisma.testimonial.create({ data: t });
  }
  console.log("✓ Testimonials seeded");

  const serviceSeeds = [
    { slug: "property-law", name: "Property & Real Estate", description: "Sale deeds, title verification, tenancy disputes, and property registration review.", icon: "Home", feeRangeMin: 800, feeRangeMax: 2500, covers: ["Sale deed and title deed review", "Encumbrance certificate verification", "Property registration guidance"], displayOrder: 1 },
    { slug: "family-law", name: "Family Law", description: "Divorce, custody, maintenance, and family settlement agreements.", icon: "Users", feeRangeMin: 900, feeRangeMax: 2000, covers: ["Divorce process guidance", "Child custody consultation", "Maintenance and alimony matters"], displayOrder: 2 },
    { slug: "contract-review", name: "Contract Review", description: "Employment agreements, vendor contracts, and NDA review before you sign.", icon: "FileCheck", feeRangeMin: 600, feeRangeMax: 1800, covers: ["Employment contract review", "NDA review", "Clause-by-clause explanation"], displayOrder: 3 },
  ];
  for (const s of serviceSeeds) {
    await prisma.service.upsert({ where: { slug: s.slug }, update: {}, create: s });
  }
  console.log("✓ Services seeded");

  // ------------------------------------------------------------------
  // SEO metadata for key pages
  // ------------------------------------------------------------------
  await prisma.seoMeta.upsert({
    where: { path: "/" },
    update: {},
    create: { path: "/", title: "NyayaSetu — Verified Documents, Real Lawyers", description: "Upload legal documents for verification and book a consultation with a Bar Council verified lawyer." },
  });
  console.log("✓ SEO metadata seeded");

  console.log("\n================ DEMO ACCOUNTS ================");
  console.log(`All passwords: ${DEMO_PASSWORD}`);
  console.log(`Super Admin : ${superAdmin.email}`);
  console.log(`Admin       : ${admin.email}`);
  lawyers.forEach((l, i) => console.log(`Lawyer ${i + 1}    : ${l.user.email}  (KYC: ${l.profile.kycStatus})`));
  clients.forEach((c, i) => console.log(`Client ${i + 1}    : ${c.email}`));
  console.log("=================================================\n");
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
