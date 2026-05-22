const jwt  = require('jsonwebtoken')
const User = require('../models/User')

const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization
    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const token   = header.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user    = await User.findById(decoded.id).select('-password')

    if (!user) return res.status(401).json({ error: 'User not found' })

    req.user = user
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') return res.status(401).json({ error: 'Token expired' })
    if (err.name === 'JsonWebTokenError')  return res.status(401).json({ error: 'Invalid token' })
    next(err)
  }
}

// Optional auth — attaches user if token present but doesn't block
const optionalAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization
    if (header?.startsWith('Bearer ')) {
      const token   = header.split(' ')[1]
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      req.user = await User.findById(decoded.id).select('-password')
    }
  } catch { /* ignore */ }
  next()
}

// Plan gate — restrict routes by plan
const requirePlan = (...plans) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' })
  if (!plans.includes(req.user.plan)) {
    return res.status(403).json({ error: `This feature requires a ${plans.join(' or ')} plan.` })
  }
  next()
}

module.exports = { protect, optionalAuth, requirePlan }