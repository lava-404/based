"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";

const CATEGORIES: { label: string; value: string }[] = [
  { label: "All", value: "" },
  { label: "Created", value: "Created" },
  { label: "Politics", value: "Politics" },
  { label: "Sports", value: "Sports" },
  { label: "Crypto", value: "Crypto" },
  { label: "Entertainment", value: "Entertainment" },
  { label: "Economics", value: "Economics" },
  { label: "Tech & AI", value: "Tech & AI" },
  { label: "Science", value: "Science" },
  { label: "World", value: "World" },
  { label: "Pop Culture", value: "Pop Culture" },
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
    <div className="sticky z-10" style={{ top: "57px" }}>
      <div
        role="tablist"
        aria-label="Market categories"
        className="flex items-center gap-6 overflow-x-auto max-w-6xl mx-auto px-6 py-3"
        style={{ scrollbarWidth: "none" }}
      >
        {CATEGORIES.map(({ label, value }) => {
          const isActive = active === value;
          return (
            <button
              key={value}
              role="tab"
              aria-selected={isActive}
              onClick={() => select(value)}
              className={[
                "shrink-0 text-[13px] font-medium whitespace-nowrap",
                "transition-colors duration-150 outline-none select-none",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                isActive
                  ? "text-[#0a0a0a] border-b border-[#0a0a0a] pb-0.5"
                  : "text-[#71717a] border-b border-transparent pb-0.5 hover:text-[#0a0a0a]",
                isPending && isActive ? "opacity-60" : "",
              ].join(" ")}
            >
              {label}
              {isPending && isActive && (
                <span className="ml-0.5 inline-block h-1 w-1 rounded-full bg-current animate-pulse align-middle" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}