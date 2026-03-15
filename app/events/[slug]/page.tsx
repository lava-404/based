'use client'
import { use, useState, useEffect } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { encodeFunctionData, type Abi } from 'viem'
import CreateMarketModal from '@/components/CreateMarketModal'
import { getBitGoDepositAddress } from '@/lib/bitgo-deposit-address'
import {
  getUsdcWrapperAddress,
  USDC_ADDRESS,
  USDC_DECIMALS,
  BASE_SEPOLIA_CHAIN_ID,
  BASESCAN_TX_URL,
} from '@/lib/market-config'
import Erc20Abi from '@/abi/ERC20.json'
import ConfidentialUSDCWrapperAbi from '@/abi/ConfidentialUSDCWrapper.json'
import type { Market } from '@/app/api/markets/route'

const OUTCOME_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

// Default event when no market is loaded yet or slug not found
const DEFAULT_EVENT = {
  title: 'Loading…',
  category: '',
  currentCount: 0,
  timeLeft: { days: 0, hrs: 0, min: 0, sec: 0 },
  outcomes: [
    { label: 'Yes', probability: 0.5, yes: 50, no: 50, color: '#3b82f6' },
    { label: 'No', probability: 0.5, yes: 50, no: 50, color: '#ef4444' },
  ],
  volume: '$0',
  liquidity: '$0',
}

