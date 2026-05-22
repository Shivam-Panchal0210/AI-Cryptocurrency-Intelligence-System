const router    = require('express').Router()
const Watchlist = require('../models/Watchlist')
const { protect } = require('../middleware/auth')

router.use(protect)

// ─── GET /api/watchlist ───────────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const wl = await Watchlist.findOne({ user: req.user._id })
    res.json({ symbols: wl?.symbols || [] })
  } catch (err) { next(err) }
})

// ─── POST /api/watchlist/:symbol ─────────────────────────────────────────────
router.post('/:symbol', async (req, res, next) => {
  try {
    const sym = req.params.symbol.toUpperCase()
    let wl = await Watchlist.findOne({ user: req.user._id })
    if (!wl) wl = new Watchlist({ user: req.user._id, symbols: [] })
    if (!wl.symbols.includes(sym)) wl.symbols.push(sym)
    await wl.save()
    res.json({ symbols: wl.symbols })
  } catch (err) { next(err) }
})

// ─── DELETE /api/watchlist/:symbol ───────────────────────────────────────────
router.delete('/:symbol', async (req, res, next) => {
  try {
    const sym = req.params.symbol.toUpperCase()
    const wl  = await Watchlist.findOne({ user: req.user._id })
    if (wl) {
      wl.symbols = wl.symbols.filter(s => s !== sym)
      await wl.save()
    }
    res.json({ symbols: wl?.symbols || [] })
  } catch (err) { next(err) }
})

module.exports = router