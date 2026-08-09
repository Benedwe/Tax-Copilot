import Link from "next/link";
import Nav from "@/components/Nav";
import ReceiptCard from "@/components/ReceiptCard";
import SealHero from "@/components/SealHero";

const STEPS = [
  {
    n: "01",
    title: "Upload what you already have",
    body: "Salary slips, bank statements, receipts, your ID. Photos or PDFs, whatever's on your phone.",
  },
  {
    n: "02",
    title: "AI reads it for you",
    body: "Gross salary, TIN numbers, employer details — pulled out field by field, so you don't retype a thing.",
  },
  {
    n: "03",
    title: "You review, we calculate",
    body: "Check the numbers against your documents, and get a tax-due figure with the working shown.",
  },
];

const DEDUCTIONS = [
  { label: "Approved retirement contributions", found: true },
  { label: "Deductible business expenses", found: true },
  { label: "Charitable donations", found: true },
  { label: "Life & medical insurance premiums", found: false },
];

export default function Home() {
  return (
    <main>
      <Nav />

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-20 grid md:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
        <div>
          <p className="text-xs tracking-[0.2em] uppercase text-brass-dark font-medium mb-4">
            For TRA individual taxpayers
          </p>
          <h1 className="text-4xl md:text-5xl leading-[1.08] text-ink">
            File your taxes like you&rsquo;re just <em className="not-italic text-brass-dark">filling in the blanks.</em>
          </h1>
          <p className="mt-6 text-lg text-ink-soft max-w-lg">
            Upload your documents. Our AI reads the numbers, finds the deductions you qualify for,
            and hands you a ready-to-file return — no tax jargon, no blank page.
          </p>
          <div className="mt-8 flex items-center gap-4">
            <Link href="/register" className="bg-ink text-paper px-6 py-3 rounded-sm hover:bg-ink-soft transition-colors">
              Start your return
            </Link>
            <Link href="/calculator" className="text-ink underline decoration-paper-line underline-offset-4 hover:decoration-ink">
              Try the calculator first
            </Link>
          </div>
          <p className="mt-6 text-xs text-ink-faint max-w-md">
            No submission to TRA in this version — you get a reviewed, ready-to-file PDF. Direct filing is on the roadmap.
          </p>
        </div>
        <div className="flex justify-center md:justify-end">
          <SealHero size={280} />
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-paper-line bg-ruled-paper">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-2xl text-ink mb-10">How it works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {STEPS.map((step) => (
              <ReceiptCard key={step.n} className="p-6">
                <span className="font-mono text-xs text-brass-dark">{step.n}</span>
                <h3 className="mt-2 text-lg text-ink font-display">{step.title}</h3>
                <p className="mt-2 text-sm text-ink-soft leading-relaxed">{step.body}</p>
              </ReceiptCard>
            ))}
          </div>
        </div>
      </section>

      {/* Deduction finder preview */}
      <section className="mx-auto max-w-6xl px-6 py-20 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <p className="text-xs tracking-[0.2em] uppercase text-brass-dark font-medium mb-3">Deduction finder</p>
          <h2 className="text-2xl text-ink mb-4">We check your documents against what TRA allows.</h2>
          <p className="text-ink-soft leading-relaxed">
            Instead of asking you to know the tax code, we read your receipts and statements and
            flag what qualifies — so nothing gets left on the table, and nothing gets claimed by mistake.
          </p>
        </div>
        <ReceiptCard className="p-6">
          <ul className="divide-y divide-paper-line">
            {DEDUCTIONS.map((d) => (
              <li key={d.label} className="flex items-center justify-between py-3">
                <span className="text-sm text-ink">{d.label}</span>
                <span className={`text-xs font-medium ${d.found ? "text-forest" : "text-ink-faint"}`}>
                  {d.found ? "✓ Found in your documents" : "Not found yet"}
                </span>
              </li>
            ))}
          </ul>
        </ReceiptCard>
      </section>

      {/* CTA footer band */}
      <section className="bg-ink text-paper">
        <div className="mx-auto max-w-6xl px-6 py-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-display">Your return doesn&rsquo;t file itself. But it almost does.</h2>
            <p className="mt-2 text-paper/70 max-w-md">Start with one document — see how the extraction works.</p>
          </div>
          <Link href="/register" className="bg-brass text-ink px-6 py-3 rounded-sm hover:bg-brass-light transition-colors whitespace-nowrap">
            Start your return
          </Link>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-6 py-8 text-xs text-ink-faint flex justify-between">
        <span>© 2026 Taxcopilot</span>
        <span>TRA individual taxpayers · Tanzania</span>
      </footer>
    </main>
  );
}
