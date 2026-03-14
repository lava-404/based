'use client'
import { use } from 'react'
import { useState } from 'react'

// ─── Dummy data (replace with your API calls) ─────────────────────────────────
const EVENT = {
  title: 'Elon Musk # tweets March 13 – March 20, 2026?',
  category: 'Politics · Culture',
  currentCount: 17,
  timeLeft: { days: 6, hrs: 19, min: 51, sec: 17 },
  outcomes: [
    { label: '<20',      probability: 0.34, yes: 0.1,  no: 0.0,  color: '#3b82f6' },
    { label: '20–39',    probability: 0.22, yes: 2.1,  no: 12.0, color: '#10b981' },
    { label: '40–59',    probability: 0.18, yes: 4.5,  no: 8.5,  color: '#f59e0b' },
    { label: '60–79',    probability: 0.14, yes: 7.2,  no: 6.1,  color: '#ef4444' },
    { label: '80–99',    probability: 0.08, yes: 12.0, no: 3.2,  color: '#8b5cf6' },
    { label: '100+',     probability: 0.04, yes: 24.0, no: 1.1,  color: '#ec4899' },
  ],
  volume: '$48,291',
  liquidity: '$12,400',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function pct(n: number) { return `${Math.round(n * 100)}%` }

function calcPayout(amount: number, yesCents: number, side: 'yes' | 'no') {
  if (amount <= 0) return { shares: 0, payout: 0, profit: 0 }
  const price = side === 'yes' ? yesCents / 100 : (100 - yesCents) / 100
  if (price <= 0) return { shares: 0, payout: 0, profit: 0 }
  const shares = amount / price
  const profit = shares - amount
  return { shares: +shares.toFixed(2), payout: +shares.toFixed(2), profit: +profit.toFixed(2) }
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 22, fontWeight: 700, lineHeight: 1, color: '#0a0a0a' }}>
        {String(value).padStart(2, '0')}
      </span>
      <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.1em', color: '#888', textTransform: 'uppercase', marginTop: 2 }}>
        {label}
      </span>
    </div>
  )
}

