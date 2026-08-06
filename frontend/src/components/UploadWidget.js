"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { DOCUMENT_TYPES } from "@/lib/documentMeta";

export default function UploadWidget({ taxReturnId, onUploaded }) {
  const [type, setType] = useState("SALARY_SLIP");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);
      formData.append("taxReturnId", taxReturnId);
      await api.uploadDocument(formData);
      setFile(null);
      e.target.reset();
      onUploaded?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <form onSubmit={handleUpload} className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
      <label className="flex-1">
        <span className="block text-xs font-medium text-ink-soft mb-1.5">Document type</span>
        <select value={type} onChange={(e) => setType(e.target.value)} className="input">
          {DOCUMENT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex-1">
        <span className="block text-xs font-medium text-ink-soft mb-1.5">File (PDF, JPG, PNG)</span>
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="input file:mr-3 file:py-1 file:px-3 file:rounded-sm file:border-0 file:bg-ink file:text-paper file:text-xs"
          required
        />
      </label>
      <button
        type="submit"
        disabled={uploading}
        className="bg-brass text-ink px-5 py-2 rounded-sm hover:bg-brass-light transition-colors disabled:opacity-60 whitespace-nowrap"
      >
        {uploading ? "Uploading…" : "Upload"}
      </button>
      {error && <p className="text-xs text-rust sm:ml-2">{error}</p>}
    </form>
  );
}
