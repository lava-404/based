import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";

/**
 * Config for Confidential Market creation (Base Sepolia).
 * All NEXT_PUBLIC_* addresses are read from env; empty or invalid values fall back to defaults or undefined.
 * Restart dev server after changing .env.
 */
export const BASE_SEPOLIA_CHAIN_ID = 84532;

/** Valid 0x + 40 hex; returns undefined for empty/invalid so we never send bad address to RPC. */
function parseAddress(value: string | undefined): `0x${string}` | undefined {
  const v = value?.trim();
  if (!v || v.length !== 42 || !/^0x[0-9a-fA-F]{40}$/.test(v)) return undefined;
  return v as `0x${string}`;
}

export const CONFIDENTIAL_MARKET_FACTORY_ADDRESS = parseAddress(
  typeof process !== "undefined" ? process.env?.NEXT_PUBLIC_CONFIDENTIAL_MARKET_FACTORY_ADDRESS : undefined
);

export const MARKET_COLLATERAL_TOKEN_ADDRESS = parseAddress(
  typeof process !== "undefined" ? process.env?.NEXT_PUBLIC_MARKET_COLLATERAL_TOKEN_ADDRESS : undefined
);

/** ENS Market Registrar (subdomain registration for markets). */
export const ENS_MARKET_REGISTRAR_ADDRESS = parseAddress(
  typeof process !== "undefined" ? process.env?.NEXT_PUBLIC_ENS_MARKET_REGISTRAR_ADDRESS : undefined
);

/** Parent domain for market subdomains (e.g. "markets.based.eth") — for display only. */
export const ENS_PARENT_DOMAIN =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_ENS_PARENT_DOMAIN?.trim()) || "markets.based.eth";

/** Default factory (ConfidentialMarketFactory on Base Sepolia). */
export const DEFAULT_FACTORY_ADDRESS: `0x${string}` =
  "0x11986c6Ea2eA0168530990eA873983c59054390F";

/** Default collateral token for new markets. */
export const DEFAULT_COLLATERAL_ADDRESS: `0x${string}` =
  "0xA663178892B6Be3e07051D413F5017f7169904B9";

export const BASESCAN_TX_URL = "https://sepolia.basescan.org/tx";

export function getFactoryAddress(): `0x${string}` {
  return CONFIDENTIAL_MARKET_FACTORY_ADDRESS ?? DEFAULT_FACTORY_ADDRESS;
}

export function getCollateralAddress(): `0x${string}` {
  return MARKET_COLLATERAL_TOKEN_ADDRESS ?? DEFAULT_COLLATERAL_ADDRESS;
}

/** ENS Market Registrar address; undefined if not set (subdomain registration skipped). */
export function getEnsRegistrarAddress(): `0x${string}` | undefined {
  return ENS_MARKET_REGISTRAR_ADDRESS;
}

export function getEnsParentDomain(): string {
  return ENS_PARENT_DOMAIN;
}

/** Public client for Base Sepolia (e.g. for transaction receipts). */
export const baseSepoliaPublicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

// ─── Order book: USDC → cUSDC wrapper (confidential amount) ───────────────────

/** USDC on Base Sepolia (for approve before wrap). */
export const USDC_ADDRESS: `0x${string}` =
  "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
export const USDC_DECIMALS = 6;

/** Contract that wraps USDC into confidential cUSDC so order amounts stay private. */
export const USDC_WRAPPER_ADDRESS = parseAddress(
  typeof process !== "undefined" ? process.env?.NEXT_PUBLIC_USDC_WRAPPER_ADDRESS : undefined
);

export function getUsdcWrapperAddress(): `0x${string}` | undefined {
  return USDC_WRAPPER_ADDRESS;
}
