"use client";

import { useState, useCallback } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AddressWithEns } from "@/components/AddressWithEns";
import { getBitGoDepositAddress } from "@/lib/bitgo-deposit-address";
import { useEnsName } from "@/lib/use-ens-name";

const BASE_SEPOLIA_CHAIN_ID = 84532;
const USDC_CONTRACT = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
const USDC_DECIMALS = 6;
const TRANSFER_SELECTOR = "0xa9059cbb";
const BASESCAN_TX = "https://sepolia.basescan.org/tx";

function padAddress(addr: string): string {
  const a = addr.startsWith("0x") ? addr.slice(2) : addr;
  return a.padStart(64, "0").toLowerCase();
}

function padAmount(amountHex: string): string {
  return amountHex.padStart(64, "0").toLowerCase();
}

export function PrivacySend() {
  const { authenticated, ready } = usePrivy();
  const { wallets } = useWallets();
  const [recipientAddress, setRecipientAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [numChunks, setNumChunks] = useState(4);
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState<{ text: string; isError?: boolean }[]>([]);

  const recipientForEns = recipientAddress.trim();
  const isValidEthAddress = /^0x[a-fA-F0-9]{40}$/.test(recipientForEns);
  const recipientEns = useEnsName(isValidEthAddress ? recipientForEns : undefined);

  const appendLog = useCallback((text: string, isError?: boolean) => {
    setLog((prev) => [...prev, { text, isError }]);
  }, []);

  const embeddedWallet = wallets?.find(
    (w) => (w as { walletClientType?: string }).walletClientType === "privy"
  );

  const handleSend = async () => {
    if (!embeddedWallet || !recipientAddress.trim() || !amount.trim()) {
      appendLog("Missing wallet, recipient, or amount.", true);
      return;
    }
    const depositAddress = getBitGoDepositAddress();
    if (!depositAddress) {
      appendLog("NEXT_PUBLIC_BITGO_DEPOSIT_ADDRESS is not set.", true);
      return;
    }
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      appendLog("Invalid USDC amount.", true);
      return;
    }

    setLoading(true);
    setLog([]);

    try {
      await (embeddedWallet as { switchChain: (id: number) => Promise<void> }).switchChain(
        BASE_SEPOLIA_CHAIN_ID
      );
      appendLog("Switched to Base Sepolia.");

      const provider = await (
        embeddedWallet as { getEthereumProvider: () => Promise<unknown> }
      ).getEthereumProvider();
      const from = (embeddedWallet as { address: string }).address;
      const amountBaseUnits = BigInt(
        Math.floor(num * 10 ** USDC_DECIMALS)
      ).toString(16);
      const data =
        TRANSFER_SELECTOR +
        padAddress(depositAddress) +
        padAmount(amountBaseUnits);

      const txHash = await (provider as { request: (args: {
        method: string;
        params: unknown[];
      }) => Promise<string> }).request({
        method: "eth_sendTransaction",
        params: [
          {
            from,
            to: USDC_CONTRACT,
            data,
            chainId: "0x14a34",
          },
        ],
      });

      appendLog(`Deposited to BitGo: ${txHash}`);
      appendLog(
        `View: ${BASESCAN_TX}/${txHash}`
      );

      const res = await fetch("/api/privacy-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientAddress: recipientAddress.trim(),
          totalAmountUsdc: num,
          numChunks,
        }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        appendLog(json?.error ?? "Privacy send request failed", true);
        setLoading(false);
        return;
      }

      const results = json.results ?? [];
      for (const r of results) {
        const amountUsdc = (r.amountBaseUnits / 10 ** USDC_DECIMALS).toFixed(2);
        const shortAddr = r.intermediateAddress
          ? `${r.intermediateAddress.slice(0, 6)}…${r.intermediateAddress.slice(-4)}`
          : "—";
        if (r.error) {
          appendLog(`Chunk ${r.chunkIndex}: ${r.error}`, true);
        } else {
          appendLog(
            `Chunk ${r.chunkIndex}: ${amountUsdc} USDC via ${shortAddr}`
          );
          if (r.txHash) {
            appendLog(`  → ${BASESCAN_TX}/${r.txHash}`);
          }
        }
      }
      appendLog("Done.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      appendLog(msg, true);
    } finally {
      setLoading(false);
    }
  };

  if (!ready) {
    return (
      <Card className="max-w-lg">
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Loading…</p>
        </CardContent>
      </Card>
    );
  }

  if (!authenticated) {
    return (
      <Card className="max-w-lg">
        <CardContent className="pt-6">
          <p className="text-muted-foreground">
            Log in with your wallet to use privacy send.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <h2 className="text-lg font-semibold text-foreground">
          Privacy USDC Send (Base Sepolia)
        </h2>
        <p className="text-sm text-muted-foreground">
          Send USDC privately via BitGo; deposit to the pool first, then chunks
          are sent to the recipient.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div>
          <label className="text-sm font-medium text-foreground block mb-1">
            Recipient address
          </label>
          <input
            type="text"
            placeholder="0x... or paste address to see ENS"
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {isValidEthAddress && recipientEns && (
            <p className="mt-1.5 text-xs text-muted-foreground">
              ENS: <AddressWithEns address={recipientForEns} showAddress={false} />
            </p>
          )}
        </div>
        <div>
          <label className="text-sm font-medium text-foreground block mb-1">
            USDC amount
          </label>
          <input
            type="text"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground block mb-1">
            Chunks: {numChunks}
          </label>
          <input
            type="range"
            min={2}
            max={8}
            value={numChunks}
            onChange={(e) => setNumChunks(Number(e.target.value))}
            className="w-full"
          />
        </div>
        <Button
          onClick={handleSend}
          disabled={loading || !embeddedWallet}
        >
          {loading ? "Sending…" : "Send Privately"}
        </Button>
        <div className="rounded-md bg-muted p-3 text-sm font-mono max-h-60 overflow-y-auto">
          {log.length === 0 ? (
            <span className="text-muted-foreground">Status log</span>
          ) : (
            log.map((item, i) => (
              <div
                key={i}
                className={item.isError ? "text-destructive" : "text-foreground"}
              >
                {item.text}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
