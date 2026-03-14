/**
 * One-time BitGo wallet setup for Base Sepolia (tbaseeth).
 * Uses BitGo Express REST API only — no BitGo SDK / no polkadot deps.
 *
 * Prereq: BitGo Express running (e.g. http://localhost:3080)
 * Run: npx ts-node scripts/setupBitGoWallet.ts
 * Env: BITGO_ACCESS_TOKEN, BITGO_ENTERPRISE_ID, WALLET_PASSPHRASE, BITGO_EXPRESS_URL (optional, default http://localhost:3080)
 * Then add printed BITGO_WALLET_ID and NEXT_PUBLIC_BITGO_DEPOSIT_ADDRESS to .env
 */

import axios from "axios";
import * as path from "path";
import * as fs from "fs";

const root = process.cwd();
const envPaths = [
  path.join(root, ".env.local"),
  path.join(root, ".env"),
];

function loadEnv(filePath: string): void {
  const content = fs.readFileSync(filePath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const eq = trimmed.indexOf("=");
      if (eq > 0) {
        const key = trimmed.slice(0, eq).trim();
        const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
        if (key && !process.env[key]) process.env[key] = value;
      }
    }
  }
}

for (const p of envPaths) {
  if (fs.existsSync(p)) loadEnv(p);
}

const trim = (s: string | undefined) => (typeof s === "string" ? s.trim() : "");
const BITGO_ACCESS_TOKEN = trim(process.env.BITGO_ACCESS_TOKEN);
const BITGO_ENTERPRISE_ID = trim(process.env.BITGO_ENTERPRISE_ID);
const WALLET_PASSPHRASE = trim(process.env.WALLET_PASSPHRASE);
const BITGO_EXPRESS_URL = trim(process.env.BITGO_EXPRESS_URL) || "http://localhost:3080";

const missing: string[] = [];
if (!BITGO_ACCESS_TOKEN) missing.push("BITGO_ACCESS_TOKEN");
if (!BITGO_ENTERPRISE_ID) missing.push("BITGO_ENTERPRISE_ID");
if (!WALLET_PASSPHRASE) missing.push("WALLET_PASSPHRASE");

if (missing.length > 0) {
  console.error("Missing env (add to .env or .env.local in project root):");
  missing.forEach((m) => console.error("  -", m));
  console.error("\nExample:\n  BITGO_ACCESS_TOKEN=your-token\n  BITGO_ENTERPRISE_ID=your-enterprise-id\n  WALLET_PASSPHRASE=your-secret-passphrase");
  process.exit(1);
}

const COIN = "tbaseeth";

async function main() {
  const baseUrl = BITGO_EXPRESS_URL.replace(/\/$/, "");
  const url = `${baseUrl}/api/v2/${COIN}/wallet/generate`;

  // tbaseeth: use custodial wallet; EVM TSS requires walletVersion 3, 5, or 6
  const body = {
    label: "Privacy Pool Master Wallet",
    passphrase: WALLET_PASSPHRASE,
    enterprise: BITGO_ENTERPRISE_ID,
    type: "custodial" as const,
    walletVersion: 3,
  };

  const { data } = await axios.post(url, body, {
    headers: {
      Authorization: `Bearer ${BITGO_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
  });

  const wallet = data.wallet ?? data;
  const walletId = wallet.id ?? wallet.wallet?.id;
  const baseAddress = wallet.receiveAddress ?? wallet.wallet?.receiveAddress ?? data.receiveAddress;
  const userKeychain = data.userKeychain ?? data.userKeychain;
  const backupKeychain = data.backupKeychain ?? data.backupKeychain;

  if (!walletId || !baseAddress) {
    console.error("Unexpected response from BitGo Express. Full response:", JSON.stringify(data, null, 2));
    process.exit(1);
  }

  console.log("\n--- Save these values ---\n");
  console.log("BITGO_WALLET_ID=", walletId);
  console.log("NEXT_PUBLIC_BITGO_DEPOSIT_ADDRESS=", baseAddress);
  console.log("\nUser keychain (encryptedPrv):", userKeychain?.encryptedPrv ?? "N/A");
  console.log("Backup pub key:", backupKeychain?.pub ?? "N/A");
  console.log("\nAdd BITGO_WALLET_ID and NEXT_PUBLIC_BITGO_DEPOSIT_ADDRESS to .env or .env.local\n");
}

main().catch((err) => {
  const msg = err.response?.data != null ? JSON.stringify(err.response.data, null, 2) : err.message;
  console.error("Error:", msg);
  process.exit(1);
});
