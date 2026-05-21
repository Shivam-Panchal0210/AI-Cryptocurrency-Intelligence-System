import { useState, useEffect } from 'react'
import { fetchBinanceOrderBook, SYMBOL_META } from '../services/cryptoApi'

export default function OrderBook({ sym = 'BTC' }) {
  const [book,    setBook]    = useState({ bids: [], asks: [] })
  const [loading, setLoading] = useState(true)
  const meta = SYMBOL_META[sym]

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const data = await fetchBinanceOrderBook(meta?.binancePair || 'BTCUSDT', 8)
        if (!cancelled) { setBook(data); setLoading(false) }
      } catch (e) {
        console.error('Order book error:', e.message)
        if (!cancelled) setLoading(false)
      }
    }
    load()
    const t = setInterval(load, 3000) // refresh every 3s
    return () => { cancelled = true; clearInterval(t) }
  }, [sym])

  const maxQty = Math.max(
    ...book.bids.map(b => b.qty),
    ...book.asks.map(a => a.qty), 1
  )

  const fmt = (n, d = 2) =>
    parseFloat(n || 0).toLocaleString('en-US', {
      minimumFractionDigits: d, maximumFractionDigits: d,
    })

  return (
    <div className="orderbook-card">
      <div className="orderbook-title">
        📋 Order Book · {sym}/USDT
        <span className="chart-live">Binance · live</span>
      </div>

      {loading ? (
        <div className="skeleton" style={{ height: 260 }} />
      ) : (
        <>
          <div className="ob-header">
            <span>Price (USD)</span>
            <span>Amount ({sym})</span>
            <span>Total</span>
          </div>

          {/* Asks — sell orders (red, reversed) */}
          {[...book.asks].reverse().map((ask, i) => (
            <div key={`ask-${i}`} className="ob-row">
              <div className="ob-depth-bar"
                style={{ width: `${(ask.qty / maxQty) * 100}%`, background: 'rgba(255,69,96,0.1)' }}
              />
              <span className="down">${fmt(ask.price)}</span>
              <span className="mono">{ask.qty.toFixed(4)}</span>
              <span className="mono muted">${fmt(ask.price * ask.qty, 0)}</span>
            </div>
          ))}

          {/* Spread */}
          {book.bids[0] && book.asks[0] && (
            <div className="ob-spread">
              Spread: ${fmt(book.asks[0].price - book.bids[0].price)} &nbsp;·&nbsp;
              {(((book.asks[0].price - book.bids[0].price)
                / book.bids[0].price) * 100).toFixed(3)}%
            </div>
          )}

          {/* Bids — buy orders (green) */}
          {book.bids.map((bid, i) => (
            <div key={`bid-${i}`} className="ob-row">
              <div className="ob-depth-bar"
                style={{ width: `${(bid.qty / maxQty) * 100}%`, background: 'rgba(93,222,74,0.1)' }}
              />
              <span className="up">${fmt(bid.price)}</span>
              <span className="mono">{bid.qty.toFixed(4)}</span>
              <span className="mono muted">${fmt(bid.price * bid.qty, 0)}</span>
            </div>
          ))}
        </>
      )}
    </div>
  )
}