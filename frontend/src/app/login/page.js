"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";
import ReceiptCard from "@/components/ReceiptCard";
import { useAuth } from "@/lib/AuthContext";

export default function LoginPage() {
  const { login, demoLogin } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err.message || "Failed to log in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDemoLogin() {
    setError("");
    setDemoLoading(true);
    try {
      await demoLogin();
      router.push("/dashboard");
    } catch (err) {
      setError(err.message || "Demo login failed. Please try again.");
    } finally {
      setDemoLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-paper">
      <Nav />
      <div className="mx-auto max-w-md px-6 py-12">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-display text-ink mb-1">Welcome back</h1>
          <p className="text-xs text-ink-soft">Sign in to manage your TRA tax returns and documents</p>
        </div>

        <ReceiptCard className="p-6 shadow-sm border border-paper-line">
          {/* Quick Demo Access Box */}
          <div className="mb-5 p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-md text-xs text-emerald-900 flex flex-col gap-2">
            <div className="flex items-center justify-between font-medium">
              <span className="flex items-center gap-1.5 font-semibold text-emerald-800">
                <span>⚡</span> Quick Testing Access
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded">Instant</span>
            </div>
            <p className="text-emerald-700 leading-relaxed">
              Test the app without typing. Uses pre-configured demo TRA profile.
            </p>
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={loading || demoLoading}
              className="w-full bg-emerald-700 text-white font-medium py-2 px-3 rounded text-xs hover:bg-emerald-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
            >
              {demoLoading ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  <span>Logging in as Demo Taxpayer…</span>
                </>
              ) : (
                <>
                  <span>Log in with Demo Account</span>
                  <span>→</span>
                </>
              )}
            </button>
          </div>

          <div className="relative flex py-2 items-center mb-4">
            <div className="flex-grow border-t border-paper-line"></div>
            <span className="flex-shrink mx-3 text-xs text-ink-faint uppercase tracking-wider font-mono">or standard login</span>
            <div className="flex-grow border-t border-paper-line"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Email Address">
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input text-sm"
              />
            </Field>

            <Field label="Password">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input text-sm pr-10"
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

            {error && (
              <div className="p-3 bg-rust/10 border border-rust/30 rounded text-xs text-rust font-medium flex items-start gap-2">
                <span className="text-sm shrink-0">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || demoLoading}
              className="w-full bg-ink text-paper py-2.5 rounded-sm hover:bg-ink-soft transition-colors disabled:opacity-60 font-medium text-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-paper" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  <span>Logging in…</span>
                </>
              ) : (
                "Log in"
              )}
            </button>
          </form>
        </ReceiptCard>

        <p className="mt-6 text-sm text-ink-soft text-center">
          No account yet?{" "}
          <Link href="/register" className="text-ink font-medium underline underline-offset-4 hover:text-ink-soft">
            Create a TRA-compliant account
          </Link>
        </p>
      </div>
    </main>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-ink-soft mb-1.5">{label}</span>
      {children}
    </label>
  );
}
