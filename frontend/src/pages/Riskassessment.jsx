import { useState } from 'react'
import useCryptoStore from '../store/useCryptoStore'

const COINS = ['BTC', 'ETH', 'SOL', 'XRP', 'BNB']

export default function RiskAssessment() {
  const prices = useCryptoStore((s) => s.prices)

  const [calc, setCalc] = useState({
    accountSize: '',
    riskPct: '2',
    sym: 'BTC',
    entryPrice: '',
    stopLoss: '',
    takeProfit: '',
  })

  const set = (key, val) => setCalc(c => ({ ...c, [key]: val }))

  const entry  = parseFloat(calc.entryPrice) || parseFloat(prices[calc.sym]?.price) || 0
  const stop   = parseFloat(calc.stopLoss)   || 0
  const tp     = parseFloat(calc.takeProfit) || 0
  const acct   = parseFloat(calc.accountSize) || 0
  const riskPct = parseFloat(calc.riskPct) || 2

  const riskPerUnit  = entry > stop ? entry - stop : 0
  const riskAmt      = acct * (riskPct / 100)
  const posSize      = riskPerUnit > 0 ? riskAmt / riskPerUnit : 0
  const posUSD       = posSize * entry
  const tpDist       = tp > entry ? tp - entry : entry * 0.05
  const rr           = riskPerUnit > 0 ? tpDist / riskPerUnit : 0
  const exposure     = acct > 0 ? (posUSD / acct) * 100 : 0

  const fmt = (n, d = 2) =>
    parseFloat(n || 0).toLocaleString('en-US', {
      minimumFractionDigits: d, maximumFractionDigits: d,
    })

  return (
    <>
      <div className="page-header">
        <div><h1>Risk Assessment</h1><p>Position sizing and trade risk calculator</p></div>
      </div>

      <div className="risk-grid">

        {/* Input card */}
        <div className="risk-card">
          <div className="risk-card-title">📐 Trade Setup</div>

          <div className="risk-field">
            <label>Account Size (USD)</label>
            <input className="form-input" type="number"
              placeholder="e.g. 10000"
              value={calc.accountSize}
              onChange={e => set('accountSize', e.target.value)} />
          </div>

          <div className="risk-field">
            <label>Risk Per Trade</label>
            <div className="risk-pct-row">
              {['1','2','3','5'].map(p => (
                <button key={p}
                  className={`pct-btn ${calc.riskPct === p ? 'active' : ''}`}
                  onClick={() => set('riskPct', p)}>
                  {p}%
                </button>
              ))}
              <input className="form-input" style={{ width: 70 }}
                type="number" value={calc.riskPct}
                onChange={e => set('riskPct', e.target.value)} />
            </div>
          </div>

          <div className="risk-field">
            <label>Coin</label>
            <select className="form-select" value={calc.sym}
              onChange={e => {
                set('sym', e.target.value)
                set('entryPrice', parseFloat(prices[e.target.value]?.price || 0).toFixed(2))
              }}>
              {COINS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="risk-field">
            <label>Entry Price (USD)</label>
            <input className="form-input" type="number"
              placeholder={`Live: $${fmt(prices[calc.sym]?.price)}`}
              value={calc.entryPrice}
              onChange={e => set('entryPrice', e.target.value)} />
          </div>

          <div className="risk-field">
            <label>Stop Loss (USD)</label>
            <input className="form-input" type="number"
              placeholder="e.g. 74000"
              value={calc.stopLoss}
              onChange={e => set('stopLoss', e.target.value)} />
          </div>

          <div className="risk-field">
            <label>Take Profit (USD) — optional</label>
            <input className="form-input" type="number"
              placeholder="e.g. 85000"
              value={calc.takeProfit}
              onChange={e => set('takeProfit', e.target.value)} />
          </div>
        </div>

        {/* Results card */}
        <div className="risk-card">
          <div className="risk-card-title">📊 Results</div>

          <div className="risk-results">
            {[
              { label: 'Risk Amount',         val: `$${fmt(riskAmt)}`,          cls: 'up' },
              { label: 'Risk Per Unit',        val: `$${fmt(riskPerUnit)}`,      cls: '' },
              { label: `Position (${calc.sym})`, val: `${posSize.toFixed(6)} ${calc.sym}`, cls: 'accent' },
              { label: 'Position Value',       val: `$${fmt(posUSD)}`,           cls: 'accent' },
              { label: 'Risk / Reward',        val: `1 : ${rr.toFixed(2)}`,      cls: rr >= 2 ? 'up' : 'down' },
              { label: 'Portfolio Exposure',   val: `${exposure.toFixed(1)}%`,   cls: exposure > 20 ? 'down' : 'up' },
            ].map(row => (
              <div key={row.label} className="risk-result-row">
                <span className="risk-result-label">{row.label}</span>
                <span className={`risk-result-val ${row.cls}`}>{row.val}</span>
              </div>
            ))}
          </div>

          {/* Exposure bar */}
          {acct > 0 && posUSD > 0 && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>
                PORTFOLIO EXPOSURE
              </div>
              <div className="conf-track" style={{ height: 8, background: '#0E1420' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(100, exposure)}%`,
                  background: exposure > 20 ? '#FF4560' : '#C8FF57',
                  borderRadius: 4,
                  transition: 'width 0.5s ease',
                }} />
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>
                {exposure > 20
                  ? '⚠️  High exposure — consider reducing size'
                  : '✅  Position within safe limits'}
              </div>
            </div>
          )}

          {/* R/R quality */}
          {rr > 0 && (
            <div style={{
              marginTop: 16,
              padding: '12px 16px',
              borderRadius: 10,
              background: rr >= 2 ? 'rgba(200,255,87,0.06)' : 'rgba(255,69,96,0.06)',
              border: `1px solid ${rr >= 2 ? 'rgba(200,255,87,0.15)' : 'rgba(255,69,96,0.15)'}`,
            }}>
              <div style={{ fontSize: 12, fontWeight: 700,
                color: rr >= 2 ? 'var(--accent)' : '#FF4560' }}>
                {rr >= 3 ? '🔥 Excellent setup' :
                 rr >= 2 ? '✅ Good risk/reward' :
                 rr >= 1 ? '⚠️  Marginal setup' :
                           '❌ Poor risk/reward — avoid'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                {rr >= 2
                  ? 'Risking $1 to make $' + rr.toFixed(2) + '. Solid trade.'
                  : 'Consider moving stop loss or finding better entry.'}
              </div>
            </div>
          )}
        </div>

        {/* Live prices — click to fill entry */}
        <div className="risk-card" style={{ gridColumn: '1 / -1' }}>
          <div className="risk-card-title">⚡ Live Prices — Click to Set Entry</div>
          <div className="risk-prices-grid">
            {COINS.map(sym => {
              const d = prices[sym]
              if (!d) return null
              const change = parseFloat(d.change24h) || 0
              return (
                <div key={sym} className="risk-price-cell"
                  onClick={() => {
                    set('sym', sym)
                    set('entryPrice', parseFloat(d.price).toFixed(2))
                  }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>{sym}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'monospace', color: 'var(--text)', margin: '4px 0' }}>
                    ${parseFloat(d.price).toLocaleString()}
                  </div>
                  <div className={change >= 0 ? 'up' : 'down'} style={{ fontSize: 12, fontWeight: 700 }}>
                    {change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--accent)', marginTop: 6 }}>
                    Click to use →
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}