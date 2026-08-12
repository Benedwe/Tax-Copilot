import Link from "next/link";
import Nav from "@/components/Nav";
import FaqSection from "@/components/FaqSection";

export const metadata = {
  title: "Frequently Asked Questions — Tax Copilot",
  description: "Find answers to common questions about TRA individual tax filing, PAYE calculations, document scanning, and security in Tanzania.",
};

export default function FaqPage() {
  return (
    <main className="min-h-screen bg-paper flex flex-col justify-between">
      <div>
        <Nav />
        <div className="pt-8">
          <FaqSection />
        </div>
      </div>

      <footer className="mx-auto w-full max-w-6xl px-6 py-8 text-xs text-ink-faint flex justify-between items-center border-t border-paper-line">
        <span>© 2026 Tax Copilot · TRA Individual Taxpayers</span>
        <div className="flex items-center gap-4">
          <Link href="/privacy" className="hover:text-ink transition-colors underline underline-offset-2">
            Privacy Policy
          </Link>
          <Link href="/faq" className="hover:text-ink transition-colors underline underline-offset-2">
            FAQs
          </Link>
          <span>Tanzania</span>
        </div>
      </footer>
    </main>
  );
}
