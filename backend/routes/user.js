const router = require('express').Router()
const { body, validationResult } = require('express-validator')
const User = require('../models/User')
const { protect } = require('../middleware/auth')

// All routes require auth
router.use(protect)

// ─── GET /api/user/profile ────────────────────────────────────────────────────
router.get('/profile', (req, res) => {
  res.json({ user: req.user })
})

// ─── PUT /api/user/profile ────────────────────────────────────────────────────
router.put('/profile', [
  body('name').optional().trim().isLength({ min: 1, max: 80 }),
  body('plan').optional().isIn(['free','pro','elite']),
], async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg })

    const { name, plan, avatar } = req.body
    const user = await User.findById(req.user._id)

    if (name)   user.name   = name
    if (plan)   user.plan   = plan
    if (avatar) user.avatar = avatar

    await user.save()
    res.json({ user })
  } catch (err) { next(err) }
})

// ─── PUT /api/user/settings ───────────────────────────────────────────────────
router.put('/settings', async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
    user.settings = { ...user.settings.toObject(), ...req.body }
    await user.save()
    res.json({ settings: user.settings })
  } catch (err) { next(err) }
})

// ─── PUT /api/user/password ───────────────────────────────────────────────────
router.put('/password', [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg })

    const user = await User.findById(req.user._id)
    if (!user.password) return res.status(400).json({ error: 'Google accounts cannot change password here.' })

    const valid = await user.comparePassword(req.body.currentPassword)
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect.' })

    user.password = req.body.newPassword
    await user.save()
    res.json({ message: 'Password updated successfully.' })
  } catch (err) { next(err) }
})

// ─── DELETE /api/user/account ─────────────────────────────────────────────────
router.delete('/account', async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.user._id)
    // Also clean up related data
    const Portfolio = require('../models/Portfolio')
    const Alert     = require('../models/Alert')
    const Watchlist = require('../models/Watchlist')
    await Promise.all([
      Portfolio.deleteOne({ user: req.user._id }),
      Alert.deleteMany({ user: req.user._id }),
      Watchlist.deleteOne({ user: req.user._id }),
    ])
    res.json({ message: 'Account deleted successfully.' })
  } catch (err) { next(err) }
})

module.exports = router