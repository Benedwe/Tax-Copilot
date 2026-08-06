export const DOCUMENT_TYPES = [
  { value: "NATIONAL_ID", label: "National ID" },
  { value: "SALARY_SLIP", label: "Salary slip" },
  { value: "BANK_STATEMENT", label: "Bank statement" },
  { value: "BUSINESS_INCOME", label: "Business income report" },
  { value: "RECEIPT", label: "Receipt" },
  { value: "OTHER", label: "Other" },
];

export function typeLabel(value) {
  return DOCUMENT_TYPES.find((t) => t.value === value)?.label || value;
}

export function fieldLabel(field) {
  const map = {
    employeeName: "Employee name",
    employeeTin: "Employee TIN",
    employerTin: "Employer TIN",
    employer: "Employer",
    payPeriod: "Pay period",
    grossSalary: "Gross salary",
    taxPaid: "Tax paid (PAYE)",
    netPay: "Net pay",
    fullName: "Full name",
    nin: "NIN",
    dateOfBirth: "Date of birth",
    accountHolder: "Account holder",
    statementPeriod: "Statement period",
    closingBalance: "Closing balance",
    totalCredits: "Total credits",
    totalDebits: "Total debits",
    businessName: "Business name",
    reportingPeriod: "Reporting period",
    grossRevenue: "Gross revenue",
    deductibleExpenses: "Deductible expenses",
    vendor: "Vendor",
    amount: "Amount",
    date: "Date",
    description: "Description",
  };
  return map[field] || field;
}

export function parseAmount(value) {
  if (!value) return 0;
  const n = Number(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}
