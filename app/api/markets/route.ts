import { NextRequest, NextResponse } from "next/server";
import { fetchCreatedMarketsFromChain } from "@/lib/fetch-created-markets";

const POLYMARKET_API = "https://gamma-api.polymarket.com/markets";

export type Market = {
  id: string;
  question: string;
  slug: string;
  category: string;
  image: string;
  icon: string;
  endDate: string;
  active: boolean;
  closed: boolean;
  archived: boolean;
  restricted: boolean;
  liquidity: number;
  volume: number;
  volume24hr: number;
  outcomes: string[];
  outcomePrices: string[];
  lastTradePrice: number;
  bestBid: number;
  bestAsk: number;
  /** When set, this market was created on-chain (ConfidentialMarketFactory). */
  source?: "polymarket" | "chain";
  /** Contract address when source === "chain". */
  marketAddress?: string;
};

function parseMarket(raw: Record<string, unknown>): Market {
  return {
    id: String(raw.id),
    question: String(raw.question ?? ""),
    slug: String(raw.slug ?? ""),
    category: String(raw.category ?? ""),
    image: String(raw.image ?? ""),
    icon: String(raw.icon ?? ""),
    endDate: String(raw.endDate ?? ""),
    active: Boolean(raw.active),
    closed: Boolean(raw.closed),
    archived: Boolean(raw.archived),
    restricted: Boolean(raw.restricted),
    liquidity: Number(raw.liquidityNum ?? raw.liquidity ?? 0),
    volume: Number(raw.volumeNum ?? raw.volume ?? 0),
    volume24hr: Number(raw.volume24hr ?? 0),
    outcomes: JSON.parse(String(raw.outcomes ?? "[]")),
    outcomePrices: JSON.parse(String(raw.outcomePrices ?? "[]")),
    lastTradePrice: Number(raw.lastTradePrice ?? 0),
    bestBid: Number(raw.bestBid ?? 0),
    bestAsk: Number(raw.bestAsk ?? 0),
    source: "polymarket",
  };
}

/** Convert on-chain created market to the shared Market type (slug = address for routing). */
function createdRowToMarket(row: { market: `0x${string}`; question: string; endTime: bigint }): Market {
  const slug = row.market.toLowerCase();
  const endDate = new Date(Number(row.endTime) * 1000).toISOString();
  const now = Date.now();
  const endMs = Number(row.endTime) * 1000;
  const active = endMs > now;
  return {
    id: slug,
    question: row.question || "Untitled market",
    slug,
    category: "Created",
    image: "",
    icon: "",
    endDate,
    active,
    closed: !active,
    archived: false,
    restricted: false,
    liquidity: 0,
    volume: 0,
    volume24hr: 0,
    outcomes: ["Yes", "No"],
    outcomePrices: ["0.5", "0.5"],
    lastTradePrice: 0.5,
    bestBid: 0,
    bestAsk: 0,
    source: "chain",
    marketAddress: row.market,
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;

    const params = new URLSearchParams();
    params.set("active", searchParams.get("active") ?? "true");
    params.set("closed", searchParams.get("closed") ?? "false");
    params.set("archived", searchParams.get("archived") ?? "false");
    params.set("order", searchParams.get("order") ?? "volume24hr");
    params.set("ascending", searchParams.get("ascending") ?? "false");
    params.set("limit", searchParams.get("limit") ?? "20");

    const allowed = ["offset", "category", "tag_slug"];
    for (const key of allowed) {
      const val = searchParams.get(key);
      if (val !== null) params.set(key, val);
    }

    const url = `${POLYMARKET_API}?${params}`;

    // Fetch Polymarket and on-chain created markets in parallel
    const [polyRes, createdRows] = await Promise.all([
      fetch(url, {
        headers: { "Content-Type": "application/json" },
        next: { revalidate: 60 },
      }),
      fetchCreatedMarketsFromChain(),
    ]);

    if (!polyRes.ok) {
      return NextResponse.json(
        { error: `Polymarket API error: ${polyRes.status}` },
        { status: polyRes.status }
      );
    }

    const raw: Record<string, unknown>[] = await polyRes.json();
    const polymarkets: Market[] = raw
      .map(parseMarket)
      .filter((m) => m.volume24hr > 0 || m.liquidity > 0);

    const createdMarkets: Market[] = createdRows.map(createdRowToMarket);

    const categoryParam = searchParams.get("category") ?? "";
    const isCreatedOnly = categoryParam.toLowerCase() === "created";

    // Created (on-chain) first, then Polymarket. If category=Created, only show on-chain.
    const markets: Market[] = isCreatedOnly
      ? createdMarkets
      : [...createdMarkets, ...polymarkets];

    return NextResponse.json({ markets, count: markets.length });
  } catch (err) {
    console.error("[markets] fetch failed:", err);
    return NextResponse.json({ error: "Failed to fetch markets" }, { status: 500 });
  }
}