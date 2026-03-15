"use client";

import { useParams } from "next/navigation";
import { useAccount } from "wagmi";
import MarketDashboard from "@/components/MarketDashboard";

export default function MarketPage() {
  const params = useParams();
  const address = params?.address as string;
  const { isConnected } = useAccount();

  if (!address) {
    return <div style={{ padding: "32px", textAlign: "center", color: "#dc2626" }}>Market address not found</div>;
  }

  if (!isConnected) {
    return (
      <div style={{ padding: "32px", textAlign: "center" }}>
        <p style={{ fontSize: "16px", color: "#71717a", marginBottom: "16px" }}>
          Please connect your wallet to view this market
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: "32px" }}>
      <MarketDashboard marketAddress={address} />
    </div>
  );
}
