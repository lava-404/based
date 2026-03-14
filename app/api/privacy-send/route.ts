import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const COIN = "tbaseeth";
const USDC_CONTRACT = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
// If BitGo Express expects a token-specific path for USDC, use e.g. "tbaseeth:usdc" as COIN or add token to sendMany body per BitGo docs.
const USDC_DECIMALS = 6;

const BITGO_EXPRESS_URL = process.env.BITGO_EXPRESS_URL ?? "http://localhost:3080";
const BITGO_ACCESS_TOKEN = process.env.BITGO_ACCESS_TOKEN;
const BITGO_WALLET_ID = process.env.BITGO_WALLET_ID;
const WALLET_PASSPHRASE = process.env.WALLET_PASSPHRASE;

/**
 * Splits total into N random unequal parts that sum to total, returns them shuffled.
 */
function splitAmount(total: number, chunks: number): number[] {
  if (chunks <= 0 || total <= 0) return [];
  if (chunks === 1) return [total];
  const parts: number[] = [];
  let remaining = total;
  for (let i = 0; i < chunks - 1; i++) {
    const max = remaining - (chunks - i - 1);
    const part = Math.floor(Math.random() * (max - 1) + 1);
    parts.push(part);
    remaining -= part;
  }
  parts.push(remaining);
  return parts.sort(() => Math.random() - 0.5);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request: NextRequest) {
  if (!BITGO_ACCESS_TOKEN || !BITGO_WALLET_ID || !WALLET_PASSPHRASE) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Server missing BITGO_ACCESS_TOKEN, BITGO_WALLET_ID, or WALLET_PASSPHRASE",
      },
      { status: 500 }
    );
  }

  let body: {
    recipientAddress?: string;
    totalAmountUsdc?: number;
    numChunks?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { recipientAddress, totalAmountUsdc, numChunks = 4 } = body;
  if (
    !recipientAddress ||
    typeof totalAmountUsdc !== "number" ||
    totalAmountUsdc <= 0
  ) {
    return NextResponse.json(
      {
        success: false,
        error: "Missing or invalid recipientAddress or totalAmountUsdc",
      },
      { status: 400 }
    );
  }

  const chunks = Math.min(8, Math.max(2, Math.floor(numChunks) || 4));
  const totalBaseUnits = Math.floor(totalAmountUsdc * 10 ** USDC_DECIMALS);
  const amounts = splitAmount(totalBaseUnits, chunks);

  const baseUrl = BITGO_EXPRESS_URL.replace(/\/$/, "");
  const authHeader = { Authorization: `Bearer ${BITGO_ACCESS_TOKEN}` };
  const results: {
    chunkIndex: number;
    amountBaseUnits: number;
    intermediateAddress: string;
    txHash?: string;
    error?: string;
  }[] = [];

  try {
    for (let i = 0; i < chunks; i++) {
      const amountBaseUnits = amounts[i];
      const label = `stealth-${Date.now()}-${i}`;

      const createRes = await axios.post(
        `${baseUrl}/api/v2/${COIN}/wallet/${BITGO_WALLET_ID}/address`,
        { label },
        { headers: authHeader }
      );
      const intermediateAddress =
        createRes.data?.address ?? createRes.data?.result?.address;
      if (!intermediateAddress) {
        results.push({
          chunkIndex: i + 1,
          amountBaseUnits,
          intermediateAddress: "",
          error: "Create address response missing address",
        });
        continue;
      }

      const recipientsFirst = [
        { address: intermediateAddress, amount: String(amountBaseUnits) },
      ];
      const sendManyBodyFirst: Record<string, unknown> = {
        recipients: recipientsFirst,
        walletPassphrase: WALLET_PASSPHRASE,
        type: "transfer",
      };

      const sendRes1 = await axios.post(
        `${baseUrl}/api/v2/${COIN}/wallet/${BITGO_WALLET_ID}/sendmany`,
        sendManyBodyFirst,
        { headers: authHeader }
      );
      const txHash1 =
        sendRes1.data?.txid ??
        sendRes1.data?.result?.txid ??
        sendRes1.data?.transfer?.txid;
      if (!txHash1) {
        results.push({
          chunkIndex: i + 1,
          amountBaseUnits,
          intermediateAddress,
          error: "First sendMany response missing txid",
        });
        continue;
      }

      await sleep(2000);

      const recipientsSecond = [
        { address: recipientAddress, amount: String(amountBaseUnits) },
      ];
      const sendManyBodySecond: Record<string, unknown> = {
        recipients: recipientsSecond,
        walletPassphrase: WALLET_PASSPHRASE,
        type: "transfer",
      };

      const sendRes2 = await axios.post(
        `${baseUrl}/api/v2/${COIN}/wallet/${BITGO_WALLET_ID}/sendmany`,
        sendManyBodySecond,
        { headers: authHeader }
      );
      const txHash2 =
        sendRes2.data?.txid ??
        sendRes2.data?.result?.txid ??
        sendRes2.data?.transfer?.txid;

      results.push({
        chunkIndex: i + 1,
        amountBaseUnits,
        intermediateAddress,
        txHash: txHash2 ?? txHash1,
      });

      const delayMs = 5000 + Math.floor(Math.random() * 15000);
      await sleep(delayMs);
    }

    return NextResponse.json({ success: true, results });
  } catch (err: unknown) {
    let message: string;
    if (err && typeof err === "object" && "response" in err) {
      const res = (err as { response?: { data?: unknown } }).response;
      message =
        res?.data != null
          ? JSON.stringify(res.data)
          : err instanceof Error
            ? err.message
            : String(err);
    } else {
      message = err instanceof Error ? err.message : String(err);
    }
    return NextResponse.json(
      { success: false, error: message, results },
      { status: 500 }
    );
  }
}
