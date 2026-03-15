"use client";

import { useState, useEffect, useRef, useCallback, KeyboardEvent, FormEvent } from "react";
import { useAccount, useWalletClient, usePublicClient } from "wagmi";
import { parseEventLogs } from "viem";

// ── ABI ──────────────────────────────────────────────────────────────────────

const FACTORY_ABI = [
  {
    inputs: [
      { internalType: "address", name: "collateralToken_", type: "address" },
      { internalType: "string", name: "question_", type: "string" },
      { internalType: "uint256", name: "endTime_", type: "uint256" },
      { internalType: "string", name: "yesName_", type: "string" },
      { internalType: "string", name: "yesSymbol_", type: "string" },
      { internalType: "string", name: "noName_", type: "string" },
      { internalType: "string", name: "noSymbol_", type: "string" },
    ],
    stateMutability: "nonpayable",
    type: "function",
    name: "createMarket",
    outputs: [{ internalType: "address", name: "market", type: "address" }],
  },
  {
    inputs: [
      { internalType: "address", name: "market", type: "address", indexed: true },
      { internalType: "address", name: "yesToken", type: "address", indexed: true },
      { internalType: "address", name: "noToken", type: "address", indexed: true },
      { internalType: "string", name: "question", type: "string", indexed: false },
      { internalType: "uint256", name: "endTime", type: "uint256", indexed: false },
      { internalType: "address", name: "resolver", type: "address", indexed: false },
    ],
    type: "event",
    name: "MarketCreated",
    anonymous: false,
  },
] as const;

const MARKET_ABI = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "function",
    name: "deposit",
  },
  {
    inputs: [
      { internalType: "euint256", name: "amount", type: "bytes32" },
    ],
    stateMutability: "nonpayable",
    type: "function",
    name: "claimWinnings",
  },
  {
    inputs: [
      { internalType: "euint256", name: "amount", type: "bytes32" },
    ],
    stateMutability: "nonpayable",
    type: "function",
    name: "redeem",
  },
  {
    inputs: [
      { internalType: "bool", name: "outcomeYesWins_", type: "bool" },
    ],
    stateMutability: "nonpayable",
    type: "function",
    name: "resolve",
  },
  {
    inputs: [
      { internalType: "address", name: "user", type: "address", indexed: true },
      { internalType: "euint256", name: "amount", type: "bytes32", indexed: false },
    ],
    type: "event",
    name: "Deposit",
    anonymous: false,
  },
  {
    inputs: [
      { internalType: "address", name: "user", type: "address", indexed: true },
      { internalType: "euint256", name: "amount", type: "bytes32", indexed: false },
    ],
    type: "event",
    name: "ClaimWinnings",
    anonymous: false,
  },
  {
    inputs: [
      { internalType: "address", name: "user", type: "address", indexed: true },
      { internalType: "euint256", name: "amount", type: "bytes32", indexed: false },
    ],
    type: "event",
    name: "Redeem",
    anonymous: false,
  },
  {
    inputs: [
      { internalType: "bool", name: "outcomeYesWins", type: "bool", indexed: false },
    ],
    type: "event",
    name: "Resolved",
    anonymous: false,
  },
  {
    inputs: [],
    stateMutability: "view",
    type: "function",
    name: "collateralToken",
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
    name: "resolver",
    outputs: [{ internalType: "address", name: "", type: "address" }],
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
    name: "totalCollateral",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
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

const OUTCOME_TOKEN_ABI = [
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "bytes32", name: "amount", type: "bytes32" },
    ],
    stateMutability: "nonpayable",
    type: "function",
    name: "approve",
  },
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
    inputs: [
      { internalType: "address", name: "from", type: "address" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "bytes32", name: "amount", type: "bytes32" },
    ],
    stateMutability: "nonpayable",
    type: "function",
    name: "transferFrom",
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
    inputs: [
      { internalType: "bytes32", name: "amount", type: "bytes32" },
    ],
    stateMutability: "nonpayable",
    type: "function",
    name: "addLiquidity",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "amount", type: "bytes32" },
    ],
    stateMutability: "nonpayable",
    type: "function",
    name: "removeLiquidity",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "amount", type: "bytes32" },
    ],
    stateMutability: "nonpayable",
    type: "function",
    name: "rebalance",
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
  {
    inputs: [],
    stateMutability: "view",
    type: "function",
    name: "market",
    outputs: [{ internalType: "address", name: "", type: "address" }],
  },
] as const;

