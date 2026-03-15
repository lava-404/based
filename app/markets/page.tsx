"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import CreateMarketModal from "@/components/CreateMarketModal";

interface MarketItem {
  address: string;
  question: string;
  createdAt: string;
}

export default function MarketsPage() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const [searchAddress, setSearchAddress] = useState("");
  const [markets, setMarkets] = useState<MarketItem[]>([
    // Demo markets - in production, fetch from blockchain/backend
    {
      address: "0x1234567890123456789012345678901234567890",
      question: "Will Bitcoin exceed $100,000 before end of 2025?",
      createdAt: "2025-03-15",
    },
    {
      address: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
      question: "Will the Fed cut rates by Q3 2025?",
      createdAt: "2025-03-14",
    },
  ]);

  const handleSearch = () => {
    if (searchAddress.length === 42) {
      // Valid ethereum address
      router.push(`/markets/${searchAddress}`);
    }
  };

  return (
    <div style={{ padding: "32px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ margin: "0 0 8px", fontSize: "32px", fontWeight: 700, color: "#0a0a0a" }}>
          Prediction Markets
        </h1>
        <p style={{ margin: 0, fontSize: "14px", color: "#71717a" }}>
          Create and manage encrypted prediction markets with FloodBase
        </p>
      </div>

      {/* Create Market Button */}
      {isConnected && (
        <div style={{ marginBottom: "32px" }}>
          <CreateMarketModal onSubmit={(data) => {
            console.log("Market created:", data);
          }} />
        </div>
      )}

      {/* Search Section */}
      <div
        style={{
          padding: "20px",
          background: "#f9f9f9",
          borderRadius: "12px",
          border: "1px solid #e4e4e7",
          marginBottom: "32px",
        }}
      >
        <h3 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: 600, color: "#0a0a0a" }}>
          View Market
        </h3>
        <div style={{ display: "flex", gap: "12px" }}>
          <input
            type="text"
            placeholder="Enter market address (0x...)"
            value={searchAddress}
            onChange={(e) => setSearchAddress(e.target.value)}
            style={{
              flex: 1,
              padding: "10px 12px",
              border: "1px solid #e4e4e7",
              borderRadius: "8px",
              fontSize: "13px",
              background: "#ffffff",
            }}
          />
          <button
            onClick={handleSearch}
            disabled={searchAddress.length !== 42}
            style={{
              padding: "10px 24px",
              background: searchAddress.length === 42 ? "#0052FF" : "#bfdbfe",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              cursor: searchAddress.length === 42 ? "pointer" : "not-allowed",
              fontWeight: 600,
              fontSize: "13px",
            }}
          >
            Search
          </button>
        </div>
      </div>

      {/* Markets Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
        {markets.map((market) => (
          <div
            key={market.address}
            onClick={() => router.push(`/markets/${market.address}`)}
            style={{
              padding: "20px",
              background: "#ffffff",
              borderRadius: "12px",
              border: "1px solid #e4e4e7",
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = "#0052FF";
              (e.currentTarget as HTMLDivElement).style.boxShadow =
                "0 4px 12px rgba(0, 82, 255, 0.1)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = "#e4e4e7";
              (e.currentTarget as HTMLDivElement).style.boxShadow =
                "0 1px 2px rgba(0, 0, 0, 0.05)";
            }}
          >
            <h3 style={{ margin: "0 0 12px", fontSize: "15px", fontWeight: 600, color: "#0a0a0a" }}>
              {market.question}
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#71717a" }}>Address:</span>
                <span
                  style={{
                    fontFamily: "monospace",
                    color: "#0052FF",
                    fontWeight: 600,
                  }}
                >
                  {market.address.slice(0, 6)}...{market.address.slice(-4)}
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#71717a" }}>Created:</span>
                <span style={{ color: "#0a0a0a", fontWeight: 500 }}>{market.createdAt}</span>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  marginTop: "12px",
                  paddingTop: "12px",
                  borderTop: "1px solid #e4e4e7",
                }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(market.address);
                  }}
                  style={{
                    flex: 1,
                    padding: "8px",
                    background: "#f4f4f5",
                    border: "1px solid #e4e4e7",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#0a0a0a",
                  }}
                >
                  Copy
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  style={{
                    flex: 1,
                    padding: "8px",
                    background: "#0052FF",
                    border: "none",
                    borderRadius: "6px",
                    color: "#ffffff",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  View →
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {markets.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "64px 32px",
            color: "#71717a",
          }}
        >
          <p style={{ fontSize: "16px", margin: "0 0 8px" }}>No markets found</p>
          <p style={{ fontSize: "13px", margin: 0 }}>Create one to get started</p>
        </div>
      )}
    </div>
  );
}
