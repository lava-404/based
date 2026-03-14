import { Button } from "@/components/ui/button"

export default function Hero() {
  return (
    <section className="relative flex items-center justify-center px-6 py-28 text-center mt-10 sm:mt-20">

      <div className="max-w-5xl">
        <h1 className="text-4xl tracking-tight leading-tight sm:text-5xl font-playfair-display">
          the <span className="font-bold text-[#0052ff]">first</span> prediction market{" "}
          <br className="hidden sm:block" />
          where traders remain completely <span className="font-bold text-[#0052ff]">invisible</span>
        </h1>
        
        <p className="mt-6 text-black text-sm max-w-2xl mx-auto">
          Trade outcomes privately with your group.  
          Create markets, stake tokens, and settle automatically when results resolve.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg">
            Launch Market
          </Button>

          <Button size="lg" variant="outline">
            Explore Markets
          </Button>
        </div>
      </div>
    </section>
  )
}