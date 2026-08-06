import { PAYE_BANDS_MONTHLY_TZS, TAX_YEAR_LABEL } from "../config/taxBrackets.js";

/**
 * Calculates PAYE-style tax on a monthly income figure using the
 * configured bands. Returns the tax due plus a breakdown per band so
 * the UI can show its work (builds trust — nobody likes a black-box
 * tax number).
 */
export function calculateMonthlyTax(monthlyIncome) {
  const income = Number(monthlyIncome) || 0;
  let previousCap = 0;
  const breakdown = [];
  let tax = 0;

  for (const band of PAYE_BANDS_MONTHLY_TZS) {
    if (income <= previousCap) break;
    const taxableInBand = Math.min(income, band.upTo) - previousCap;
    const bandTax = Math.max(taxableInBand, 0) * band.rate;
    if (taxableInBand > 0) {
      breakdown.push({
        from: previousCap,
        to: band.upTo === Infinity ? null : band.upTo,
        rate: band.rate,
        taxableAmount: round2(taxableInBand),
        taxForBand: round2(bandTax),
      });
    }
    tax += bandTax;
    previousCap = band.upTo;
  }

  return {
    monthlyIncome: round2(income),
    taxDue: round2(tax),
    effectiveRate: income > 0 ? round4(tax / income) : 0,
    breakdown,
    bandsVersion: TAX_YEAR_LABEL,
  };
}

/**
 * Annualizes a monthly calculation — used when a return aggregates a
 * full year of salary slips. This simple approach (12x monthly tax)
 * approximates PAYE withholding; a full annual assessment can differ
 * once deductions, reliefs, and non-employment income are factored in.
 */
export function calculateAnnualTaxFromMonthlyIncome(monthlyIncome) {
  const monthly = calculateMonthlyTax(monthlyIncome);
  return {
    ...monthly,
    annualIncome: round2(monthly.monthlyIncome * 12),
    annualTaxDue: round2(monthly.taxDue * 12),
  };
}

/**
 * Full return summary: gross income minus deductions, tax due, vs. tax
 * already paid (e.g. withheld via PAYE), yielding a balance owed or a
 * refund.
 */
export function summarizeReturn({ grossIncome, deductions = [], taxPaid = 0, isMonthly = true }) {
  const totalDeductions = deductions.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const taxableIncome = Math.max(Number(grossIncome) - totalDeductions, 0);

  const calc = isMonthly
    ? calculateMonthlyTax(taxableIncome)
    : calculateAnnualTaxFromMonthlyIncome(taxableIncome / 12);

  const taxDue = isMonthly ? calc.taxDue : calc.annualTaxDue;
  const balance = round2(taxDue - Number(taxPaid || 0));

  return {
    grossIncome: round2(Number(grossIncome) || 0),
    totalDeductions: round2(totalDeductions),
    taxableIncome: round2(taxableIncome),
    taxDue: round2(taxDue),
    taxPaid: round2(Number(taxPaid) || 0),
    balance, // positive = amount owed to TRA, negative = refund due to taxpayer
    isRefund: balance < 0,
    breakdown: calc.breakdown,
    bandsVersion: TAX_YEAR_LABEL,
  };
}

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
function round4(n) {
  return Math.round((n + Number.EPSILON) * 10000) / 10000;
}
