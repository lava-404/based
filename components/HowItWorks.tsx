"use client";

import { useEffect, useState } from "react";

const steps = [
  {
    number: "01",
    label: "Connect",
    title: "ENS Login & Wallet Setup",
    description:
      "Sign in with your ENS identity. The platform auto-generates multiple stealth wallets via BitGo SDK to ensure your on-chain footprint stays unlinkable.",
    tags: ["ENS Login", "BitGo SDK", "Stealth Addresses"],
    tagColors: ["blue", "yellow", "yellow"],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.8}>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
  {
    number: "02",
    label: "Create",
    title: "Create a Prediction Market",
    description:
      "Use the Market Creator tool to deploy a new prediction market. It's instantly routed into the encrypted dark pool — Clawbot agents and MEV bots are blocked at the gate.",
    tags: ["Market Creator", "Dark Pool", "MEV Protected"],
    tagColors: ["pink", "dark", "red"],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.8}>
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),
  },
  {
    number: "03",
    label: "Predict",
    title: "Place Your Prediction Anonymously",
    description:
      "As a Market Predictor, submit your position via an ENS subdomain routed through a fresh BitGo stealth address. No one can see your bet — not even the protocol.",
    tags: ["Market Predictor", "ENS Subdomain", "BitGo SDK"],
    tagColors: ["pink", "blue", "yellow"],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.8}>
        <path d="M3 17l4-8 4 4 4-6 4 10" />
      </svg>
    ),
  },
  {
    number: "04",
    label: "Encrypt",
    title: "FHE Powers the Dark Pool",
    description:
      "All predictions are processed under Fully Homomorphic Encryption via Inco-Comfy. Computation happens on ciphertext — the dark pool sees nothing in plaintext.",
    tags: ["FHE", "Inco-Comfy", "Zero-Knowledge"],
    tagColors: ["pink", "blue", "yellow"],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.8}>

        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        
      </svg>
    ),
  },
  {
    number: "05",
    label: "Reveal",
    title: "Market Resolves & Pool Unveils",
    description:
      "When the market ends, the dark pool becomes visible to all participants. Results are revealed on-chain, fairly and transparently — no manipulation was possible.",
    tags: ["Transparent", "On-Chain", "Fair Reveal"],
    tagColors: ["blue", "blue", "blue"],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.8}>
        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
];

const tagColorMap: Record<string, string> = {
  blue: "bg-[#0052FF]/10 text-[#0052FF] border border-[#0052FF]/25",
  yellow: "bg-amber-50 text-amber-700 border border-amber-200",
  pink: "bg-pink-50 text-pink-600 border border-pink-200",
  dark: "bg-gray-900 text-gray-100 border border-gray-700",
  red: "bg-red-50 text-red-600 border border-red-200",
};

function StepCard({
  step,
  index,
  visible,
}: {
  step: (typeof steps)[0];
  index: number;
  visible: boolean;
}) {
  const isDark = step.number === "09";

  return (
    <div
      className="relative flex flex-col md:flex-row items-start gap-0"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0px)" : "translateY(40px)",
        transition: `opacity 0.6s ease, transform 0.6s ease`,
        transitionDelay: `${index * 120}ms`,
      }}
    >
      {/* Step number bubble */}
      <div className="flex md:flex-col items-center mr-5 md:mr-0 md:w-20 shrink-0">
        <div
          className="relative z-10 flex items-center justify-center w-12 h-12 rounded-full"
          style={{
            background: "linear-gradient(135deg, #0052FF 0%, #3378ff 100%)",
            boxShadow: "0 0 0 4px rgba(0,82,255,0.12), 0 4px 12px rgba(0,82,255,0.35)",
          }}
        >
          <span className="text-white font-mono text-xs font-bold tracking-widest">{step.number}</span>
        </div>
        {index < steps.length - 1 && (
          <div className="md:hidden w-px h-8 bg-gradient-to-b from-[#0052FF]/60 to-[#0052FF]/10 mt-1 self-center" />
        )}
        {index < steps.length - 1 && (
          <div className="hidden md:block w-px flex-1 min-h-[calc(100%+2rem)] bg-gradient-to-b from-[#0052FF]/50 to-[#0052FF]/10 mt-2" />
        )}
      </div>

      {/* Card */}
      <div
        className={`mb-10 md:mb-12 flex-1 rounded-2xl overflow-hidden transition-all duration-300
          ${
            isDark
              ? "bg-[#0c0c0c] border border-[#0052FF]/40 shadow-[0_4px_24px_rgba(0,82,255,0.12)]"
              : "bg-white border border-gray-100 shadow-sm hover:border-[#0052FF]/30 hover:shadow-[0_4px_24px_rgba(0,82,255,0.08)]"
          }`}
      >
        {/* Top accent bar */}
        <div
          className="h-[3px] w-full"
          style={{
            background: isDark
              ? "#0052FF"
              : "linear-gradient(to right, #0052FF, rgba(0,82,255,0.15))",
          }}
        />

        <div className="p-5 md:p-7">
          {/* Label + icon row */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono font-bold tracking-[0.2em] uppercase text-[#0052FF]">
              {step.label}
            </span>
            <div
              className="p-2 rounded-xl text-[#0052FF]"
              style={{
                background: isDark ? "rgba(0,82,255,0.18)" : "rgba(0,82,255,0.07)",
              }}
            >
              {step.icon}
            </div>
          </div>

          <h3
            className={`text-lg md:text-xl font-semibold mb-2 leading-snug ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            {step.title}
          </h3>

          <p className={`text-sm leading-relaxed mb-5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
            {step.description}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {step.tags.map((tag, i) => (
              <span
                key={tag}
                className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  isDark && tagColorMap[step.tagColors[i]].includes("bg-gray-900")
                    ? "bg-[#0052FF]/20 text-[#0052FF] border border-[#0052FF]/30"
                    : tagColorMap[step.tagColors[i]]
                }`}
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Blue step progress dots */}
          <div className="mt-5 flex items-center gap-2">
            {steps.map((_, si) => (
              <div
                key={si}
                className="h-[3px] rounded-full transition-all duration-300"
                style={{
                  flex: si === index ? 3 : 1,
                  background:
                    si === index
                      ? "#0052FF"
                      : si < index
                      ? "rgba(0,82,255,0.3)"
                      : isDark
                      ? "rgba(255,255,255,0.08)"
                      : "rgba(0,0,0,0.07)",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HowItWorks() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="min-h-screen py-16 md:py-4 relative overflow-hidden">
      {/* Ambient blue glows */}
     
      

      <div className="max-w-2xl mx-auto relative text-center">
        {/* Header */}
        <div
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0px)" : "translateY(30px)",
            transition: "opacity 0.7s ease, transform 0.7s ease",
          }}
          className="mb-14 md:mb-16"
        >
          {/* Eyebrow pill */}
          <div className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full border bg-[#0052FF]/5 text-center">
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{ boxShadow: "0 0 6px rgba(0,82,255,0.8)" }}
            />
            <span className="text-xs font-mono text-[#0052FF] tracking-[0.2em] uppercase font-bold">
              How It Works
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-semibold text-gray-900 leading-tight tracking-tight mb-4  font-playfair-display">
            Anonymous prediction markets,{" "}
            <span style={{ color: "#0052FF" }}>end to end.</span>
          </h1>
          
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Desktop vertical connector */}
          

          <div className="">
            {steps.map((step, i) => (
              <StepCard key={step.number} step={step} index={i} visible={visible} />
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}