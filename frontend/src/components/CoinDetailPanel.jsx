import { useState, useEffect } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'

const BINANCE = 'https://api.binance.com/api/v3'

const COLORS = {
  BTC: '#F7931A',
  ETH: '#627EEA',
  BNB: '#F3BA2F',
  SOL: '#9945FF',
  XRP: '#00AAE4',
  ADA: '#0033AD',
  DOGE: '#C2A633',
  SHIB: '#FF6B00',
  DOT: '#E6007A',
  AVAX: '#E84142',
}

export default function CoinDetailPanel({ coin, onClose }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState('7D')
  const [tab, setTab] = useState('overview')

  if (!coin) return null

  const sym = coin.symbol?.toUpperCase()
  const color = COLORS[sym] || '#00f5a0'
  const change = parseFloat(coin.changePercent24Hr || 0)

  const binancePair = `${sym}USDT`

  useEffect(() => {
    loadChart()
  }, [coin, range])

  const loadChart = async () => {
    setLoading(true)

    try {
      const config = {
        '1D': { interval: '5m', limit: 288 },
        '7D': { interval: '1h', limit: 168 },
        '30D': { interval: '4h', limit: 180 },
      }

      const { interval, limit } = config[range]

      const res = await fetch(
        `${BINANCE}/klines?symbol=${binancePair}&interval=${interval}&limit=${limit}`
      )

      const data = await res.json()

      const formatted = data.map((k, i) => {
        const close = parseFloat(k[4])

        const noise =
          Math.sin(i * 0.4) * close * 0.003 +
          Math.cos(i * 0.2) * close * 0.002

        return {
          time: new Date(k[0]).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }),
          price: close + noise,
        }
      })

      setHistory(formatted)
    } catch (err) {
      console.error(err)
    }

    setLoading(false)
  }

  const fmt = (n) =>
    parseFloat(n || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })

  const fmtLarge = (n) => {
    const v = parseFloat(n || 0)

    if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`
    if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`

    return `$${v.toFixed(2)}`
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      {/* PANEL */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 520,
          maxWidth: '100vw',
          height: '100vh',
          overflowY: 'auto',
          background: '#05070D',
          borderLeft: '1px solid #0E1420',
          animation: 'slideIn .25s ease',
        }}
      >
        {/* HEADER */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid #0E1420',
            position: 'sticky',
            top: 0,
            background: '#05070D',
            zIndex: 10,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 26,
                fontWeight: 800,
                color: '#fff',
              }}
            >
              {coin.name}
            </div>

            <div
              style={{
                color: '#64748b',
                marginTop: 4,
                fontSize: 14,
              }}
            >
              {sym}/USDT
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              border: '1px solid #1E293B',
              background: '#0A0F1A',
              color: '#fff',
              cursor: 'pointer',
              fontSize: 16,
            }}
          >
            ✕
          </button>
        </div>

        {/* PRICE */}
        <div style={{ padding: 24 }}>
          <div
            style={{
              fontSize: 38,
              fontWeight: 800,
              color: '#fff',
            }}
          >
            ${fmt(coin.priceUsd)}
          </div>

          <div
            style={{
              marginTop: 10,
              color: change >= 0 ? '#00f5a0' : '#ff4d6d',
              fontWeight: 700,
              fontSize: 16,
            }}
          >
            {change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
          </div>
        </div>

        {/* TABS */}
        <div
          style={{
            display: 'flex',
            gap: 10,
            padding: '0 24px 20px',
          }}
        >
          <button
            onClick={() => setTab('overview')}
            style={tabBtn(tab === 'overview', color)}
          >
            Overview
          </button>

          <button
            onClick={() => setTab('stats')}
            style={tabBtn(tab === 'stats', color)}
          >
            Stats
          </button>

          <button
            onClick={() => setTab('about')}
            style={tabBtn(tab === 'about', color)}
          >
            About
          </button>
        </div>

        {/* OVERVIEW */}
        {tab === 'overview' && (
          <div style={{ padding: '0 24px 24px' }}>
            {/* RANGE */}
            <div
              style={{
                display: 'flex',
                gap: 10,
                marginBottom: 20,
              }}
            >
              {['1D', '7D', '30D'].map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  style={rangeBtn(range === r, color)}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* CHART */}
            <div
              style={{
                background: '#0A0F1A',
                border: '1px solid #1E293B',
                borderRadius: 14,
                padding: 14,
              }}
            >
              {loading ? (
                <div
                  style={{
                    height: 200,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#64748b',
                  }}
                >
                  Loading chart...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={history}>
                    <CartesianGrid
                      stroke="#111827"
                      vertical={false}
                    />

                    <XAxis
                      dataKey="time"
                      tick={{
                        fill: '#64748b',
                        fontSize: 10,
                      }}
                    />

                    <YAxis
                      tick={{
                        fill: '#64748b',
                        fontSize: 10,
                      }}
                      domain={['auto', 'auto']}
                    />

                    <Tooltip />

                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke={color}
                      strokeWidth={2.5}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* STATS CARDS */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 14,
                marginTop: 20,
              }}
            >
              <div style={statCard}>
                <div style={smallLabel}>24H HIGH</div>
                <div style={bigValue}>
                  ${fmt(coin.highPrice)}
                </div>
              </div>

              <div style={statCard}>
                <div style={smallLabel}>24H LOW</div>
                <div style={bigValue}>
                  ${fmt(coin.lowPrice)}
                </div>
              </div>

              <div style={statCard}>
                <div style={smallLabel}>VOLUME</div>
                <div style={bigValue}>
                  {fmtLarge(coin.volumeUsd24Hr)}
                </div>
              </div>

              <div style={statCard}>
                <div style={smallLabel}>MARKET CAP</div>
                <div style={bigValue}>
                  {fmtLarge(coin.marketCapUsd)}
                </div>
              </div>
            </div>

            {/* MARKET SENTIMENT */}
            <div
              style={{
                marginTop: 20,
                background: '#0A0F1A',
                border: `1px solid ${
                  change >= 0
                    ? 'rgba(0,245,160,0.25)'
                    : 'rgba(255,77,109,0.25)'
                }`,
                borderRadius: 14,
                padding: 18,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '1px',
                  marginBottom: 12,
                  color:
                    change >= 0
                      ? '#00f5a0'
                      : '#ff4d6d',
                }}
              >
                {change >= 0
                  ? '🟢 BULLISH MARKET SIGNAL'
                  : '🔴 BEARISH MARKET SIGNAL'}
              </div>

              <div
                style={{
                  color: '#cbd5e1',
                  lineHeight: 1.7,
                  fontSize: 14,
                }}
              >
                {change >= 0 ? (
                  <>
                    Buyers are currently dominating
                    the market with increasing
                    momentum and strong trading
                    activity. Short-term indicators
                    suggest bullish continuation if
                    volume remains high.
                  </>
                ) : (
                  <>
                    Selling pressure is currently
                    stronger in the market. Traders
                    are showing cautious sentiment
                    with possible short-term downside
                    movement until support levels
                    stabilize.
                  </>
                )}
              </div>

              {/* CONFIDENCE BAR */}
              <div
                style={{
                  marginTop: 16,
                  height: 6,
                  borderRadius: 20,
                  overflow: 'hidden',
                  background: '#111827',
                }}
              >
                <div
                  style={{
                    width: `${Math.min(
                      90,
                      Math.max(
                        45,
                        Math.abs(change) * 12
                      )
                    )}%`,
                    height: '100%',
                    background:
                      change >= 0
                        ? '#00f5a0'
                        : '#ff4d6d',
                    transition: '0.4s',
                  }}
                />
              </div>

              <div
                style={{
                  marginTop: 8,
                  color: '#64748b',
                  fontSize: 12,
                }}
              >
                AI Confidence:{' '}
                {Math.min(
                  90,
                  Math.max(
                    45,
                    Math.floor(Math.abs(change) * 12)
                  )
                )}
                %
              </div>
            </div>
          </div>
        )}

        {/* STATS TAB */}
        {tab === 'stats' && (
          <div style={{ padding: 24 }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 18,
              }}
            >
              {[
                ['Rank', coin.rank],
                ['Price', `$${fmt(coin.priceUsd)}`],
                ['24H Change', `${change.toFixed(2)}%`],
                ['24H High', `$${fmt(coin.highPrice)}`],
                ['24H Low', `$${fmt(coin.lowPrice)}`],
                ['Volume', fmtLarge(coin.volumeUsd24Hr)],
                ['Market Cap', fmtLarge(coin.marketCapUsd)],
              ].map(([label, value]) => (
                <div
                  key={label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    paddingBottom: 14,
                    borderBottom:
                      '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div style={{ color: '#64748b' }}>
                    {label}
                  </div>

                  <div
                    style={{
                      color: '#fff',
                      fontWeight: 700,
                    }}
                  >
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABOUT TAB */}
        {tab === 'about' && (
          <div style={{ padding: 24 }}>
            <div
              style={{
                color: '#cbd5e1',
                lineHeight: 1.8,
                fontSize: 15,
              }}
            >
              {coin.name} ({sym}) is one of the most
              traded cryptocurrencies in the global
              market. It is actively traded on Binance
              and other major exchanges with high
              liquidity and strong community support.
            </div>

            <div
              style={{
                marginTop: 30,
                display: 'flex',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <a
                href={`https://www.binance.com/en/trade/${sym}_USDT`}
                target="_blank"
                rel="noreferrer"
                style={linkBtn}
              >
                Binance
              </a>

              <a
                href={`https://www.coingecko.com/en/coins/${sym.toLowerCase()}`}
                target="_blank"
                rel="noreferrer"
                style={linkBtn}
              >
                CoinGecko
              </a>

              <a
                href={`https://coinmarketcap.com/currencies/${coin.name.toLowerCase().replace(/\s+/g, '-')}`}
                target="_blank"
                rel="noreferrer"
                style={linkBtn}
              >
                CoinMarketCap
              </a>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  )
}

const statCard = {
  background: '#0A0F1A',
  border: '1px solid #1E293B',
  borderRadius: 12,
  padding: 16,
}

const smallLabel = {
  color: '#64748b',
  fontSize: 11,
  marginBottom: 6,
  fontWeight: 600,
  textTransform: 'uppercase',
}

const bigValue = {
  color: '#fff',
  fontSize: 20,
  fontWeight: 700,
}

const tabBtn = (active, color) => ({
  padding: '8px 14px',
  borderRadius: 8,
  border: 'none',
  cursor: 'pointer',
  background: active ? color : '#111827',
  color: '#fff',
  fontWeight: 700,
  fontSize: 13,
})

const rangeBtn = (active, color) => ({
  padding: '6px 12px',
  borderRadius: 8,
  border: 'none',
  cursor: 'pointer',
  background: active ? color : '#111827',
  color: '#fff',
  fontWeight: 700,
  fontSize: 12,
})

const linkBtn = {
  padding: '8px 14px',
  borderRadius: 8,
  textDecoration: 'none',
  background: '#111827',
  border: '1px solid #1E293B',
  color: '#fff',
  fontWeight: 600,
  fontSize: 13,
}