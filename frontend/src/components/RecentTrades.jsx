import { useState, useEffect } from 'react'
import { fetchBinanceTrades, SYMBOL_META } from '../services/cryptoApi'

export default function RecentTrades({ sym = 'BTC' }) {
  const [trades, setTrades] = useState([])
  const meta = SYMBOL_META[sym]

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const data = await fetchBinanceTrades(meta?.binancePair || 'BTCUSDT', 15)
        if (!cancelled) setTrades(data)
      } catch (e) {
        console.error('Trades error:', e.message)
      }
    }
    load()
    const t = setInterval(load, 2000) // refresh every 2s
    return () => { cancelled = true; clearInterval(t) }
  }, [sym])

  return (
    <div className="orderbook-card">
      <div className="orderbook-title">
        ⚡ Recent Trades · {sym}/USDT
        <span className="chart-live">Binance · live</span>
      </div>

      <div className="ob-header">
        <span>Price (USD)</span>
        <span>Amount ({sym})</span>
        <span>Time</span>
      </div>

      {trades.map((t, i) => (
        <div key={i} className="ob-row">
          <span className={t.isBuyer ? 'down' : 'up'}>
            ${parseFloat(t.price).toLocaleString('en-US', {
              minimumFractionDigits: 2, maximumFractionDigits: 2,
            })}
          </span>
          <span className="mono">{parseFloat(t.qty).toFixed(4)}</span>
          <span className="mono muted" style={{ fontSize: 10 }}>
            {new Date(t.time).toLocaleTimeString('en-US', { hour12: false })}
          </span>
        </div>
      ))}
    </div>
  )
}