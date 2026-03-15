"use client";

import { useState, useEffect, useRef, useCallback, KeyboardEvent, FormEvent } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { encodeFunctionData, decodeEventLog } from "viem";
import ConfidentialMarketFactoryAbi from "@/abi/ConfidentialMarketFactory.json";
import {
  getFactoryAddress,
  getCollateralAddress,
  getEnsRegistrarAddress,
  getEnsParentDomain,
  baseSepoliaPublicClient,
  BASE_SEPOLIA_CHAIN_ID,
  BASESCAN_TX_URL,
} from "@/lib/market-config";

// ── Types ────────────────────────────────────────────────────────────────────

interface FormErrors {
  question?: string;
  options?: string;
  validTill?: string;
  yesPrice?: string;
  noPrice?: string;
  subdomain?: string;
}

interface MarketFormData {
  question: string;
  options: string[];
  validTill: string;
  yesPrice: string;
  noPrice: string;
  subdomain?: string;
}

interface CreateMarketModalProps {
  /** Called with the final form data when the user submits successfully. */
  onSubmit?: (data: MarketFormData) => void;
  /** Controlled open state (when set, trigger button is hidden; parent controls open). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Pre-fill question (e.g. event market title). */
  defaultQuestion?: string;
  /** Pre-fill end date (YYYY-MM-DD). */
  defaultValidTill?: string;
  /** When true, do not render the "Create Market" trigger button (use with controlled open). */
  noTrigger?: boolean;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function CreateMarketModal({
  onSubmit,
  open: controlledOpen,
  onOpenChange,
  defaultQuestion,
  defaultValidTill,
  noTrigger,
}: CreateMarketModalProps) {
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();

  const [internalOpen, setInternalOpen] = useState<boolean>(false);
  const isControlled = controlledOpen !== undefined && onOpenChange !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = useCallback(
    (v: boolean) => {
      if (isControlled) onOpenChange?.(v);
      else setInternalOpen(v);
    },
    [isControlled, onOpenChange]
  );

  const [question, setQuestion] = useState<string>("");
  const [options, setOptions] = useState<string[]>(["Yes", "No"]);
  const [newOption, setNewOption] = useState<string>("");
  const [validTill, setValidTill] = useState<string>("");
  const [yesPrice, setYesPrice] = useState<string>("");
  const [noPrice, setNoPrice] = useState<string>("");
  const [subdomain, setSubdomain] = useState<string>("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [subdomainTxHash, setSubdomainTxHash] = useState<string | null>(null);
  const [createdSubdomain, setCreatedSubdomain] = useState<string | null>(null);
  const [subdomainSkippedReason, setSubdomainSkippedReason] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLTextAreaElement>(null);

  // When opening with defaults, pre-fill question and validTill (ConfidentialMarket: question_, endTime_)
  useEffect(() => {
    if (!open) return;
    if (defaultQuestion !== undefined && defaultQuestion !== "") setQuestion(defaultQuestion);
    if (defaultValidTill !== undefined && defaultValidTill !== "") setValidTill(defaultValidTill);
  }, [open, defaultQuestion, defaultValidTill]);

  // ── Reset ──────────────────────────────────────────────────────────────────

  const resetForm = useCallback((): void => {
    setQuestion("");
    setOptions(["Yes", "No"]);
    setNewOption("");
    setValidTill("");
    setYesPrice("");
    setNoPrice("");
    setSubdomain("");
    setErrors({});
    setSubmitted(false);
    setIsCreating(false);
    setTxHash(null);
    setSubdomainTxHash(null);
    setCreatedSubdomain(null);
    setSubdomainSkippedReason(null);
    setCreateError(null);
  }, []);

  const handleClose = useCallback((): void => {
    setOpen(false);
    setTimeout(resetForm, 300);
  }, [resetForm, setOpen]);

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
    if (subdomain.trim()) {
      const label = subdomain.trim().toLowerCase();
      if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(label) || label.length > 63) {
        errs.subdomain = "Use only letters, numbers, and hyphens (1–63 characters).";
      }
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
    setCreateError(null);

    if (!ready || !authenticated) {
      setCreateError("Please log in with your wallet to create a market.");
      return;
    }

    const wallet = wallets?.[0];
    if (!wallet) {
      setCreateError("No wallet connected. Connect a wallet to continue.");
      return;
    }

    let factoryAddress: `0x${string}`;
    try {
      factoryAddress = getFactoryAddress();
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "Factory address not configured.");
      return;
    }

    const endTimeDate = new Date(validTill);
    endTimeDate.setHours(23, 59, 59, 999);
    const endTimeUnix = BigInt(Math.floor(endTimeDate.getTime() / 1000));
    const collateralToken = getCollateralAddress();

    const data = encodeFunctionData({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      abi: ConfidentialMarketFactoryAbi as any,
      functionName: "createMarket",
      args: [
        collateralToken,
        question.trim(),
        endTimeUnix,
        "Yes",
        "YES",
        "No",
        "NO",
      ],
    });

    const subdomainLabel = subdomain.trim() ? subdomain.trim().toLowerCase() : undefined;
    const registrarAddress = getEnsRegistrarAddress();

    setIsCreating(true);
    try {
      const walletWithChain = wallet as {
        address: string;
        switchChain?: (chainId: number) => Promise<void>;
        getEthereumProvider: () => Promise<{ request: (args: { method: string; params: unknown[] }) => Promise<string> }>;
      };
      if (walletWithChain.switchChain) {
        await walletWithChain.switchChain(BASE_SEPOLIA_CHAIN_ID);
      }
      const provider = await walletWithChain.getEthereumProvider();
      // Let the wallet/RPC estimate gas to avoid "exceeds max transaction gas limit" (many wallets cap at ~12–15M).
      const hash = await provider.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: (wallet as { address: string }).address,
            to: factoryAddress,
            data,
            chainId: "0x14a34",
          },
        ],
      });
      const txHashHex = hash as string;
      setTxHash(txHashHex);

      const receipt = await baseSepoliaPublicClient.waitForTransactionReceipt({
        hash: txHashHex as `0x${string}`,
      });

      let marketAddress: `0x${string}` | undefined;
      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({
            abi: ConfidentialMarketFactoryAbi as never[],
            data: log.data,
            topics: log.topics,
          });
          if (decoded.eventName === "MarketCreated") {
            marketAddress = (decoded.args as { market: `0x${string}` }).market;
            break;
          }
        } catch {
          // not our event
        }
      }

      if (subdomainLabel && registrarAddress && marketAddress) {
        // Subdomain registration must be sent by the registrar's operator (not the user).
        // The contract only allows operator/owner to call registerMarketSubdomain.
        const regRes = await fetch("/api/register-ens-subdomain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subdomainLabel,
            marketAddress,
          }),
        });
        const regData = await regRes.json();
        if (regRes.ok && regData.success && regData.txHash) {
          setSubdomainTxHash(regData.txHash);
          setCreatedSubdomain(subdomainLabel);
        } else {
          setSubdomainSkippedReason(regData?.error ?? "Subdomain registration failed.");
        }
      } else if (subdomainLabel) {
        if (!registrarAddress) {
          setSubdomainSkippedReason("ENS registrar not configured.");
        } else if (!marketAddress) {
          setSubdomainSkippedReason("Could not read market address from tx; register subdomain manually if needed.");
        }
      }

      onSubmit?.({ question, options, validTill, yesPrice, noPrice, subdomain: subdomainLabel });
      setSubmitted(true);
      // Keep success state visible until user closes (no auto-close)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setCreateError(msg);
    } finally {
      setIsCreating(false);
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
        .cm-input-amount {
          font-size: 16px;
          font-weight: 600;
          font-variant-numeric: tabular-nums;
          letter-spacing: 0.02em;
        }
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

      {/* ── Trigger (hidden when noTrigger or controlled) ─────────────────────── */}
      {!noTrigger && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{
            background: "#ffffff",
            color: "#0052ff",
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
      )}

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
              <div style={{ position: "relative" }}>
                <button
                  type="button"
                  className="cm-close-btn"
                  onClick={handleClose}
                  aria-label="Close modal"
                  style={{
                    position: "absolute",
                    top: 16,
                    right: 16,
                    padding: 8,
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    borderRadius: 8,
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <path d="M1.5 1.5l10 10M11.5 1.5l-10 10" stroke="#71717a" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </button>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "56px 32px 32px",
                    gap: "14px",
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
                <p style={{ fontSize: "16px", fontWeight: 600, color: "#0a0a0a", margin: 0 }}>
                  Market Created!
                </p>
                <p style={{ fontSize: "14px", color: "#71717a", margin: 0 }}>
                  Your prediction market is now live.
                </p>
                {createdSubdomain && (
                  <>
                    <p style={{ fontSize: "13px", color: "#0a0a0a", margin: 0, fontWeight: 600 }}>
                      Share at: <span style={{ color: "#0052FF" }}>{createdSubdomain}.{getEnsParentDomain()}</span>
                    </p>
                    <p style={{ fontSize: "12px", color: "#71717a", margin: 0 }}>
                      Subname registered on Base Sepolia. It may take a moment to appear on ENS.
                    </p>
                    <a
                      href={`https://sepolia.app.ens.domains/${getEnsParentDomain()}?tab=subnames`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: "13px",
                        color: "#0052FF",
                        fontWeight: 600,
                        marginTop: "4px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      View subnames on ENS (Sepolia) →
                    </a>
                  </>
                )}
                {subdomainSkippedReason && (
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#b91c1c",
                      margin: 0,
                      padding: "8px 12px",
                      background: "#fef2f2",
                      borderRadius: 8,
                      textAlign: "left",
                      width: "100%",
                      boxSizing: "border-box",
                    }}
                  >
                    <strong>Subdomain not registered:</strong> {subdomainSkippedReason}
                    <br />
                    <span style={{ color: "#71717a" }}>
                      Ensure ENS_REGISTRAR_OPERATOR_PRIVATE_KEY is set and the registrar contract is on Base Sepolia.
                    </span>
                  </div>
                )}
                {txHash && (
                  <a
                    href={`${BASESCAN_TX_URL}/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: "13px",
                      color: "#0052FF",
                      fontWeight: 600,
                      marginTop: "4px",
                    }}
                  >
                    View market tx on BaseScan →
                  </a>
                )}
                {subdomainTxHash && (
                  <a
                    href={`${BASESCAN_TX_URL}/${subdomainTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: "13px",
                      color: "#0052FF",
                      fontWeight: 600,
                      marginTop: "2px",
                      display: "block",
                    }}
                  >
                    View subdomain tx on BaseScan →
                  </a>
                )}
                <button
                  type="button"
                  onClick={handleClose}
                  style={{
                    marginTop: 20,
                    padding: "10px 24px",
                    borderRadius: 12,
                    border: "1px solid #e5e5e5",
                    background: "#fff",
                    color: "#0a0a0a",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  Close
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
                      Question, end time, and YES/NO outcome tokens (ConfidentialMarket)
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
                  {/* <div>
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
                  </div> */}

                  {/* End time (ConfidentialMarket endTime_) */}
                  <div>
                    <label htmlFor="cm-date" style={labelStyle}>
                      End time
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

                  {/* Add subdomain to this market at creation (optional; any market can have one) */}
                  <div>
                    <label htmlFor="cm-subdomain" style={labelStyle}>
                      Market subdomain (optional)
                    </label>
                    <input
                      id="cm-subdomain"
                      type="text"
                      className={`cm-input${errors.subdomain ? " cm-field-error" : ""}`}
                      placeholder="e.g. btc-100k or elon-tweets-march"
                      value={subdomain}
                      onChange={(evt) => {
                        setSubdomain(evt.target.value);
                        setErrors((prev) => ({ ...prev, subdomain: undefined }));
                      }}
                      style={{ textTransform: "lowercase" }}
                    />
                    <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#71717a" }}>
                      {getEnsRegistrarAddress() ? (
                        <>
                          This market will be reachable at{" "}
                          <strong style={{ color: "#0a0a0a" }}>
                            {subdomain.trim() ? `${subdomain.trim().toLowerCase()}.` : "…."}
                            {getEnsParentDomain()}
                          </strong>
                          . Subnames are visible on{" "}
                          <a
                            href={`https://sepolia.app.ens.domains/${getEnsParentDomain()}?tab=subnames`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: "#0052FF", fontWeight: 600 }}
                          >
                            ENS (Sepolia)
                          </a>
                          .
                        </>
                      ) : (
                        <span style={{ color: "#a1a1aa" }}>
                          Set NEXT_PUBLIC_ENS_MARKET_REGISTRAR_ADDRESS to register a subdomain for this market.
                        </span>
                      )}
                    </p>
                    {errors.subdomain && <ErrorMsg>{errors.subdomain}</ErrorMsg>}
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
                            className={`cm-input cm-input-amount${errors.yesPrice ? " cm-field-error" : ""}`}
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
                            className={`cm-input cm-input-amount${errors.noPrice ? " cm-field-error" : ""}`}
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

                  {createError && (
                    <div
                      style={{
                        padding: "10px 12px",
                        borderRadius: "8px",
                        background: "#fef2f2",
                        border: "1px solid #fecaca",
                        fontSize: "13px",
                        color: "#dc2626",
                      }}
                    >
                      {createError}
                    </div>
                  )}

                  {/* Actions */}
                  <div
                    className="cm-actions-row"
                    style={{ display: "flex", gap: "10px", paddingTop: "4px" }}
                  >
                    <button
                      type="button"
                      className="cm-cancel-btn"
                      onClick={handleClose}
                      disabled={isCreating}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="cm-submit-btn"
                      disabled={isCreating}
                      style={{ opacity: isCreating ? 0.7 : 1 }}
                    >
                      {isCreating ? "Creating…" : "Create Market"}
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