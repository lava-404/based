"use client";

import { useEnsName } from "@/lib/use-ens-name";

type Props = {
  /** Ethereum address (0x...) */
  address: string;
  /** Show full address as secondary line or tooltip */
  showAddress?: boolean;
  /** Max length for truncated address when no ENS */
  truncate?: number;
  className?: string;
  /** Optional explorer base URL for link */
  explorerUrl?: string;
};

/**
 * Displays ENS name (when resolved) with wallet address.
 * Uses existing viem-based ENS resolution via useEnsName (mainnet).
 * Privy does not provide ENS; we resolve from address.
 */
export function AddressWithEns({
  address,
  showAddress = true,
  truncate = 10,
  className = "",
  explorerUrl,
}: Props) {
  const ensName = useEnsName(address);

  const shortAddress =
    address.length <= truncate * 2 + 4
      ? address
      : `${address.slice(0, truncate)}…${address.slice(-Math.min(truncate, 4))}`;

  const content = (
    <span className={className} title={address}>
      {ensName ? (
        <>
          <span className="font-medium">{ensName}</span>
          {showAddress && (
            <span className="text-muted-foreground ml-1.5 text-sm">
              ({shortAddress})
            </span>
          )}
        </>
      ) : (
        <span>{shortAddress}</span>
      )}
    </span>
  );

  if (explorerUrl) {
    const href = `${explorerUrl}/address/${address}`;
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:underline focus:outline-none focus:underline"
      >
        {content}
      </a>
    );
  }

  return content;
}
