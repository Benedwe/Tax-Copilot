const STATUS_STYLES = {
  UPLOADED: { label: "Uploaded", color: "#5B6B85", bg: "transparent" },
  PROCESSING: { label: "Reading…", color: "#B8892B", bg: "transparent" },
  EXTRACTED: { label: "Extracted", color: "#1E5E45", bg: "transparent" },
  NEEDS_REVIEW: { label: "Needs review", color: "#A63D2F", bg: "transparent" },
  VERIFIED: { label: "Verified", color: "#1E5E45", bg: "#DCEAE3" },
  FAILED: { label: "Failed", color: "#A63D2F", bg: "#F3DFDA" },
  DRAFT: { label: "Draft", color: "#5B6B85", bg: "transparent" },
  DOCUMENTS_PENDING: { label: "Documents pending", color: "#B8892B", bg: "transparent" },
  READY_FOR_REVIEW: { label: "Ready for review", color: "#B8892B", bg: "#F7EED9" },
  REVIEWED: { label: "Reviewed", color: "#1E5E45", bg: "#DCEAE3" },
  GENERATED: { label: "Generated", color: "#1E5E45", bg: "#DCEAE3" },
};

// A small circular "stamp" indicator — the recurring signature motif
// used everywhere a document or return has a status.
export default function StatusStamp({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.DRAFT;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium stamp-ring"
      style={{ color: s.color, backgroundColor: s.bg }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: s.color }} />
      {s.label}
    </span>
  );
}
