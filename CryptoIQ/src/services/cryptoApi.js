// ─────────────────────────────────────────────────────
// DUAL SOURCE: Binance (prices/charts) + CoinGecko (metadata)
// ─────────────────────────────────────────────────────

const BINANCE    = 'https://api.binance.com/api/v3'
const COINGECKO  = 'https://api.coingecko.com/api/v3'
const FEAR_GREED = 'https://api.alternative.me/fng/?limit=1'

// ── Master coin config — used everywhere in the app ──
export const SYMBOL_META = {
  BTC:  {
    sym: 'BTC', name: 'Bitcoin',    color: '#F7931A',
    binancePair: 'BTCUSDT', geckoId: 'bitcoin',
  },
  ETH:  {
    sym: 'ETH', name: 'Ethereum',   color: '#627EEA',
    binancePair: 'ETHUSDT', geckoId: 'ethereum',
  },
  SOL:  {
    sym: 'SOL', name: 'Solana',     color: '#9945FF',
    binancePair: 'SOLUSDT', geckoId: 'solana',
  },
  XRP:  {
    sym: 'XRP', name: 'XRP',        color: '#00AAE4',
    binancePair: 'XRPUSDT', geckoId: 'ripple',
  },
  BNB:  {
    sym: 'BNB', name: 'BNB',        color: '#F3BA2F',
    binancePair: 'BNBUSDT', geckoId: 'binancecoin',
  },
  AVAX: {
    sym: 'AVAX', name: 'Avalanche', color: '#E84142',
    binancePair: 'AVAXUSDT', geckoId: 'avalanche-2',
  },
}

// Helper — find meta by geckoId
export const getMetaByGeckoId = (geckoId) =>
  Object.values(SYMBOL_META).find(m => m.geckoId === geckoId)

// ─────────────────────────────────────────────────────
// ✅ BINANCE — prices, charts, order book, trades
// ─────────────────────────────────────────────────────

/**
 * Binance 24hr ticker
 * Returns { BTC: { price, change24h, high, low, volume }, ... }
 */
export const fetchBinanceTickers = async () => {
  const pairs = Object.values(SYMBOL_META).map(m => m.binancePair)
  const res = await fetch(
    `${BINANCE}/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(pairs))}`
  )
  if (!res.ok) throw new Error(`Binance ticker failed: ${res.status}`)

  const data = await res.json()
  const result = {}

  data.forEach(ticker => {
    const meta = Object.values(SYMBOL_META)
      .find(m => m.binancePair === ticker.symbol)
    if (!meta) return

    result[meta.sym] = {
      price:     parseFloat(ticker.lastPrice),
      change24h: parseFloat(ticker.priceChangePercent),
      high:      parseFloat(ticker.highPrice),
      low:       parseFloat(ticker.lowPrice),
      volume:    parseFloat(ticker.quoteVolume), // USD volume
      source:    'binance',
    }
  })

  return result
}

/**
 * Binance Klines (candlestick data for charts)
 * interval: 1m 5m 15m 1h 4h 1d
 */
export const fetchBinanceKlines = async (
  pair     = 'BTCUSDT',
  interval = '1h',
  limit    = 168
) => {
  const res = await fetch(
    `${BINANCE}/klines?symbol=${pair}&interval=${interval}&limit=${limit}`
  )
  if (!res.ok) throw new Error(`Binance klines failed: ${res.status}`)

  const data = await res.json()
  // [openTime, open, high, low, close, volume, ...]
  return data.map(k => ({
    time:   k[0],
    open:   parseFloat(k[1]),
    high:   parseFloat(k[2]),
    low:    parseFloat(k[3]),
    price:  parseFloat(k[4]),  // close price
    volume: parseFloat(k[5]),
  }))
}

/**
 * Binance Order Book — top bids/asks
 */
export const fetchBinanceOrderBook = async (pair = 'BTCUSDT', limit = 10) => {
  const res = await fetch(`${BINANCE}/depth?symbol=${pair}&limit=${limit}`)
  if (!res.ok) throw new Error(`Order book failed: ${res.status}`)

  const data = await res.json()
  return {
    bids: data.bids.map(([price, qty]) => ({
      price: parseFloat(price), qty: parseFloat(qty),
    })),
    asks: data.asks.map(([price, qty]) => ({
      price: parseFloat(price), qty: parseFloat(qty),
    })),
  }
}

/**
 * Binance Recent Trades
 */
export const fetchBinanceTrades = async (pair = 'BTCUSDT', limit = 20) => {
  const res = await fetch(`${BINANCE}/trades?symbol=${pair}&limit=${limit}`)
  if (!res.ok) throw new Error(`Trades failed: ${res.status}`)

  const data = await res.json()
  return data.map(t => ({
    price:   parseFloat(t.price),
    qty:     parseFloat(t.qty),
    time:    t.time,
    isBuyer: t.isBuyerMaker,
  }))
}

// ─────────────────────────────────────────────────────
// ✅ COINGECKO — market cap, rank, supply (Binance lacks these)
// ─────────────────────────────────────────────────────

/**
 * CoinGecko live prices (fallback if Binance fails)
 */
export const fetchLivePrices = async () => {
  const res = await fetch(
    `${COINGECKO}/simple/price?ids=bitcoin,ethereum,solana,ripple,binancecoin,avalanche-2` +
    `&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`
  )
  if (!res.ok) throw new Error('CoinGecko price fetch failed')
  return res.json()
}

/**
 * CoinGecko price history (fallback for charts)
 */
export const fetchPriceHistory = async (coinId = 'bitcoin', days = 7) => {
  const res = await fetch(
    `${COINGECKO}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`
  )
  if (!res.ok) throw new Error('CoinGecko history failed')
  const data = await res.json()
  return data.prices // [[timestamp, price], ...]
}

/**
 * CoinGecko markets — market cap, rank, supply
 */
export const fetchCoinGeckoMarkets = async () => {
  const ids = Object.values(SYMBOL_META).map(m => m.geckoId).join(',')
  const res = await fetch(
    `${COINGECKO}/coins/markets?vs_currency=usd&ids=${ids}` +
    `&order=market_cap_desc&per_page=10&page=1`
  )
  if (!res.ok) throw new Error('CoinGecko markets failed')

  const data = await res.json()
  const result = {}

  data.forEach(coin => {
    const meta = getMetaByGeckoId(coin.id)
    if (!meta) return
    result[meta.sym] = {
      marketCap:         coin.market_cap,
      rank:              coin.market_cap_rank,
      circulatingSupply: coin.circulating_supply,
      totalSupply:       coin.total_supply,
      ath:               coin.ath,
      athDate:           coin.ath_date,
      image:             coin.image,
    }
  })

  return result
}

// ─────────────────────────────────────────────────────
// ✅ FEAR & GREED (unchanged)
// ─────────────────────────────────────────────────────

export const fetchFearGreed = async () => {
  const res = await fetch(FEAR_GREED)
  if (!res.ok) throw new Error('Fear greed failed')
  const data = await res.json()
  return data.data[0]
}