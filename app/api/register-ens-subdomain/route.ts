import { NextRequest, NextResponse } from "next/server";
import { type Abi, createWalletClient, http, encodeFunctionData } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia, sepolia } from "viem/chains";
import { getEnsRegistrarAddress } from "@/lib/market-config";

const REGISTER_MARKET_SUBDOMAIN_ABI: Abi = [
  {
    type: "function",
    name: "registerMarketSubdomain",
    inputs: [
      { name: "label", type: "string", internalType: "string" },
      { name: "market", type: "address", internalType: "address" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
];

/**
 * Register an ENS subdomain for a market. Must be called by your backend
 * using the registrar's operator private key — the contract only allows
 * the operator (or owner) to call registerMarketSubdomain.
 *
 * Requires:
 *   - ENS_REGISTRAR_OPERATOR_PRIVATE_KEY (with or without 0x prefix)
 *   - NEXT_PUBLIC_ENS_MARKET_REGISTRAR_ADDRESS (registrar contract address)
 *
 * Optional: ENS_REGISTRAR_CHAIN_ID — 84532 = Base Sepolia (default), 11155111 = Ethereum Sepolia (ENS testnet)
 * Optional: ENS_RPC_URL or BASE_SEPOLIA_RPC_URL — RPC URL for the chain (recommended for reliable server-side tx)
 */
const CHAIN_ID_BASE_SEPOLIA = 84532;
const CHAIN_ID_ETHEREUM_SEPOLIA = 11155111;

function getChainAndTransport(): { chain: typeof baseSepolia | typeof sepolia; transport: ReturnType<typeof http> } {
  const chainId = process.env.ENS_REGISTRAR_CHAIN_ID
    ? parseInt(process.env.ENS_REGISTRAR_CHAIN_ID, 10)
    : CHAIN_ID_BASE_SEPOLIA;
  const rpcUrl =
    process.env.ENS_RPC_URL?.trim() ||
    process.env.BASE_SEPOLIA_RPC_URL?.trim() ||
    (chainId === CHAIN_ID_ETHEREUM_SEPOLIA ? (process.env.SEPOLIA_RPC_URL?.trim() || undefined) : undefined);

  const chain = chainId === CHAIN_ID_ETHEREUM_SEPOLIA ? sepolia : baseSepolia;
  const transport = rpcUrl ? http(rpcUrl) : http();
  return { chain, transport };
}

export async function POST(request: NextRequest) {
  const rawKey = process.env.ENS_REGISTRAR_OPERATOR_PRIVATE_KEY?.trim();
  if (!rawKey) {
    return NextResponse.json(
      { success: false, error: "ENS_REGISTRAR_OPERATOR_PRIVATE_KEY not configured. Set it in .env (server-only)." },
      { status: 500 }
    );
  }

  let registrarAddress: `0x${string}`;
  try {
    const addr = getEnsRegistrarAddress();
    if (!addr) throw new Error("NEXT_PUBLIC_ENS_MARKET_REGISTRAR_ADDRESS not set");
    registrarAddress = addr;
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Registrar not configured" },
      { status: 500 }
    );
  }

  let body: { subdomainLabel?: string; marketAddress?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const subdomainLabel = typeof body.subdomainLabel === "string" ? body.subdomainLabel.trim().toLowerCase() : "";
  const marketAddress = typeof body.marketAddress === "string" ? body.marketAddress.trim() : "";

  if (!subdomainLabel || !/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(subdomainLabel) || subdomainLabel.length > 63) {
    return NextResponse.json(
      { success: false, error: "Invalid subdomainLabel (letters, numbers, hyphens, 1–63 chars)" },
      { status: 400 }
    );
  }

  if (!marketAddress || !/^0x[0-9a-fA-F]{40}$/.test(marketAddress)) {
    return NextResponse.json(
      { success: false, error: "Invalid marketAddress (0x + 40 hex)" },
      { status: 400 }
    );
  }

  const pk = rawKey.startsWith("0x") ? (rawKey as `0x${string}`) : (`0x${rawKey}` as `0x${string}`);
  const account = privateKeyToAccount(pk);
  const { chain, transport } = getChainAndTransport();

  const walletClient = createWalletClient({
    account,
    chain,
    transport,
  });

  const data = encodeFunctionData({
    abi: REGISTER_MARKET_SUBDOMAIN_ABI,
    functionName: "registerMarketSubdomain",
    args: [subdomainLabel, marketAddress as `0x${string}`],
  });

  try {
    const hash = await walletClient.sendTransaction({
      to: registrarAddress,
      data,
      gas: BigInt(2000000),
    });
    return NextResponse.json({ success: true, txHash: hash });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[register-ens-subdomain]", msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
