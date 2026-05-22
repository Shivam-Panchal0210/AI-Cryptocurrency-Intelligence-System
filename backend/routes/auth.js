const router = require('express').Router()
const jwt    = require('jsonwebtoken')
const { body, validationResult } = require('express-validator')
const User   = require('../models/User')
const { protect } = require('../middleware/auth')

// ─── Helper: sign JWT ─────────────────────────────────────────────────────────
const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, {
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
})

const sendToken = (user, statusCode, res) => {
  const token = signToken(user._id)
  res.status(statusCode).json({ token, user })
}

// ─── POST /api/auth/register ──────────────────────────────────────────────────
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 80 }),
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('plan').optional().isIn(['free','pro','elite']),
], async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg })

    const { name, email, password, plan } = req.body

    if (await User.findOne({ email })) {
      return res.status(409).json({ error: 'An account with this email already exists.' })
    }

    const user = await User.create({ name, email, password, plan: plan || 'free' })
    user.lastLogin = new Date()
    await user.save()

    sendToken(user, 201, res)
  } catch (err) { next(err) }
})

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', [
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg })

    const { email, password } = req.body
    const user = await User.findOne({ email })

    if (!user || !user.password) {
      return res.status(401).json({ error: 'Invalid email or password.' })
    }

    const valid = await user.comparePassword(password)
    if (!valid) return res.status(401).json({ error: 'Invalid email or password.' })

    user.lastLogin = new Date()
    await user.save()

    sendToken(user, 200, res)
  } catch (err) { next(err) }
})

// ─── POST /api/auth/firebase ──────────────────────────────────────────────────
// Called after Firebase Google sign-in — syncs user to MongoDB
router.post('/firebase', async (req, res, next) => {
  try {
    const { uid, name, email, plan } = req.body
    if (!uid || !email) return res.status(400).json({ error: 'uid and email required' })

    let user = await User.findOne({ $or: [{ firebaseUid: uid }, { email }] })

    if (!user) {
      // First Google login — create account
      user = await User.create({
        firebaseUid: uid,
        name: name || email.split('@')[0],
        email,
        plan: plan || 'free',
      })
    } else {
      // Returning user — update firebase uid if missing
      if (!user.firebaseUid) { user.firebaseUid = uid }
      user.lastLogin = new Date()
      await user.save()
    }

    sendToken(user, 200, res)
  } catch (err) { next(err) }
})

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', protect, (req, res) => {
  res.json({ user: req.user })
})

// ─── POST /api/auth/refresh ───────────────────────────────────────────────────
router.post('/refresh', protect, (req, res) => {
  const token = signToken(req.user._id)
  res.json({ token, user: req.user })
})

module.exports = router