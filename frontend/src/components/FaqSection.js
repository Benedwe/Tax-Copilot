"use client";

import { useState } from "react";
import ReceiptCard from "@/components/ReceiptCard";

const FAQ_ITEMS = [
  {
    id: "paye-calculation",
    question: "How does Tax Copilot calculate my Tanzanian PAYE & individual income tax?",
    answer:
      "Tax Copilot uses official Tanzania Revenue Authority (TRA) individual income tax bands, standard personal relief rules, and deductible allowances. When you upload salary slips or input gross income, our system automatically applies current statutory rates to determine your tax liability.",
  },
  {
    id: "tin-requirement",
    question: "Is my 9-digit TRA TIN compulsory to create an account?",
    answer:
      "Yes, TRA Taxpayer Identification Numbers (TIN) are compulsory for all individual tax filings in Tanzania. Providing your 9-digit TIN (e.g. 123-456-789) ensures your calculations, document extractions, and draft tax returns are officially formatted.",
  },
  {
    id: "document-security",
    question: "Are my uploaded financial documents secure?",
    answer:
      "Security and privacy are top priorities. All uploaded salary slips, receipts, and bank statements are encrypted in transit and at rest. Your documents are used strictly to extract values for your tax return and are never shared with unauthorized third parties.",
  },
  {
    id: "direct-tra-filing",
    question: "Does Tax Copilot submit my tax return directly to the TRA portal?",
    answer:
      "In this version, Tax Copilot extracts your data, verifies eligible deductions, and generates a reviewed, ready-to-file TRA compliant return draft PDF. Direct automated API submission to the TRA portal is currently on our product roadmap.",
  },
  {
    id: "supported-file-types",
    question: "What document formats can I upload for AI extraction?",
    answer:
      "You can upload PDFs, PNGs, JPEGs, or WEBP images taken from your phone or desktop. Our OCR document processor automatically extracts gross income, tax withheld, employer details, and qualifying expense receipts.",
  },
  {
    id: "deduction-finder",
    question: "What tax deductions does the system identify automatically?",
    answer:
      "Tax Copilot scans your uploaded receipts for TRA-recognized deductible items, including approved pension/retirement contributions, deductible business expenses, qualifying charitable donations, and medical/life insurance premiums.",
  },
];

export default function FaqSection() {
  const [openId, setOpenId] = useState("paye-calculation");

  function toggle(id) {
    setOpenId(openId === id ? null : id);
  }

  return (
    <section className="border-t border-paper-line bg-paper py-16" id="faq">
      <div className="mx-auto max-w-4xl px-6">
        <div className="text-center mb-10">
          <p className="text-xs tracking-[0.2em] uppercase text-brass-dark font-medium mb-2">
            Frequently Asked Questions
          </p>
          <h2 className="text-3xl font-display text-ink">Everything you need to know</h2>
          <p className="mt-2 text-sm text-ink-soft max-w-lg mx-auto">
            Clear answers about TRA tax returns, document scanning, TIN requirements, and calculations.
          </p>
        </div>

        <div className="space-y-3">
          {FAQ_ITEMS.map((item) => {
            const isOpen = openId === item.id;
            return (
              <ReceiptCard
                key={item.id}
                className="overflow-hidden transition-all border border-paper-line hover:border-ink-soft/40"
              >
                <button
                  type="button"
                  onClick={() => toggle(item.id)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-medium text-ink hover:text-ink-soft transition-colors"
                  aria-expanded={isOpen}
                >
                  <span className="text-base font-display">{item.question}</span>
                  <span
                    className={`shrink-0 w-6 h-6 rounded-full bg-paper-accent/60 flex items-center justify-center text-xs text-ink transition-transform duration-200 ${
                      isOpen ? "rotate-180 bg-ink text-paper" : ""
                    }`}
                  >
                    ▼
                  </span>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 text-sm text-ink-soft leading-relaxed border-t border-paper-line/60 pt-3 bg-ruled-paper/30 animate-fadeIn">
                    {item.answer}
                  </div>
                )}
              </ReceiptCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}
