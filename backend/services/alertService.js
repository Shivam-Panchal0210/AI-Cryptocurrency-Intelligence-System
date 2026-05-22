const cron      = require('node-cron')
const Alert     = require('../models/Alert')
const User      = require('../models/User')
const { broadcast } = require('./websocketService')
const { sendAlertEmail } = require('./emailService')

// ─── Fetch current prices from Binance ────────────────────────────────────────
async function fetchPrices(symbols) {
  try {
    const pairs = symbols.map(s => `${s}USDT`)
    const url   = `https://api.binance.com/api/v3/ticker/price`
    const res   = await fetch(url)
    const data  = await res.json()
    const map   = {}
    data.forEach(t => {
      const sym = t.symbol.replace('USDT', '')
      if (symbols.includes(sym)) map[sym] = parseFloat(t.price)
    })
    return map
  } catch (err) {
    console.error('❌ Alert cron: failed to fetch prices:', err.message)
    return {}
  }
}

// ─── Check all active alerts ──────────────────────────────────────────────────
async function checkAlerts() {
  try {
    // Get all unique symbols from active, un-triggered alerts
    const activeAlerts = await Alert.find({ active: true, triggered: false })
    if (activeAlerts.length === 0) return

    const symbols    = [...new Set(activeAlerts.map(a => a.symbol))]
    const prices     = await fetchPrices(symbols)

    const toTrigger = activeAlerts.filter(alert => {
      const price = prices[alert.symbol]
      if (!price) return false
      return alert.type === 'above'
        ? price >= alert.targetPrice
        : price <= alert.targetPrice
    })

    if (toTrigger.length === 0) return

    console.log(`🔔 Triggering ${toTrigger.length} alert(s)`)

    for (const alert of toTrigger) {
      const price = prices[alert.symbol]

      // Mark as triggered
      alert.triggered      = true
      alert.triggeredAt    = new Date()
      alert.triggeredPrice = price
      await alert.save()

      // Push notification via WebSocket
      if (alert.notifyPush) {
        broadcast({
          type:    'alert_triggered',
          alertId: alert._id,
          userId:  alert.user.toString(),
          symbol:  alert.symbol,
          type_:   alert.type,
          target:  alert.targetPrice,
          price,
        })
      }

      // Email notification
      if (alert.notifyEmail) {
        try {
          const user = await User.findById(alert.user)
          if (user) {
            await sendAlertEmail(user.email, user.name, alert, price)
          }
        } catch (err) {
          console.error('❌ Failed to send alert email:', err.message)
        }
      }
    }
  } catch (err) {
    console.error('❌ Alert cron error:', err.message)
  }
}

// ─── Start cron — runs every minute ──────────────────────────────────────────
function startAlertCron() {
  cron.schedule('* * * * *', () => {
    checkAlerts()
  })
  console.log('⏱️  Alert cron started (checks every 60s)')
}

module.exports = { startAlertCron, checkAlerts }