import { useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import useCryptoStore from '../store/useCryptoStore'

// Define your alert thresholds here
const ALERTS = [
  { symbol: 'BTC', above: 70000, msg: '🚀 BTC broke $70,000!' },
  { symbol: 'BTC', below: 60000, msg: '⚠️ BTC dropped below $60,000' },
  { symbol: 'ETH', above: 4000,  msg: '🚀 ETH broke $4,000!' },
  { symbol: 'SOL', above: 200,   msg: '🚀 SOL broke $200!' },
]

export const usePriceAlerts = () => {
  const { prices } = useCryptoStore()
  const fired = useRef(new Set()) // prevent duplicate alerts

  useEffect(() => {
    ALERTS.forEach(alert => {
      const data = prices[alert.symbol]
      if (!data) return
      const price = data.price
      const key = `${alert.symbol}-${alert.above || alert.below}`

      if (alert.above && price > alert.above && !fired.current.has(key)) {
        fired.current.add(key)
        toast.success(alert.msg, { duration: 5000 })
      }
      if (alert.below && price < alert.below && !fired.current.has(key)) {
        fired.current.add(key)
        toast.error(alert.msg, { duration: 5000 })
      }
    })
  }, [prices])
}