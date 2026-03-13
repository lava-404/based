import { CardSmall } from "@/components/SmallCard";
import { type Market } from "@/app/api/markets/route";

async function getMarkets(): Promise<Market[]> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/api/markets`,
    { next: { revalidate: 60 } }
  );

  if (!res.ok) return [];
  const { markets } = await res.json();
  return markets;
}

export default async function Home() {
  const markets = await getMarkets();

  return (
    <main className="min-h-screen bg-background px-6 py-12">
      <div className="max-w-6xl mx-auto">

        <div className="mb-10">
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            Markets
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {markets.length} active markets
          </p>
        </div>

        {markets.length === 0 ? (
          <p className="text-muted-foreground text-sm">No markets found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {markets.map((market) => (
              <CardSmall key={market.id} market={market} />
            ))}
          </div>
        )}

      </div>
    </main>
  );
}