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
  const [tin, setTin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(name, email, password, tin.trim() || undefined);
      router.push("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <Nav />
      <div className="mx-auto max-w-md px-6 py-16">
        <h1 className="text-2xl text-ink mb-1">Start your return</h1>
        <p className="text-ink-soft text-sm mb-8">Takes under a minute. No card required.</p>
        <ReceiptCard className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Full name">
              <input required value={name} onChange={(e) => setName(e.target.value)} className="input" />
            </Field>
            <Field label="Email">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Password" hint="At least 8 characters">
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
              />
            </Field>
            <Field label="TIN number" hint="Optional">
              <input
                value={tin}
                onChange={(e) => setTin(e.target.value)}
                className="input"
              />
            </Field>
            {error && <p className="text-sm text-rust">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-ink text-paper py-2.5 rounded-sm hover:bg-ink-soft transition-colors disabled:opacity-60"
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>
        </ReceiptCard>
        <p className="mt-6 text-sm text-ink-soft text-center">
          Already have an account?{" "}
          <Link href="/login" className="text-ink underline underline-offset-4">
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
