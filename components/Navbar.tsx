"use client";

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
    <nav className="flex items-center justify-between px-6 h-14 max-w-6xl mx-auto">
      <a href="/" className="flex items-center gap-2 no-underline">
        <div className="w-7 h-7 bg-primary rounded-[7px] flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="4.5" stroke="white" strokeWidth="1.8" />
            <circle cx="7" cy="7" r="1.5" fill="white" />
          </svg>
        </div>
        <span className="text-[15px] font-medium text-foreground tracking-tight">
          Flowbase
        </span>
      </a>

      <div className="flex items-center gap-2">
        {!ready ? (
          <Button variant="outline" size="sm" disabled>
            Loading…
          </Button>
        ) : authenticated ? (
          <>
            {displayName && (
              <span className="text-sm text-muted-foreground max-w-[140px] truncate" title={address}>
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
  );
}
