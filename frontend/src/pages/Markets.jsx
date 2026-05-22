// frontend/src/pages/Markets.jsx

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import OrderBook from '../components/OrderBook'
import RecentTrades from '../components/RecentTrades'
import CoinDetailPanel from '../components/CoinDetailPanel'
import useCryptoStore from '../store/useCryptoStore'

const API_BASE = 'http://localhost:5000/api'
const PER_PAGE = 10

const MAIN_COINS = [
  'BTC',
  'ETH',
  'BNB',
  'SOL',
  'XRP',
  'ADA',
  'DOGE',
  'SHIB',
  'DOT',
  'AVAX',
]

const CRYPTOCOMPARE_API_KEY =
  '769b4d81ef2e9bf6e9f650da89ad04e597833cec375c8f1c51ee097aaaec4ef0'

const CURRENCY_FULL_NAMES = {
  USD: 'USD - United States Dollar',
  EUR: 'EUR - Euro',
  GBP: 'GBP - British Pound',
  INR: 'INR - Indian Rupee',
  JPY: 'JPY - Japanese Yen',
  CAD: 'CAD - Canadian Dollar',
  AUD: 'AUD - Australian Dollar',
}

const SYMBOL_MAP = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  JPY: '¥',
  CAD: '$',
  AUD: '$',
}

const CATEGORIES = [
  { id: 'all', label: 'All Active Pairs' },
  { id: 'watchlist', label: '⭐ My Watchlist' },
  { id: 'gainers', label: '▲ Top Gainers' },
  { id: 'losers', label: '▼ Top Losers' },
  { id: 'stablecoin', label: 'Stablecoins' },
]

const Sparkline = ({ change }) => {
  const pts = Array.from({ length: 20 }, (_, i) => {
    const trend = change >= 0 ? i * 1.5 : (19 - i) * 1.5
    const noise = Math.sin(i * 1.3) * 4 + Math.cos(i * 0.9) * 3

    return Math.max(2, Math.min(38, 20 + trend + noise))
  })

  const max = Math.max(...pts)
  const min = Math.min(...pts)

  const coords = pts
    .map((p, i) => {
      const x = (i / (pts.length - 1)) * 80
      const y = 40 - ((p - min) / (max - min || 1)) * 36
      return `${x},${y}`
    })
    .join(' ')

  const areaCoords = `0,40 ${coords} 80,40`

  return (
    <svg width="80" height="40" viewBox="0 0 80 40">
      <defs>
        <linearGradient
          id={`sg${change > 0 ? 'g' : 'r'}`}
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop
            offset="0%"
            stopColor={change >= 0 ? '#00f5a0' : '#ff4d6d'}
            stopOpacity="0.2"
          />

          <stop
            offset="100%"
            stopColor={change >= 0 ? '#00f5a0' : '#ff4d6d'}
            stopOpacity="0"
          />
        </linearGradient>
      </defs>

      <polygon
        points={areaCoords}
        fill={`url(#sg${change > 0 ? 'g' : 'r'})`}
      />

      <polyline
        points={coords}
        fill="none"
        stroke={change >= 0 ? '#00f5a0' : '#ff4d6d'}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}

const NewsContainer = ({ news }) => {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        borderRadius: 12,
        padding: 20,
        border: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      <h3
        style={{
          color: '#00f5a0',
          fontSize: 13,
          marginBottom: 20,
          letterSpacing: '1px',
        }}
      >
        ⚡ LATEST NEWS
      </h3>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        {news.length > 0 ? (
          news.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noreferrer"
              style={{
                textDecoration: 'none',
                color: '#cbd5e1',
                fontSize: 14,
                lineHeight: 1.5,
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                paddingBottom: 10,
              }}
            >
              {item.title}
            </a>
          ))
        ) : (
          <p style={{ color: '#64748b' }}>
            Loading news...
          </p>
        )}
      </div>
    </div>
  )
}

const SkeletonRow = () => (
  <tr>
    <td>
      <div style={{ ...sk.cell, width: 16 }} />
    </td>

    <td>
      <div style={{ ...sk.cell, width: 28 }} />
    </td>

    <td>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div
          style={{
            ...sk.cell,
            width: 32,
            height: 32,
            borderRadius: '50%',
          }}
        />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 5,
          }}
        >
          <div style={{ ...sk.cell, width: 70 }} />

          <div
            style={{
              ...sk.cell,
              width: 40,
              height: 10,
            }}
          />
        </div>
      </div>
    </td>

    {[90, 64, 90, 90, 110].map((w, j) => (
      <td key={j}>
        <div style={{ ...sk.cell, width: w }} />
      </td>
    ))}

    <td>
      <div
        style={{
          ...sk.cell,
          width: 80,
          height: 24,
        }}
      />
    </td>
  </tr>
)

const sk = {
  cell: {
    height: 14,
    borderRadius: 4,
    background: 'var(--skeleton, #0f1e35)',
    animation: 'shimmer 1.4s infinite',
    display: 'inline-block',
  },
}