const FACTORY_ADDRESS = "0x11986c6Ea2eA0168530990eA873983c59054390F" as const;
const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b1566469c3d" as const;

// ── Types ────────────────────────────────────────────────────────────────────

interface FormErrors {
  question?: string;
  options?: string;
  validTill?: string;
  yesPrice?: string;
  noPrice?: string;
}

interface MarketFormData {
  question: string;
  options: string[];
  validTill: string;
  yesPrice: string;
  noPrice: string;
}

interface CreateMarketModalProps {
  /** Called with the final form data when the user submits successfully. */
  onSubmit?: (data: MarketFormData) => void;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function CreateMarketModal({ onSubmit }: CreateMarketModalProps) {
  const [open, setOpen] = useState<boolean>(false);
  const [question, setQuestion] = useState<string>("");
  const [options, setOptions] = useState<string[]>(["Yes", "No"]);
  const [newOption, setNewOption] = useState<string>("");
  const [validTill, setValidTill] = useState<string>("");
  const [yesPrice, setYesPrice] = useState<string>("");
  const [noPrice, setNoPrice] = useState<string>("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [marketData, setMarketData] = useState<{
    market: string;
    yesToken: string;
    noToken: string;
  } | null>(null);
  const [buyingToken, setBuyingToken] = useState<"yes" | "no" | null>(null);
  const [buyTxHash, setBuyTxHash] = useState<string | null>(null);

  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLTextAreaElement>(null);

  // ── Reset ──────────────────────────────────────────────────────────────────

  const resetForm = useCallback((): void => {
    setQuestion("");
    setOptions(["Yes", "No"]);
    setNewOption("");
    setValidTill("");
    setYesPrice("");
    setNoPrice("");
    setErrors({});
    setSubmitted(false);
    setLoading(false);
    setTxHash(null);
    setMarketData(null);
  }, []);

  const handleClose = useCallback((): void => {
    setOpen(false);
    setTimeout(resetForm, 300);
  }, [resetForm]);

  // ── Side-effects ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      setTimeout(() => firstInputRef.current?.focus(), 50);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (evt: globalThis.KeyboardEvent): void => {
      if (evt.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, handleClose]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleBackdropClick = (evt: React.MouseEvent<HTMLDivElement>): void => {
    if (modalRef.current && !modalRef.current.contains(evt.target as Node)) {
      handleClose();
    }
  };

  const addOption = (): void => {
    const trimmed = newOption.trim();
    if (trimmed && !options.includes(trimmed)) {
      setOptions((prev) => [...prev, trimmed]);
      setNewOption("");
    }
  };

  const removeOption = (idx: number): void => {
    setOptions((prev) => prev.filter((_, i) => i !== idx));
  };

  const validate = (): FormErrors => {
    const errs: FormErrors = {};

    if (!question.trim()) {
      errs.question = "Question is required.";
    }
    if (options.length < 2) {
      errs.options = "At least 2 options required.";
    }
    if (!validTill) {
      errs.validTill = "Expiry date is required.";
    } else {
      const picked = new Date(validTill);
      const todayMidnight = new Date();
      todayMidnight.setHours(0, 0, 0, 0);
      if (picked <= todayMidnight) errs.validTill = "Date must be in the future.";
    }
    if (!yesPrice || isNaN(Number(yesPrice)) || Number(yesPrice) <= 0) {
      errs.yesPrice = "Enter a valid YES price.";
    }
    if (!noPrice || isNaN(Number(noPrice)) || Number(noPrice) <= 0) {
      errs.noPrice = "Enter a valid NO price.";
    }
    return errs;
  };

  const handleSubmit = async (evt: FormEvent<HTMLFormElement>): Promise<void> => {
    evt.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    if (!walletClient || !publicClient || !address) {
      setErrors({ question: "Wallet not connected" });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Convert date to Unix timestamp
      const endTime = Math.floor(new Date(validTill).getTime() / 1000);

      // Step 1: Call createMarket function
      const hash = await walletClient.writeContract({
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: "createMarket",
        args: [
          USDC_ADDRESS,
          question,
          BigInt(endTime),
          `${options[0]} Token`,
          options[0].substring(0, 3).toUpperCase(),
          `${options[1]} Token`,
          options[1].substring(0, 3).toUpperCase(),
        ],
      });

      setTxHash(hash);

      // Step 2: Wait for transaction receipt
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      // Step 3: Parse MarketCreated event from logs
      if (receipt && receipt.logs) {
        const parsedLogs = parseEventLogs({
          abi: FACTORY_ABI,
          logs: receipt.logs,
        });

        const marketCreatedEvent = parsedLogs.find(
          (log) => log.eventName === "MarketCreated"
        ) as any;

        if (marketCreatedEvent) {
          setMarketData({
            market: marketCreatedEvent.args.market,
            yesToken: marketCreatedEvent.args.yesToken,
            noToken: marketCreatedEvent.args.noToken,
          });
        }
      }

      onSubmit?.({ question, options, validTill, yesPrice, noPrice });
      setSubmitted(true);
      setTimeout(() => handleClose(), 4000);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to create market";
      setErrors({ question: errorMsg });
      setLoading(false);
    }
  };

  const buyToken = async (tokenType: "yes" | "no"): Promise<void> => {
    if (!walletClient || !publicClient || !address || !marketData) {
      setErrors({ question: "Market data or wallet not available" });
      return;
    }

    const amount = tokenType === "yes" ? yesPrice : noPrice;
    if (!amount) {
      setErrors({ question: `No ${tokenType.toUpperCase()} price set` });
      return;
    }

    setBuyingToken(tokenType);

    try {
      // Convert to USDC decimals (6 decimals for USDC)
      const amountInDecimals = BigInt(Math.floor(Number(amount) * 1e6));

      // Step 1: Approve USDC spending on market contract
      const approveTx = await walletClient.writeContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: "approve",
        args: [marketData.market as `0x${string}`, amountInDecimals],
      });

      await publicClient.waitForTransactionReceipt({ hash: approveTx });

      // Step 2: Deposit to market (no parameters - encrypted transaction)
      const depositTx = await walletClient.writeContract({
        address: marketData.market as `0x${string}`,
        abi: MARKET_ABI,
        functionName: "deposit",
        args: [],
      });

      await publicClient.waitForTransactionReceipt({ hash: depositTx });

      setBuyTxHash(depositTx);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : `Failed to buy ${tokenType.toUpperCase()} tokens`;
      setErrors({ question: errorMsg });
    } finally {
      setBuyingToken(null);
    }
  };

  const today: string = new Date().toISOString().split("T")[0];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @keyframes cm-fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes cm-slideUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes cm-pop {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.05); }
        }
        .cm-input {
          width: 100%;
          height: 40px;
          padding: 0 12px;
          border-radius: 6px;
          border: 1px solid #e4e4e7;
          background: #ffffff;
          color: #0a0a0a;
          font-size: 14px;
          box-sizing: border-box;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          font-family: inherit;
        }
        .cm-input:focus {
          border-color: #0052FF;
          box-shadow: 0 0 0 3px rgba(0, 82, 255, 0.12);
        }
        .cm-input.cm-field-error { border-color: #dc2626; }
        .cm-textarea {
          width: 100%;
          min-height: 80px;
          padding: 10px 12px;
          border-radius: 6px;
          border: 1px solid #e4e4e7;
          background: #ffffff;
          color: #0a0a0a;
          font-size: 14px;
          box-sizing: border-box;
          outline: none;
          resize: vertical;
          transition: border-color 0.15s, box-shadow 0.15s;
          font-family: inherit;
          line-height: 1.5;
        }
        .cm-textarea:focus {
          border-color: #0052FF;
          box-shadow: 0 0 0 3px rgba(0, 82, 255, 0.12);
        }
        .cm-textarea.cm-field-error { border-color: #dc2626; }
        .cm-opt-tag {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          border-radius: 100px;
          font-size: 13px;
          font-weight: 500;
          background: #f4f4f5;
          color: #3f3f46;
          border: 1px solid #e4e4e7;
        }
        .cm-remove-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #a1a1aa;
          display: flex;
          align-items: center;
          padding: 0;
          line-height: 1;
          transition: color 0.15s;
        }
        .cm-remove-btn:hover { color: #dc2626; }
        .cm-add-btn {
          height: 40px;
          padding: 0 16px;
          background: #f4f4f5;
          border: 1px solid #e4e4e7;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          color: #3f3f46;
          flex-shrink: 0;
          transition: background 0.15s;
          font-family: inherit;
        }
        .cm-add-btn:hover { background: #e4e4e7; }
        .cm-close-btn {
          background: #f4f4f5;
          border: 1px solid #e4e4e7;
          border-radius: 6px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: background 0.15s;
          padding: 0;
        }
        .cm-close-btn:hover { background: #e4e4e7; }
        .cm-cancel-btn {
          flex: 1;
          height: 44px;
          background: #f4f4f5;
          color: #3f3f46;
          border: 1px solid #e4e4e7;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s;
          font-family: inherit;
        }
        .cm-cancel-btn:hover { background: #e4e4e7; }
        .cm-submit-btn {
          flex: 2;
          height: 44px;
          background: #0052FF;
          color: #ffffff;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.15s;
          font-family: inherit;
        }
        .cm-submit-btn:hover { opacity: 0.88; }
        .cm-modal-scroll::-webkit-scrollbar { width: 6px; }
        .cm-modal-scroll::-webkit-scrollbar-track { background: transparent; }
        .cm-modal-scroll::-webkit-scrollbar-thumb {
          background: #e4e4e7;
          border-radius: 3px;
        }
        @media (max-width: 480px) {
          .cm-token-row  { flex-direction: column !important; }
          .cm-actions-row { flex-direction: column !important; }
          .cm-cancel-btn, .cm-submit-btn { flex: none !important; width: 100%; }
        }
      `}</style>

      {/* ── Trigger ─────────────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          background: "#0052FF",
          color: "#ffffff",
          border: "none",
          borderRadius: "8px",
          padding: "0 24px",
          height: "44px",
          fontSize: "14px",
          fontWeight: 600,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          fontFamily: "inherit",
          transition: "opacity 0.15s",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.88"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        Create Market
      </button>

      {/* ── Backdrop + Modal ─────────────────────────────────────────────────── */}
      {open && (
        <div
          onClick={handleBackdropClick}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(10, 10, 10, 0.5)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            animation: "cm-fadeIn 0.18s ease",
          }}
        >
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-label="Create Market"
            className="cm-modal-scroll"
            style={{
              background: "#ffffff",
              border: "1px solid #e4e4e7",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "520px",
              maxHeight: "90vh",
              overflowY: "auto",
              animation: "cm-slideUp 0.22s ease",
              boxSizing: "border-box",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.12)",
            }}
          >
            {/* ── Success state ─────────────────────────────────────────────── */}
            {submitted ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "32px",
                  gap: "20px",
                  animation: "cm-pop 0.4s ease",
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    background: "rgba(0, 82, 255, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5 13l4 4L19 7"
                      stroke="#0052FF"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: "16px", fontWeight: 600, color: "#0a0a0a", margin: 0 }}>
                    Market Created Successfully!
                  </p>
                  <p style={{ fontSize: "13px", color: "#71717a", margin: "4px 0 0" }}>
                    Your prediction market is now live
                  </p>
                </div>

                {/* Transaction Hash */}
                {txHash && (
                  <div
                    style={{
                      width: "100%",
                      padding: "12px",
                      background: "#f4f4f5",
                      borderRadius: "8px",
                      border: "1px solid #e4e4e7",
                    }}
                  >
                    <p style={{ fontSize: "11px", fontWeight: 600, color: "#71717a", margin: "0 0 6px" }}>
                      TX HASH
                    </p>
                    <p
                      style={{
                        fontSize: "11px",
                        color: "#0a0a0a",
                        margin: 0,
                        fontFamily: "monospace",
                        wordBreak: "break-all",
                        lineHeight: "1.4",
                      }}
                    >
                      {txHash}
                    </p>
                  </div>
                )}

                {/* Market Details from Event */}
                {marketData ? (
                  <div
                    style={{
                      width: "100%",
                      padding: "16px",
                      background: "#f0f5ff",
                      borderRadius: "8px",
                      border: "1px solid #bfdbfe",
                    }}
                  >
                    <p style={{ fontSize: "11px", fontWeight: 600, color: "#0052ff", margin: "0 0 12px", textTransform: "uppercase" }}>
                      Market Addresses
                    </p>

                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {/* Market Address */}
                      <div>
                        <p style={{ fontSize: "10px", fontWeight: 600, color: "#71717a", margin: "0 0 4px", textTransform: "uppercase" }}>
                          Market Contract
                        </p>
                        <p
                          style={{
                            fontSize: "11px",
                            color: "#0a0a0a",
                            margin: 0,
                            fontFamily: "monospace",
                            wordBreak: "break-all",
                            background: "#ffffff",
                            padding: "6px 8px",
                            borderRadius: "4px",
                            border: "1px solid #dbeafe",
                            lineHeight: "1.3",
                          }}
                        >
                          {marketData.market}
                        </p>
                      </div>

                      {/* YES Token */}
                      <div>
                        <p style={{ fontSize: "10px", fontWeight: 600, color: "#0052ff", margin: "0 0 4px", display: "flex", alignItems: "center", gap: "4px" }}>
                          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#0052ff" }} />
                          YES Token
                        </p>
                        <p
                          style={{
                            fontSize: "11px",
                            color: "#0a0a0a",
                            margin: 0,
                            fontFamily: "monospace",
                            wordBreak: "break-all",
                            background: "#ffffff",
                            padding: "6px 8px",
                            borderRadius: "4px",
                            border: "1px solid #dbeafe",
                            lineHeight: "1.3",
                          }}
                        >
                          {marketData.yesToken}
                        </p>
                      </div>

                      {/* NO Token */}
                      <div>
                        <p style={{ fontSize: "10px", fontWeight: 600, color: "#71717a", margin: "0 0 4px", display: "flex", alignItems: "center", gap: "4px" }}>
                          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#71717a" }} />
                          NO Token
                        </p>
                        <p
                          style={{
                            fontSize: "11px",
                            color: "#0a0a0a",
                            margin: 0,
                            fontFamily: "monospace",
                            wordBreak: "break-all",
                            background: "#ffffff",
                            padding: "6px 8px",
                            borderRadius: "4px",
                            border: "1px solid #dbeafe",
                            lineHeight: "1.3",
                          }}
                        >
                          {marketData.noToken}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ color: "#71717a", fontSize: "12px" }}>
                    Loading market details...
                  </div>
                )}

                {/* Buy Token Buttons */}
                {marketData && !buyTxHash && (
                  <div
                    style={{
                      width: "100%",
                      display: "flex",
                      gap: "12px",
                      flexDirection: "column",
                    }}
                  >
                    <div style={{ background: "#f0f5ff", padding: "12px", borderRadius: "8px", border: "1px solid #dbeafe" }}>
                      <p style={{ fontSize: "11px", fontWeight: 600, color: "#0052ff", margin: "0 0 8px", textTransform: "uppercase" }}>
                        Market Ready to Trade
                      </p>
                      <p style={{ fontSize: "12px", color: "#0a0a0a", margin: 0 }}>
                        Deposit USDC to buy YES or NO outcome tokens
                      </p>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <button
                        type="button"
                        onClick={() => buyToken("yes")}
                        disabled={buyingToken !== null}
                        style={{
                          height: "48px",
                          background: buyingToken === "yes" ? "rgba(0, 82, 255, 0.7)" : "#0052FF",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "8px",
                          fontSize: "13px",
                          fontWeight: 600,
                          cursor: buyingToken ? "not-allowed" : "pointer",
                          transition: "all 0.2s ease",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "2px",
                        }}
                        onMouseEnter={(e) => {
                          if (!buyingToken) (e.currentTarget as HTMLButtonElement).style.opacity = "0.88";
                        }}
                        onMouseLeave={(e) => {
                          if (!buyingToken) (e.currentTarget as HTMLButtonElement).style.opacity = "1";
                        }}
                      >
                        <span style={{ fontSize: "14px", fontWeight: 700 }}>YES</span>
                        <span style={{ fontSize: "11px", opacity: 0.9 }}>
                          {buyingToken === "yes" ? "Processing..." : `${yesPrice} USDC`}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => buyToken("no")}
                        disabled={buyingToken !== null}
                        style={{
                          height: "48px",
                          background: buyingToken === "no" ? "rgba(113, 113, 122, 0.7)" : "#71717a",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "8px",
                          fontSize: "13px",
                          fontWeight: 600,
                          cursor: buyingToken ? "not-allowed" : "pointer",
                          transition: "all 0.2s ease",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "2px",
                        }}
                        onMouseEnter={(e) => {
                          if (!buyingToken) (e.currentTarget as HTMLButtonElement).style.opacity = "0.88";
                        }}
                        onMouseLeave={(e) => {
                          if (!buyingToken) (e.currentTarget as HTMLButtonElement).style.opacity = "1";
                        }}
                      >
                        <span style={{ fontSize: "14px", fontWeight: 700 }}>NO</span>
                        <span style={{ fontSize: "11px", opacity: 0.9 }}>
                          {buyingToken === "no" ? "Processing..." : `${noPrice} USDC`}
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Token Purchase Success */}
                {buyTxHash && (
                  <div
                    style={{
                      width: "100%",
                      padding: "12px",
                      background: "#ecfdf5",
                      borderRadius: "8px",
                      border: "1px solid #bbf7d0",
                      animation: "cm-slideUp 0.3s ease",
                    }}
                  >
                    <p style={{ fontSize: "11px", fontWeight: 600, color: "#059669", margin: "0 0 4px" }}>
                      ✓ DEPOSIT CONFIRMED
                    </p>
                    <p style={{ fontSize: "10px", color: "#047857", margin: "0 0 6px" }}>
                      Your collateral has been deposited to the market
                    </p>
                    <p
                      style={{
                        fontSize: "10px",
                        color: "#0a0a0a",
                        margin: 0,
                        fontFamily: "monospace",
                        wordBreak: "break-all",
                        lineHeight: "1.4",
                        background: "#f0fdf4",
                        padding: "6px",
                        borderRadius: "4px",
                      }}
                    >
                      TX: {buyTxHash}
                    </p>
                  </div>
                )}

                {errors.question && buyingToken && (
                  <div
                    style={{
                      width: "100%",
                      padding: "12px",
                      background: "#fee2e2",
                      borderRadius: "8px",
                      border: "1px solid #fca5a5",
                      animation: "cm-slideUp 0.3s ease",
                    }}
                  >
                    <p style={{ fontSize: "11px", fontWeight: 600, color: "#dc2626", margin: "0 0 4px" }}>
                      ✗ DEPOSIT FAILED
                    </p>
                    <p style={{ fontSize: "10px", color: "#991b1b", margin: 0 }}>
                      {errors.question}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: "flex", gap: "12px", paddingTop: "12px" }}>
                  <button
                    type="button"
                    onClick={handleClose}
                    style={{
                      flex: 1,
                      padding: "12px",
                      background: "#e4e4e7",
                      color: "#0a0a0a",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => window.open(`/markets/${marketData?.market || ""}`, "_blank")}
                    disabled={!marketData}
                    style={{
                      flex: 1,
                      padding: "12px",
                      background: marketData ? "#0052FF" : "#bfdbfe",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: marketData ? "pointer" : "not-allowed",
                    }}
                  >
                    📊 View Market
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* ── Header ──────────────────────────────────────────────── */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "20px 24px 0",
                  }}
                >
                  <div>
                    <h2
                      style={{
                        margin: 0,
                        fontSize: "18px",
                        fontWeight: 700,
                        color: "#0a0a0a",
                        letterSpacing: "-0.02em",
                      }}
                    >
                      Create Market
                    </h2>
                    <p style={{ margin: "2px 0 0", fontSize: "13px", color: "#71717a" }}>
                      Set up a new prediction market
                    </p>
                  </div>

                  <button
                    type="button"
                    className="cm-close-btn"
                    onClick={handleClose}
                    aria-label="Close modal"
                  >
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                      <path
                        d="M1.5 1.5l10 10M11.5 1.5l-10 10"
                        stroke="#71717a"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </div>

                <div style={{ height: "1px", background: "#e4e4e7", margin: "18px 0 0" }} />

                {/* ── Form ────────────────────────────────────────────────── */}
                <form
                  onSubmit={handleSubmit}
                  noValidate
                  style={{
                    padding: "20px 24px 24px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "20px",
                  }}
                >
                  {/* Question */}
                  <div>
                    <label htmlFor="cm-question" style={labelStyle}>
                      Question
                    </label>
                    <textarea
                      ref={firstInputRef}
                      id="cm-question"
                      className={`cm-textarea${errors.question ? " cm-field-error" : ""}`}
                      placeholder="Will Bitcoin exceed $100,000 before the end of 2025?"
                      value={question}
                      onChange={(evt) => {
                        setQuestion(evt.target.value);
                        setErrors((prev) => ({ ...prev, question: undefined }));
                      }}
                    />
                    {errors.question && <ErrorMsg>{errors.question}</ErrorMsg>}
                  </div>

                  {/* Options */}
                  <div>
                    <label style={labelStyle}>Options</label>
                    <div
                      style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "10px" }}
                    >
                      {options.map((opt, i) => (
                        <span key={`${opt}-${i}`} className="cm-opt-tag">
                          {opt}
                          {options.length > 2 && (
                            <button
                              type="button"
                              className="cm-remove-btn"
                              onClick={() => removeOption(i)}
                              aria-label={`Remove ${opt}`}
                            >
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <path
                                  d="M2 2l8 8M10 2L2 10"
                                  stroke="currentColor"
                                  strokeWidth="1.6"
                                  strokeLinecap="round"
                                />
                              </svg>
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input
                        type="text"
                        className="cm-input"
                        placeholder="Add an option..."
                        value={newOption}
                        onChange={(evt) => setNewOption(evt.target.value)}
                        onKeyDown={(evt: KeyboardEvent<HTMLInputElement>) => {
                          if (evt.key === "Enter") {
                            evt.preventDefault();
                            addOption();
                          }
                        }}
                        style={{ flex: 1 }}
                      />
                      <button type="button" className="cm-add-btn" onClick={addOption}>
                        Add
                      </button>
                    </div>
                    {errors.options && <ErrorMsg>{errors.options}</ErrorMsg>}
                  </div>

                  {/* Valid Till */}
                  <div>
                    <label htmlFor="cm-date" style={labelStyle}>
                      Valid Till
                    </label>
                    <input
                      id="cm-date"
                      type="date"
                      className={`cm-input${errors.validTill ? " cm-field-error" : ""}`}
                      min={today}
                      value={validTill}
                      onChange={(evt) => {
                        setValidTill(evt.target.value);
                        setErrors((prev) => ({ ...prev, validTill: undefined }));
                      }}
                    />
                    {errors.validTill && <ErrorMsg>{errors.validTill}</ErrorMsg>}
                  </div>

                  {/* Token Prices */}
                  <div>
                    <label style={labelStyle}>Token Prices</label>
                    <div className="cm-token-row" style={{ display: "flex", gap: "12px" }}>

                      {/* YES */}
                      <div style={tokenCardStyle("#f0f5ff")}>
                        <div style={tokenLabelStyle("#0052FF")}>
                          <span style={tokenDotStyle("#0052FF")} />
                          YES Token
                        </div>
                        <div style={{ position: "relative" }}>
                          <DollarPrefix />
                          <input
                            type="number"
                            className={`cm-input${errors.yesPrice ? " cm-field-error" : ""}`}
                            min="0.01"
                            step="0.01"
                            placeholder="0.60"
                            value={yesPrice}
                            onChange={(evt) => {
                              setYesPrice(evt.target.value);
                              setErrors((prev) => ({ ...prev, yesPrice: undefined }));
                            }}
                            style={{ paddingLeft: "26px" }}
                          />
                        </div>
                        {errors.yesPrice && <ErrorMsg>{errors.yesPrice}</ErrorMsg>}
                      </div>

                      {/* NO */}
                      <div style={tokenCardStyle("#f9f9f9")}>
                        <div style={tokenLabelStyle("#71717a")}>
                          <span style={tokenDotStyle("#71717a")} />
                          NO Token
                        </div>
                        <div style={{ position: "relative" }}>
                          <DollarPrefix />
                          <input
                            type="number"
                            className={`cm-input${errors.noPrice ? " cm-field-error" : ""}`}
                            min="0.01"
                            step="0.01"
                            placeholder="0.40"
                            value={noPrice}
                            onChange={(evt) => {
                              setNoPrice(evt.target.value);
                              setErrors((prev) => ({ ...prev, noPrice: undefined }));
                            }}
                            style={{ paddingLeft: "26px" }}
                          />
                        </div>
                        {errors.noPrice && <ErrorMsg>{errors.noPrice}</ErrorMsg>}
                      </div>

                    </div>
                  </div>

                  {/* Actions */}
                  <div
                    className="cm-actions-row"
                    style={{ display: "flex", gap: "10px", paddingTop: "4px" }}
                  >
                    <button type="button" className="cm-cancel-btn" onClick={handleClose} disabled={loading}>
                      Cancel
                    </button>
                    <button type="submit" className="cm-submit-btn" disabled={loading} style={{ opacity: loading ? 0.7 : 1 }}>
                      {loading ? "Creating Market..." : "Create Market"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ── Small helper components ───────────────────────────────────────────────────

function ErrorMsg({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#dc2626" }}>
      {children}
    </p>
  );
}

function DollarPrefix() {
  return (
    <span
      style={{
        position: "absolute",
        left: 10,
        top: "50%",
        transform: "translateY(-50%)",
        fontSize: "13px",
        color: "#71717a",
        fontWeight: 500,
        pointerEvents: "none",
        userSelect: "none",
      }}
    >
      $
    </span>
  );
}

// ── Style helpers ─────────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  fontWeight: 600,
  color: "#71717a",
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  marginBottom: "6px",
};

const tokenCardStyle = (bg: string): React.CSSProperties => ({
  flex: 1,
  minWidth: 0,
  borderRadius: "8px",
  border: "1px solid #e4e4e7",
  padding: "12px",
  background: bg,
});

const tokenLabelStyle = (color: string): React.CSSProperties => ({
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color,
  display: "flex",
  alignItems: "center",
  gap: "6px",
  marginBottom: "8px",
});

const tokenDotStyle = (bg: string): React.CSSProperties => ({
  width: 7,
  height: 7,
  borderRadius: "50%",
  background: bg,
  display: "inline-block",
  flexShrink: 0,
});