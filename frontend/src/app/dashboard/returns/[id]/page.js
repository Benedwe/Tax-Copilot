"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Nav from "@/components/Nav";
import ReceiptCard from "@/components/ReceiptCard";
import RequireAuth from "@/components/RequireAuth";
import StatusStamp from "@/components/StatusStamp";
import UploadWidget from "@/components/UploadWidget";
import DocumentRow from "@/components/DocumentRow";
import { api } from "@/lib/api";
import { parseAmount } from "@/lib/documentMeta";

const fmt = (n) =>
  `TZS ${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

export default function TaxReturnPage() {
  return (
    <RequireAuth>
      <TaxReturnContent />
    </RequireAuth>
  );
}

function TaxReturnContent() {
  const { id } = useParams();
  const [taxReturn, setTaxReturn] = useState(null);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState("");

  const [grossIncome, setGrossIncome] = useState("");
  const [taxPaid, setTaxPaid] = useState("");
  const [isMonthly, setIsMonthly] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const [newDeduction, setNewDeduction] = useState({ category: "", description: "", amount: "" });

  const load = useCallback(async () => {
    try {
      const { taxReturn } = await api.getTaxReturn(id);
      setTaxReturn(taxReturn);
      if (Number(taxReturn.grossIncome) > 0) setGrossIncome(String(taxReturn.grossIncome));
      if (Number(taxReturn.taxPaid) > 0) setTaxPaid(String(taxReturn.taxPaid));
    } catch (err) {
      setError(err.message);
    }
  }, [id]);

  useEffect(() => {
    load();
    api.deductionCategories().then((d) => setCategories(d.categories));
  }, [load]);

  // Auto-suggest gross income / tax paid from verified salary slips, so
  // the person isn't retyping numbers that were already extracted.
  const suggested = useMemo(() => {
    if (!taxReturn) return { income: 0, paid: 0 };
    let income = 0;
    let paid = 0;
    for (const doc of taxReturn.documents || []) {
      if (doc.type !== "SALARY_SLIP") continue;
      for (const ex of doc.extractions || []) {
        if (ex.field === "grossSalary") income += parseAmount(ex.value);
        if (ex.field === "taxPaid") paid += parseAmount(ex.value);
      }
    }
    return { income, paid };
  }, [taxReturn]);

  // Suggested deductions: receipts that have an amount/vendor extracted
  // but haven't been added as a deduction yet.
  const suggestedDeductions = useMemo(() => {
    if (!taxReturn) return [];
    const existingSourceIds = new Set((taxReturn.deductions || []).map((d) => d.sourceDocumentId).filter(Boolean));
    return (taxReturn.documents || [])
      .filter((doc) => doc.type === "RECEIPT" && !existingSourceIds.has(doc.id))
      .map((doc) => {
        const fields = Object.fromEntries((doc.extractions || []).map((e) => [e.field, e.value]));
        if (!fields.amount) return null;
        const efdNo = fields.efdControlNumber || fields.receiptNumber;
        const isEfd = fields.isEfdCompliant === "true" || Boolean(efdNo);
        return {
          documentId: doc.id,
          vendor: fields.vendor,
          amount: parseAmount(fields.amount),
          efdNo,
          isEfd,
        };
      })
      .filter(Boolean);
  }, [taxReturn]);

  async function acceptSuggestion(s) {
    try {
      await api.addDeduction(id, {
        category: "charity",
        description: s.vendor || "From receipt",
        amount: s.amount,
        sourceDocumentId: s.documentId,
      });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAddDeduction(e) {
    e.preventDefault();
    if (!newDeduction.category || !newDeduction.amount) return;
    try {
      await api.addDeduction(id, {
        category: newDeduction.category,
        description: newDeduction.description || undefined,
        amount: Number(newDeduction.amount),
      });
      setNewDeduction({ category: "", description: "", amount: "" });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRemoveDeduction(deductionId) {
    try {
      await api.removeDeduction(id, deductionId);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCalculate() {
    setCalculating(true);
    setError("");
    try {
      await api.recalculate(id, {
        grossIncome: Number(grossIncome) || 0,
        taxPaid: Number(taxPaid) || 0,
        isMonthly,
      });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setCalculating(false);
    }
  }

  async function handleDownload() {
    setDownloading(true);
    setError("");
    try {
      await api.markReviewed(id);
      await api.downloadPdf(id, `tax-return-${taxReturn.year}.pdf`);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setDownloading(false);
    }
  }

  if (!taxReturn) {
    return (
      <main>
        <Nav />
        <div className="mx-auto max-w-4xl px-6 py-16 text-ink-faint text-sm">
          {error ? <p className="text-rust">{error}</p> : "Loading your return…"}
        </div>
      </main>
    );
  }

  return (
    <main>
      <Nav />
      <div className="mx-auto max-w-4xl px-6 py-16 space-y-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs tracking-[0.2em] uppercase text-brass-dark font-medium mb-2">
              {taxReturn.year} Tax Return
            </p>
            <h1 className="text-3xl text-ink">Your filing workspace</h1>
          </div>
          <StatusStamp status={taxReturn.status} />
        </div>

        {/* Legal & Liability Notice Banner */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-sm p-4 text-xs text-amber-900 space-y-1">
          <p className="font-semibold text-sm">⚠️ Legal Disclaimer & Verification Policy</p>
          <p>
            Tax Copilot provides <strong>reviewed calculation estimates</strong> to assist your tax preparation. It is not tax advice and does not submit filings directly to the Tanzania Revenue Authority (TRA).
          </p>
          <p>
            Please use the <strong>Side-by-Side Review</strong> tool on all uploaded documents to inspect and confirm extracted figures against your physical documents before generating your PDF return summary.
          </p>
        </div>

        {error && <p className="text-sm text-rust">{error}</p>}

        {/* Documents */}
        <section>
          <h2 className="text-lg text-ink mb-4 font-display">1. Documents</h2>
          <ReceiptCard className="p-6 mb-4">
            <UploadWidget taxReturnId={id} onUploaded={load} />
          </ReceiptCard>
          {taxReturn.documents?.length > 0 ? (
            <ReceiptCard className="px-6">
              {taxReturn.documents.map((doc) => (
                <DocumentRow key={doc.id} document={doc} onChanged={load} />
              ))}
            </ReceiptCard>
          ) : (
            <p className="text-sm text-ink-faint">No documents yet — upload one above to get started.</p>
          )}
        </section>

        {/* Deductions */}
        <section>
          <h2 className="text-lg text-ink mb-4 font-display">2. Deductions</h2>

          {suggestedDeductions.length > 0 && (
            <ReceiptCard className="p-6 mb-4">
              <p className="text-xs text-ink-faint mb-3">Found in your uploaded receipts:</p>
              <ul className="space-y-2">
                {suggestedDeductions.map((s) => (
                  <li key={s.documentId} className="flex items-center justify-between text-sm flex-wrap gap-2">
                    <span className="text-ink flex items-center gap-2">
                      {s.vendor || "Receipt"} — <span className="font-mono">{fmt(s.amount)}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium ${
                          s.isEfd ? "bg-forest/10 text-forest border border-forest/20" : "bg-rust/10 text-rust border border-rust/20"
                        }`}
                      >
                        {s.isEfd ? `✓ TRA EFD [${s.efdNo || "Verified"}]` : "⚠ Missing TRA EFD Control No"}
                      </span>
                    </span>
                    <button onClick={() => acceptSuggestion(s)} className="text-forest text-xs hover:underline">
                      ✓ Add as deduction
                    </button>
                  </li>
                ))}
              </ul>
            </ReceiptCard>
          )}

          <ReceiptCard className="p-6">
            {taxReturn.deductions?.length > 0 && (
              <ul className="divide-y divide-paper-line mb-4">
                {taxReturn.deductions.map((d) => (
                  <li key={d.id} className="flex items-center justify-between py-2.5 text-sm">
                    <span className="text-ink">
                      {d.category}
                      {d.description ? ` — ${d.description}` : ""}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-ink">{fmt(d.amount)}</span>
                      <button
                        onClick={() => handleRemoveDeduction(d.id)}
                        className="text-ink-faint hover:text-rust text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <form onSubmit={handleAddDeduction} className="flex flex-col sm:flex-row gap-2">
              <select
                value={newDeduction.category}
                onChange={(e) => setNewDeduction({ ...newDeduction, category: e.target.value })}
                className="input sm:w-56"
              >
                <option value="">Category…</option>
                {categories.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
              <input
                placeholder="Note (optional)"
                value={newDeduction.description}
                onChange={(e) => setNewDeduction({ ...newDeduction, description: e.target.value })}
                className="input flex-1"
              />
              <input
                type="number"
                placeholder="Amount"
                value={newDeduction.amount}
                onChange={(e) => setNewDeduction({ ...newDeduction, amount: e.target.value })}
                className="input sm:w-36 font-mono"
              />
              <button type="submit" className="bg-ink text-paper px-4 py-2 rounded-sm text-sm whitespace-nowrap">
                Add
              </button>
            </form>
          </ReceiptCard>
        </section>

        {/* Review & calculate */}
        <section>
          <h2 className="text-lg text-ink mb-4 font-display">3. Review & calculate</h2>
          <ReceiptCard className="p-6">
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <label className="block">
                <span className="block text-xs font-medium text-ink-soft mb-1.5">
                  Gross income (TZS)
                  {suggested.income > 0 && (
                    <button
                      type="button"
                      onClick={() => setGrossIncome(String(suggested.income))}
                      className="ml-2 text-brass-dark hover:underline"
                    >
                      use {fmt(suggested.income)} from salary slips
                    </button>
                  )}
                </span>
                <input
                  type="number"
                  value={grossIncome}
                  onChange={(e) => setGrossIncome(e.target.value)}
                  className="input font-mono"
                />
              </label>
              <label className="block">
                <span className="block text-xs font-medium text-ink-soft mb-1.5">
                  Tax already paid (TZS)
                  {suggested.paid > 0 && (
                    <button
                      type="button"
                      onClick={() => setTaxPaid(String(suggested.paid))}
                      className="ml-2 text-brass-dark hover:underline"
                    >
                      use {fmt(suggested.paid)}
                    </button>
                  )}
                </span>
                <input
                  type="number"
                  value={taxPaid}
                  onChange={(e) => setTaxPaid(e.target.value)}
                  className="input font-mono"
                />
              </label>
            </div>
            <div className="flex items-center gap-2 text-xs mb-5">
              <button
                type="button"
                onClick={() => setIsMonthly(false)}
                className={`px-3 py-1.5 rounded-full stamp-ring ${!isMonthly ? "bg-ink text-paper" : "text-ink-soft"}`}
              >
                Annual figure
              </button>
              <button
                type="button"
                onClick={() => setIsMonthly(true)}
                className={`px-3 py-1.5 rounded-full stamp-ring ${isMonthly ? "bg-ink text-paper" : "text-ink-soft"}`}
              >
                Monthly figure
              </button>
            </div>
            <button
              onClick={handleCalculate}
              disabled={calculating}
              className="bg-brass text-ink px-5 py-2.5 rounded-sm hover:bg-brass-light transition-colors disabled:opacity-60"
            >
              {calculating ? "Calculating…" : "Calculate"}
            </button>

            {Number(taxReturn.taxDue) > 0 || Number(taxReturn.taxableIncome) > 0 ? (
              <div className="mt-6 pt-6 border-t border-paper-line">
                <dl className="space-y-2 text-sm mb-4">
                  <Row label="Taxable income" value={fmt(taxReturn.taxableIncome)} />
                  <Row label="Tax due" value={fmt(taxReturn.taxDue)} />
                </dl>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-ink">
                    {Number(taxReturn.balance) < 0 ? "Refund due" : "Balance owed"}
                  </span>
                  <span className={`font-mono text-xl ${Number(taxReturn.balance) < 0 ? "text-forest" : "text-rust"}`}>
                    {fmt(Math.abs(taxReturn.balance))}
                  </span>
                </div>
              </div>
            ) : null}
          </ReceiptCard>
        </section>

        {/* Generate */}
        <section>
          <h2 className="text-lg text-ink mb-4 font-display">4. Generate return</h2>
          <ReceiptCard className="p-6 flex items-center justify-between flex-wrap gap-4">
            <p className="text-sm text-ink-soft max-w-md">
              Download a ready-to-file PDF summary. Nothing is submitted to TRA — this version
              stops at a document you can review and file yourself.
            </p>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="bg-ink text-paper px-5 py-2.5 rounded-sm hover:bg-ink-soft transition-colors disabled:opacity-60 whitespace-nowrap"
            >
              {downloading ? "Preparing…" : "Download PDF"}
            </button>
          </ReceiptCard>
        </section>
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
