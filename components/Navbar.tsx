import { Button } from "./ui/button";
<<<<<<< Updated upstream
import { BitGo } from "bitgo";

async function placeBet() {
  await fetch("/api/bet", {
    method: "POST",
    body: JSON.stringify({
      address: "0x123...",
      amount: "1000000000000000",
    }),
  });
}

export function Navbar() {
  
=======
import { usePrivy } from "@privy-io/react-auth";
import { AddressWithEns } from "./AddressWithEns";

export function Navbar() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const wallet = user?.linkedAccounts?.find(
    (a) => a.type === "wallet" || a.type === "smart_wallet"
  ) as { address: string } | undefined;
  const address = wallet?.address;

>>>>>>> Stashed changes
  return (
    <nav className="flex items-center justify-between px-6 h-14 max-w-6xl mx-auto">

      <a href="/" className="flex items-center gap-2 no-underline">
        <div className="w-7 h-7 bg-primary rounded-[7px] flex items-center justify-center">
          {/* swap for your logo */}
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="4.5" stroke="white" strokeWidth="1.8"/>
            <circle cx="7" cy="7" r="1.5" fill="white"/>
          </svg>
        </div>
        <span className="text-[15px] font-medium text-foreground tracking-tight">
          Flowbase
        </span>
      </a>

      <div className="flex items-center gap-2">
<<<<<<< Updated upstream
        <a href="/login">
          <Button variant="outline" size="sm" >Log in</Button>
        </a>
        <a href="/signup">
          <Button variant="default" size="sm">Sign up</Button>
          
        </a>
        
=======
        {!ready ? (
          <Button variant="outline" size="sm" disabled>
            Loading…
          </Button>
        ) : authenticated ? (
          <>
            {address && (
              <span className="text-sm text-muted-foreground max-w-[200px] truncate">
                <AddressWithEns address={address} showAddress className="truncate" />
              </span>
            )}
            <Button variant="outline" size="sm" onClick={logout}>
              Log out
            </Button>
          </>
        ) : (
          <>
            <span className="text-xs text-muted-foreground hidden sm:inline">Wallet (ENS) or email</span>
            <Button variant="outline" size="sm" onClick={login}>
              Log in
            </Button>
            <Button variant="default" size="sm" onClick={login}>
              Sign up
            </Button>
          </>
        )}
>>>>>>> Stashed changes
      </div>

    </nav>
  )
}