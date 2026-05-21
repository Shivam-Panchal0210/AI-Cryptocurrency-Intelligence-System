import { useState, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { fetchBinanceKlines, fetchPriceHistory, SYMBOL_META } from '../services/cryptoApi'

const COINS = ['BTC', 'ETH', 'SOL', 'XRP'].map(sym => SYMBOL_META[sym])

const RANGES = [
  { label: '1D',  days: 1,  interval: '5m',  limit: 288 },
  { label: '7D',  days: 7,  interval: '1h',  limit: 168 },
  { label: '30D', days: 30, interval: '4h',  limit: 180 },
]

const CustomTooltip = ({ active, payload, color }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <div className="tt-price" style={{ color }}>
        ${parseFloat(payload[0].value).toLocaleString('en-US', {
          minimumFractionDigits: 2, maximumFractionDigits: 2,
        })}
      </div>
      <div className="tt-time">{payload[0].payload.time}</div>
    </div>
  )
}

export default function PriceChart() {
  const [activeCoin,  setActiveCoin]  = useState(COINS[0])
  const [activeRange, setActiveRange] = useState(RANGES[1])
  const [history,     setHistory]     = useState([])
  const [loading,     setLoading]     = useState(true)
  const [source,      setSource]      = useState('binance')

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        // Try Binance first
        const klines = await fetchBinanceKlines(
          activeCoin.binancePair,
          activeRange.interval,
          activeRange.limit
        )
        if (cancelled) return

        setHistory(klines.map(k => ({
          time: new Date(k.time).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric',
            ...(activeRange.days === 1 && { hour: '2-digit', minute: '2-digit' }),
          }),
          price: k.price,
        })))
        setSource('binance')

      } catch {
        // Fall back to CoinGecko
        try {
          const raw = await fetchPriceHistory(activeCoin.geckoId, activeRange.days)
          if (cancelled) return
          setHistory(raw.map(([ts, price]) => ({
            time: new Date(ts).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric',
              ...(activeRange.days === 1 && { hour: '2-digit', minute: '2-digit' }),
            }),
            price: parseFloat(price.toFixed(2)),
          })))
          setSource('coingecko')
        } catch (e) {
          console.error('Both chart sources failed:', e.message)
        }
      }

      if (!cancelled) setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [activeCoin, activeRange])

  const prices = history.map(d => d.price)
  const min    = prices.length ? Math.min(...prices) : 0
  const max    = prices.length ? Math.max(...prices) : 0
  const last   = history[history.length - 1]?.price ?? 0
  const first  = history[0]?.price ?? 0
  const pct    = first ? (((last - first) / first) * 100).toFixed(2) : null
  const isUp   = pct !== null && parseFloat(pct) >= 0

  return (
    <div className="chart-card">
      <div className="chart-header">
        <div className="chart-coins">
          {COINS.map(c => (
            <button
              key={c.sym}
              className={`chart-coin-btn ${activeCoin.sym === c.sym ? 'active' : ''}`}
              style={activeCoin.sym === c.sym
                ? { color: c.color, borderColor: c.color, background: `${c.color}18` }
                : {}}
              onClick={() => setActiveCoin(c)}
            >
              {c.sym}
            </button>
          ))}
        </div>
        <div className="chart-days">
          {RANGES.map(r => (
            <button
              key={r.label}
              className={`chart-day-btn ${activeRange.label === r.label ? 'active' : ''}`}
              onClick={() => setActiveRange(r)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {pct && (
        <div className="chart-summary">
          <span className="chart-current-price" style={{ color: activeCoin.color }}>
            ${last.toLocaleString('en-US', {
              minimumFractionDigits: 2, maximumFractionDigits: 2,
            })}
          </span>
          <span className={isUp ? 'up' : 'down'}>
            {isUp ? '▲' : '▼'} {Math.abs(pct)}%
          </span>
          <span className="chart-period-label">
            {activeRange.label} · via {source === 'binance' ? '🟡 Binance' : '🦎 CoinGecko'}
          </span>
        </div>
      )}

      {loading ? (
        <div className="skeleton" style={{ height: 220, marginTop: 8 }} />
      ) : history.length === 0 ? (
        <div style={{ height: 220, display: 'flex', alignItems: 'center',
          justifyContent: 'center', color: '#4A5568', fontSize: 13 }}>
          No data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={history} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="#0E1420" strokeDasharray="4 4" vertical={false} />
            <XAxis
              dataKey="time"
              tick={{ fill: '#4A5568', fontSize: 10 }}
              tickLine={false} axisLine={false}
              interval={Math.floor(history.length / 6)}
            />
            <YAxis
              domain={[min * 0.998, max * 1.002]}
              tick={{ fill: '#4A5568', fontSize: 10 }}
              tickLine={false} axisLine={false}
              tickFormatter={v => v >= 1000
                ? `$${(v / 1000).toFixed(1)}k`
                : `$${v.toFixed(3)}`}
              width={60}
            />
            <Tooltip content={<CustomTooltip color={activeCoin.color} />} />
            <Line
              type="monotone" dataKey="price"
              stroke={activeCoin.color} strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: activeCoin.color, stroke: '#05070D' }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}