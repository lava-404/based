import CTA from "@/components/Cta";
import FeatureCards from "@/components/Features";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";

import HowItWorks from "@/components/HowItWorks";

export default function Page() {
  return (
    <main className="w-full overflow-x-hidden flex items-center justify-center flex-col">
      <Hero/>
      <div className="absolute inset-0 -z-10 w-[100vw] h-[30rem] bg-[url('/image1.png')] bg-contain bg-center bg-no-repeat lg:mt-130 mt-155" />
      <FeatureCards />
      <HowItWorks />
      <CTA />
      <Footer />
    </main>
  )
}