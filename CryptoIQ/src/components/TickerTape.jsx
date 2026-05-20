import useCryptoStore from '../store/useCryptoStore'

const SYMBOLS = ['BTC', 'ETH', 'SOL', 'XRP', 'BNB']

export default function TickerTape() {

  // SAFE ACCESS
  const prices = useCryptoStore((state) => state.prices || {})

  const items = SYMBOLS.map((sym) => {

    const d = prices?.[sym]

    // wait until data arrives
    if (!d) {
      return (
        <span key={sym} className="ticker-item">
          <span className="ticker-sym">{sym}</span>
          <span className="ticker-price">Loading...</span>
        </span>
      )
    }

    const up = Number(d.change24h) >= 0

    return (
      <span key={sym} className="ticker-item">

        <span className="ticker-sym">
          {sym}
        </span>

        <span className="ticker-price">
          ${Number(d.price).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}
        </span>

        <span className={up ? 'up' : 'down'}>
          {up ? '▲' : '▼'} {Math.abs(Number(d.change24h)).toFixed(2)}%
        </span>

      </span>
    )
  })

  return (
    <div className="ticker-wrap">
      <div className="ticker-track">
        {items}
        {items}
        {items}
      </div>
    </div>
  )
}