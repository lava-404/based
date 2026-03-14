"use client";

import { usePrivy } from "@privy-io/react-auth";
import { PrivacySend } from "@/components/PrivacySend";

export default function PrivacyPage() {
  const { ready, authenticated } = usePrivy();

  if (!ready) {
    return (
      <main className="min-h-screen px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <p className="text-muted-foreground">Loading…</p>
        </div>
      </main>
    );
  }

  if (!authenticated) {
    return (
      <main className="min-h-screen px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Privacy Send
          </h1>
          <p className="text-muted-foreground">
            Please log in with your wallet to use the privacy USDC send feature.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-semibold text-foreground mb-2">
          Privacy Send
        </h1>
        <p className="text-muted-foreground text-sm mb-6">
          Send USDC on Base Sepolia via BitGo with chunked privacy.
        </p>
        <PrivacySend />
      </div>
    </main>
  );
}
