"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAccount, useWalletClient, usePublicClient } from "wagmi";

// ABIs
const MARKET_ABI = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "function",
    name: "deposit",
  },
  {
    inputs: [{ internalType: "bytes32", name: "amount", type: "bytes32" }],
    stateMutability: "nonpayable",
    type: "function",
    name: "claimWinnings",
  },
  {
    inputs: [{ internalType: "bytes32", name: "amount", type: "bytes32" }],
    stateMutability: "nonpayable",
    type: "function",
    name: "redeem",
  },
  {
    inputs: [{ internalType: "bool", name: "outcomeYesWins_", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
    name: "resolve",
  },
  {
    inputs: [],
    stateMutability: "view",
    type: "function",
    name: "question",
    outputs: [{ internalType: "string", name: "", type: "string" }],
  },
  {
    inputs: [],
    stateMutability: "view",
    type: "function",
    name: "endTime",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
  },
  {
    inputs: [],
    stateMutability: "view",
    type: "function",
    name: "resolved",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
  },
  {
    inputs: [],
    stateMutability: "view",
    type: "function",
    name: "outcomeYesWins",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
  },
  {
    inputs: [],
    stateMutability: "view",
    type: "function",
    name: "resolver",
    outputs: [{ internalType: "address", name: "", type: "address" }],
  },
  {
    inputs: [],
    stateMutability: "view",
    type: "function",
    name: "yesToken",
    outputs: [{ internalType: "address", name: "", type: "address" }],
  },
  {
    inputs: [],
    stateMutability: "view",
    type: "function",
    name: "noToken",
    outputs: [{ internalType: "address", name: "", type: "address" }],
  },
] as const;

const OUTCOME_TOKEN_ABI = [
  {
    inputs: [
      { internalType: "address", name: "account", type: "address" },
    ],
    stateMutability: "view",
    type: "function",
    name: "balanceOf",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
  },
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "bytes32", name: "amount", type: "bytes32" },
    ],
    stateMutability: "nonpayable",
    type: "function",
    name: "transfer",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
  },
  {
    inputs: [],
    stateMutability: "view",
    type: "function",
    name: "name",
    outputs: [{ internalType: "string", name: "", type: "string" }],
  },
  {
    inputs: [],
    stateMutability: "view",
    type: "function",
    name: "symbol",
    outputs: [{ internalType: "string", name: "", type: "string" }],
  },
] as const;

const POOL_ABI = [
  {
    inputs: [{ internalType: "bytes32", name: "amount", type: "bytes32" }],
    stateMutability: "nonpayable",
    type: "function",
    name: "addLiquidity",
  },
  {
    inputs: [{ internalType: "bytes32", name: "amount", type: "bytes32" }],
    stateMutability: "nonpayable",
    type: "function",
    name: "removeLiquidity",
  },
  {
    inputs: [],
    stateMutability: "view",
    type: "function",
    name: "market",
    outputs: [{ internalType: "address", name: "", type: "address" }],
  },
] as const;

const USDC_ABI = [
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    stateMutability: "nonpayable",
    type: "function",
    name: "approve",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    stateMutability: "view",
    type: "function",
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
  },
] as const;

const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b1566469c3d" as const;

interface MarketData {
  address: string;
  question: string;
  endTime: number;
  resolved: boolean;
  outcomeYesWins?: boolean;
  resolver: string;
  yesToken: string;
  noToken: string;
}

interface Tab {
  id: "overview" | "transfer" | "claim" | "redeem" | "liquidity";
  label: string;
  icon: string;
}

