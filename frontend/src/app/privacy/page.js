import Link from "next/link";
import Nav from "@/components/Nav";
import ReceiptCard from "@/components/ReceiptCard";

export const metadata = {
  title: "Privacy Policy — Tax Copilot",
  description: "Learn how Tax Copilot collects, protects, and handles your TRA TIN numbers, financial documents, and tax return data.",
};

export default function PrivacyPolicyPage() {
  return (
    <main>
      <Nav />
      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="mb-10 border-b border-paper-line pb-6">
          <p className="text-xs tracking-[0.2em] uppercase text-brass-dark font-medium mb-2">Legal & Privacy</p>
          <h1 className="text-3xl font-display text-ink mb-2">Privacy Policy</h1>
          <p className="text-sm text-ink-soft">Last updated: August 9, 2026</p>
        </div>

        <ReceiptCard className="p-8 space-y-8 text-ink leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-display text-ink font-semibold border-b border-paper-line pb-1">
              1. Introduction & Overview
            </h2>
            <p className="text-sm text-ink-soft">
              Tax Copilot (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) respects your privacy and is committed to safeguarding your personal data and sensitive financial documents. This Privacy Policy explains how we collect, use, store, process, and protect your information when you use the Tax Copilot application and services designed for taxpayers in Tanzania.
            </p>
            <p className="text-sm text-ink-soft">
              By registering an account or uploading documents to Tax Copilot, you agree to the collection and use of information in accordance with this policy and applicable Tanzanian data protection frameworks.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-display text-ink font-semibold border-b border-paper-line pb-1">
              2. Information We Collect
            </h2>
            <p className="text-sm text-ink-soft">
              To calculate your tax liabilities accurately and ensure compliance with Tanzania Revenue Authority (TRA) regulations, we collect the following categories of information:
            </p>
            <ul className="list-disc pl-5 text-sm text-ink-soft space-y-2">
              <li>
                <strong>Compulsory Account & Identity Data:</strong> Full name, valid email address, account password, and your compulsory 9-digit TRA Taxpayer Identification Number (TIN).
              </li>
              <li>
                <strong>Uploaded Financial & Tax Documents:</strong> Images or PDFs of salary slips, bank statements, business income records, National ID cards (NIN), and TRA Electronic Fiscal Device (EFD / VFD) receipt vouchers.
              </li>
              <li>
                <strong>Extracted Tax Figures:</strong> Figures extracted from your documents, including gross income, PAYE tax withheld, pension contributions (NSSF/PSSSF), and EFD Control Numbers.
              </li>
              <li>
                <strong>System & Usage Logs:</strong> IP address, device identifiers, browser type, and interaction logs captured for security auditing and rate-limiting purposes.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-display text-ink font-semibold border-b border-paper-line pb-1">
              3. How We Use Your Information
            </h2>
            <p className="text-sm text-ink-soft">
              We process your data strictly for legitimate tax assistance purposes:
            </p>
            <ul className="list-disc pl-5 text-sm text-ink-soft space-y-1.5">
              <li>To calculate resident individual PAYE tax liabilities under the Tanzania Income Tax Act Cap 332.</li>
              <li>To extract text and numerical figures from uploaded documents using Optical Character Recognition (OCR) and Artificial Intelligence.</li>
              <li>To verify Electronic Fiscal Device (EFD) receipt numbers for statutory tax deduction claims under Section 35 of the Tax Administration Act Cap 438.</li>
              <li>To generate downloadable, ready-to-file PDF tax return summaries.</li>
              <li>To authenticate your account session and prevent unauthorized access to your tax records.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-display text-ink font-semibold border-b border-paper-line pb-1">
              4. AI Document Processing & Privacy Guarantees
            </h2>
            <div className="bg-paper-light border border-paper-line p-4 rounded text-xs space-y-2 text-ink-soft">
              <p className="font-semibold text-ink text-sm">🔒 Zero AI Model Training Policy</p>
              <p>
                Your uploaded documents, salary slips, and extracted tax data are strictly confidential. We <strong>NEVER</strong> sell your data to third parties, nor do we use your financial documents or TIN information to train public or commercial AI models.
              </p>
              <p>
                Artificial Intelligence models process your text transiently in isolated server sessions solely to output structured JSON fields for your manual side-by-side review.
              </p>
            </div>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg font-display text-ink font-semibold border-b border-paper-line pb-1">
              5. TRA Statutory Record Retention & Security
            </h2>
            <p className="text-sm text-ink-soft">
              Under Section 35 of the Tanzania Tax Administration Act Cap 438, taxpayers are required to retain records of all receipts and returns for a period of five (5) years.
            </p>
            <ul className="list-disc pl-5 text-sm text-ink-soft space-y-1.5">
              <li>
                <strong>Data Storage & Encryption:</strong> All files and database entries are stored in encrypted databases utilizing industry-standard AES-256 encryption at rest and TLS 1.3 in transit.
              </li>
              <li>
                <strong>Row Level Security (RLS):</strong> Database tables enforce isolated access policies ensuring that only you (the authenticated account holder with matching credentials) can access your tax documents.
              </li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-lg font-display text-ink font-semibold border-b border-paper-line pb-1">
              6. Your Rights & Data Controls
            </h2>
            <p className="text-sm text-ink-soft">You retain full control over your tax records:</p>
            <ul className="list-disc pl-5 text-sm text-ink-soft space-y-1.5">
              <li><strong>Access & Review:</strong> View and inspect all extracted fields side-by-side against original documents at any time.</li>
              <li><strong>Correction:</strong> Manually adjust any extracted income, deduction, or TIN figure before return calculation.</li>
              <li><strong>Deletion:</strong> Delete uploaded document files or clear your return history permanently from your dashboard.</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section className="space-y-3 border-t border-paper-line pt-4">
            <h2 className="text-lg font-display text-ink font-semibold">7. Contact Us</h2>
            <p className="text-sm text-ink-soft">
              If you have questions regarding this Privacy Policy, your compulsory TIN registration, or data protection practices, please contact our support team at{" "}
              <a href="mailto:privacy@taxcopilot.tz" className="text-ink underline">
                privacy@taxcopilot.tz
              </a>.
            </p>
          </section>
        </ReceiptCard>

        <div className="mt-8 text-center">
          <Link href="/" className="text-sm text-ink hover:underline">
            ← Back to Tax Copilot Home
          </Link>
        </div>
      </div>
    </main>
  );
}
