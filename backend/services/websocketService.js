const WebSocket = require('ws')

let wss       = null
const clients = new Map() // clientId -> { ws, subscriptions: Set }
let binanceWs = null
let reconnectTimer = null

// Keep track of active Binance stream subscriptions globally
let activeBinanceStreams = new Set()

// ─── Init WebSocket server ────────────────────────────────────────────────────
function initWebSocket(server) {
  // FIXED: Explicitly added the path interceptor for '/ws' to match frontend handshakes
  wss = new WebSocket.Server({ server, path: '/ws' })
  console.log('📡 WebSocket server ready and monitoring connections at /ws')

  wss.on('connection', (ws, req) => {
    const id = Date.now() + Math.random().toString(36).slice(2)
    
    // Default system subscriptions for tracking market panels
    clients.set(id, { 
      ws, 
      subscriptions: new Set(['btcusdt','ethusdt','solusdt','bnbusdt','xrpusdt']) 
    })
    console.log(`🔌 Client connected: ${id} (${wss.clients.size} total)`)

    ws.send(JSON.stringify({ type: 'connected', id }))

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw)
        handleClientMessage(id, msg)
      } catch { /* ignore malformed */ }
    })

    ws.on('close', () => {
      clients.delete(id)
      console.log(`🔌 Client disconnected: ${id} (${wss.clients.size} remaining)`)
      if (clients.size === 0) disconnectBinance()
    })

    ws.on('error', (err) => console.warn(`WS client error [${id}]:`, err.message))

    // Automatically trigger external streaming channels
    if (!binanceWs || binanceWs.readyState !== WebSocket.OPEN) {
      connectBinance()
    }
  })
}

// ─── Handle messages from frontend ───────────────────────────────────────────
function handleClientMessage(id, msg) {
  const client = clients.get(id)
  if (!client) return

  if (msg.type === 'subscribe' && msg.symbols) {
    msg.symbols.forEach(s => client.subscriptions.add(s.toLowerCase() + 'usdt'))
  }
  if (msg.type === 'unsubscribe' && msg.symbols) {
    msg.symbols.forEach(s => client.subscriptions.delete(s.toLowerCase() + 'usdt'))
  }
  if (msg.type === 'ping') {
    client.ws.send(JSON.stringify({ type: 'pong', ts: Date.now() }))
  }
}

// ─── Connect to Binance WebSocket ─────────────────────────────────────────────
function connectBinance() {
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null }

  const baseUrl = 'wss://stream.binance.com:9443/stream?streams=!miniTicker@arr/btcusdt@depth20/btcusdt@trade'
  console.log('📡 Connecting to Binance Aggregated Multi-Streams...')

  binanceWs = new WebSocket(baseUrl)

  binanceWs.on('open', () => {
    console.log('✅ Binance Live Data WebSockets operational')
  })

  binanceWs.on('message', (raw) => {
    try {
      const payload = JSON.parse(raw)
      const streamName = payload.stream
      const streamData = payload.data

      // 1. Handle Global Market List Tickers
      if (streamName === '!miniTicker@arr') {
        if (!Array.isArray(streamData)) return
        const updates = {}
        streamData.forEach(t => {
          if (!t.s.endsWith('USDT')) return
          updates[t.s] = {
            symbol:    t.s,
            price:     t.c,
            open:      t.o,
            high:      t.h,
            low:       t.l,
            volume:    t.v,
            change24h: (((parseFloat(t.c) - parseFloat(t.o)) / parseFloat(t.o)) * 100).toFixed(2),
          }
        })

        // Send to clients tracking active rows
        clients.forEach(({ ws, subscriptions }) => {
          if (ws.readyState !== WebSocket.OPEN) return
          const relevant = {}
          
          subscriptions.forEach(sym => {
            const upperSym = sym.toUpperCase()                        // e.g., "BTCUSDT"
            const shortSym = upperSym.replace('USDT', '')              // e.g., "BTC"
            
            if (updates[upperSym]) {
              // FIXED: We populate all 3 casing variations so the layout never misses a lookup key match
              relevant[upperSym] = updates[upperSym]
              relevant[sym]      = updates[upperSym]
              relevant[shortSym] = updates[upperSym]
            }
          })
          
          if (Object.keys(relevant).length > 0) {
            ws.send(JSON.stringify({ type: 'prices', data: relevant }))
          }
        })
      }

      // 2. Handle Realtime Order Book Data
      if (streamName && streamName.endsWith('@depth20')) {
        broadcastToSubscribers(streamName.split('@')[0], {
          type: 'orderbook',
          symbol: streamName.split('@')[0].toUpperCase(),
          bids: streamData.bids,
          asks: streamData.asks
        })
      }

      // 3. Handle Live Realtime Recent Trades
      if (streamName && streamName.endsWith('@trade')) {
        broadcastToSubscribers(streamName.split('@')[0], {
          type: 'trades',
          symbol: streamName.split('@')[0].toUpperCase(),
          data: {
            price: streamData.p,
            amount: streamData.q,
            time: streamData.T,
            isBuyerMaker: streamData.m
          }
        })
      }

    } catch (err) { /* ignore raw parsing fails */ }
  })

  binanceWs.on('close', () => {
    console.warn('⚠️ Binance stream closed — scheduling reconnection matrix...')
    reconnectTimer = setTimeout(connectBinance, 5000)
  })

  binanceWs.on('error', (err) => {
    console.error('❌ Binance WebSocket pipeline error:', err.message)
  })
}

function broadcastToSubscribers(targetSymbol, payload) {
  const jsonString = JSON.stringify(payload)
  clients.forEach(({ ws, subscriptions }) => {
    if (ws.readyState === WebSocket.OPEN && subscriptions.has(targetSymbol.toLowerCase())) {
      ws.send(jsonString)
    }
  })
}

function disconnectBinance() {
  if (binanceWs) {
    binanceWs.terminate()
    binanceWs = null
    console.log('📡 Binance connection suspended (0 active user components)')
  }
}

function broadcast(message) {
  const payload = JSON.stringify(message)
  clients.forEach(({ ws }) => {
    if (ws.readyState === WebSocket.OPEN) ws.send(payload)
  })
}

module.exports = { initWebSocket, broadcast }