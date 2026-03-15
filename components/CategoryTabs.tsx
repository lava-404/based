"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import {
  Zap,
  Landmark,
  Trophy,
  Bitcoin,
  Clapperboard,
  TrendingUp,
  Bot,
  FlaskConical,
  Globe,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Category = {
  label: string;
  value: string;
  Icon: LucideIcon;
  bg: string;
  text: string;
  activeBg: string;
  activeText: string;
  activeShadow: string;
};

const CATEGORIES: Category[] = [
  {
    label: "All",
    value: "",
    Icon: Zap,
    bg: "rgba(100, 116, 139, 0.10)",
    text: "#334155",
    activeBg: "#334155",
    activeText: "#f8fafc",
    activeShadow: "0 4px 14px rgba(51,65,85,0.25)",
  },
  {
    label: "Politics",
    value: "Politics",
    Icon: Landmark,
    bg: "rgba(168, 85, 247, 0.10)",
    text: "#7e22ce",
    activeBg: "#7e22ce",
    activeText: "#faf5ff",
    activeShadow: "0 4px 14px rgba(126,34,206,0.25)",
  },
  {
    label: "Sports",
    value: "Sports",
    Icon: Trophy,
    bg: "rgba(234, 179, 8, 0.10)",
    text: "#854d0e",
    activeBg: "#854d0e",
    activeText: "#fefce8",
    activeShadow: "0 4px 14px rgba(133,77,14,0.25)",
  },
  {
    label: "Crypto",
    value: "Crypto",
    Icon: Bitcoin,
    bg: "rgba(249, 115, 22, 0.10)",
    text: "#9a3412",
    activeBg: "#9a3412",
    activeText: "#fff7ed",
    activeShadow: "0 4px 14px rgba(154,52,18,0.25)",
  },
  {
    label: "Entertainment",
    value: "Entertainment",
    Icon: Clapperboard,
    bg: "rgba(236, 72, 153, 0.10)",
    text: "#9d174d",
    activeBg: "#9d174d",
    activeText: "#fdf2f8",
    activeShadow: "0 4px 14px rgba(157,23,77,0.25)",
  },
  {
    label: "Economics",
    value: "Economics",
    Icon: TrendingUp,
    bg: "rgba(34, 197, 94, 0.10)",
    text: "#14532d",
    activeBg: "#14532d",
    activeText: "#f0fdf4",
    activeShadow: "0 4px 14px rgba(20,83,45,0.25)",
  },
  {
    label: "Tech & AI",
    value: "Tech & AI",
    Icon: Bot,
    bg: "rgba(0, 82, 255, 0.10)",
    text: "#1e3a8a",
    activeBg: "#1e3a8a",
    activeText: "#eff6ff",
    activeShadow: "0 4px 14px rgba(30,58,138,0.25)",
  },
  {
    label: "Science",
    value: "Science",
    Icon: FlaskConical,
    bg: "rgba(6, 182, 212, 0.10)",
    text: "#164e63",
    activeBg: "#164e63",
    activeText: "#ecfeff",
    activeShadow: "0 4px 14px rgba(22,78,99,0.25)",
  },
  {
    label: "World",
    value: "World",
    Icon: Globe,
    bg: "rgba(20, 184, 166, 0.10)",
    text: "#134e4a",
    activeBg: "#134e4a",
    activeText: "#f0fdfa",
    activeShadow: "0 4px 14px rgba(19,78,74,0.25)",
  },
  {
    label: "Pop Culture",
    value: "Pop Culture",
    Icon: Sparkles,
    bg: "rgba(239, 68, 68, 0.10)",
    text: "#7f1d1d",
    activeBg: "#7f1d1d",
    activeText: "#fff1f2",
    activeShadow: "0 4px 14px rgba(127,29,29,0.25)",
  },
];

export function CategoryTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const active = searchParams.get("category") ?? "";

  function select(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("category", value);
    else params.delete("category");
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  return (
    <div
      className="bg-transaparent border-b border-border sticky z-10"
      style={{ top: "57px" }}>
      <div className="relative max-w-6xl mx-auto">
        <div
          role="tablist"
          aria-label="Market categories"
          className="flex items-center gap-2.5 overflow-x-auto px-6 py-3.5"
          style={{ scrollbarWidth: "none" }}>
          {CATEGORIES.map(({ label, value, Icon, bg, text, activeBg, activeText, activeShadow }) => {
            const isActive = active === value;
            return (
              <button
                key={value}
                role="tab"
                aria-selected={isActive}
                onClick={() => select(value)}
                style={
                  isActive
                    ? {
                        backgroundColor: activeBg,
                        color: activeText,
                        boxShadow: activeShadow,
                      }
                    : {
                        backgroundColor: bg,
                        color: text,
                      }
                }
                className={[
                  "relative shrink-0 flex items-center gap-2 px-4 py-2",
                  "rounded-full text-sm font-semibold whitespace-nowrap",
                  "transition-all duration-200 outline-none select-none",
                  "focus-visible:ring-2 focus-visible:ring-ring",
                  isActive
                    ? "scale-[1.04]"
                    : "hover:scale-[1.03] hover:brightness-95",
                  isPending && isActive ? "opacity-60" : "",
                ].join(" ")}
              >
                <Icon size={15} strokeWidth={2.3} />
                <span>{label}</span>

                {isPending && isActive && (
                  <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}