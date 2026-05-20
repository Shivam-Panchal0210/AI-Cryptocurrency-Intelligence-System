import { useState, useMemo } from 'react'
import useCryptoStore from '../store/useCryptoStore'
import { SYMBOL_META } from '../services/cryptoApi'
import OrderBook from '../components/OrderBook'
import RecentTrades from '../components/RecentTrades'

const ALL_COINS = ['BTC', 'ETH', 'SOL', 'XRP', 'BNB']

const SUPPLY = {
  BTC: 19700000, ETH: 120000000, SOL: 460000000,
  XRP: 57000000000, BNB: 145000000,
}

// ✅ Sparkline is defined OUTSIDE but used INSIDE — this is fine
// It is NOT a hook, just a regular component
const Sparkline = ({ change }) => {
  const points = Array.from({ length: 10 }, (_, i) => {
    const trend = change >= 0 ? i * 2 : (9 - i) * 2
    const noise = Math.sin(i * 1.5) * 5
    return Math.max(2, Math.min(38, 20 + trend + noise))
  })
  const max = Math.max(...points)
  const min = Math.min(...points)
  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * 80
    const y = 40 - ((p - min) / (max - min || 1)) * 36
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width="80" height="40" viewBox="0 0 80 40">
      <polyline
        points={coords}
        fill="none"
        stroke={change >= 0 ? '#5DDE4A' : '#FF4560'}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}

// ✅ ALL hooks must be at the TOP of this function, nothing before them
export default function Markets() {

  // ── ALL useState/useMemo at the very top ──
  const prices = useCryptoStore((s) => s.prices)
  const [search,      setSearch]      = useState('')
  const [sortBy,      setSortBy]      = useState('marketCap')
  const [sortDir,     setSortDir]     = useState('desc')
  const [filter,      setFilter]      = useState('all')
  const [selectedSym, setSelectedSym] = useState('BTC')

  // ── Logic after hooks ──
  const handleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(col); setSortDir('desc') }
  }

  const rows = useMemo(() => {
    return ALL_COINS
      .map((sym) => {
        const d    = prices[sym]
        const meta = SYMBOL_META[sym]
        if (!d) return null
        const price = parseFloat(d.price) || 0
        return {
          sym,
          name:      meta?.name  || sym,
          color:     meta?.color || '#fff',
          price,
          change24h: parseFloat(d.change24h) || 0,
          high:      parseFloat(d.high)  || 0,
          low:       parseFloat(d.low)   || 0,
          volume:    parseFloat(d.volume) || 0,
          marketCap: price * (SUPPLY[sym] || 1),
        }
      })
      .filter(Boolean)
      .filter(r =>
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.sym.toLowerCase().includes(search.toLowerCase())
      )
      .filter(r => {
        if (filter === 'gainers') return r.change24h > 0
        if (filter === 'losers')  return r.change24h < 0
        return true
      })
      .sort((a, b) => {
        const mul = sortDir === 'asc' ? 1 : -1
        return (a[sortBy] - b[sortBy]) * mul
      })
  }, [prices, search, sortBy, sortDir, filter])

  const fmt = (n, d = 2) =>
    parseFloat(n || 0).toLocaleString('en-US', {
      minimumFractionDigits: d,
      maximumFractionDigits: d,
    })

  const SortIcon = ({ col }) => (
    <span style={{ marginLeft: 4, color: sortBy === col ? 'var(--accent)' : '#2D3748' }}>
      {sortBy === col ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  )

  // ── Render ──
  return (
    <>
      <div className="page-header">
        <div>
          <h1>Markets</h1>
          <p>Live prices, volume and market data</p>
        </div>
      </div>

      {/* Controls */}
      <div className="markets-controls">
        <input
          className="search-input"
          placeholder="🔍  Search coin..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="filter-tabs">
          {['all', 'gainers', 'losers'].map(f => (
            <button
              key={f}
              className={`filter-tab ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : f === 'gainers' ? '▲ Gainers' : '▼ Losers'}
            </button>
          ))}
        </div>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted)' }}>
          {rows.length} coins
        </span>
      </div>

      {/* Table */}
      <div className="markets-table-wrap">
        <table className="markets-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Coin</th>
              <th onClick={() => handleSort('price')} style={{ cursor: 'pointer' }}>
                Price <SortIcon col="price" />
              </th>
              <th onClick={() => handleSort('change24h')} style={{ cursor: 'pointer' }}>
                24h % <SortIcon col="change24h" />
              </th>
              <th onClick={() => handleSort('high')} style={{ cursor: 'pointer' }}>
                24h High <SortIcon col="high" />
              </th>
              <th onClick={() => handleSort('low')} style={{ cursor: 'pointer' }}>
                24h Low <SortIcon col="low" />
              </th>
              <th onClick={() => handleSort('volume')} style={{ cursor: 'pointer' }}>
                Volume <SortIcon col="volume" />
              </th>
              <th onClick={() => handleSort('marketCap')} style={{ cursor: 'pointer' }}>
                Mkt Cap <SortIcon col="marketCap" />
              </th>
              <th>7D Trend</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.sym} className="market-row">
                <td className="rank">{i + 1}</td>
                <td>
                  <div className="coin-cell">
                    <div className="coin-ball"
                      style={{ background: r.color + '22', color: r.color }}>
                      {r.sym[0]}
                    </div>
                    <div>
                      <div className="coin-cell-name">{r.name}</div>
                      <div className="coin-cell-sym">{r.sym}</div>
                    </div>
                  </div>
                </td>
                <td className="mono">${fmt(r.price)}</td>
                <td className={r.change24h >= 0 ? 'up' : 'down'}>
                  {r.change24h >= 0 ? '▲' : '▼'} {Math.abs(r.change24h).toFixed(2)}%
                </td>
                <td className="mono up">${fmt(r.high)}</td>
                <td className="mono down">${fmt(r.low)}</td>
                <td className="mono">${(r.volume / 1e6).toFixed(1)}M</td>
                <td className="mono">
                  ${r.marketCap >= 1e9
                    ? (r.marketCap / 1e9).toFixed(1) + 'B'
                    : (r.marketCap / 1e6).toFixed(1) + 'M'}
                </td>
                <td><Sparkline change={r.change24h} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Order Book + Recent Trades */}
      <div style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700 }}>
            ORDER BOOK & TRADES:
          </span>
          {ALL_COINS.map(sym => (
            <button
              key={sym}
              className={`pct-btn ${selectedSym === sym ? 'active' : ''}`}
              onClick={() => setSelectedSym(sym)}
            >
              {sym}
            </button>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <OrderBook sym={selectedSym} />
          <RecentTrades sym={selectedSym} />
        </div>
      </div>
    </>
  )
}