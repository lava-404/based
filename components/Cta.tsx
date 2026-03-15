import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CTA() {
  return (
    <section className="px-6 py-32 text-center bg-[#0052ff] w-full">

      <div className="max-w-3xl mx-auto">

        <h2 className="text-3xl lg:text-5xl font-semibold text-white font-playfair-display">
          Start your first market
        </h2>

        <p className="text-white mt-4">
          Launch private prediction markets for events, crypto, sports, or internal forecasting.
        </p>

        <div className="mt-8">
          <Button size="lg" variant="secondary" className="bg-white text-[#0052ff] hover:bg-white/90" asChild>
            <Link href="/events">Explore Markets</Link>
          </Button>
        </div>

      </div>

    </section>
  );
}