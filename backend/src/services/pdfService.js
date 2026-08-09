import PDFDocument from "pdfkit";

/**
 * Streams a generated tax return summary as a PDF onto the given
 * writable response. Kept deliberately simple typographically — this
 * is a filing document, not a marketing artifact.
 */
export function generateReturnPdf({ user, taxReturn, deductions, res }) {
  const doc = new PDFDocument({ margin: 50 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="tax-return-${taxReturn.year}.pdf"`);
  doc.pipe(res);

  doc.fontSize(20).text("Tax Copilot — Individual Tax Return Summary", { align: "left" });
  doc.moveDown(0.3);
  doc.fontSize(9).fillColor("#c53030").text("ESTIMATE FOR REVIEW — NOT AN OFFICIAL TRA SUBMISSION OR TAX ADVICE", { underline: true });
  doc.moveDown(0.2);
  doc.fontSize(10).fillColor("#555").text(`Tax year: ${taxReturn.year}    Generated: ${new Date().toLocaleDateString()}`);
  doc.moveDown(1);

  doc.fillColor("#000").fontSize(12).text("Taxpayer & TRA TIN Information", { underline: true });
  doc.fontSize(11).text(`Name: ${user.name}`);
  doc.text(`TIN (Compulsory): ${user.tin ? `${user.tin} [Verified 9-digit TRA TIN]` : "MISSING — REQUIRED BY TRA"}`);
  doc.text(`Email: ${user.email}`);
  doc.moveDown(1);

  doc.fontSize(12).text("Income & Tax Summary (Tanzania Income Tax Act Cap 332)", { underline: true });
  const rows = [
    ["Gross income", formatTzs(taxReturn.grossIncome)],
    ["Total deductions", formatTzs(taxReturn.totalDeductions)],
    ["Taxable income", formatTzs(taxReturn.taxableIncome)],
    ["Tax due", formatTzs(taxReturn.taxDue)],
    ["Tax already paid", formatTzs(taxReturn.taxPaid)],
    [Number(taxReturn.balance) < 0 ? "Refund due" : "Balance owed", formatTzs(Math.abs(taxReturn.balance))],
  ];
  doc.moveDown(0.5);
  rows.forEach(([label, value]) => {
    doc.fontSize(11).fillColor("#000").text(`${label}:`, { continued: true }).text(`  ${value}`, { align: "right" });
  });

  if (deductions?.length) {
    doc.moveDown(1);
    doc.fontSize(12).text("Deductions Claimed & TRA EFD Fiscal Receipt Status", { underline: true });
    doc.moveDown(0.3);
    deductions.forEach((d) => {
      doc.fontSize(10).fillColor("#000").text(`• ${d.category}${d.description ? ` — ${d.description}` : ""}: ${formatTzs(d.amount)}`);
    });
  }

  doc.moveDown(1.5);
  doc
    .fontSize(8.5)
    .fillColor("#4a5568")
    .text(
      "LEGAL DISCLAIMER & STATUTORY TRA COMPLIANCE NOTICE:\n" +
        "1. COMPULSORY TIN REQUIREMENT: Under the Tanzania Tax Administration Act Cap 438, all tax returns and tax calculations require a valid 9-digit Taxpayer Identification Number (TIN).\n" +
        "2. ESTIMATE ONLY: This summary is an AI-assisted calculation estimate produced for taxpayer convenience under Tanzania Income Tax Act Cap 332. It does NOT constitute legal, financial, or tax advice, nor an official submission to the Tanzania Revenue Authority (TRA).\n" +
        "3. MANUAL VERIFICATION REQUIRED: Taxpayers are strictly responsible for inspecting and verifying all extracted figures against physical documents prior to filing with TRA.\n" +
        "4. TRA EFD RECEIPT COMPLIANCE: Under Tanzania tax law (Tax Administration Act Sec 35), business expenses and tax deductions require valid TRA Electronic Fiscal Device (EFD/VFD) fiscal receipts with registered Control Numbers.\n" +
        "5. MANDATORY RECORD RETENTION: TRA requires taxpayers to retain physical copies of all EFD receipts, tax certificates, and supporting documents for a statutory period of five (5) years.",
      { align: "left" }
    );

  doc.end();
}

function formatTzs(amount) {
  const n = Number(amount) || 0;
  return `TZS ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
