// Renamed but keeping same export name so App.jsx doesn't break
import { useEffect, useRef } from 'react'
import useCryptoStore from '../store/useCryptoStore'

const SYMBOLS = ['BTC', 'ETH', 'SOL', 'XRP', 'BNB']

export const useBinanceSocket = () => {
  const { prices, setPrices, setFlash, clearFlash } = useCryptoStore()
  const prevRef = useRef({})

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,ripple,binancecoin&vs_currencies=usd&include_24hr_change=true'
        )
        const raw = await res.json()

        const idToSym = {
          bitcoin: 'BTC', ethereum: 'ETH', solana: 'SOL',
          ripple: 'XRP', binancecoin: 'BNB',
        }

        setPrices((prev) => {
          const updated = { ...prev }
          Object.entries(raw).forEach(([id, data]) => {
            const sym = idToSym[id]
            if (!sym) return
            const newPrice = data.usd
            const prevPrice = prevRef.current[sym]

            if (prevPrice && newPrice !== prevPrice) {
              const dir = newPrice > prevPrice ? 'up' : 'down'
              setFlash(sym, dir)
              setTimeout(() => clearFlash(sym), 600)
            }
            prevRef.current[sym] = newPrice

            updated[sym] = {
              ...prev[sym],
              price: newPrice,
              change24h: parseFloat((data.usd_24h_change ?? 0).toFixed(2)),
            }
          })
          return updated
        })
      } catch (e) {
        // silent fail — useCryptoData will still have data
      }
    }

    poll()
    const t = setInterval(poll, 15000) // every 15 seconds
    return () => clearInterval(t)
  }, [])
}