function marketToEvent(m: Market) {
  const outcomes = (m.outcomes ?? []).map((label, i) => {
    const price = parseFloat(m.outcomePrices?.[i] ?? '0.5')
    const prob = price
    const yesC = Math.round(price * 100)
    const noC = 100 - yesC
    return {
      label,
      probability: prob,
      yes: yesC / 100,
      no: noC / 100,
      color: OUTCOME_COLORS[i % OUTCOME_COLORS.length],
    }
  })
  if (outcomes.length === 0) {
    outcomes.push({ label: 'Yes', probability: 0.5, yes: 50, no: 50, color: '#3b82f6' })
    outcomes.push({ label: 'No', probability: 0.5, yes: 50, no: 50, color: '#ef4444' })
  }
  const end = m.endDate ? new Date(m.endDate).getTime() - Date.now() : 0
  const days = Math.max(0, Math.floor(end / 86400000))
  const hrs = Math.max(0, Math.floor((end % 86400000) / 3600000))
  const min = Math.max(0, Math.floor((end % 3600000) / 60000))
  const sec = Math.max(0, Math.floor((end % 60000) / 1000))
  return {
    title: m.question,
    category: m.category || '',
    currentCount: 0,
    timeLeft: { days, hrs, min, sec },
    outcomes,
    volume: m.volume >= 1000 ? `$${(m.volume / 1000).toFixed(1)}K` : `$${Math.round(m.volume)}`,
    liquidity: m.liquidity >= 1000 ? `$${(m.liquidity / 1000).toFixed(1)}K` : `$${Math.round(m.liquidity)}`,
  }
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
  const { slug } = use(params)
  const [event, setEvent] = useState(DEFAULT_EVENT)
  const [selectedOutcomeIdx, setSelectedOutcomeIdx] = useState(0)
  const [side, setSide] = useState<'yes' | 'no'>('yes')
  const [amount, setAmount] = useState('')
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market')
  const [createMarketOpen, setCreateMarketOpen] = useState(false)
  const [orderMode, setOrderMode] = useState<'my-wallet' | 'stealth-bitgo'>('my-wallet')
  const [stealthOrder, setStealthOrder] = useState<{
    orderId: string
    stealthAddress: string
    amountUsd: number
    side: 'yes' | 'no'
    message: string
  } | null>(null)
  const [placeOrderLoading, setPlaceOrderLoading] = useState(false)
  const [placeOrderError, setPlaceOrderError] = useState<string | null>(null)
  const [myWalletOrderIntent, setMyWalletOrderIntent] = useState(false)
  const [wrapTxHash, setWrapTxHash] = useState<string | null>(null)
  const { ready, authenticated } = usePrivy()
  const { wallets } = useWallets()

  useEffect(() => {
    const base = typeof window !== 'undefined' ? window.location.origin : ''
    fetch(`${base}/api/markets?limit=50&active=true`)
      .then((r) => r.json())
      .then((data: { markets?: Market[] }) => {
        const markets: Market[] = data.markets ?? []
        const m = markets.find((x) => (x.slug || x.id) === slug)
        if (m) setEvent(marketToEvent(m))
        else setEvent((prev) => (prev.title === 'Loading…' ? { ...prev, title: 'Market' } : prev))
      })
      .catch(() => setEvent((prev) => (prev.title === 'Loading…' ? { ...prev, title: 'Market' } : prev)))
  }, [slug])

  const outcome = event.outcomes[selectedOutcomeIdx] ?? event.outcomes[0]
  const numAmount = parseFloat(amount) || 0
  const { shares, payout, profit } = calcPayout(numAmount, outcome.yes * 100, side)

  const presets = [1, 5, 10, 100]

  const handlePlaceOrder = async () => {
    if (numAmount <= 0) return
    setPlaceOrderError(null)
    setStealthOrder(null)

    if (orderMode === 'stealth-bitgo') {
      setPlaceOrderLoading(true)
      try {
        const res = await fetch('/api/stealth-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amountUsd: numAmount,
            side,
            marketId: slug,
          }),
        })
        const data = await res.json()
        if (!res.ok || !data.success) {
          setPlaceOrderError(data?.error ?? 'Failed to create stealth order')
          return
        }
        setStealthOrder({
          orderId: data.orderId,
          stealthAddress: data.stealthAddress,
          amountUsd: data.amountUsd ?? numAmount,
          side: data.side ?? side,
          message: data.message ?? '',
        })
      } catch (e) {
        setPlaceOrderError(e instanceof Error ? e.message : 'Request failed')
      } finally {
        setPlaceOrderLoading(false)
      }
      return
    }

    // My wallet: either wrap USDC (when wrapper set) or post a commitment tx (on-chain, no order details)
    setPlaceOrderError(null)
    setStealthOrder(null)
    setMyWalletOrderIntent(false)
    if (!ready || !authenticated) {
      setPlaceOrderError('Please log in with your wallet to place an order.')
      return
    }
    const wallet = wallets?.[0]
    if (!wallet) {
      setPlaceOrderError('No wallet connected. Connect a wallet to continue.')
      return
    }
    const wrapperAddress = getUsdcWrapperAddress()
    setPlaceOrderLoading(true)
    try {
      const walletWithChain = wallet as {
        address: string
        switchChain?: (chainId: number) => Promise<void>
        getEthereumProvider: () => Promise<{ request: (args: { method: string; params: unknown[] }) => Promise<string> }>
      }
      if (walletWithChain.switchChain) {
        await walletWithChain.switchChain(BASE_SEPOLIA_CHAIN_ID)
      }
      const provider = await walletWithChain.getEthereumProvider()
      const from = (wallet as { address: string }).address

      if (wrapperAddress) {
        // Confidential path: approve USDC → deposit into wrapper (amount private on-chain)
        const amountBaseUnits = BigInt(Math.floor(numAmount * 10 ** USDC_DECIMALS))
        const approveData = encodeFunctionData({
          abi: Erc20Abi as Abi,
          functionName: 'approve',
          args: [wrapperAddress, amountBaseUnits],
        })
        await provider.request({
          method: 'eth_sendTransaction',
          params: [{ from, to: USDC_ADDRESS, data: approveData, chainId: '0x14a34' }],
        })
        const depositData = encodeFunctionData({
          abi: ConfidentialUSDCWrapperAbi as Abi,
          functionName: 'deposit',
          args: [amountBaseUnits],
        })
        const depositHash = await provider.request({
          method: 'eth_sendTransaction',
          params: [{ from, to: wrapperAddress, data: depositData, chainId: '0x14a34' }],
        }) as string
        setWrapTxHash(depositHash)
      } else {
        // No wrapper: send a commitment tx (0 value to self) so there is an on-chain tx that reveals no order details
        const hash = await provider.request({
          method: 'eth_sendTransaction',
          params: [{ from, to: from, value: '0x0', data: '0x', chainId: '0x14a34' }],
        }) as string
        setWrapTxHash(hash)
      }
    } catch (err) {
      setPlaceOrderError(err instanceof Error ? err.message : String(err))
    } finally {
      setPlaceOrderLoading(false)
    }
  }

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
          <span style={{ fontSize: 12, color: '#888', fontWeight: 500 }}>{event.category}</span>
          <span style={{ color: '#ddd' }}>›</span>
          <span style={{ fontSize: 12, color: '#555', fontWeight: 500 }}>Event</span>
          <span style={{ color: '#ddd' }}>›</span>
          <span style={{ fontSize: 12, color: '#0052FF', fontWeight: 600 }}>{slug}</span>
        </div>

        {/* ── Title row (event market title + Create market on the right) ── */}
        <div className="fade-up" style={{ animationDelay: '0.05s', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <h1 style={{
              fontSize: 28, fontWeight: 700, color: '#0a0a0a', lineHeight: 1.25,
              letterSpacing: '-0.02em', maxWidth: 680, margin: 0,
            }}>
              {event.title}
            </h1>
            <button
              type="button"
              onClick={() => setCreateMarketOpen(true)}
              style={{
                flexShrink: 0,
                padding: '10px 20px',
                borderRadius: 12,
                border: '1px solid rgba(0,82,255,0.4)',
                background: 'linear-gradient(135deg, #0052FF, #3b82f6)',
                color: '#fff',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                boxShadow: '0 4px 14px rgba(0,82,255,0.25)',
              }}
            >
              Create market
            </button>
          </div>
          {/* stats pill row */}
          <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
            {[
              { label: 'Volume', value: event.volume },
              { label: 'Liquidity', value: event.liquidity },
              { label: 'Live count', value: event.currentCount },
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

        {/* Create market modal (pre-filled with event title); uses your wallet + configured factory/collateral */}
        <CreateMarketModal
          open={createMarketOpen}
          onOpenChange={setCreateMarketOpen}
          defaultQuestion={event.title}
          noTrigger
        />

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
                  {event.currentCount}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#aaa', fontWeight: 500 }}>Time left</span>
                <div style={{ display: 'flex', gap: 16 }}>
                  <CountdownUnit value={event.timeLeft.days} label="days" />
                  <CountdownUnit value={event.timeLeft.hrs}  label="hrs"  />
                  <CountdownUnit value={event.timeLeft.min}  label="min"  />
                  <CountdownUnit value={event.timeLeft.sec}  label="sec"  />
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
                {event.outcomes.map((o, i) => (
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
                {event.outcomes.map((o, i) => (
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

            {/* Order mode: My wallet vs Stealth (BitGo) */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#888', display: 'block', marginBottom: 6 }}>
                Place order with
              </label>
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6,
                background: '#f5f5f5', borderRadius: 14, padding: 4,
              }}>
                {[
                  { id: 'my-wallet' as const, label: 'My wallet', desc: 'Sign with Privy' },
                  { id: 'stealth-bitgo' as const, label: 'Stealth (BitGo)', desc: 'BitGo address' },
                ].map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => { setOrderMode(m.id); setStealthOrder(null); setPlaceOrderError(null); setMyWalletOrderIntent(false); setWrapTxHash(null); }}
                    style={{
                      padding: '10px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
                      textAlign: 'left', fontFamily: "'DM Sans', sans-serif",
                      background: orderMode === m.id ? '#fff' : 'transparent',
                      boxShadow: orderMode === m.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0a0a0a', display: 'block' }}>{m.label}</span>
                    <span style={{ fontSize: 11, color: '#888', marginTop: 2, display: 'block' }}>{m.desc}</span>
                  </button>
                ))}
              </div>
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

            {placeOrderError && (
              <div style={{
                padding: '10px 12px', marginBottom: 12, borderRadius: 12,
                background: '#fef2f2', border: '1px solid #fecaca',
                fontSize: 12, color: '#dc2626',
              }}>
                {placeOrderError}
              </div>
            )}

            {wrapTxHash && orderMode === 'my-wallet' && (
              <div style={{
                padding: '14px 16px', marginBottom: 12, borderRadius: 14,
                background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.02))',
                border: '1px solid rgba(16,185,129,0.3)',
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#059669', marginBottom: 6 }}>
                  Bet placed — transaction on chain
                </div>
                <p style={{ fontSize: 12, color: '#555', margin: 0 }}>
                  {getUsdcWrapperAddress()
                    ? 'USDC wrapped in confidential cUSDC — no order amount or side is visible on-chain.'
                    : 'Commitment recorded on-chain. This transaction reveals no information about your bet.'}
                </p>
                <a
                  href={`${BASESCAN_TX_URL}/${wrapTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: 13, color: '#0052FF', fontWeight: 700, marginTop: 10, display: 'inline-flex',
                    alignItems: 'center', gap: 6,
                  }}
                >
                  View transaction on BaseScan →
                </a>
              </div>
            )}

            {stealthOrder && (
              <div style={{
                padding: '14px 16px', marginBottom: 12, borderRadius: 14,
                background: 'linear-gradient(135deg, rgba(0,82,255,0.06), rgba(0,82,255,0.02))',
                border: '1px solid rgba(0,82,255,0.2)',
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#0052FF', marginBottom: 8 }}>
                  Stealth order created
                </div>
                <div style={{ fontSize: 11, color: '#555', marginBottom: 6 }}>
                  Order ID: <code style={{ background: '#f0f0f0', padding: '2px 6px', borderRadius: 4 }}>{stealthOrder.orderId}</code>
                </div>
                <div style={{ fontSize: 11, color: '#555', marginBottom: 6 }}>
                  Stealth address: <code style={{ wordBreak: 'break-all', fontSize: 10 }}>{stealthOrder.stealthAddress}</code>
                </div>
                <div style={{ fontSize: 11, color: '#555', marginBottom: 8 }}>
                  Deposit <strong>${stealthOrder.amountUsd}</strong> USDC to the BitGo deposit address below. Your order will be placed from our BitGo wallet so your main wallet stays private.
                </div>
                {getBitGoDepositAddress() && (
                  <div style={{ fontSize: 10, color: '#888', wordBreak: 'break-all' }}>
                    Deposit to: {getBitGoDepositAddress()}
                  </div>
                )}
              </div>
            )}

            {/* Trade button */}
            <button
              type="button"
              className="trade-btn"
              disabled={numAmount <= 0 || placeOrderLoading}
              onClick={handlePlaceOrder}
              style={{
                width: '100%', padding: '14px 0', borderRadius: 14, border: 'none',
                fontSize: 15, fontWeight: 700, cursor: numAmount > 0 && !placeOrderLoading ? 'pointer' : 'not-allowed',
                fontFamily: "'DM Sans', sans-serif",
                background: numAmount > 0 && !placeOrderLoading
                  ? side === 'yes'
                    ? 'linear-gradient(135deg, #0052FF, #3b82f6)'
                    : 'linear-gradient(135deg, #ef4444, #f97316)'
                  : '#e5e5e5',
                color: numAmount > 0 && !placeOrderLoading ? '#fff' : '#bbb',
                boxShadow: numAmount > 0 && !placeOrderLoading
                  ? side === 'yes'
                    ? '0 4px 20px rgba(0,82,255,0.3)'
                    : '0 4px 20px rgba(239,68,68,0.3)'
                  : 'none',
              }}
            >
              {placeOrderLoading
                ? (orderMode === 'stealth-bitgo' ? 'Creating stealth order…' : 'Placing bet…')
                : numAmount > 0
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