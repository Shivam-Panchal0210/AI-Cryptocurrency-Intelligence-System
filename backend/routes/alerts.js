const router = require('express').Router()
const { body, param, validationResult } = require('express-validator')
const Alert  = require('../models/Alert')
const { protect } = require('../middleware/auth')

router.use(protect)

// ─── GET /api/alerts ──────────────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const alerts = await Alert.find({ user: req.user._id }).sort({ createdAt: -1 })
    res.json({ alerts })
  } catch (err) { next(err) }
})

// ─── POST /api/alerts ─────────────────────────────────────────────────────────
router.post('/', [
  body('symbol').notEmpty().trim().toUpperCase(),
  body('type').isIn(['above','below']).withMessage("type must be 'above' or 'below'"),
  body('targetPrice').isFloat({ min: 0 }).withMessage('targetPrice must be positive'),
  body('notifyEmail').optional().isBoolean(),
  body('notifyPush').optional().isBoolean(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg })

    // Limit alerts per plan
    const count = await Alert.countDocuments({ user: req.user._id, active: true })
    const limits = { free: 3, pro: 20, elite: 100 }
    const limit  = limits[req.user.plan] || 3
    if (count >= limit) {
      return res.status(403).json({ error: `Your ${req.user.plan} plan allows up to ${limit} active alerts. Upgrade to add more.` })
    }

    const { symbol, type, targetPrice, notifyEmail, notifyPush } = req.body
    const alert = await Alert.create({
      user: req.user._id,
      symbol, type, targetPrice,
      notifyEmail: notifyEmail ?? false,
      notifyPush:  notifyPush  ?? true,
    })

    res.status(201).json({ alert })
  } catch (err) { next(err) }
})

// ─── PUT /api/alerts/:id ──────────────────────────────────────────────────────
router.put('/:id', [param('id').isMongoId()], async (req, res, next) => {
  try {
    const alert = await Alert.findOne({ _id: req.params.id, user: req.user._id })
    if (!alert) return res.status(404).json({ error: 'Alert not found' })

    const { targetPrice, type, active, notifyEmail, notifyPush } = req.body
    if (targetPrice !== undefined) alert.targetPrice = targetPrice
    if (type        !== undefined) alert.type        = type
    if (active      !== undefined) { alert.active = active; alert.triggered = false }
    if (notifyEmail !== undefined) alert.notifyEmail = notifyEmail
    if (notifyPush  !== undefined) alert.notifyPush  = notifyPush

    await alert.save()
    res.json({ alert })
  } catch (err) { next(err) }
})

// ─── DELETE /api/alerts/:id ───────────────────────────────────────────────────
router.delete('/:id', [param('id').isMongoId()], async (req, res, next) => {
  try {
    const alert = await Alert.findOneAndDelete({ _id: req.params.id, user: req.user._id })
    if (!alert) return res.status(404).json({ error: 'Alert not found' })
    res.json({ message: 'Alert deleted' })
  } catch (err) { next(err) }
})

// ─── POST /api/alerts/:id/reset ───────────────────────────────────────────────
router.post('/:id/reset', [param('id').isMongoId()], async (req, res, next) => {
  try {
    const alert = await Alert.findOne({ _id: req.params.id, user: req.user._id })
    if (!alert) return res.status(404).json({ error: 'Alert not found' })
    alert.triggered = false
    alert.active    = true
    await alert.save()
    res.json({ alert })
  } catch (err) { next(err) }
})

module.exports = router