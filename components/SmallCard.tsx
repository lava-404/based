import { Market } from "@/app/api/markets/route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import Image from "next/image";

type Props = {
  market: Market;
};

function formatVolume(vol: number): string {
  if (vol >= 1_000_000) return `$${(vol / 1_000_000).toFixed(0)}M Vol.`;
  if (vol >= 1_000) return `$${(vol / 1_000).toFixed(0)}K Vol.`;
  return `$${vol.toFixed(0)} Vol.`;
}

function OutcomeRow({
  label,
  price,
}: {
  label: string;
  price: string;
}) {
  const pct = Math.round(parseFloat(price) * 100);

  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
      <span className="text-sm text-foreground font-medium">{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-foreground w-10 text-right">
          {pct}%
        </span>
        <Button
          size="sm"
          className="h-7 px-3 text-xs font-semibold bg-green-600/20 text-green-500 hover:bg-green-600/30 border-0"
        >
          Yes
        </Button>
        <Button
          size="sm"
          className="h-7 px-3 text-xs font-semibold bg-red-600/20 text-red-500 hover:bg-red-600/30 border-0"
        >
          No
        </Button>
      </div>
    </div>
  );
}

export function CardSmall({ market }: Props) {
  const outcomes: string[] = market.outcomes ?? [];
  const prices: string[] = market.outcomePrices ?? [];

  // Binary market (Yes/No) — show as a single row with the question
  const isBinary =
    outcomes.length === 2 &&
    outcomes[0].toLowerCase() === "yes" &&
    outcomes[1].toLowerCase() === "no";

  return (
    <Card className="w-full h-full flex flex-col bg-card border-border rounded-xl overflow-hidden hover:border-primary/40 transition-colors">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-start gap-3">
          {market.icon ? (
            <div className="shrink-0 w-9 h-9 rounded-lg overflow-hidden bg-muted">
              <img
                src={market.icon}
                alt=""
                width={36}
                height={36}
                className="object-cover w-full h-full"
              />
            </div>
          ) : (
            <div className="shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="text-primary text-xs font-bold">?</span>
            </div>
          )}
          <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
            {market.question}
          </p>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-0 flex-1">
        {isBinary ? (
          <OutcomeRow label={outcomes[0]} price={prices[0]} />
        ) : (
          outcomes.slice(0, 4).map((outcome, i) => (
            <OutcomeRow key={outcome} label={outcome} price={prices[i] ?? "0"} />
          ))
        )}
      </CardContent>

      <CardFooter className="px-4 py-3 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {formatVolume(market.volume)}
        </span>
        <span className="text-xs text-muted-foreground">
          {new Date(market.endDate).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      </CardFooter>
    </Card>
  );
}