"use client";

import { useState, useEffect } from "react";
import StatusStamp from "./StatusStamp";
import { api } from "@/lib/api";
import { typeLabel, fieldLabel } from "@/lib/documentMeta";

export default function DocumentRow({ document, onChanged }) {
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editedFields, setEditedFields] = useState({});
  const [verifiedChecked, setVerifiedChecked] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (document?.extractions) {
      const map = {};
      document.extractions.forEach((ex) => {
        map[ex.field] = ex.value;
      });
      setEditedFields(map);
    }
  }, [document]);

  async function handleProcess() {
    setBusy(true);
    setError("");
    try {
      await api.processDocument(document.id);
      setOpen(true);
      onChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveAndVerify() {
    setBusy(true);
    setError("");
    try {
      const payload = Object.entries(editedFields).map(([field, value]) => ({ field, value }));
      await api.updateDocumentExtractions(document.id, payload);
      setEditing(false);
      onChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    try {
      await api.deleteDocument(document.id);
      onChanged?.();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  const isReceipt = document.type === "RECEIPT";
  const efdControlNo = editedFields["efdControlNumber"] || editedFields["receiptNumber"];
  const isEfdValid = editedFields["isEfdCompliant"] === "true" || Boolean(efdControlNo);

  const canProcess = document.status === "UPLOADED" || document.status === "FAILED";
  const canVerify = document.status === "EXTRACTED" || document.status === "NEEDS_REVIEW";

  return (
    <div className="border-t border-paper-line first:border-t-0">
      <div className="py-3 flex items-center gap-4">
        <button
          onClick={() => setOpen(!open)}
          className="flex-1 text-left flex items-center gap-3 min-w-0"
        >
          <span className="text-ink text-sm truncate">{document.fileName}</span>
          <span className="text-xs text-ink-faint whitespace-nowrap">{typeLabel(document.type)}</span>
          {isReceipt && (
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium ${
                isEfdValid ? "bg-forest/10 text-forest border border-forest/20" : "bg-rust/10 text-rust border border-rust/20"
              }`}
            >
              {isEfdValid ? `✓ TRA EFD [${efdControlNo || "Verified"}]` : "⚠ Missing TRA EFD Control No"}
            </span>
          )}
        </button>
        <StatusStamp status={document.status} />
        <div className="flex items-center gap-2 text-xs">
          {canProcess && (
            <button onClick={handleProcess} disabled={busy} className="text-brass-dark hover:underline disabled:opacity-50">
              {busy ? "Reading…" : "Read with AI"}
            </button>
          )}
          {(canVerify || document.extractions?.length > 0) && (
            <button
              onClick={() => {
                setOpen(true);
                setEditing(!editing);
              }}
              disabled={busy}
              className="text-brass-dark hover:underline disabled:opacity-50"
            >
              {editing ? "Close Review" : "Side-by-Side Review"}
            </button>
          )}
          <button onClick={handleDelete} disabled={busy} className="text-ink-faint hover:text-rust disabled:opacity-50">
            Remove
          </button>
        </div>
      </div>

      {open && document.extractions?.length > 0 && (
        <div className="pb-4 pl-1 space-y-3">
          {/* TRA EFD Receipt Alert Banner */}
          {isReceipt && (
            <div
              className={`p-3 text-xs rounded border ${
                isEfdValid ? "bg-forest/5 border-forest/20 text-forest" : "bg-amber-500/10 border-amber-500/30 text-amber-900"
              }`}
            >
              {isEfdValid ? (
                <p>
                  <strong>✓ Valid TRA Fiscal Receipt:</strong> EFD Control Number detected (<code>{efdControlNo}</code>). Allowed as a tax deduction under TRA guidelines.
                </p>
              ) : (
                <p>
                  <strong>⚠ TRA Receipt Notice:</strong> Missing Electronic Fiscal Device (EFD) Control Number. TRA requires valid EFD receipts for tax deductibility. Without an EFD number, this deduction may be disallowed by TRA during audits.
                </p>
              )}
            </div>
          )}

          {/* Side-by-Side Verification Panel */}
          <div className="bg-paper rounded-sm p-4 border border-paper-line space-y-4">
            <div className="flex items-center justify-between border-b border-paper-line pb-2">
              <span className="text-xs font-semibold text-ink uppercase tracking-wider">
                Side-by-Side Document Extractions ({editing ? "Edit Mode" : "Read-only"})
              </span>
              <button
                type="button"
                onClick={() => setEditing(!editing)}
                className="text-xs text-brass-dark hover:underline font-medium"
              >
                {editing ? "Switch to View Mode" : "✎ Edit Extracted Figures"}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {document.extractions.map((ex) => (
                <div key={ex.id} className="space-y-1">
                  <label className="block text-xs text-ink-faint">{fieldLabel(ex.field)}</label>
                  {editing ? (
                    <input
                      type="text"
                      value={editedFields[ex.field] ?? ex.value}
                      onChange={(e) => setEditedFields({ ...editedFields, [ex.field]: e.target.value })}
                      className="input w-full font-mono text-xs"
                    />
                  ) : (
                    <div className="font-mono text-ink text-xs p-2 bg-paper-light rounded border border-paper-line flex justify-between items-center">
                      <span>{editedFields[ex.field] ?? ex.value}</span>
                      {ex.confidence < 0.6 && (
                        <span className="text-rust text-[10px]" title="Low confidence — please verify">
                          ⚠ Check figure
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {editing && (
              <div className="pt-3 border-t border-paper-line space-y-3">
                <label className="flex items-start gap-2 text-xs text-ink-soft cursor-pointer">
                  <input
                    type="checkbox"
                    checked={verifiedChecked}
                    onChange={(e) => setVerifiedChecked(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span>
                    I have manually inspected these figures against my physical document and approve them for tax calculation.
                  </span>
                </label>

                <button
                  onClick={handleSaveAndVerify}
                  disabled={busy || !verifiedChecked}
                  className="bg-forest text-paper text-xs px-4 py-2 rounded font-medium disabled:opacity-50 hover:bg-forest/90 transition-colors"
                >
                  {busy ? "Saving…" : "Save & Confirm Extractions"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {error && <p className="text-xs text-rust pb-2">{error}</p>}
    </div>
  );
}
