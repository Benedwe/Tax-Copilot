"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";
import ReceiptCard from "@/components/ReceiptCard";
import { useAuth } from "@/lib/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

  return (
    <main className="min-h-screen bg-paper">
      <Nav />
      <div className="mx-auto max-w-md px-6 py-12">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-display text-ink mb-1">Welcome back</h1>
          <p className="text-xs text-ink-soft">Sign in to manage your TRA tax returns and documents</p>
        </div>


          <ReceiptCard>
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
                disabled={loading}
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
