/**
 * OCR layer. Swap in a real provider by filling GOOGLE_VISION_API_KEY
 * (or wiring up Tesseract locally) — until then, runs in MOCK mode so
 * the full pipeline (upload → OCR → AI fields → review) is demoable
 * with zero external cost or setup.
 */
export async function runOcr({ filePath, mimeType, documentType }) {
  if (process.env.GOOGLE_VISION_API_KEY) {
    // TODO: call Google Vision's documents.annotate here and return
    // { rawText } instead of the mock below.
    // See: https://cloud.google.com/vision/docs/ocr
  }

  return mockOcr(documentType);
}

function mockOcr(documentType) {
  const samples = {
    SALARY_SLIP: `ABC LTD
      Employee Name: Benjamin Edward
      Employee TIN: 123-456-789
      Employer TIN: 987-654-321
      Pay Period: July 2026
      Gross Salary: 4,500,000
      PAYE Deducted: 630,000
      Net Pay: 3,870,000`,
    NATIONAL_ID: `UNITED REPUBLIC OF TANZANIA
      NATIONAL IDENTIFICATION AUTHORITY
      Name: Benjamin Edward
      NIN: 19900101-00000-00000-00
      Date of Birth: 01/01/1990`,
    BANK_STATEMENT: `CRDB BANK PLC
      Account Holder: Benjamin Edward
      Statement Period: Jul 2026
      Closing Balance: 5,120,340
      Total Credits: 4,900,000
      Total Debits: 1,240,000`,
    BUSINESS_INCOME: `Business Income Summary
      Business Name: Edward Trading Co.
      Reporting Period: July 2026
      Gross Revenue: 8,200,000
      Deductible Expenses: 2,150,000`,
    RECEIPT: `TRA EFD FISCAL RECEIPT / INVOICE
      Vendor: St. Joseph Charity Fund
      Employer/Vendor TIN: 104-582-991
      EFD Control No: 1002938475
      Receipt No: EFD-TZ-2026-9812
      Amount: 150,000
      Date: 14/07/2026
      Description: Tax Deductible Donation`,
    OTHER: `Document text not recognized as a known template.`,
  };

  return { rawText: samples[documentType] || samples.OTHER, mock: true };
}
