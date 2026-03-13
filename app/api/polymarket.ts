import { NextRequest, NextResponse } from "next/server";

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
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;

    // Pass-through supported Polymarket query params
    const params = new URLSearchParams();
    const allowed = ["limit", "offset", "order", "ascending", "active", "closed", "archived", "category"];
    for (const key of allowed) {
      const val = searchParams.get(key);
      if (val !== null) params.set(key, val);
    }

    const url = `${POLYMARKET_API}${params.size ? `?${params}` : ""}`;

    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 60 }, // cache for 60s
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Polymarket API error: ${res.status}` },
        { status: res.status }
      );
    }

    const raw: Record<string, unknown>[] = await res.json();
    const markets: Market[] = raw.map(parseMarket);

    return NextResponse.json({ markets, count: markets.length });
  } catch (err) {
    console.error("[polymarket] fetch failed:", err);
    return NextResponse.json({ error: "Failed to fetch markets" }, { status: 500 });
  }
}