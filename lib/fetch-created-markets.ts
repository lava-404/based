import { getFactoryAddress, baseSepoliaPublicClient } from "@/lib/market-config";
import ConfidentialMarketFactoryAbi from "@/abi/ConfidentialMarketFactory.json";

export type CreatedMarketRow = {
  market: `0x${string}`;
  question: string;
  endTime: bigint;
};

/**
 * Fetches all markets created via ConfidentialMarketFactory on Base Sepolia.
 * Returns empty array if factory is not configured or RPC fails.
 */
export async function fetchCreatedMarketsFromChain(): Promise<CreatedMarketRow[]> {
  let factoryAddress: `0x${string}`;
  try {
    factoryAddress = getFactoryAddress();
  } catch {
    return [];
  }

  try {
    const count = await baseSepoliaPublicClient.readContract({
      address: factoryAddress,
      abi: ConfidentialMarketFactoryAbi as never[],
      functionName: "marketCount",
      args: [],
    });
    const num = Number(count);
    if (num === 0) return [];

    const rows: CreatedMarketRow[] = [];
    for (let i = 0; i < num; i++) {
      const info = await baseSepoliaPublicClient.readContract({
        address: factoryAddress,
        abi: ConfidentialMarketFactoryAbi as never[],
        functionName: "getMarket",
        args: [BigInt(i)],
      });
      const [market, , , question, endTime] = info as readonly [
        `0x${string}`,
        `0x${string}`,
        `0x${string}`,
        string,
        bigint,
      ];
      rows.push({ market, question, endTime });
    }
    return rows;
  } catch (err) {
    console.error("[fetch-created-markets] chain read failed:", err);
    return [];
  }
}
