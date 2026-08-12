"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";
import ReceiptCard from "@/components/ReceiptCard";
import { useAuth } from "@/lib/AuthContext";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [tin, setTin] = useState("");
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleTinChange(e) {
    const raw = e.target.value;
    const digits = raw.replace(/\D/g, "").slice(0, 9);
    if (digits.length <= 3) {
      setTin(digits);
    } else if (digits.length <= 6) {
      setTin(`${digits.slice(0, 3)}-${digits.slice(3)}`);
    } else {
      setTin(`${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`);
    }
  }

  function handleFillDemo() {
    const randomId = Math.floor(1000 + Math.random() * 9000);
    setName("Amina Salim");
    setEmail(`taxpayer.${randomId}@example.tz`);
    setPassword("password123");
    setTin("987-654-321");
    setAcceptedPrivacy(true);
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const cleanTin = tin.replace(/[\s-]/g, "");
    if (cleanTin.length !== 9) {
      setError("Compulsory TRA TIN must be exactly 9 digits (e.g. 123-456-789)");
      return;
    }

    if (!acceptedPrivacy) {
      setError("You must accept the Privacy Policy to create an account.");
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password, tin.trim());
      router.push("/dashboard");
    } catch (err) {
      setError(err.message || "Registration failed. Please check your inputs.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-paper">
      <Nav />
      <div className="mx-auto max-w-md px-6 py-12">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-display text-ink mb-1">Start your tax return</h1>
          <p className="text-xs text-ink-soft">Create a TRA-compliant taxpayer account to manage deductions</p>
        </div>

        <ReceiptCard className="p-6 shadow-sm border border-paper-line">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-ink-faint">Account Details</span>
            <button
              type="button"
              onClick={handleFillDemo}
              className="text-[11px] font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded border border-emerald-200 transition-colors flex items-center gap-1"
            >
              <span>⚡</span> Fill Sample Info
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Full Name">
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input text-sm"
                placeholder="e.g. Jane Joel Binemungu"
              />
            </Field>

            <Field label="Email Address">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input text-sm"
                placeholder="jane@example.com"
              />
            </Field>

            <Field label="Password" hint="At least 8 characters">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input text-sm pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink text-xs p-1"
                  tabIndex={-1}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </Field>

            <Field label="TRA TIN Number" hint="Compulsory 9-digit TRA Taxpayer ID">
              <input
                type="text"
                required
                value={tin}
                onChange={handleTinChange}
                placeholder="123-456-789"
                className="input tracking-wide font-mono text-sm"
              />
            </Field>

            <label className="flex items-start gap-2.5 cursor-pointer pt-1 text-xs text-ink-soft">
              <input
                type="checkbox"
                required
                checked={acceptedPrivacy}
                onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                className="mt-0.5 rounded border-paper-line accent-ink shrink-0"
              />
              <span>
                I have read and agree to the{" "}
                <Link href="/privacy" target="_blank" className="text-ink font-medium underline underline-offset-2 hover:text-ink-soft">
                  Privacy Policy
                </Link>{" "}
                and TRA document processing terms.
              </span>
            </label>

            {error && (
              <div className="p-3 bg-rust/10 border border-rust/30 rounded text-xs text-rust font-medium flex items-start gap-2">
                <span className="text-sm shrink-0">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !acceptedPrivacy}
              className="w-full bg-ink text-paper py-2.5 rounded-sm hover:bg-ink-soft transition-colors disabled:opacity-60 font-medium text-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-paper" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  <span>Creating Account…</span>
                </>
              ) : (
                "Create TRA-Compliant Account"
              )}
            </button>
          </form>
        </ReceiptCard>

        <p className="mt-6 text-sm text-ink-soft text-center">
          Already have an account?{" "}
          <Link href="/login" className="text-ink font-medium underline underline-offset-4 hover:text-ink-soft">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-ink-soft mb-1.5">
        {label}
        {hint && <span className="text-ink-faint font-normal"> · {hint}</span>}
      </span>
      {children}
    </label>
  );
}
