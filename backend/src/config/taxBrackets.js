/**
 * TRA (Tanzania Revenue Authority) resident individual PAYE bands.
 *
 * IMPORTANT: TRA typically revises these bands in the annual Finance Act
 * (usually effective each July). The figures below reflect a commonly
 * published recent schedule, kept here as a single editable source of
 * truth — verify against the current TRA PAYE guide / Finance Act before
 * relying on this for a real filing, and update this file when rates change.
 * This tool provides an estimate, not tax advice.
 *
 * Bands are MONTHLY, in TZS, for resident individuals with employment
 * income. `rate` applies to the amount of income that falls within the
 * band; `base` is the cumulative tax owed on all lower bands.
 */
export const PAYE_BANDS_MONTHLY_TZS = [
  { upTo: 270000, rate: 0, base: 0 },
  { upTo: 520000, rate: 0.08, base: 0 },
  { upTo: 760000, rate: 0.2, base: 20000 },
  { upTo: 1000000, rate: 0.25, base: 68000 },
  { upTo: Infinity, rate: 0.3, base: 128000 },
];

export const TAX_YEAR_LABEL = "2025/2026 (verify against current TRA schedule)";

/**
 * Deduction categories the Deduction Finder recognizes, mapped to the
 * document types that typically evidence them. This is a starting
 * taxonomy, not an authoritative list of what TRA allows — some of these
 * (e.g. broad "education" or "medical" deductions) are NOT currently
 * general PAYE deductions under Tanzanian law and are included here as
 * placeholders for jurisdictions/rules you configure later. Review and
 * adjust before using this for real filings.
 */
export const DEDUCTION_CATEGORIES = [
  { key: "retirement_contribution", label: "Approved retirement fund contribution", documentTypes: ["SALARY_SLIP", "BANK_STATEMENT"] },
  { key: "business_expense", label: "Deductible business expense", documentTypes: ["BUSINESS_INCOME", "RECEIPT"] },
  { key: "charity", label: "Approved charitable donation", documentTypes: ["RECEIPT"] },
  { key: "insurance", label: "Life/medical insurance premium", documentTypes: ["RECEIPT", "BANK_STATEMENT"] },
  { key: "other", label: "Other", documentTypes: ["OTHER"] },
];
