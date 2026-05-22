import { useState, useMemo, useEffect } from 'react'
import useCryptoStore from '../store/useCryptoStore'

export default function RiskAssessment() {
  const prices = useCryptoStore((s) => s.prices)
  const coinList = useMemo(() => Object.keys(prices || {}), [prices])

  const [calc, setCalc] = useState({
    accountSize: '10000',
    riskPct: '2',
    sym: 'BTC',
    entryPrice: '',
    stopLoss: '',
    takeProfit: '',
  })

  // Auto-sync entry price when selection changes
  useEffect(() => {
    if (prices[calc.sym]) {
      setCalc(prev => ({ ...prev, entryPrice: parseFloat(prices[calc.sym].price).toFixed(2) }))
    }
  }, [prices, calc.sym])

  const set = (key, val) => setCalc(prev => ({ ...prev, [key]: val }))

  const entry   = parseFloat(calc.entryPrice) || 0
  const stop    = parseFloat(calc.stopLoss)   || 0
  const tp      = parseFloat(calc.takeProfit) || 0
  const acct    = parseFloat(calc.accountSize) || 0
  const riskPct = parseFloat(calc.riskPct) || 2

  const riskPerUnit  = entry > stop ? entry - stop : 0
  const riskAmt      = acct * (riskPct / 100)
  const posSize      = riskPerUnit > 0 ? riskAmt / riskPerUnit : 0
  const posUSD       = posSize * entry
  const rr           = riskPerUnit > 0 ? ((tp > entry ? tp - entry : entry * 0.05) / riskPerUnit) : 0
  const exposure     = acct > 0 ? (posUSD / acct) * 100 : 0

  const fmt = (n, d = 2) => parseFloat(n || 0).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })

  return (
    <>
      <div className="page-header">
        <div><h1>Risk Assessment</h1><p>Dynamic Position Sizing</p></div>
      </div>

      <div className="risk-grid">
        <div className="risk-card">
          <div className="risk-card-title">Trade Setup</div>
          <div className="risk-field">
            <label>Account Size (USD)</label>
            <input className="form-input" type="number" value={calc.accountSize} onChange={e => set('accountSize', e.target.value)} />
          </div>
          <div className="risk-field">
            <label>Coin</label>
            <select className="form-select" value={calc.sym} onChange={e => set('sym', e.target.value)}>
              {coinList.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="risk-field">
            <label>Entry Price</label>
            <input className="form-input" type="number" value={calc.entryPrice} onChange={e => set('entryPrice', e.target.value)} />
          </div>
          <div className="risk-field">
            <label>Stop Loss</label>
            <input className="form-input" type="number" value={calc.stopLoss} onChange={e => set('stopLoss', e.target.value)} />
          </div>
          <div className="risk-field">
            <label>Take Profit</label>
            <input className="form-input" type="number" value={calc.takeProfit} onChange={e => set('takeProfit', e.target.value)} />
          </div>
        </div>

        <div className="risk-card">
          <div className="risk-card-title">Results</div>
          <div className="risk-results">
            {[{ label: 'Risk Amount', val: `$${fmt(riskAmt)}` },
              { label: 'Position Size', val: `${posSize.toFixed(4)} ${calc.sym}` },
              { label: 'Position Value', val: `$${fmt(posUSD)}` },
              { label: 'Risk/Reward', val: `1 : ${rr.toFixed(2)}` },
              { label: 'Exposure', val: `${exposure.toFixed(1)}%` }].map(row => (
              <div key={row.label} className="risk-result-row">
                <span className="risk-result-label">{row.label}</span>
                <span className="risk-result-val">{row.val}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="risk-card" style={{ gridColumn: '1 / -1' }}>
          <div className="risk-card-title">All Available Assets</div>
          <div className="risk-prices-grid">
            {coinList.map(sym => (
              <div key={sym} className="risk-price-cell" onClick={() => set('sym', sym)}>
                <div style={{ fontWeight: 700 }}>{sym}</div>
                <div style={{ fontSize: 14 }}>${fmt(prices[sym]?.price)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}