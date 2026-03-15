import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

/**
 * Stealth order: create a BitGo-backed address for placing an order so the
 * on-chain order can be submitted from BitGo (not the user's wallet).
 * Uses the same BitGo wallet already initialized for privacy-send.
 */
const COIN = "tbaseeth";
const BITGO_EXPRESS_URL = process.env.BITGO_EXPRESS_URL ?? "http://localhost:3080";
const BITGO_ACCESS_TOKEN = process.env.BITGO_ACCESS_TOKEN;
const BITGO_WALLET_ID = process.env.BITGO_WALLET_ID;

export async function POST(request: NextRequest) {
  if (!BITGO_ACCESS_TOKEN || !BITGO_WALLET_ID) {
    return NextResponse.json(
      {
        success: false,
        error: "Server missing BITGO_ACCESS_TOKEN or BITGO_WALLET_ID",
      },
      { status: 500 }
    );
  }

  let body: {
    amountUsd?: number;
    side?: "yes" | "no";
    marketId?: string;
    marketAddress?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { amountUsd, side, marketId, marketAddress } = body;
  const amount = typeof amountUsd === "number" && amountUsd > 0 ? amountUsd : 0;
  const orderId = `order-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const label = `stealth-${orderId}`;

  const baseUrl = BITGO_EXPRESS_URL.replace(/\/$/, "");
  const authHeader = { Authorization: `Bearer ${BITGO_ACCESS_TOKEN}` };

  try {
    const createRes = await axios.post(
      `${baseUrl}/api/v2/${COIN}/wallet/${BITGO_WALLET_ID}/address`,
      { label },
      { headers: authHeader }
    );
    const stealthAddress =
      createRes.data?.address ?? createRes.data?.result?.address;
    if (!stealthAddress) {
      return NextResponse.json(
        {
          success: false,
          error: "BitGo address creation response missing address",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      orderId,
      stealthAddress,
      amountUsd: amount,
      side: side ?? "yes",
      marketId: marketId ?? null,
      marketAddress: marketAddress ?? null,
      message:
        "Deposit the order amount to the BitGo deposit address (NEXT_PUBLIC_BITGO_DEPOSIT_ADDRESS). Your order will be placed from our BitGo wallet so your main wallet stays private.",
    });
  } catch (err: unknown) {
    const message =
      err && typeof err === "object" && "response" in err
        ? JSON.stringify((err as { response?: { data?: unknown } }).response?.data)
        : err instanceof Error
          ? err.message
          : String(err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
