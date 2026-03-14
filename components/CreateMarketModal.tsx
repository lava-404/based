"use client";

import { useState, useEffect, useRef, useCallback, KeyboardEvent, FormEvent } from "react";

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

  const handleSubmit = (evt: FormEvent<HTMLFormElement>): void => {
    evt.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    onSubmit?.({ question, options, validTill, yesPrice, noPrice });
    setSubmitted(true);
    setTimeout(() => handleClose(), 1800);
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
                  padding: "56px 32px",
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
                    <button type="button" className="cm-cancel-btn" onClick={handleClose}>
                      Cancel
                    </button>
                    <button type="submit" className="cm-submit-btn">
                      Create Market
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