const fmtPrice = (n, cur = 'USD', rate = 1) => {
  const v = parseFloat(n) * rate
  const symbol = SYMBOL_MAP[cur] || cur

  if (!v) return `${symbol} 0.00`

  if (v >= 1000) {
    return `${symbol} ${v.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  if (v >= 1) return `${symbol} ${v.toFixed(2)}`
  if (v >= 0.01) return `${symbol} ${v.toFixed(4)}`

  return `${symbol} ${v.toFixed(6)}`
}

const fmtLarge = (n, cur = 'USD', rate = 1) => {
  const v = parseFloat(n) * rate
  const symbol = SYMBOL_MAP[cur] || cur

  if (!v) return '—'

  if (v >= 1e9) return `${symbol} ${(v / 1e9).toFixed(2)}B`
  if (v >= 1e6) return `${symbol} ${(v / 1e6).toFixed(2)}M`

  return `${symbol} ${v.toFixed(2)}`
}

export default function Markets() {
  const [coins, setCoins] = useState([])
  const [watchlist, setWatchlist] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] =
    useState('')
  const [category, setCategory] = useState('all')
  const [page, setPage] = useState(1)

  const [selectedSym, setSelectedSym] =
    useState('BTC')

  const [selectedLabel, setSelectedLabel] =
    useState('BTC')

  const [selectedCoin, setSelectedCoin] =
    useState(null)

  const [news, setNews] = useState([])

  const [currency, setCurrency] = useState('USD')

  const [fxRates, setFxRates] = useState({
    USD: 1,
  })

  const abortRef = useRef(null)

  const token = localStorage.getItem('token')

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 250)

    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    fetch('https://open.er-api.com/v6/latest/USD')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.rates) {
          setFxRates(data.rates)
        }
      })
  }, [])

  const loadNews = useCallback(async () => {
    try {
      const res = await fetch(
        `https://min-api.cryptocompare.com/data/v2/news/?lang=EN&api_key=${CRYPTOCOMPARE_API_KEY}`
      )

      const json = await res.json()

      if (json.Data) {
        setNews(json.Data.slice(0, 6))
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  useEffect(() => {
    loadNews()

    const interval = setInterval(loadNews, 60000)

    return () => clearInterval(interval)
  }, [loadNews])

  const loadWatchlist = useCallback(async () => {
    if (!token) return

    try {
      const res = await fetch(`${API_BASE}/watchlist`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const json = await res.json()

      if (json.success) {
        setWatchlist(json.watchlist)
      }
    } catch (err) {
      console.error(err)
    }
  }, [token])

  const loadMarketFeed = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort()

    abortRef.current = new AbortController()

    try {
      const res = await fetch(`${API_BASE}/markets`, {
        signal: abortRef.current.signal,
      })

      if (!res.ok) {
        throw new Error('Backend failure.')
      }

      const rawData = await res.json()

      const formattedData = rawData.map(
        (item, index) => {
          const sym = (item.symbol || item.s).replace(
            'USDT',
            ''
          )

          return {
            id: item.symbol || item.s,
            rank: index + 1,
            name: sym,
            symbol: sym,
            priceUsd: parseFloat(
              item.lastPrice || item.c || 0
            ),
            changePercent24Hr: parseFloat(
              item.priceChangePercent || item.P || 0
            ),
            highPrice: parseFloat(
              item.highPrice || item.h || 0
            ),
            lowPrice: parseFloat(
              item.lowPrice || item.l || 0
            ),
            volumeUsd24Hr: parseFloat(
              item.quoteVolume || item.q || 0
            ),
          }
        }
      )

      setCoins(formattedData)

      const priceMap = {}

      formattedData.forEach((c) => {
        priceMap[c.symbol] = {
          price: c.priceUsd,
          change24h: c.changePercent24Hr,
        }
      })

      useCryptoStore.getState().setPrices(priceMap)
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMarketFeed()
    loadWatchlist()

    const thread = setInterval(loadMarketFeed, 5000)

    return () => {
      clearInterval(thread)

      if (abortRef.current) {
        abortRef.current.abort()
      }
    }
  }, [loadMarketFeed, loadWatchlist])

  const toggleWatchlist = async (e, symbol) => {
    e.stopPropagation()

    if (!token) {
      alert('Please login first')
      return
    }

    try {
      const res = await fetch(`${API_BASE}/watchlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          symbol: symbol.toUpperCase(),
        }),
      })

      const json = await res.json()

      if (json.success) {
        setWatchlist(json.watchlist)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const sorted = useMemo(() => {
    let list = [...coins]

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase()

      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.symbol.toLowerCase().includes(q)
      )
    } else if (category === 'all') {
      list = list.filter((c) =>
        MAIN_COINS.includes(c.symbol)
      )
    }

    if (category === 'watchlist') {
      list = list.filter((c) =>
        watchlist.includes(c.symbol.toUpperCase())
      )
    }

    if (category === 'gainers') {
      list = list.filter(
        (c) => parseFloat(c.changePercent24Hr) > 0
      )
    }

    if (category === 'losers') {
      list = list.filter(
        (c) => parseFloat(c.changePercent24Hr) < 0
      )
    }

    return list
  }, [coins, debouncedSearch, category, watchlist])

  const paginatedSorted = useMemo(() => {
    const offset = (page - 1) * PER_PAGE
    return sorted.slice(offset, offset + PER_PAGE)
  }, [sorted, page])

  const rate = fxRates[currency] || 1

  return (
    <>
      <div
        className="page-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <h1>Global Markets</h1>

        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          style={darkSelectStyle}
        >
          {Object.keys(CURRENCY_FULL_NAMES).map(
            (code) => (
              <option key={code} value={code}>
                {CURRENCY_FULL_NAMES[code]}
              </option>
            )
          )}
        </select>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
          marginBottom: 16,
        }}
      >
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              setCategory(cat.id)
              setPage(1)
            }}
            style={{
              padding: '7px 16px',
              borderRadius: 20,
              border: '1px solid rgba(255,255,255,.08)',
              background:
                category === cat.id
                  ? 'rgba(0,245,160,.15)'
                  : 'rgba(255,255,255,.03)',
              color:
                category === cat.id
                  ? '#00f5a0'
                  : '#94a3b8',
              cursor: 'pointer',
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div
        className="markets-controls"
        style={{ marginBottom: 16 }}
      >
        <input
          className="search-input"
          placeholder="🔍 Search assets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: 8,
            background: '#0f172a',
            border: '1px solid #334155',
            color: '#fff',
          }}
        />
      </div>

      {error && (
        <div
          style={{
            color: '#ff4d6d',
            marginBottom: 10,
          }}
        >
          {error}
        </div>
      )}

      <div className="markets-table-wrap">
        <table className="markets-table">
          <thead>
            <tr>
              <th></th>
              <th>#</th>
              <th>Coin</th>
              <th>Price</th>
              <th>24h %</th>
              <th>24h High</th>
              <th>24h Low</th>
              <th>Volume</th>
              <th>Trend</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <SkeletonRow key={i} />
              ))
            ) : (
              paginatedSorted.map((coin, index) => {
                const chg =
                  parseFloat(
                    coin.changePercent24Hr
                  ) || 0

                const isStarred =
                  watchlist.includes(
                    coin.symbol.toUpperCase()
                  )

                return (
                  <tr
                    key={coin.id}
                    className="market-row"
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      setSelectedSym(coin.id)
                      setSelectedLabel(coin.symbol)
                      setSelectedCoin(coin)
                    }}
                  >
                    <td
                      onClick={(e) =>
                        toggleWatchlist(e, coin.symbol)
                      }
                      style={{
                        textAlign: 'center',
                        color: isStarred
                          ? '#ffb300'
                          : '#475569',
                      }}
                    >
                      {isStarred ? '★' : '☆'}
                    </td>

                    <td>
                      {index + 1 + (page - 1) * PER_PAGE}
                    </td>

                    <td>
                      {coin.name} ({coin.symbol})
                    </td>

                    <td>
                      {fmtPrice(
                        coin.priceUsd,
                        currency,
                        rate
                      )}
                    </td>

                    <td
                      style={{
                        color:
                          chg >= 0
                            ? '#00f5a0'
                            : '#ff4d6d',
                      }}
                    >
                      {chg.toFixed(2)}%
                    </td>

                    <td>
                      {fmtPrice(
                        coin.highPrice,
                        currency,
                        rate
                      )}
                    </td>

                    <td>
                      {fmtPrice(
                        coin.lowPrice,
                        currency,
                        rate
                      )}
                    </td>

                    <td>
                      {fmtLarge(
                        coin.volumeUsd24Hr,
                        currency,
                        rate
                      )}
                    </td>

                    <td>
                      <Sparkline change={chg} />
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <div
        style={{
          marginTop: 32,
          display: 'grid',
          gridTemplateColumns: '1fr 300px',
          gap: 20,
        }}
      >
        <div>
          <h3>
            Order Book & Trades: {selectedLabel}
          </h3>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 16,
            }}
          >
            <OrderBook sym={selectedLabel} />
            <RecentTrades sym={selectedLabel} />
          </div>
        </div>

        <NewsContainer news={news} />
      </div>

      {selectedCoin && (
        <CoinDetailPanel
          coin={selectedCoin}
          onClose={() => setSelectedCoin(null)}
        />
      )}

      <style>{`
        @keyframes shimmer {
          0% { opacity: .35 }
          50% { opacity: .9 }
          100% { opacity: .35 }
        }
      `}</style>
    </>
  )
}

const refreshBtnStyle = {
  padding: '8px 16px',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 700,
  border: '1px solid rgba(0,245,160,.3)',
  background: 'rgba(0,245,160,.08)',
  color: '#00f5a0',
  cursor: 'pointer',
}

const logoutBtnStyle = {
  padding: '8px 16px',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 700,
  border: '1px solid rgba(255,77,109,.3)',
  background: 'rgba(255,77,109,.08)',
  color: '#ff4d6d',
  cursor: 'pointer',
}

const darkSelectStyle = {
  padding: '8px 12px',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 700,
  border: '1px solid #334155',
  background: '#0f172a',
  color: '#93c5fd',
  cursor: 'pointer',
  outline: 'none',
  minWidth: '220px',
}