// The hero's signature element: a large circular seal, styled after an
// official revenue-authority stamp, with the product name arcing
// around its rim. It's the one bold flourish on an otherwise quiet page.
export default function SealHero({ size = 260 }) {
  const r = 118;
  const cx = 130;
  const cy = 130;
  return (
    <svg viewBox="0 0 260 260" width={size} height={size} role="img" aria-label="Tax Copilot seal">
      <defs>
        <path id="sealArcTop" d={`M ${cx - r},${cy} a ${r},${r} 0 1,1 ${r * 2},0`} fill="none" />
        <path id="sealArcBottom" d={`M ${cx - r},${cy} a ${r},${r} 0 1,0 ${r * 2},0`} fill="none" />
      </defs>

      <circle cx={cx} cy={cy} r={122} fill="none" stroke="#B8892B" strokeWidth="1" opacity="0.5" />
      <circle cx={cx} cy={cy} r={108} fill="none" stroke="#12213A" strokeWidth="2" />
      <circle cx={cx} cy={cy} r={100} fill="none" stroke="#12213A" strokeWidth="1" />

      <text fontSize="12.5" letterSpacing="3" fill="#12213A" fontFamily="var(--font-body)">
        <textPath href="#sealArcTop" startOffset="50%" textAnchor="middle">
          TAX COPILOT · EST. 2026
        </textPath>
      </text>
      <text fontSize="12.5" letterSpacing="3" fill="#12213A" fontFamily="var(--font-body)">
        <textPath href="#sealArcBottom" startOffset="50%" textAnchor="middle">
          FOR TRA INDIVIDUAL TAXPAYERS
        </textPath>
      </text>

      {/* Center mark: a checkmark inside a ledger tick-box, standing in
          for "reviewed and ready" */}
      <rect x={cx - 34} y={cy - 34} width="68" height="68" rx="4" fill="none" stroke="#B8892B" strokeWidth="1.5" />
      <path
        d={`M ${cx - 18} ${cy + 2} l 12 14 l 24 -30`}
        fill="none"
        stroke="#1E5E45"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