function GraphPlaceholder() {
  return (
    <div style={{
      width: '100%', height: 220,
      borderRadius: 16,
      background: 'linear-gradient(135deg, rgba(59,130,246,0.05) 0%, rgba(16,185,129,0.05) 100%)',
      border: '1.5px dashed rgba(0,0,0,0.1)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 8, position: 'relative', overflow: 'hidden',
    }}>
      {/* decorative grid lines */}
      {[0.25, 0.5, 0.75].map(f => (
        <div key={f} style={{
          position: 'absolute', left: 0, right: 0,
          top: `${f * 100}%`, height: 1,
          background: 'rgba(0,0,0,0.05)',
        }} />
      ))}
      <svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth={1.5} strokeLinecap="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
      <span style={{ fontSize: 13, color: '#aaa', fontWeight: 500 }}>
        Probability chart — connected via your API
      </span>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const [selectedOutcomeIdx, setSelectedOutcomeIdx] = useState(0)
  const [side, setSide] = useState<'yes' | 'no'>('yes')
  const [amount, setAmount] = useState('')
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market')
  const { slug } = use(params)

  const outcome = EVENT.outcomes[selectedOutcomeIdx]
  const numAmount = parseFloat(amount) || 0
  const { shares, payout, profit } = calcPayout(numAmount, outcome.yes * 100, side)

  const presets = [1, 5, 10, 100]

  return (
    <div style={{
      minHeight: '100vh',
     
      fontFamily: "'DM Sans', sans-serif",
      padding: '32px 24px',
    }}>
      {/* Google font imports */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500;700&display=swap');

        .outcome-row { transition: background 0.15s, box-shadow 0.15s; }
        .outcome-row:hover { background: rgba(255,255,255,0.8) !important; }
        .side-btn { transition: all 0.15s; }
        .preset-btn { transition: all 0.12s; }
        .preset-btn:hover { transform: translateY(-1px); }
        .trade-btn { transition: all 0.15s; }
        .trade-btn:hover { filter: brightness(1.07); transform: translateY(-1px); }
        .trade-btn:active { transform: translateY(0); }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.4s ease both; }
      `}</style>

      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* ── Breadcrumb ── */}
        <div className="fade-up" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: '#888', fontWeight: 500 }}>{EVENT.category}</span>
          <span style={{ color: '#ddd' }}>›</span>
          <span style={{ fontSize: 12, color: '#555', fontWeight: 500 }}>Event</span>
          <span style={{ color: '#ddd' }}>›</span>
          <span style={{ fontSize: 12, color: '#0052FF', fontWeight: 600 }}>{slug}</span>
        </div>

        {/* ── Title row ── */}
        <div className="fade-up" style={{ animationDelay: '0.05s', marginBottom: 24 }}>
          <h1 style={{
            fontSize: 28, fontWeight: 700, color: '#0a0a0a', lineHeight: 1.25,
            letterSpacing: '-0.02em', maxWidth: 680,
          }}>
            {EVENT.title}
          </h1>
          {/* stats pill row */}
          <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
            {[
              { label: 'Volume', value: EVENT.volume },
              { label: 'Liquidity', value: EVENT.liquidity },
              { label: 'Live count', value: EVENT.currentCount },
            ].map(s => (
              <div key={s.label} style={{
                padding: '4px 12px', borderRadius: 999,
                background: 'rgba(255,255,255,0.85)',
                border: '1px solid rgba(0,0,0,0.07)',
                fontSize: 12, color: '#555', fontWeight: 500,
                display: 'flex', gap: 6, alignItems: 'center',
              }}>
                <span style={{ color: '#aaa' }}>{s.label}</span>
                <span style={{ fontWeight: 700, color: '#0a0a0a' }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Main grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>

          {/* LEFT COLUMN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Countdown card */}
            <div className="fade-up" style={{
              animationDelay: '0.1s',
              background: 'rgba(255,255,255,0.75)',
              backdropFilter: 'blur(12px)',
              borderRadius: 20,
              border: '1px solid rgba(0,0,0,0.07)',
              padding: '18px 24px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%', background: '#ef4444',
                  boxShadow: '0 0 0 3px rgba(239,68,68,0.2)',
                  display: 'inline-block', flexShrink: 0,
                }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#555', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Live count
                </span>
                <span style={{
                  fontSize: 36, fontWeight: 800, color: '#0a0a0a',
                  fontFamily: "'DM Mono', monospace", lineHeight: 1, marginLeft: 4,
                }}>
                  {EVENT.currentCount}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#aaa', fontWeight: 500 }}>Time left</span>
                <div style={{ display: 'flex', gap: 16 }}>
                  <CountdownUnit value={EVENT.timeLeft.days} label="days" />
                  <CountdownUnit value={EVENT.timeLeft.hrs}  label="hrs"  />
                  <CountdownUnit value={EVENT.timeLeft.min}  label="min"  />
                  <CountdownUnit value={EVENT.timeLeft.sec}  label="sec"  />
                </div>
              </div>
            </div>

            {/* Graph card */}
            <div className="fade-up" style={{
              animationDelay: '0.15s',
              background: 'rgba(255,255,255,0.75)',
              backdropFilter: 'blur(12px)',
              borderRadius: 20,
              border: '1px solid rgba(0,0,0,0.07)',
              padding: '20px 24px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#0a0a0a' }}>Probability over time</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  {['1D','1W','1M','All'].map(t => (
                    <button key={t} style={{
                      padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                      border: 'none', cursor: 'pointer',
                      background: t === '1W' ? '#0052FF' : 'transparent',
                      color: t === '1W' ? '#fff' : '#999',
                    }}>{t}</button>
                  ))}
                </div>
              </div>

              {/* Outcome legend */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                {EVENT.outcomes.map((o, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: '#555' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: o.color, display: 'inline-block' }} />
                    {o.label} {pct(o.probability)}
                  </div>
                ))}
              </div>

              <GraphPlaceholder />
            </div>

            {/* Outcomes table */}
            <div className="fade-up" style={{
              animationDelay: '0.2s',
              background: 'rgba(255,255,255,0.75)',
              backdropFilter: 'blur(12px)',
              borderRadius: 20,
              border: '1px solid rgba(0,0,0,0.07)',
              padding: '20px 24px',
            }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#0a0a0a', display: 'block', marginBottom: 14 }}>
                Outcomes
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {EVENT.outcomes.map((o, i) => (
                  <div
                    key={i}
                    className="outcome-row"
                    onClick={() => setSelectedOutcomeIdx(i)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '28px 1fr 60px 70px 70px',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 14px',
                      borderRadius: 12,
                      cursor: 'pointer',
                      background: selectedOutcomeIdx === i
                        ? `linear-gradient(90deg, ${o.color}18, ${o.color}08)`
                        : 'transparent',
                      border: selectedOutcomeIdx === i
                        ? `1.5px solid ${o.color}40`
                        : '1.5px solid transparent',
                    }}
                  >
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: o.color, display: 'inline-block' }} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#0a0a0a' }}>{o.label}</span>

                    {/* probability bar */}
                    <div style={{ position: 'relative' }}>
                      <div style={{ height: 4, borderRadius: 99, background: '#f0f0f0', overflow: 'hidden' }}>
                        <div style={{ width: pct(o.probability), height: '100%', borderRadius: 99, background: o.color }} />
                      </div>
                      <span style={{ fontSize: 11, color: '#888', fontWeight: 600, marginTop: 2, display: 'block' }}>
                        {pct(o.probability)}
                      </span>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 12, color: '#10b981', fontWeight: 700 }}>Yes {o.yes}¢</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 12, color: '#ef4444', fontWeight: 700 }}>No {o.no}¢</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN — Bet panel */}
          <div className="fade-up" style={{
            animationDelay: '0.12s',
            position: 'sticky', top: 24,
            background: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(16px)',
            borderRadius: 24,
            border: '1px solid rgba(0,0,0,0.08)',
            padding: '24px',
            boxShadow: '0 8px 40px rgba(0,82,255,0.06)',
          }}>

            {/* Selected outcome badge */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18,
            }}>
              <span style={{
                width: 10, height: 10, borderRadius: '50%',
                background: outcome.color, display: 'inline-block',
                boxShadow: `0 0 0 3px ${outcome.color}30`,
              }} />
              <span style={{ fontSize: 18, fontWeight: 800, color: '#0a0a0a' }}>
                {outcome.label}
              </span>
            </div>

            {/* Yes / No toggle */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr',
              gap: 6, marginBottom: 16,
              background: '#f5f5f5', borderRadius: 14, padding: 4,
            }}>
              {(['yes', 'no'] as const).map(s => (
                <button
                  key={s}
                  className="side-btn"
                  onClick={() => setSide(s)}
                  style={{
                    padding: '10px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
                    fontWeight: 700, fontSize: 14, fontFamily: "'DM Sans', sans-serif",
                    background: side === s
                      ? s === 'yes' ? '#0052FF' : '#ef4444'
                      : 'transparent',
                    color: side === s ? '#fff' : '#888',
                  }}
                >
                  {s === 'yes' ? `Yes ${outcome.yes}¢` : `No ${outcome.no}¢`}
                </button>
              ))}
            </div>

            {/* Order type */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
              {(['market', 'limit'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setOrderType(t)}
                  style={{
                    padding: '4px 14px', borderRadius: 999, fontSize: 12,
                    fontWeight: 600, border: 'none', cursor: 'pointer',
                    background: orderType === t ? '#0a0a0a' : 'transparent',
                    color: orderType === t ? '#fff' : '#aaa',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            {/* Amount input */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#888', display: 'block', marginBottom: 6 }}>
                Amount
              </label>
              <div style={{
                display: 'flex', alignItems: 'center',
                background: '#f7f8fa',
                borderRadius: 12, border: '1.5px solid rgba(0,0,0,0.08)',
                padding: '0 14px',
              }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: '#ccc', marginRight: 4 }}>$</span>
                <input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  style={{
                    flex: 1, border: 'none', background: 'transparent',
                    fontSize: 22, fontWeight: 700, color: '#0a0a0a', outline: 'none',
                    padding: '12px 0', fontFamily: "'DM Mono', monospace",
                  }}
                />
              </div>
            </div>

            {/* Presets */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
              {presets.map(p => (
                <button
                  key={p}
                  className="preset-btn"
                  onClick={() => setAmount(String((parseFloat(amount) || 0) + p))}
                  style={{
                    flex: 1, padding: '6px 0', borderRadius: 8, border: '1px solid rgba(0,0,0,0.08)',
                    background: '#f7f8fa', fontSize: 12, fontWeight: 700,
                    color: '#555', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  +${p}
                </button>
              ))}
              <button
                className="preset-btn"
                onClick={() => setAmount('1000')}
                style={{
                  flex: 1, padding: '6px 0', borderRadius: 8, border: '1px solid rgba(0,0,0,0.08)',
                  background: '#f7f8fa', fontSize: 12, fontWeight: 700,
                  color: '#555', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Max
              </button>
            </div>

            {/* Payout summary */}
            {numAmount > 0 && (
              <div style={{
                background: `linear-gradient(135deg, ${outcome.color}10, ${outcome.color}05)`,
                border: `1px solid ${outcome.color}25`,
                borderRadius: 14, padding: '14px 16px', marginBottom: 16,
              }}>
                {[
                  { label: 'Shares', value: shares },
                  { label: 'Avg price', value: `${side === 'yes' ? outcome.yes : outcome.no}¢` },
                  { label: 'Potential payout', value: `$${payout}` },
                  { label: 'Potential profit', value: `$${profit}`, highlight: true },
                ].map(row => (
                  <div key={row.label} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '3px 0',
                  }}>
                    <span style={{ fontSize: 12, color: '#888', fontWeight: 500 }}>{row.label}</span>
                    <span style={{
                      fontSize: 13, fontWeight: 700,
                      color: row.highlight ? (profit >= 0 ? '#10b981' : '#ef4444') : '#0a0a0a',
                      fontFamily: "'DM Mono', monospace",
                    }}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Trade button */}
            <button
              className="trade-btn"
              disabled={numAmount <= 0}
              style={{
                width: '100%', padding: '14px 0', borderRadius: 14, border: 'none',
                fontSize: 15, fontWeight: 700, cursor: numAmount > 0 ? 'pointer' : 'not-allowed',
                fontFamily: "'DM Sans', sans-serif",
                background: numAmount > 0
                  ? side === 'yes'
                    ? 'linear-gradient(135deg, #0052FF, #3b82f6)'
                    : 'linear-gradient(135deg, #ef4444, #f97316)'
                  : '#e5e5e5',
                color: numAmount > 0 ? '#fff' : '#bbb',
                boxShadow: numAmount > 0
                  ? side === 'yes'
                    ? '0 4px 20px rgba(0,82,255,0.3)'
                    : '0 4px 20px rgba(239,68,68,0.3)'
                  : 'none',
              }}
            >
              {numAmount > 0
                ? `Place ${side === 'yes' ? 'Yes' : 'No'} trade · $${numAmount}`
                : 'Enter an amount'}
            </button>

            <p style={{ fontSize: 11, color: '#bbb', textAlign: 'center', marginTop: 12 }}>
              By trading, you agree to the{' '}
              <a href="#" style={{ color: '#0052FF', textDecoration: 'none' }}>Terms of Use</a>
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}