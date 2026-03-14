import { NextResponse } from "next/server";
import { getSdk, ensureUnlocked } from "@/services/bitgo";

export async function POST(req: Request) {
  const body = await req.json();

  const { address, amount } = body;

  await ensureUnlocked();

  const sdk = getSdk();

  const wallet = await sdk.coin("tbaseeth").wallets().get({
    id: process.env.BITGO_WALLET_ID!,
  });

  const tx = await wallet.send({
    address,
    amount,
    walletPassphrase: process.env.BITGO_WALLET_PASSPHRASE!,
  });

  return NextResponse.json({ tx });
}