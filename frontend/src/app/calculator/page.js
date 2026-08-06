"use client";

import { useState } from "react";
import Nav from "@/components/Nav";
import ReceiptCard from "@/components/ReceiptCard";
import { api } from "@/lib/api";

const fmt = (n) =>
  `TZS ${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

export default function CalculatorPage() {
  const [income, setIncome] = useState("");
  const [isMonthly, setIsMonthly] = useState(true);
  const [taxPaid, setTaxPaid] = useState("");
  const [deductions, setDeductions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function addDeduction() {
    setDeductions([...deductions, { category: "", amount: "" }]);
  }
  function updateDeduction(i, key, value) {
    const next = [...deductions];
    next[i][key] = value;
    setDeductions(next);
  }
  function removeDeduction(i) {
    setDeductions(deductions.filter((_, idx) => idx !== i));
  }

  async function handleCalculate(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { summary } = await api.quickCalculate({
        grossIncome: Number(income) || 0,
        isMonthly,
        taxPaid: Number(taxPaid) || 0,
        deductions: deductions
          .filter((d) => d.category && d.amount)
          .map((d) => ({ category: d.category, amount: Number(d.amount) || 0 })),
      });
      setSummary(summary);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <Nav />
      <div className="mx-auto max-w-4xl px-6 py-16">
        <p className="text-xs tracking-[0.2em] uppercase text-brass-dark font-medium mb-3">Tax calculator</p>
        <h1 className="text-3xl text-ink mb-2">See what you&rsquo;d owe — no account needed.</h1>
        <p className="text-ink-soft mb-10 max-w-2xl">
          A quick estimate using TRA&rsquo;s resident PAYE bands. This is a planning tool, not a filed
          return — figures should be checked against current TRA guidance.
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          <ReceiptCard className="p-6">
            <form onSubmit={handleCalculate} className="space-y-5">
              <div className="flex gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setIsMonthly(true)}
                  className={`px-3 py-1.5 rounded-full stamp-ring ${isMonthly ? "bg-ink text-paper" : "text-ink-soft"}`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setIsMonthly(false)}
                  className={`px-3 py-1.5 rounded-full stamp-ring ${!isMonthly ? "bg-ink text-paper" : "text-ink-soft"}`}
                >
                  Annual
                </button>
              </div>

              <label className="block">
                <span className="block text-xs font-medium text-ink-soft mb-1.5">
                  Gross {isMonthly ? "monthly" : "annual"} income (TZS)
                </span>
                <input
                  type="number"
                  min="0"
                  required
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  className="input font-mono"
                  placeholder="4,500,000"
                />
              </label>

              <label className="block">
                <span className="block text-xs font-medium text-ink-soft mb-1.5">Tax already paid / withheld (TZS)</span>
                <input
                  type="number"
                  min="0"
                  value={taxPaid}
                  onChange={(e) => setTaxPaid(e.target.value)}
                  className="input font-mono"
                  placeholder="0"
                />
              </label>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="block text-xs font-medium text-ink-soft">Deductions</span>
                  <button type="button" onClick={addDeduction} className="text-xs text-brass-dark hover:underline">
                    + Add deduction
                  </button>
                </div>
                <div className="space-y-2">
                  {deductions.map((d, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        placeholder="e.g. Retirement fund"
                        value={d.category}
                        onChange={(e) => updateDeduction(i, "category", e.target.value)}
                        className="input flex-1"
                      />
                      <input
                        type="number"
                        placeholder="Amount"
                        value={d.amount}
                        onChange={(e) => updateDeduction(i, "amount", e.target.value)}
                        className="input w-32 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => removeDeduction(i)}
                        className="text-ink-faint hover:text-rust px-2"
                        aria-label="Remove deduction"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {error && <p className="text-sm text-rust">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-ink text-paper py-2.5 rounded-sm hover:bg-ink-soft transition-colors disabled:opacity-60"
              >
                {loading ? "Calculating…" : "Calculate"}
              </button>
            </form>
          </ReceiptCard>

          <ReceiptCard className="p-6">
            {!summary ? (
              <div className="h-full flex items-center justify-center text-center text-ink-faint text-sm py-16">
                Your estimate will appear here.
              </div>
            ) : (
              <div>
                <h3 className="text-lg text-ink mb-4 font-display">Estimate</h3>
                <dl className="space-y-2.5 text-sm">
                  <Row label="Gross income" value={fmt(summary.grossIncome)} />
                  <Row label="Total deductions" value={fmt(summary.totalDeductions)} />
                  <Row label="Taxable income" value={fmt(summary.taxableIncome)} />
                  <Row label="Tax due" value={fmt(summary.taxDue)} />
                  <Row label="Tax already paid" value={fmt(summary.taxPaid)} />
                </dl>
                <div className="mt-4 pt-4 border-t border-paper-line flex items-center justify-between">
                  <span className="text-sm font-medium text-ink">{summary.isRefund ? "Refund due" : "Balance owed"}</span>
                  <span className={`font-mono text-lg ${summary.isRefund ? "text-forest" : "text-rust"}`}>
                    {fmt(Math.abs(summary.balance))}
                  </span>
                </div>

                {summary.breakdown?.length > 0 && (
                  <details className="mt-5 text-xs text-ink-soft">
                    <summary className="cursor-pointer text-brass-dark">Show the band-by-band working</summary>
                    <table className="w-full mt-3 font-mono text-xs">
                      <tbody>
                        {summary.breakdown.map((b, i) => (
                          <tr key={i} className="border-t border-paper-line">
                            <td className="py-1.5 pr-2">
                              {fmt(b.from)}–{b.to ? fmt(b.to) : "∞"}
                            </td>
                            <td className="py-1.5 pr-2">{(b.rate * 100).toFixed(0)}%</td>
                            <td className="py-1.5 text-right">{fmt(b.taxForBand)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </details>
                )}
                <p className="mt-5 text-[11px] text-ink-faint leading-relaxed">
                  Bands used: {summary.bandsVersion}. Estimate only — verify against current TRA guidance.
                </p>
              </div>
            )}
          </ReceiptCard>
        </div>
      </div>
    </main>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <dt className="text-ink-soft">{label}</dt>
      <dd className="font-mono text-ink">{value}</dd>
    </div>
  );
}
