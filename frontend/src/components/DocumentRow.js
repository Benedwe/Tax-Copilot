"use client";

import { useState } from "react";
import StatusStamp from "./StatusStamp";
import { api } from "@/lib/api";
import { typeLabel, fieldLabel } from "@/lib/documentMeta";

export default function DocumentRow({ document, onChanged }) {
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

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

  async function handleVerify() {
    setBusy(true);
    setError("");
    try {
      await api.verifyDocument(document.id);
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
        </button>
        <StatusStamp status={document.status} />
        <div className="flex items-center gap-2 text-xs">
          {canProcess && (
            <button onClick={handleProcess} disabled={busy} className="text-brass-dark hover:underline disabled:opacity-50">
              {busy ? "Reading…" : "Read with AI"}
            </button>
          )}
          {canVerify && (
            <button onClick={handleVerify} disabled={busy} className="text-forest hover:underline disabled:opacity-50">
              Confirm correct
            </button>
          )}
          <button onClick={handleDelete} disabled={busy} className="text-ink-faint hover:text-rust disabled:opacity-50">
            Remove
          </button>
        </div>
      </div>

      {open && document.extractions?.length > 0 && (
        <div className="pb-4 pl-1">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm bg-paper rounded-sm p-4 border border-paper-line">
            {document.extractions.map((ex) => (
              <div key={ex.id} className="contents">
                <dt className="text-ink-faint">{fieldLabel(ex.field)}</dt>
                <dd className="font-mono text-ink flex items-center gap-2">
                  {ex.value}
                  {ex.confidence < 0.6 && (
                    <span className="text-rust text-xs" title="Low confidence — please check">
                      ⚠
                    </span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}
      {error && <p className="text-xs text-rust pb-2">{error}</p>}
    </div>
  );
}