export default function MarketDashboard({ marketAddress }: { marketAddress: string }) {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const [activeTab, setActiveTab] = useState<"overview" | "transfer" | "claim" | "redeem" | "liquidity">("overview");
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [yesBalance, setYesBalance] = useState<string>("0");
  const [noBalance, setNoBalance] = useState<string>("0");
  const [loading, setLoading] = useState(true);
  const [transacting, setTransacting] = useState(false);
  const [txStatus, setTxStatus] = useState<string>("");

  // Tab content state
  const [transferRecipient, setTransferRecipient] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferToken, setTransferToken] = useState<"yes" | "no">("yes");
  const [claimAmount, setClaimAmount] = useState("");
  const [redeemYesAmount, setRedeemYesAmount] = useState("");
  const [redeemNoAmount, setRedeemNoAmount] = useState("");
  const [lpAmount, setLpAmount] = useState("");
  const [lpAction, setLpAction] = useState<"add" | "remove">("add");

  // Load market data
  useEffect(() => {
    const loadMarketData = async () => {
      if (!publicClient) return;
      setLoading(true);

      try {
        // Get market details
        const question = await publicClient.readContract({
          address: marketAddress as `0x${string}`,
          abi: MARKET_ABI,
          functionName: "question",
        });

        const endTime = await publicClient.readContract({
          address: marketAddress as `0x${string}`,
          abi: MARKET_ABI,
          functionName: "endTime",
        });

        const resolved = await publicClient.readContract({
          address: marketAddress as `0x${string}`,
          abi: MARKET_ABI,
          functionName: "resolved",
        });

        const resolver = await publicClient.readContract({
          address: marketAddress as `0x${string}`,
          abi: MARKET_ABI,
          functionName: "resolver",
        });

        const yesToken = await publicClient.readContract({
          address: marketAddress as `0x${string}`,
          abi: MARKET_ABI,
          functionName: "yesToken",
        });

        const noToken = await publicClient.readContract({
          address: marketAddress as `0x${string}`,
          abi: MARKET_ABI,
          functionName: "noToken",
        });

        let outcomeYesWins;
        if (resolved) {
          outcomeYesWins = await publicClient.readContract({
            address: marketAddress as `0x${string}`,
            abi: MARKET_ABI,
            functionName: "outcomeYesWins",
          });
        }

        setMarketData({
          address: marketAddress,
          question: question as string,
          endTime: Number(endTime),
          resolved: resolved as boolean,
          outcomeYesWins: outcomeYesWins as boolean | undefined,
          resolver: resolver as string,
          yesToken: yesToken as string,
          noToken: noToken as string,
        });

        // Load token balances if user connected
        if (address) {
          const yesBal = await publicClient.readContract({
            address: yesToken as `0x${string}`,
            abi: OUTCOME_TOKEN_ABI,
            functionName: "balanceOf",
            args: [address],
          });

          const noBal = await publicClient.readContract({
            address: noToken as `0x${string}`,
            abi: OUTCOME_TOKEN_ABI,
            functionName: "balanceOf",
            args: [address],
          });

          setYesBalance(yesBal ? yesBal.toString() : "0");
          setNoBalance(noBal ? noBal.toString() : "0");
        }
      } catch (error) {
        console.error("Error loading market:", error);
        setTxStatus("Failed to load market data");
      } finally {
        setLoading(false);
      }
    };

    loadMarketData();
  }, [marketAddress, address, publicClient]);

  const handleTransferToken = async () => {
    if (!walletClient || !publicClient || !address || !marketData) return;
    if (!transferRecipient || !transferAmount) {
      setTxStatus("Please fill all fields");
      return;
    }

    setTransacting(true);
    setTxStatus("Processing transfer...");

    try {
      const tokenAddress = transferToken === "yes" ? marketData.yesToken : marketData.noToken;
      const amount = BigInt(transferAmount);

      const hash = await walletClient.writeContract({
        address: tokenAddress as `0x${string}`,
        abi: OUTCOME_TOKEN_ABI,
        functionName: "transfer",
        args: [transferRecipient as `0x${string}`, amount as any],
      });

      await publicClient.waitForTransactionReceipt({ hash });
      setTxStatus(`✓ ${transferToken.toUpperCase()} tokens transferred!`);
      setTransferRecipient("");
      setTransferAmount("");

      // Refresh balances
      const newBal = await publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: OUTCOME_TOKEN_ABI,
        functionName: "balanceOf",
        args: [address],
      });

      if (transferToken === "yes") {
        setYesBalance(newBal ? newBal.toString() : "0");
      } else {
        setNoBalance(newBal ? newBal.toString() : "0");
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Transfer failed";
      setTxStatus(`✗ ${msg}`);
    } finally {
      setTransacting(false);
    }
  };

  const handleClaimWinnings = async () => {
    if (!walletClient || !publicClient || !address || !marketData || !claimAmount) return;

    setTransacting(true);
    setTxStatus("Claiming winnings...");

    try {
      const amount = BigInt(claimAmount);

      const hash = await walletClient.writeContract({
        address: marketAddress as `0x${string}`,
        abi: MARKET_ABI,
        functionName: "claimWinnings",
        args: [amount as any],
      });

      await publicClient.waitForTransactionReceipt({ hash });
      setTxStatus("✓ Winnings claimed!");
      setClaimAmount("");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Claim failed";
      setTxStatus(`✗ ${msg}`);
    } finally {
      setTransacting(false);
    }
  };

  const handleRedeem = async () => {
    if (!walletClient || !publicClient || !address || !marketData) return;
    if (!redeemYesAmount && !redeemNoAmount) {
      setTxStatus("Enter amount to redeem");
      return;
    }

    setTransacting(true);
    setTxStatus("Redeeming tokens...");

    try {
      const amount = BigInt(redeemYesAmount || redeemNoAmount || "0");

      const hash = await walletClient.writeContract({
        address: marketAddress as `0x${string}`,
        abi: MARKET_ABI,
        functionName: "redeem",
        args: [amount as any],
      });

      await publicClient.waitForTransactionReceipt({ hash });
      setTxStatus("✓ Tokens redeemed!");
      setRedeemYesAmount("");
      setRedeemNoAmount("");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Redeem failed";
      setTxStatus(`✗ ${msg}`);
    } finally {
      setTransacting(false);
    }
  };

  const handleLiquidityAction = async () => {
    if (!walletClient || !publicClient || !address || !marketData || !lpAmount) return;

    setTransacting(true);
    setTxStatus(`${lpAction === "add" ? "Adding" : "Removing"} liquidity...`);

    try {
      const amount = BigInt(lpAmount);

      const hash = await walletClient.writeContract({
        address: marketAddress as `0x${string}`,
        abi: POOL_ABI,
        functionName: lpAction === "add" ? "addLiquidity" : "removeLiquidity",
        args: [amount as any],
      });

      await publicClient.waitForTransactionReceipt({ hash });
      setTxStatus(`✓ Liquidity ${lpAction === "add" ? "added" : "removed"}!`);
      setLpAmount("");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Operation failed";
      setTxStatus(`✗ ${msg}`);
    } finally {
      setTransacting(false);
    }
  };

  const handleResolveMarket = async (outcome: boolean) => {
    if (!walletClient || !publicClient || !address || !marketData) return;
    if (address.toLowerCase() !== marketData.resolver.toLowerCase()) {
      setTxStatus("Only resolver can resolve market");
      return;
    }

    setTransacting(true);
    setTxStatus(`Resolving to ${outcome ? "YES" : "NO"}...`);

    try {
      const hash = await walletClient.writeContract({
        address: marketAddress as `0x${string}`,
        abi: MARKET_ABI,
        functionName: "resolve",
        args: [outcome],
      });

      await publicClient.waitForTransactionReceipt({ hash });
      setTxStatus(`✓ Market resolved to ${outcome ? "YES" : "NO"}!`);

      // Reload market data
      const resolved = await publicClient.readContract({
        address: marketAddress as `0x${string}`,
        abi: MARKET_ABI,
        functionName: "resolved",
      });

      if (resolved && marketData) {
        const outcomeYesWins = await publicClient.readContract({
          address: marketAddress as `0x${string}`,
          abi: MARKET_ABI,
          functionName: "outcomeYesWins",
        });

        setMarketData({ ...marketData, resolved: true, outcomeYesWins: outcomeYesWins as boolean });
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Resolution failed";
      setTxStatus(`✗ ${msg}`);
    } finally {
      setTransacting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "32px", textAlign: "center", color: "#71717a" }}>
        Loading market...
      </div>
    );
  }

  if (!marketData) {
    return (
      <div style={{ padding: "32px", textAlign: "center", color: "#dc2626" }}>
        Market not found
      </div>
    );
  }

  const tabs: Tab[] = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "transfer", label: "Transfer", icon: "🔄" },
    { id: "claim", label: "Claim", icon: "🏆" },
    { id: "redeem", label: "Redeem", icon: "💱" },
    { id: "liquidity", label: "Liquidity", icon: "💧" },
  ];

  const pastEndTime = Date.now() > marketData.endTime * 1000;

  return (
    <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e4e4e7", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "24px", background: "#f4f4f5", borderBottom: "1px solid #e4e4e7" }}>
        <h2 style={{ margin: "0 0 8px", fontSize: "20px", fontWeight: 700, color: "#0a0a0a" }}>
          {marketData.question}
        </h2>
        <div style={{ display: "flex", gap: "24px", fontSize: "13px", color: "#71717a" }}>
          <span>📍 {marketData.address.slice(0, 6)}...{marketData.address.slice(-4)}</span>
          <span>📅 {new Date(marketData.endTime * 1000).toLocaleDateString()}</span>
          <span style={{ fontWeight: 600 }}>
            {marketData.resolved ? `✓ ${marketData.outcomeYesWins ? "YES" : "NO"} Won` : pastEndTime ? "⏰ Pending Resolution" : "🔄 Active"}
          </span>
        </div>
      </div>

      {/* Token Balances */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", padding: "20px", background: "#f9f9f9", borderBottom: "1px solid #e4e4e7" }}>
        <div style={{ padding: "12px", background: "#f0f5ff", borderRadius: "8px", border: "1px solid #dbeafe" }}>
          <p style={{ fontSize: "11px", fontWeight: 600, color: "#0052ff", margin: "0 0 4px", textTransform: "uppercase" }}>YES Tokens</p>
          <p style={{ fontSize: "16px", fontWeight: 700, color: "#0a0a0a", margin: 0 }}>{yesBalance}</p>
        </div>
        <div style={{ padding: "12px", background: "#f5f5f5", borderRadius: "8px", border: "1px solid #e5e5e5" }}>
          <p style={{ fontSize: "11px", fontWeight: 600, color: "#71717a", margin: "0 0 4px", textTransform: "uppercase" }}>NO Tokens</p>
          <p style={{ fontSize: "16px", fontWeight: 700, color: "#0a0a0a", margin: 0 }}>{noBalance}</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #e4e4e7", background: "#ffffff" }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: "16px",
              background: activeTab === tab.id ? "#0052FF" : "transparent",
              color: activeTab === tab.id ? "#ffffff" : "#71717a",
              border: "none",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 600,
              transition: "all 0.2s ease",
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ padding: "20px" }}>
        {/* Overview */}
        {activeTab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ padding: "12px", background: "#f0f5ff", borderRadius: "8px" }}>
              <p style={{ fontSize: "11px", color: "#0052ff", margin: "0 0 4px", fontWeight: 600 }}>Market Status</p>
              <p style={{ fontSize: "14px", margin: 0, color: "#0a0a0a", fontWeight: 600 }}>
                {marketData.resolved ? `Resolved to: ${marketData.outcomeYesWins ? "YES" : "NO"}` : `${pastEndTime ? "Awaiting" : "Active"}`}
              </p>
            </div>

            {address?.toLowerCase() === marketData.resolver.toLowerCase() && !marketData.resolved && pastEndTime && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <button
                  onClick={() => handleResolveMarket(true)}
                  disabled={transacting}
                  style={{
                    padding: "12px",
                    background: "#0052FF",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: 600,
                    opacity: transacting ? 0.7 : 1,
                  }}
                >
                  Resolve YES
                </button>
                <button
                  onClick={() => handleResolveMarket(false)}
                  disabled={transacting}
                  style={{
                    padding: "12px",
                    background: "#71717a",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: 600,
                    opacity: transacting ? 0.7 : 1,
                  }}
                >
                  Resolve NO
                </button>
              </div>
            )}
          </div>
        )}

        {/* Transfer */}
        {activeTab === "transfer" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <select
              value={transferToken}
              onChange={(e) => setTransferToken(e.target.value as "yes" | "no")}
              style={{
                padding: "10px 12px",
                border: "1px solid #e4e4e7",
                borderRadius: "6px",
                fontSize: "13px",
                background: "#ffffff",
              }}
            >
              <option value="yes">YES Token</option>
              <option value="no">NO Token</option>
            </select>

            <input
              type="text"
              placeholder="Recipient address"
              value={transferRecipient}
              onChange={(e) => setTransferRecipient(e.target.value)}
              style={{
                padding: "10px 12px",
                border: "1px solid #e4e4e7",
                borderRadius: "6px",
                fontSize: "13px",
                background: "#ffffff",
              }}
            />

            <input
              type="number"
              placeholder="Amount"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              style={{
                padding: "10px 12px",
                border: "1px solid #e4e4e7",
                borderRadius: "6px",
                fontSize: "13px",
                background: "#ffffff",
              }}
            />

            <button
              onClick={handleTransferToken}
              disabled={transacting}
              style={{
                padding: "12px",
                background: "#0052FF",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: 600,
                opacity: transacting ? 0.7 : 1,
              }}
            >
              Transfer
            </button>
          </div>
        )}

        {/* Claim */}
        {activeTab === "claim" && marketData.resolved && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <p style={{ fontSize: "13px", color: "#71717a", margin: 0 }}>
              {marketData.outcomeYesWins ? "You won! Claim your USDC from YES tokens." : "You won! Claim your USDC from NO tokens."}
            </p>

            <input
              type="number"
              placeholder="Amount to claim"
              value={claimAmount}
              onChange={(e) => setClaimAmount(e.target.value)}
              style={{
                padding: "10px 12px",
                border: "1px solid #e4e4e7",
                borderRadius: "6px",
                fontSize: "13px",
                background: "#ffffff",
              }}
            />

            <button
              onClick={handleClaimWinnings}
              disabled={transacting}
              style={{
                padding: "12px",
                background: "#059669",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: 600,
                opacity: transacting ? 0.7 : 1,
              }}
            >
              Claim Winnings
            </button>
          </div>
        )}

        {/* Redeem */}
        {activeTab === "redeem" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <p style={{ fontSize: "13px", color: "#71717a", margin: 0 }}>
              Exchange your tokens back for USDC
            </p>

            <input
              type="number"
              placeholder="YES amount to redeem"
              value={redeemYesAmount}
              onChange={(e) => setRedeemYesAmount(e.target.value)}
              style={{
                padding: "10px 12px",
                border: "1px solid #e4e4e7",
                borderRadius: "6px",
                fontSize: "13px",
                background: "#ffffff",
              }}
            />

            <input
              type="number"
              placeholder="NO amount to redeem"
              value={redeemNoAmount}
              onChange={(e) => setRedeemNoAmount(e.target.value)}
              style={{
                padding: "10px 12px",
                border: "1px solid #e4e4e7",
                borderRadius: "6px",
                fontSize: "13px",
                background: "#ffffff",
              }}
            />

            <button
              onClick={handleRedeem}
              disabled={transacting}
              style={{
                padding: "12px",
                background: "#7c3aed",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: 600,
                opacity: transacting ? 0.7 : 1,
              }}
            >
              Redeem Tokens
            </button>
          </div>
        )}

        {/* Liquidity */}
        {activeTab === "liquidity" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <button
                onClick={() => setLpAction("add")}
                style={{
                  padding: "10px",
                  background: lpAction === "add" ? "#0052FF" : "#e4e4e7",
                  color: lpAction === "add" ? "#ffffff" : "#0a0a0a",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "13px",
                }}
              >
                Add Liquidity
              </button>
              <button
                onClick={() => setLpAction("remove")}
                style={{
                  padding: "10px",
                  background: lpAction === "remove" ? "#0052FF" : "#e4e4e7",
                  color: lpAction === "remove" ? "#ffffff" : "#0a0a0a",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "13px",
                }}
              >
                Remove Liquidity
              </button>
            </div>

            <input
              type="number"
              placeholder="Amount (USDC)"
              value={lpAmount}
              onChange={(e) => setLpAmount(e.target.value)}
              style={{
                padding: "10px 12px",
                border: "1px solid #e4e4e7",
                borderRadius: "6px",
                fontSize: "13px",
                background: "#ffffff",
              }}
            />

            <button
              onClick={handleLiquidityAction}
              disabled={transacting}
              style={{
                padding: "12px",
                background: "#0ea5e9",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: 600,
                opacity: transacting ? 0.7 : 1,
              }}
            >
              {lpAction === "add" ? "Add" : "Remove"}
            </button>
          </div>
        )}

        {/* Status Message */}
        {txStatus && (
          <div
            style={{
              marginTop: "16px",
              padding: "12px",
              background: txStatus.includes("✗") ? "#fee2e2" : "#ecfdf5",
              border: `1px solid ${txStatus.includes("✗") ? "#fca5a5" : "#bbf7d0"}`,
              borderRadius: "8px",
              fontSize: "12px",
              color: txStatus.includes("✗") ? "#991b1b" : "#047857",
            }}
          >
            {txStatus}
          </div>
        )}
      </div>
    </div>
  );
}
