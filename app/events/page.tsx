import { Suspense } from "react";
import { CardSmall } from "@/components/SmallCard";
import { CategoryTabs } from "@/components/CategoryTabs";
import { type Market } from "@/app/api/markets/route";
import Link from "next/link";
import { CreateMarketOnEvents } from "@/components/CreateMarketOnEvents";

async function getMarkets(category?: string): Promise<Market[]> {
  const params = new URLSearchParams({
    limit: "16",
    active: "true",
  });
  if (category) params.set("category", category);

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/api/markets?${params}`,
    { next: { revalidate: 60 } }
  );

  if (!res.ok) return [];
  const { markets } = await res.json();
  return markets;
}

type Props = {
  searchParams: Promise<{ category?: string }>;
};

export default async function EventsPage({ searchParams }: Props) {
  const { category } = await searchParams;
  const markets = await getMarkets(category);

  return (
    <main className="min-h-screen">

      {/* Category tab strip — needs Suspense because it calls useSearchParams */}
      <Suspense fallback={<div className="h-[41px] border-b border-border" />}>
        <CategoryTabs />
      </Suspense>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">
              {category || "All Markets"}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {markets.length} active markets
            </p>
          </div>
          <CreateMarketOnEvents />
        </div>

        {markets.length === 0 ? (
          <p className="text-muted-foreground text-sm">No markets found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {markets.map((market) => (
              <Link key={market.id} href={`/events/${market.slug}`} className="block cursor-pointer">
                <CardSmall market={market} />
              </Link>
            ))}
          </div>
        )}
      </div>

    </main>
  );
}