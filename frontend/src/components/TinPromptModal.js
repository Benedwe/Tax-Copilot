"use client";

import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";

export default function TinPromptModal() {
  const { user, hasValidTin, updateUserTin } = useAuth();
  const [tin, setTin] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  if (!user || hasValidTin) return null;

  function handleTinChange(e) {
    const raw = e.target.value;
    const digits = raw.replace(/\D/g, "").slice(0, 9);
    if (digits.length <= 3) {
      setTin(digits);
    } else if (digits.length <= 6) {
      setTin(`${digits.slice(0, 3)}-${digits.slice(3)}`);
    } else {
      setTin(`${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const cleanDigits = tin.replace(/\D/g, "");
    if (cleanDigits.length !== 9) {
      setError("Please enter a valid 9-digit TRA Taxpayer Identification Number.");
      return;
    }

    setSaving(true);
    try {
      await updateUserTin(tin);
    } catch (err) {
      setError(err.message || "Failed to update TIN.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-paper border-2 border-amber-600 shadow-2xl rounded-lg max-w-md w-full p-6 text-ink">
        <div className="flex items-center gap-3 mb-3 text-amber-700 font-semibold">
          <span className="text-2xl">⚠️</span>
          <h2 className="text-lg">Compulsory TRA TIN Required</h2>
        </div>
        <p className="text-xs text-ink-soft mb-4 leading-relaxed">
          Under Tanzania Revenue Authority (TRA) regulations (Tax Administration Act Cap 438), all taxpayers using Tax Copilot must register a valid 9-digit Taxpayer Identification Number (TIN) to file returns or claim deductions.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1">
              TRA TIN Number (9 Digits)
            </label>
            <input
              type="text"
              required
              value={tin}
              onChange={handleTinChange}
              placeholder="123-456-789"
              className="w-full px-3 py-2 border border-paper-line rounded text-sm font-mono tracking-widest bg-white focus:outline-none focus:ring-2 focus:ring-ink"
            />
          </div>

          {error && (
            <div className="p-2.5 bg-rust/10 border border-rust/30 rounded text-xs text-rust font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-medium text-sm rounded shadow transition-colors disabled:opacity-50"
          >
            {saving ? "Saving & Validating TIN…" : "Save Compulsory TRA TIN"}
          </button>
        </form>
      </div>
    </div>
  );
}
