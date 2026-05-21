import { useState, useEffect } from 'react'
import useCryptoStore from '../store/useCryptoStore'
import { SYMBOL_META } from '../services/cryptoApi'
import toast from 'react-hot-toast'

const COINS        = ['BTC', 'ETH', 'SOL', 'XRP', 'BNB']
const STORAGE_KEY  = 'cryptoai_portfolio'

export default function Portfolio() {
  const prices = useCryptoStore((s) => s.prices)

  const [holdings, setHoldings] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {} }
    catch { return {} }
  })

  const [form, setForm] = useState({ sym: 'BTC', amount: '', buyPrice: '' })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(holdings))
  }, [holdings])

  const addHolding = () => {
    const amount   = parseFloat(form.amount)
    const buyPrice = parseFloat(form.buyPrice)
    if (!amount || !buyPrice || amount <= 0 || buyPrice <= 0) {
      toast.error('Enter valid amount and buy price')
      return
    }
    setHoldings(prev => ({ ...prev, [form.sym]: { amount, buyPrice } }))
    toast.success(`Added ${amount} ${form.sym} to portfolio`)
    setForm(f => ({ ...f, amount: '', buyPrice: '' }))
  }

  const removeHolding = (sym) => {
    setHoldings(prev => { const n = { ...prev }; delete n[sym]; return n })
    toast.success(`Removed ${sym}`)
  }

  const fmt = (n, d = 2) =>
    parseFloat(n || 0).toLocaleString('en-US', {
      minimumFractionDigits: d, maximumFractionDigits: d,
    })

  const rows = Object.entries(holdings).map(([sym, h]) => {
    const cur   = parseFloat(prices[sym]?.price) || 0
    const value = cur * h.amount
    const cost  = h.buyPrice * h.amount
    const pnl   = value - cost
    const pct   = cost > 0 ? (pnl / cost) * 100 : 0
    const meta  = Object.values(SYMBOL_META).find(m => m.sym === sym)
    return { sym, ...h, cur, value, cost, pnl, pct, color: meta?.color }
  })

  const totalValue = rows.reduce((s, r) => s + r.value, 0)
  const totalCost  = rows.reduce((s, r) => s + r.cost,  0)
  const totalPnl   = totalValue - totalCost
  const totalPct   = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0

  return (
    <>
      <div className="page-header">
        <div><h1>Portfolio</h1><p>Track your holdings and P&L in real-time</p></div>
      </div>

      {/* Summary */}
      <div className="port-summary">
        {[
          { label: 'Total Value',  val: `$${fmt(totalValue)}`,  cls: '' },
          { label: 'Total Cost',   val: `$${fmt(totalCost)}`,   cls: '' },
          { label: 'Total P&L',
            val: `${totalPnl >= 0 ? '+' : ''}$${fmt(Math.abs(totalPnl))}`,
            cls: totalPnl >= 0 ? 'up' : 'down' },
          { label: 'Return',
            val: `${totalPct >= 0 ? '+' : ''}${totalPct.toFixed(2)}%`,
            cls: totalPct >= 0 ? 'up' : 'down' },
        ].map(item => (
          <div key={item.label} className="port-stat-card">
            <div className="port-stat-label">{item.label}</div>
            <div className={`port-stat-val ${item.cls}`}>{item.val}</div>
          </div>
        ))}
      </div>

      {/* Add form */}
      <div className="port-form-card">
        <div className="port-form-title">➕ Add Holding</div>
        <div className="port-form-row">
          <select
            className="form-select"
            value={form.sym}
            onChange={e => setForm(f => ({ ...f, sym: e.target.value }))}
          >
            {COINS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input
            className="form-input"
            type="number"
            placeholder="Amount (e.g. 0.5)"
            value={form.amount}
            onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
          />
          <input
            className="form-input"
            type="number"
            placeholder="Buy price (USD)"
            value={form.buyPrice}
            onChange={e => setForm(f => ({ ...f, buyPrice: e.target.value }))}
          />
          <button className="form-btn" onClick={addHolding}>Add</button>
        </div>
        {/* Quick fill current price */}
        <div style={{ marginTop: 8, fontSize: 11, color: 'var(--muted)' }}>
          Current {form.sym} price:{' '}
          <span
            style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: 700 }}
            onClick={() =>
              setForm(f => ({
                ...f,
                buyPrice: parseFloat(prices[form.sym]?.price || 0).toFixed(2),
              }))
            }
          >
            ${parseFloat(prices[form.sym]?.price || 0).toFixed(2)} (click to fill)
          </span>
        </div>
      </div>

      {/* Holdings table */}
      {rows.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: 48 }}>💼</div>
          <div style={{ marginTop: 12, color: 'var(--muted)', fontSize: 14 }}>
            No holdings yet — add your first position above
          </div>
        </div>
      ) : (
        <div className="markets-table-wrap">
          <table className="markets-table">
            <thead>
              <tr>
                <th>Coin</th>
                <th>Amount</th>
                <th>Buy Price</th>
                <th>Current Price</th>
                <th>Value</th>
                <th>P&L</th>
                <th>Return</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.sym} className="market-row">
                  <td>
                    <div className="coin-cell">
                      <div className="coin-ball"
                        style={{ background: r.color + '22', color: r.color }}>
                        {r.sym[0]}
                      </div>
                      <span className="coin-cell-name">{r.sym}</span>
                    </div>
                  </td>
                  <td className="mono">{r.amount}</td>
                  <td className="mono">${fmt(r.buyPrice)}</td>
                  <td className="mono">${fmt(r.cur)}</td>
                  <td className="mono">${fmt(r.value)}</td>
                  <td className={`mono ${r.pnl >= 0 ? 'up' : 'down'}`}>
                    {r.pnl >= 0 ? '+' : ''}${fmt(Math.abs(r.pnl))}
                  </td>
                  <td className={r.pct >= 0 ? 'up' : 'down'}>
                    {r.pct >= 0 ? '▲' : '▼'} {Math.abs(r.pct).toFixed(2)}%
                  </td>
                  <td>
                    <button className="remove-btn" onClick={() => removeHolding(r.sym)}>
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}