import useCryptoStore from '../store/useCryptoStore'

const coinMap = {
  BTC:  { name: 'Bitcoin',  color: '#F7931A' },
  ETH:  { name: 'Ethereum', color: '#627EEA' },
  SOL:  { name: 'Solana',   color: '#9945FF' },
  XRP:  { name: 'XRP',      color: '#00AAE4' },
  BNB:  { name: 'BNB',      color: '#F3BA2F' },
  AVAX: { name: 'Avalanche',color: '#E84142' },
}

const fmt = (n, dec = 2) =>
  parseFloat(n || 0).toLocaleString('en-US', {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  })

export default function PriceCard({ symbol }) {
  const prices     = useCryptoStore((s) => s.prices)
  const flashState = useCryptoStore((s) => s.flashState)

  const data  = prices?.[symbol]
  const flash = flashState?.[symbol]
  const meta  = coinMap[symbol]

  // Loading state
  if (!data) return (
    <div className="price-card loading">
      <div className="skeleton" style={{ height: 100 }} />
    </div>
  )

  const change = parseFloat(data.change24h) || 0
  const isUp   = change >= 0

  return (
    <div className={`price-card ${flash ? `flash-${flash}` : ''}`}>
      <div className="card-top">
        <div className="coin-dot" style={{ background: meta?.color }} />
        <span className="coin-name">{meta?.name || symbol}</span>
        <span className="coin-sym">{symbol}</span>
      </div>

      <div className="card-price">${fmt(data.price)}</div>

      <div className={`card-change ${isUp ? 'up' : 'down'}`}>
        {isUp ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
      </div>

      <div className="card-meta">
        <span>H: ${fmt(data.high)}</span>
        <span>L: ${fmt(data.low)}</span>
      </div>
    </div>
  )
}