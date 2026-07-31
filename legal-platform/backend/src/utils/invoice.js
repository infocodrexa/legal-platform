const PDFDocument = require("pdfkit");
const { uploadPrivateObject } = require("./s3");

// Builds the PDF entirely in memory (no temp files) and resolves with the
// finished Buffer once PDFKit finishes streaming. Mirrors a plain
// PDFKit-only approach — no headless-browser rendering involved.
function buildInvoicePdfBuffer({ payment, user, lawyerProfile, lawyerUser, appointment }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const invoiceNumber = `INV-${payment.id.slice(0, 8).toUpperCase()}`;
    const invoiceDate = (payment.capturedAt || new Date()).toLocaleDateString("en-IN");
    const amount = Number(payment.amount);
    const commission = Number(payment.platformCommission);
    const payout = Number(payment.lawyerPayout);

    // Header
    doc.fontSize(18).text("Legal Platform", { continued: false });
    doc.fontSize(10).fillColor("#555").text("Tax Invoice / Payment Receipt");
    doc.moveDown(1.5);
    doc.fillColor("#000");

    // Invoice meta
    doc.fontSize(10);
    doc.text(`Invoice No: ${invoiceNumber}`);
    doc.text(`Invoice Date: ${invoiceDate}`);
    doc.text(`Payment ID: ${payment.razorpayPaymentId || "-"}`);
    doc.text(`Order ID: ${payment.razorpayOrderId}`);
    doc.moveDown(1);

    // Parties
    const colTop = doc.y;
    doc.font("Helvetica-Bold").text("Billed To", 50, colTop);
    doc.font("Helvetica").text(user.name);
    doc.text(user.email);
    doc.text(user.phone);
    if (payment.buyerGstin) doc.text(`GSTIN: ${payment.buyerGstin}`);

    doc.font("Helvetica-Bold").text("Service Provider", 320, colTop);
    doc.font("Helvetica").text(lawyerUser?.name || "Lawyer");
    doc.text(`Bar Council ID: ${lawyerProfile.barCouncilId}`);
    doc.moveDown(2);

    // Line items table (simple, PDFKit has no built-in table primitive)
    const tableTop = doc.y;
    const col = { desc: 50, amount: 420 };
    doc.font("Helvetica-Bold");
    doc.text("Description", col.desc, tableTop);
    doc.text("Amount (INR)", col.amount, tableTop, { width: 100, align: "right" });
    doc.moveTo(50, tableTop + 15).lineTo(545, tableTop + 15).stroke();
    doc.font("Helvetica");

    let rowY = tableTop + 25;
    const scheduledDate = appointment ? new Date(appointment.scheduledStart).toLocaleString("en-IN") : "-";
    doc.text(`Legal consultation fee (appointment on ${scheduledDate})`, col.desc, rowY, { width: 350 });
    doc.text(payout.toFixed(2), col.amount, rowY, { width: 100, align: "right" });
    rowY += 20;
    doc.text("Platform commission", col.desc, rowY, { width: 350 });
    doc.text(commission.toFixed(2), col.amount, rowY, { width: 100, align: "right" });
    rowY += 20;

    doc.moveTo(50, rowY).lineTo(545, rowY).stroke();
    rowY += 10;
    doc.font("Helvetica-Bold");
    doc.text("Total Paid", col.desc, rowY, { width: 350 });
    doc.text(`${payment.currency} ${amount.toFixed(2)}`, col.amount, rowY, { width: 100, align: "right" });
    doc.font("Helvetica");

    doc.moveDown(4);
    doc.fontSize(8).fillColor("#777").text(
      "This is a system-generated receipt. GST applicability and registration details are subject to the " +
        "platform's tax registration status at the time of the transaction. Platform commission and the " +
        "lawyer's consultation fee are shown separately as required for marketplace/aggregator transactions.",
      50,
      rowY + 40,
      { width: 495 }
    );

    doc.end();
  });
}

async function generateAndStoreInvoice({ payment, user, lawyerProfile, lawyerUser, appointment }) {
  const buffer = await buildInvoicePdfBuffer({ payment, user, lawyerProfile, lawyerUser, appointment });
  const key = await uploadPrivateObject({
    prefix: "invoices",
    userId: user.id,
    originalFileName: `invoice-${payment.id}.pdf`,
    mimeType: "application/pdf",
    buffer,
  });
  return key;
}

module.exports = { generateAndStoreInvoice };
