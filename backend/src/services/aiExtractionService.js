/**
 * Turns raw OCR text into structured fields with per-field confidence.
 * Real mode calls the OpenAI API with a strict JSON-only prompt; mock
 * mode parses the same deterministic sample text the OCR stub returns,
 * so the whole pipeline works end-to-end before you add an API key.
 */
const FIELD_SCHEMAS = {
  SALARY_SLIP: ["employeeName", "employeeTin", "employerTin", "employer", "payPeriod", "grossSalary", "taxPaid", "netPay"],
  NATIONAL_ID: ["fullName", "nin", "dateOfBirth"],
  BANK_STATEMENT: ["accountHolder", "statementPeriod", "closingBalance", "totalCredits", "totalDebits"],
  BUSINESS_INCOME: ["businessName", "reportingPeriod", "grossRevenue", "deductibleExpenses"],
  RECEIPT: ["vendor", "amount", "date", "description"],
  OTHER: [],
};

export async function extractFields({ rawText, documentType }) {
  if (process.env.OPENAI_API_KEY) {
    return callOpenAiExtraction({ rawText, documentType });
  }
  return mockExtract({ rawText, documentType });
}

async function callOpenAiExtraction({ rawText, documentType }) {
  const fields = FIELD_SCHEMAS[documentType] || [];
  const prompt = `Extract the following fields from this ${documentType} document text as strict JSON
(keys: ${fields.join(", ")}). Respond with ONLY a JSON object, no prose, no markdown fences.
Text:
"""${rawText}"""`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
    }),
  });

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content?.trim() ?? "{}";
  const clean = text.replace(/^```json\s*|```$/g, "");
  let parsed = {};
  try {
    parsed = JSON.parse(clean);
  } catch {
    parsed = {};
  }

  return Object.entries(parsed).map(([field, value]) => ({
    field,
    value: String(value ?? ""),
    confidence: value ? 0.9 : 0.3,
  }));
}

// Deterministic parser for the mock OCR sample text, so the demo
// pipeline produces sensible structured output without any API key.
function mockExtract({ rawText, documentType }) {
  const grab = (label) => {
    const match = rawText.match(new RegExp(`${label}:\\s*(.+)`, "i"));
    return match ? match[1].trim() : "";
  };

  switch (documentType) {
    case "SALARY_SLIP":
      return toResults({
        employeeName: grab("Employee Name"),
        employeeTin: grab("Employee TIN"),
        employerTin: grab("Employer TIN"),
        payPeriod: grab("Pay Period"),
        grossSalary: grab("Gross Salary"),
        taxPaid: grab("PAYE Deducted"),
        netPay: grab("Net Pay"),
      });
    case "NATIONAL_ID":
      return toResults({
        fullName: grab("Name"),
        nin: grab("NIN"),
        dateOfBirth: grab("Date of Birth"),
      });
    case "BANK_STATEMENT":
      return toResults({
        accountHolder: grab("Account Holder"),
        statementPeriod: grab("Statement Period"),
        closingBalance: grab("Closing Balance"),
        totalCredits: grab("Total Credits"),
        totalDebits: grab("Total Debits"),
      });
    case "BUSINESS_INCOME":
      return toResults({
        businessName: grab("Business Name"),
        reportingPeriod: grab("Reporting Period"),
        grossRevenue: grab("Gross Revenue"),
        deductibleExpenses: grab("Deductible Expenses"),
      });
    case "RECEIPT":
      return toResults({
        vendor: grab("Vendor"),
        amount: grab("Amount"),
        date: grab("Date"),
        description: grab("Description"),
      });
    default:
      return [];
  }
}

function toResults(fieldMap) {
  return Object.entries(fieldMap)
    .filter(([, value]) => value)
    .map(([field, value]) => ({ field, value, confidence: 0.97 }));
}
