/**
 * Reads BitGo deposit address from env.
 * Accepts: plain "0x..." or JSON with .address, or object-like string.
 */
export function getBitGoDepositAddress(): string | null {
  const raw = process.env.NEXT_PUBLIC_BITGO_DEPOSIT_ADDRESS?.trim();
  if (!raw) return null;
  if (raw.startsWith("0x") && /^0x[a-fA-F0-9]{40}$/.test(raw)) return raw;
  try {
    const parsed = JSON.parse(raw) as { address?: string };
    if (typeof parsed?.address === "string") return parsed.address;
  } catch {
    // not JSON; try to extract 0x address from object-like string
    const match = raw.match(/['"]?address['"]?\s*:\s*['"]?(0x[a-fA-F0-9]{40})['"]?/);
    if (match?.[1]) return match[1];
    if (raw.startsWith("0x") && raw.length >= 40) return raw.slice(0, 42);
  }
  return null;
}
