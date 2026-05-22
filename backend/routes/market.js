const router = require('express').Router()
const axios = require('axios') // Swapped to stable axios
const { optionalAuth } = require('../middleware/auth')

const BINANCE = 'https://api.binance.com/api/v3'

// Standard headers to prevent Binance from blocking your local IP address
// Standard headers to prevent Binance from blocking your local IP address
const axiosConfig = {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json',
    'Connection': 'keep-alive',
    'Accept-Encoding': 'gzip, deflate, br'
  },
  timeout: 10000 // Bumped to 10 seconds to stop ECONNRESET drops
}

// Simple in-memory cache to avoid hammering Binance
const cache = new Map()
const CACHE_TTL = 10 * 1000 // 10 seconds

const cached = async (key, fetcher) => {
  const hit = cache.get(key)
  if (hit && Date.now() - hit.ts < CACHE_TTL) return hit.data
  const data = await fetcher()
  cache.set(key, { data, ts: Date.now() })
  return data
}

// ─── ADDED: GET / (Root Route Fallback) ───────────────────────────────────────
// This answers the exact frontend request to /api/markets and fixes the 404!
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const data = await cached('ticker_all', async () => {
      const response = await axios.get(`${BINANCE}/ticker/24hr`, axiosConfig)
      const all = response.data
      return all.filter(t => t.symbol.endsWith('USDT'))
    })
    res.json(data)
  } catch (err) { 
    console.error("❌ Binance Root Market Route Error:", err.message)
    next(err) 
  }
})

// ─── GET /api/markets/ticker ───────────────────────────────────────────────────
// All 24hr tickers (USDT pairs)
router.get('/ticker', optionalAuth, async (req, res, next) => {
  try {
    const data = await cached('ticker_all', async () => {
      const response = await axios.get(`${BINANCE}/ticker/24hr`, axiosConfig)
      const all = response.data
      return all.filter(t => t.symbol.endsWith('USDT'))
    })
    res.json(data)
  } catch (err) { 
    console.error("❌ Binance Ticker Route Error:", err.message)
    next(err) 
  }
})

// ─── GET /api/markets/ticker/:symbol ──────────────────────────────────────────
router.get('/ticker/:symbol', optionalAuth, async (req, res, next) => {
  try {
    const sym  = req.params.symbol.toUpperCase()
    const pair = sym.endsWith('USDT') ? sym : `${sym}USDT`
    const data = await cached(`ticker_${pair}`, async () => {
      const response = await axios.get(`${BINANCE}/ticker/24hr?symbol=${pair}`, axiosConfig)
      return response.data
    })
    res.json(data)
  } catch (err) { next(err) }
})

// ─── GET /api/markets/price/:symbol ───────────────────────────────────────────
router.get('/price/:symbol', optionalAuth, async (req, res, next) => {
  try {
    const sym  = req.params.symbol.toUpperCase()
    const pair = sym.endsWith('USDT') ? sym : `${sym}USDT`
    const data = await cached(`price_${pair}`, async () => {
      const response = await axios.get(`${BINANCE}/ticker/price?symbol=${pair}`, axiosConfig)
      return response.data
    })
    res.json(data)
  } catch (err) { next(err) }
})

// ─── GET /api/markets/klines/:symbol ──────────────────────────────────────────
// Candlestick / OHLCV data
router.get('/klines/:symbol', optionalAuth, async (req, res, next) => {
  try {
    const sym      = req.params.symbol.toUpperCase()
    const pair     = sym.endsWith('USDT') ? sym : `${sym}USDT`
    const interval = req.query.interval || '1h'
    const limit    = Math.min(parseInt(req.query.limit) || 100, 1000)
    const key      = `klines_${pair}_${interval}_${limit}`

    const data = await cached(key, async () => {
      const response = await axios.get(`${BINANCE}/klines?symbol=${pair}&interval=${interval}&limit=${limit}`, axiosConfig)
      const raw = response.data
      return raw.map(k => ({
        time:   k[0],
        open:   parseFloat(k[1]),
        high:   parseFloat(k[2]),
        low:    parseFloat(k[3]),
        close:  parseFloat(k[4]),
        volume: parseFloat(k[5]),
      }))
    })
    res.json(data)
  } catch (err) { next(err) }
})

// ─── GET /api/markets/orderbook/:symbol ───────────────────────────────────────
router.get('/orderbook/:symbol', optionalAuth, async (req, res, next) => {
  try {
    const sym   = req.params.symbol.toUpperCase()
    const pair  = sym.endsWith('USDT') ? sym : `${sym}USDT`
    const limit = Math.min(parseInt(req.query.limit) || 20, 100)

    const data = await cached(`orderbook_${pair}`, async () => {
      const response = await axios.get(`${BINANCE}/depth?symbol=${pair}&limit=${limit}`, axiosConfig)
      return response.data
    })
    res.json(data)
  } catch (err) { next(err) }
})

// ─── GET /api/markets/trades/:symbol ──────────────────────────────────────────
router.get('/trades/:symbol', optionalAuth, async (req, res, next) => {
  try {
    const sym   = req.params.symbol.toUpperCase()
    const pair  = sym.endsWith('USDT') ? sym : `${sym}USDT`
    const limit = Math.min(parseInt(req.query.limit) || 20, 100)

    const data = await cached(`trades_${pair}`, async () => {
      const response = await axios.get(`${BINANCE}/trades?symbol=${pair}&limit=${limit}`, axiosConfig)
      return response.data
    })
    res.json(data)
  } catch (err) { next(err) }
})

module.exports = router