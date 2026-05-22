require('dotenv').config()
const express    = require('express')
const http       = require('http')
const cors       = require('cors')
const helmet     = require('helmet')
const morgan     = require('morgan')
const rateLimit  = require('express-rate-limit')

const connectDB  = require('./config/db')
const { initWebSocket } = require('./services/websocketService')
const { startAlertCron } = require('./services/alertService')

const authRoutes      = require('./routes/auth')
const userRoutes      = require('./routes/user')
const portfolioRoutes = require('./routes/portfolio')
const alertRoutes     = require('./routes/alerts')
const marketRoutes    = require('./routes/market')
const watchlistRoutes = require('./routes/watchlist')

const app    = express()
const server = http.createServer(app)

// ─── Security & middleware ────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "ws://localhost:5000", "wss://localhost:5000", "https://api.binance.com", "wss://stream.binance.com:9443"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://*.binance.com"]
    }
  }
}))

app.use(cors({
  origin:      process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json({ limit: '10kb' }))
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'))

// ─── Global rate limiter ──────────────────────────────────────────────────────
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 200,
  message: { error: 'Too many requests, please try again later.' },
}))

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({
  status: 'ok',
  uptime: process.uptime(),
  timestamp: new Date().toISOString(),
}))

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',      authRoutes)
app.use('/api/user',      userRoutes)
app.use('/api/portfolio', portfolioRoutes)
app.use('/api/alerts',    alertRoutes)

// FIXED: Mounted specifically to /api/markets (PLURAL) to match frontend requests
app.use('/api/markets',   marketRoutes) 

app.use('/api/watchlist', watchlistRoutes)

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: `Route ${req.originalUrl} not found` }))

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message)
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
})

// ─── Managed Async App Boot Sequence ──────────────────────────────────────────
const PORT = process.env.PORT || 5000

async function startServer() {
  try {
    // 1. Establish database connection FIRST (Fixes the Alert Cron Error)
    await connectDB()
    
    // 2. Fire up your WebSocket Gateway + Alert Cron Workers ONLY AFTER DB is ready
    initWebSocket(server)
    startAlertCron()

    // 3. Open API HTTP Port listeners
    server.listen(PORT, () => {
      console.log(`🚀 CryptoAI backend running on port ${PORT}`)
      console.log(`📡 WebSocket ready`)
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`)
    })
  } catch (error) {
    console.error('❌ Critical system boot crash:', error.message)
    process.exit(1)
  }
}

// Boot the system
startServer()