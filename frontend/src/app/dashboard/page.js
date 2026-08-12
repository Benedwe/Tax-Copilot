"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import ReceiptCard from "@/components/ReceiptCard";
import RequireAuth from "@/components/RequireAuth";
import StatusStamp from "@/components/StatusStamp";
import { useAuth } from "@/lib/AuthContext";
import { api } from "@/lib/api";

import TinPromptModal from "@/components/TinPromptModal";

export default function DashboardPage() {
  return (
    <RequireAuth>
      <TinPromptModal />
      <DashboardContent />
    </RequireAuth>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [taxReturns, setTaxReturns] = useState(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .listTaxReturns()
      .then((d) => setTaxReturns(d.taxReturns))
      .catch((err) => setError(err.message));
  }, []);

  async function handleNewReturn() {
    setCreating(true);
    setError("");
    try {
      const { taxReturn } = await api.createTaxReturn(new Date().getFullYear());
      router.push(`/dashboard/returns/${taxReturn.id}`);
    } catch (err) {
      setError(err.message);
      setCreating(false);
    }
  }

  return (
    <main>
      <Nav />
      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-xs tracking-[0.2em] uppercase text-brass-dark font-medium mb-2">Dashboard</p>
            <h1 className="text-3xl text-ink">Welcome back{user?.name ? `, ${user.name}` : ""}.</h1>
            <p className="mt-2 text-sm text-ink-soft">Your tax workspace is ready.</p>
          </div>
          <button
            onClick={handleNewReturn}
            disabled={creating}
            className="bg-ink text-paper px-5 py-2.5 rounded-sm hover:bg-ink-soft transition-colors disabled:opacity-60"
          >
            {creating ? "Creating…" : `New ${new Date().getFullYear()} return`}
          </button>
        </div>

        {error && <p className="text-sm text-rust mb-6">{error}</p>}

        {!taxReturns ? (
          <p className="text-ink-faint text-sm">Loading your returns…</p>
        ) : taxReturns.length === 0 ? (
          <ReceiptCard className="p-10 text-center">
            <p className="text-ink-soft">You haven&rsquo;t started a return yet.</p>
            <p className="text-sm text-ink-faint mt-1">Start one and upload your first document to see how it works.</p>
          </ReceiptCard>
        ) : (
          <div className="grid md:grid-cols-2 gap-5">
            {taxReturns.map((tr) => (
              <button
                key={tr.id}
                onClick={() => router.push(`/dashboard/returns/${tr.id}`)}
                className="text-left"
              >
                <ReceiptCard className="p-6 hover:shadow-md transition-shadow h-full">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-display text-ink">{tr.year} Tax Return</h3>
                    <StatusStamp status={tr.status} />
                  </div>
                  <dl className="grid grid-cols-2 gap-y-1 text-sm">
                    <dt className="text-ink-faint">Tax due</dt>
                    <dd className="font-mono text-ink text-right">
                      TZS {Number(tr.taxDue || 0).toLocaleString()}
                    </dd>
                    <dt className="text-ink-faint">Balance</dt>
                    <dd className="font-mono text-ink text-right">
                      TZS {Number(tr.balance || 0).toLocaleString()}
                    </dd>
                  </dl>
                </ReceiptCard>
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
