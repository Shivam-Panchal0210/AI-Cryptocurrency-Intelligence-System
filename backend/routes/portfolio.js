const router    = require('express').Router()
const { body, param, validationResult } = require('express-validator')
const Portfolio = require('../models/Portfolio')
const { protect } = require('../middleware/auth')

router.use(protect)

// ─── Helper: fetch live prices from Binance ───────────────────────────────────
async function getLivePrices(symbols) {
  try {
    const url  = 'https://api.binance.com/api/v3/ticker/price'
    const res  = await fetch(url)
    const data = await res.json()
    const map  = {}
    data.forEach(t => {
      const sym = t.symbol.replace('USDT', '')
      if (symbols.includes(sym)) map[sym] = parseFloat(t.price)
    })
    return map
  } catch { return {} }
}

// ─── GET /api/portfolio ───────────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    let portfolio = await Portfolio.findOne({ user: req.user._id })
    if (!portfolio) {
      portfolio = await Portfolio.create({ user: req.user._id, holdings: [] })
    }

    // Enrich with live prices
    const symbols    = [...new Set(portfolio.holdings.map(h => h.symbol))]
    const livePrices = await getLivePrices(symbols)

    const enriched = portfolio.holdings.map(h => {
      const livePrice    = livePrices[h.symbol] || h.buyPrice
      const currentValue = h.amount * livePrice
      const costBasis    = h.amount * h.buyPrice
      const pnl          = currentValue - costBasis
      const pnlPct       = costBasis > 0 ? (pnl / costBasis) * 100 : 0
      return {
        ...h.toObject(),
        livePrice,
        currentValue,
        costBasis,
        pnl,
        pnlPct,
      }
    })

    const totalValue    = enriched.reduce((s, h) => s + h.currentValue, 0)
    const totalCost     = enriched.reduce((s, h) => s + h.costBasis, 0)
    const totalPnl      = totalValue - totalCost
    const totalPnlPct   = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0

    res.json({
      holdings: enriched,
      summary: {
        totalValue,
        totalCost,
        totalPnl,
        totalPnlPct,
        holdingCount: enriched.length,
      },
    })
  } catch (err) { next(err) }
})

// ─── POST /api/portfolio/holding ─────────────────────────────────────────────
router.post('/holding', [
  body('symbol').notEmpty().trim().toUpperCase(),
  body('amount').isFloat({ min: 0.00000001 }).withMessage('Amount must be positive'),
  body('buyPrice').isFloat({ min: 0 }).withMessage('Buy price must be positive'),
  body('buyDate').optional().isISO8601(),
  body('notes').optional().trim().isLength({ max: 500 }),
], async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg })

    let portfolio = await Portfolio.findOne({ user: req.user._id })
    if (!portfolio) portfolio = new Portfolio({ user: req.user._id, holdings: [] })

    const { symbol, amount, buyPrice, buyDate, notes, name } = req.body
    portfolio.holdings.push({ symbol, amount, buyPrice, buyDate, notes, name })
    await portfolio.save()

    res.status(201).json({ message: 'Holding added', holdings: portfolio.holdings })
  } catch (err) { next(err) }
})

// ─── PUT /api/portfolio/holding/:id ──────────────────────────────────────────
router.put('/holding/:id', [
  param('id').isMongoId(),
  body('amount').optional().isFloat({ min: 0 }),
  body('buyPrice').optional().isFloat({ min: 0 }),
], async (req, res, next) => {
  try {
    const portfolio = await Portfolio.findOne({ user: req.user._id })
    if (!portfolio) return res.status(404).json({ error: 'Portfolio not found' })

    const holding = portfolio.holdings.id(req.params.id)
    if (!holding) return res.status(404).json({ error: 'Holding not found' })

    const { amount, buyPrice, notes, buyDate } = req.body
    if (amount   !== undefined) holding.amount   = amount
    if (buyPrice !== undefined) holding.buyPrice = buyPrice
    if (notes    !== undefined) holding.notes    = notes
    if (buyDate  !== undefined) holding.buyDate  = buyDate

    await portfolio.save()
    res.json({ message: 'Holding updated', holding })
  } catch (err) { next(err) }
})

// ─── DELETE /api/portfolio/holding/:id ───────────────────────────────────────
router.delete('/holding/:id', [param('id').isMongoId()], async (req, res, next) => {
  try {
    const portfolio = await Portfolio.findOne({ user: req.user._id })
    if (!portfolio) return res.status(404).json({ error: 'Portfolio not found' })

    portfolio.holdings = portfolio.holdings.filter(
      h => h._id.toString() !== req.params.id
    )
    await portfolio.save()
    res.json({ message: 'Holding removed' })
  } catch (err) { next(err) }
})

// ─── DELETE /api/portfolio ────────────────────────────────────────────────────
router.delete('/', async (req, res, next) => {
  try {
    await Portfolio.deleteOne({ user: req.user._id })
    res.json({ message: 'Portfolio cleared' })
  } catch (err) { next(err) }
})

module.exports = router