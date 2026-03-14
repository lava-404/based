"use client";

import { useState, useEffect } from "react";

export function useEnsName(address: string | undefined): string | null {
  const [ensName, setEnsName] = useState<string | null>(null);

  useEffect(() => {
    if (!address) {
      setEnsName(null);
      return;
    }
    let cancelled = false;
    const base = typeof window !== "undefined" ? window.location.origin : "";
    fetch(`${base}/api/ens?address=${encodeURIComponent(address)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data?.name) setEnsName(data.name);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [address]);

  return ensName;
}
