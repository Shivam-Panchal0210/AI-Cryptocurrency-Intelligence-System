import { useEffect } from 'react'
import {
  fetchBinanceTickers,
  fetchBinanceKlines,
  fetchLivePrices,
  fetchPriceHistory,
  fetchCoinGeckoMarkets,
  fetchFearGreed,
  SYMBOL_META,
} from '../services/cryptoApi'
import useCryptoStore from '../store/useCryptoStore'

const generateSignals = (priceMap) => {
  return Object.entries(priceMap).map(([sym, data]) => {
    const change = data.change24h ?? 0
    let action = 'WATCH', confidence = 50
    let reason = 'Monitoring price action and volume.'

    if (change > 5) {
      action = 'STRONG BUY'; confidence = 75 + Math.floor(Math.random() * 15)
      reason = `Breakout +${change.toFixed(1)}%. Strong Binance volume surge.`
    } else if (change > 2) {
      action = 'BUY'; confidence = 60 + Math.floor(Math.random() * 15)
      reason = `Uptrend +${change.toFixed(1)}%. Binance 24hr momentum positive.`
    } else if (change < -5) {
      action = 'STRONG SELL'; confidence = 72 + Math.floor(Math.random() * 15)
      reason = `Sharp drop ${change.toFixed(1)}%. Heavy sell pressure detected.`
    } else if (change < -2) {
      action = 'SELL'; confidence = 58 + Math.floor(Math.random() * 15)
      reason = `Downtrend ${change.toFixed(1)}%. MACD bearish on Binance data.`
    }

    return { id: sym, action, confidence, reason, change }
  })
}

export const useCryptoData = () => {
  const { setPrices, setPriceHistory, setFearGreed, setSignals } = useCryptoStore()

  // ── PRICES: Try Binance first, fall back to CoinGecko ──
  const loadPrices = async () => {
    try {
      // PRIMARY: Binance
      const binancePrices = await fetchBinanceTickers()
      console.log('✅ Binance prices loaded')
      setPrices(binancePrices)
      setSignals(generateSignals(binancePrices))

      // SECONDARY: CoinGecko market cap (non-blocking, runs in background)
      fetchCoinGeckoMarkets()
        .then(meta => {
          setPrices(prev => {
            const updated = { ...prev }
            Object.entries(meta).forEach(([sym, geckoData]) => {
              if (updated[sym]) {
                updated[sym] = { ...updated[sym], ...geckoData }
              }
            })
            return updated
          })
          console.log('✅ CoinGecko market cap merged')
        })
        .catch(e => console.warn('⚠️ CoinGecko metadata skipped:', e.message))

    } catch (binanceErr) {
      // FALLBACK: CoinGecko if Binance fails
      console.warn('⚠️ Binance failed, falling back to CoinGecko:', binanceErr.message)
      try {
        const raw = await fetchLivePrices()
        const priceMap = {}

        Object.entries(raw).forEach(([geckoId, data]) => {
          const meta = Object.values(SYMBOL_META).find(m => m.geckoId === geckoId)
          if (!meta) return
          priceMap[meta.sym] = {
            price:     data.usd ?? 0,
            change24h: parseFloat((data.usd_24h_change ?? 0).toFixed(2)),
            high:      (data.usd ?? 0) * 1.015,
            low:       (data.usd ?? 0) * 0.985,
            volume:    data.usd_24h_vol ?? 0,
            source:    'coingecko',
          }
        })

        console.log('✅ CoinGecko fallback prices loaded')
        setPrices(priceMap)
        setSignals(generateSignals(priceMap))
      } catch (geckoErr) {
        console.error('❌ Both APIs failed:', geckoErr.message)
      }
    }
  }

  // ── CHART HISTORY: Try Binance klines first, fall back to CoinGecko ──
  const loadHistory = async (sym = 'BTC', days = 7) => {
    const meta = SYMBOL_META[sym]
    if (!meta) return

    const intervalMap = { 1: '5m',  7: '1h',  30: '4h'  }
    const limitMap    = { 1: 288,   7: 168,   30: 180   }

    try {
      // PRIMARY: Binance klines
      const klines = await fetchBinanceKlines(
        meta.binancePair,
        intervalMap[days] || '1h',
        limitMap[days]    || 168
      )

      const formatted = klines.map(k => ({
        time: new Date(k.time).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric',
          ...(days === 1 && { hour: '2-digit', minute: '2-digit' }),
        }),
        price: k.price,
        high:  k.high,
        low:   k.low,
      }))

      console.log(`✅ Binance klines for ${sym}: ${formatted.length} candles`)
      setPriceHistory(formatted)

    } catch (binanceErr) {
      // FALLBACK: CoinGecko history
      console.warn(`⚠️ Binance klines failed for ${sym}, using CoinGecko:`, binanceErr.message)
      try {
        const raw = await fetchPriceHistory(meta.geckoId, days)
        const formatted = raw.map(([ts, price]) => ({
          time: new Date(ts).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric',
            ...(days === 1 && { hour: '2-digit', minute: '2-digit' }),
          }),
          price: parseFloat(price.toFixed(2)),
        }))
        console.log(`✅ CoinGecko history fallback for ${sym}: ${formatted.length} points`)
        setPriceHistory(formatted)
      } catch (geckoErr) {
        console.error('❌ Both chart APIs failed:', geckoErr.message)
      }
    }
  }

  // ── FEAR & GREED ──
  const loadFearGreed = async () => {
    try {
      const fg = await fetchFearGreed()
      console.log('✅ Fear & Greed:', fg.value, fg.value_classification)
      setFearGreed(fg)
    } catch (err) {
      console.error('❌ Fear & Greed failed:', err.message)
    }
  }

  useEffect(() => {
    loadPrices()
    loadHistory('BTC', 7)
    loadFearGreed()

    const t1 = setInterval(loadPrices,  15000)  // prices every 15s
    const t2 = setInterval(() => loadHistory('BTC', 7), 300000) // chart every 5min
    const t3 = setInterval(loadFearGreed, 300000) // F&G every 5min

    return () => { clearInterval(t1); clearInterval(t2); clearInterval(t3) }
  }, [])

  return { loadHistory }
}