"use client";

import { useState } from "react";
import {
  EyeOff,
  Lock,
  Layers,
  Shield,
  Network,
  Timer,
} from "lucide-react";

const features = [
  {
    id: 1,
    icon: EyeOff,
    label: "01",
    title: "Anonymous Predictions",
    summary: "Stealth address routing",
    description:
      "Predictions are placed using stealth addresses, meaning your real wallet never appears in the market.",
  },
  {
    id: 2,
    icon: Lock,
    label: "02",
    title: "Fully Encrypted Market State",
    summary: "FHE-powered computation",
    description:
      "Using FHE, all bets remain encrypted while still allowing computation on the data.",
  },
  {
    id: 3,
    icon: Layers,
    label: "03",
    title: "Dark Pool Mechanics",
    summary: "Hidden until close",
    description:
      "Market activity remains hidden until the market closes, preventing front-running.",
  },
  {
    id: 4,
    icon: Shield,
    label: "04",
    title: "MEV Resistant",
    summary: "Zero visible order flow",
    description: "No visible orders means no bot exploitation of any kind.",
  },
  {
    id: 5,
    icon: Network,
    label: "05",
    title: "Multi-Market Architecture",
    summary: "ENS subdomain isolation",
    description:
      "Markets run on separate ENS subdomains, allowing isolated prediction environments.",
  },
  {
    id: 6,
    icon: Timer,
    label: "06",
    title: "Private Until Settlement",
    summary: "Decrypt on resolution",
    description:
      "When the market ends, the encrypted pool is decrypted and the result becomes visible.",
  },
];

export default function FeatureCards() {
  const [activeCard, setActiveCard] = useState<number | null>(null);

  return (
    <section className="w-full px-4 py-16 sm:py-24 lg:mt-58">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <div className="mb-12 sm:mb-16 text-center">
          <h2
            className="text-3xl sm:text-4xl font-semibold tracking-tight font-playfair-display"
          >
            Built for privacy,
            <br />
            <span style={{ color: "var(--primary)" }}>by design.</span>
          </h2>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            const isActive = activeCard === feature.id;

            return (
              <button
                key={feature.id}
                onClick={() => setActiveCard(isActive ? null : feature.id)}
                className="group relative text-left rounded-xl p-5 sm:p-6 transition-all duration-300 cursor-pointer focus:outline-none"
                style={{
                  background: isActive ? "var(--primary)" : "var(--card)",
                  border: isActive
                    ? "1px solid var(--primary)"
                    : "1px solid var(--border)",
                  transform: isActive ? "translateY(-1px)" : "translateY(0)",
                  boxShadow: isActive
                    ? "0 8px 32px color-mix(in oklch, var(--primary) 20%, transparent)"
                    : "0 0 0 transparent",
                }}
              >
                {/* Top row: icon + number */}
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-300"
                    style={{
                      background: isActive
                        ? "rgba(255,255,255,0.15)"
                        : "color-mix(in oklch, var(--primary) 8%, transparent)",
                    }}
                  >
                    <Icon
                      size={17}
                      strokeWidth={1.75}
                      style={{
                        color: isActive ? "#ffffff" : "var(--primary)",
                      }}
                    />
                  </div>

                  <span
                    className="font-mono text-[11px] tracking-widest transition-colors duration-300"
                    style={{
                      color: isActive
                        ? "rgba(255,255,255,0.4)"
                        : "var(--muted-foreground)",
                    }}
                  >
                    {feature.label}
                  </span>
                </div>

                {/* Title */}
                <h3
                  className="text-[15px] font-semibold leading-snug mb-1.5 transition-colors duration-300"
                  style={{
                    color: isActive ? "#ffffff" : "var(--card-foreground)",
                  }}
                >
                  {feature.title}
                </h3>

                {/* Summary line */}
                <p
                  className="text-xs font-mono mb-3 transition-colors duration-300"
                  style={{
                    color: isActive ? "rgba(255,255,255,0.55)" : "var(--primary)",
                  }}
                >
                  {feature.summary}
                </p>

                {/* Description — expands on click */}
                <div
                  className="overflow-hidden transition-all duration-300 ease-in-out"
                  style={{
                    maxHeight: isActive ? "120px" : "0px",
                    opacity: isActive ? 1 : 0,
                  }}
                >
                  <p
                    className="text-sm leading-relaxed pt-1"
                    style={{ color: "rgba(255,255,255,0.75)" }}
                  >
                    {feature.description}
                  </p>
                </div>

                {/* Collapsed hint — shown when not active */}
                <div
                  className="overflow-hidden transition-all duration-300 ease-in-out"
                  style={{
                    maxHeight: isActive ? "0px" : "60px",
                    opacity: isActive ? 0 : 1,
                  }}
                >
                  <p
                    className="text-sm leading-relaxed line-clamp-2"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {feature.description}
                  </p>
                </div>

                {/* Tap indicator */}
                <div
                  className="flex items-center gap-1 mt-4 transition-all duration-300"
                  style={{
                    opacity: isActive ? 0 : 1,
                  }}
                >
                  <div
                    className="h-px flex-1 transition-all duration-300 group-hover:opacity-100"
                    style={{
                      background: "var(--border)",
                      opacity: 0.6,
                    }}
                  />
                  <span
                    className="text-[10px] font-mono tracking-widest uppercase transition-colors duration-200 group-hover:text-[var(--primary)]"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    tap
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}