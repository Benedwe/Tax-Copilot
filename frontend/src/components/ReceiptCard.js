export default function ReceiptCard({ children, className = "" }) {
  return (
    <div
      className={`receipt-edge bg-paper-raised border border-paper-line rounded-sm shadow-[0_1px_0_#E4DCC5] pt-5 ${className}`}
    >
      {children}
    </div>
  );
}
