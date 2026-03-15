"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import { usePrivy } from "@privy-io/react-auth";
import { useEnsName } from "@/lib/use-ens-name";

export function Navbar() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const wallet = user?.linkedAccounts?.find(
    (a) => a.type === "wallet" || a.type === "smart_wallet"
  ) as { address: string } | undefined;
  const address = wallet?.address;
  const ensName = useEnsName(address);
  const displayName = ensName ?? (address ? `${address.slice(0, 6)}…${address.slice(-4)}` : null);

  return (
    <header className="w-full border-b border-black/10 bg-white/80 backdrop-blur-sm sticky top-0 z-20">
      <nav className="flex items-center justify-between h-14 px-6 max-w-6xl mx-auto w-full">
        {/* Left: logo + nav links */}
        <div className="flex items-center gap-4 shrink-0">
          <a href="/" className="flex items-center gap-2 no-underline">
            <div className="w-7 h-7 bg-primary rounded-[7px] flex items-center justify-center shrink-0">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="4.5" stroke="white" strokeWidth="1.8" />
                <circle cx="7" cy="7" r="1.5" fill="white" />
              </svg>
            </div>
            <span className="hidden sm:inline text-[15px] font-medium text-foreground tracking-tight">
              cBaseMarket
            </span>
          </a>
          <Link href="/events" className="text-sm text-muted-foreground hover:text-foreground no-underline">
            Explore Markets
          </Link>
          <a href="/privacy" className="hidden sm:block text-sm text-muted-foreground hover:text-foreground no-underline">
            Privacy Send
          </a>
        </div>

        {/* Right: login / signup or user + logout */}
        <div className="flex items-center gap-2 shrink-0">
        {!ready ? (
          <Button variant="outline" size="sm" disabled>
            Loading…
          </Button>
        ) : authenticated ? (
          <>
            {displayName && (
              <span className="hidden sm:block text-sm text-muted-foreground max-w-[140px] truncate" title={address}>
                {displayName}
              </span>
            )}
            <Button variant="outline" size="sm" onClick={logout}>
              Log out
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" size="sm" onClick={login}>
              Log in
            </Button>
            <Button variant="default" size="sm" onClick={login}>
              Sign up
            </Button>
          </>
        )}
        </div>
      </nav>
    </header>
  );
}