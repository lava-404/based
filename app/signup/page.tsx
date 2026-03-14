"use client";

import { useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function SignupPage() {
  const { ready, authenticated, login } = usePrivy();
  const router = useRouter();

  useEffect(() => {
    if (ready && authenticated) {
      router.replace("/");
    }
  }, [ready, authenticated, router]);

  if (!ready) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </main>
    );
  }

  if (authenticated) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center">
        <p className="text-muted-foreground">Redirecting…</p>
      </main>
    );
  }

  return (
    <main className="min-h-[60vh] flex flex-col items-center justify-center gap-6 px-6">
      <h1 className="text-2xl font-semibold text-foreground">
        Create an account
      </h1>
      <p className="text-muted-foreground text-center max-w-sm">
        Connect your Ethereum wallet (ENS supported) or use email to get started.
      </p>
      <Button size="lg" onClick={login}>
        Sign up with wallet or email
      </Button>
    </main>
  );
}
