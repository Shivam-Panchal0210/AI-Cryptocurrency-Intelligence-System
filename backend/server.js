// backend/server.js
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

app.use(cors({ origin: FRONTEND_URL }));
app.use(express.json());

// ─── MEMORY STORAGE ─────────────────────────────────────────────────────────
const users = []; 
const watchlists = {}; 
let marketCache = null;
let lastMarketFetch = 0;
const MARKET_CACHE_MS = 3000;

const COIN_NAMES = {
  BTC: 'Bitcoin', ETH: 'Ethereum', BNB: 'BNB', SOL: 'Solana', XRP: 'Ripple',
  ADA: 'Cardano', DOGE: 'Dogecoin', SHIB: 'Shiba Inu', DOT: 'Polkadot', AVAX: 'Avalanche'
};

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; 
  if (!token) return res.status(401).json({ success: false, message: 'Token missing.' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ success: false, message: 'Invalid token.' });
    req.user = user; 
    next();
  });
};

// ─── AUTH ROUTES ─────────────────────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Fields missing.' });
    const userExists = users.find(u => u.email === email.toLowerCase());
    if (userExists) return res.status(409).json({ success: false, message: 'User exists.' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = { id: Date.now().toString(), email: email.toLowerCase(), password: hashedPassword };
    users.push(newUser);
    watchlists[newUser.id] = [];
    res.status(201).json({ success: true });
  } catch (error) { res.status(500).json({ success: false }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email.toLowerCase());
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ success: false, message: 'Invalid credentials.' });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, user: { id: user.id, email: user.email } });
  } catch (error) { res.status(500).json({ success: false }); }
});

// ─── DATA ROUTES FOR YOUR FRONTEND COMPONENTS ────────────────────────────────

// 1. Markets Table Data
app.get('/api/markets', async (req, res) => {
  const now = Date.now();
  if (marketCache && (now - lastMarketFetch < MARKET_CACHE_MS)) return res.json({ success: true, data: marketCache });
  try {
    const response = await axios.get('https://api.binance.com/api/v3/ticker/24hr', { timeout: 5000 });
    const filtered = response.data.filter(item => item.symbol.endsWith('USDT') && !item.symbol.includes('UP') && !item.symbol.includes('DOWN'));
    
    const formattedData = filtered.map((item, index) => {
      const baseAsset = item.symbol.replace('USDT', '');
      return { 
        id: item.symbol.toLowerCase(), 
        rank: (index + 1).toString(), 
        symbol: baseAsset, 
        name: COIN_NAMES[baseAsset] || baseAsset, 
        priceUsd: item.lastPrice, 
        changePercent24Hr: item.priceChangePercent,
        // 👇 Here is the newly added missing data 👇
        highPrice: item.highPrice,
        lowPrice: item.lowPrice,
        volumeUsd24Hr: item.quoteVolume 
      };
    });
    
    marketCache = formattedData; lastMarketFetch = now;
    res.json({ success: true, data: formattedData });
  } catch (error) { res.status(502).json({ success: false }); }
});

// 2. Chart Candlestick Data
app.get('/api/klines', async (req, res) => {
  try {
    const { symbol = 'BTC', interval = '1d', limit = '40' } = req.query;
    let sym = symbol.toUpperCase();
    if (!sym.endsWith('USDT')) sym = `${sym}USDT`;

    const response = await axios.get('https://api.binance.com/api/v3/klines', {
      params: { symbol: sym, interval, limit }
    });
    const standardCandles = response.data.map(c => ({
      time: c[0], open: parseFloat(c[1]), high: parseFloat(c[2]), low: parseFloat(c[3]), close: parseFloat(c[4]), volume: parseFloat(c[5])
    }));
    res.json({ success: true, data: standardCandles });
  } catch (error) { res.status(500).json({ success: false }); }
});

// 3. Fear & Greed Index Data
app.get('/api/fear-greed', async (req, res) => {
  try {
    const response = await axios.get('https://alternative.me/fng/?limit=1');
    const payload = response.data.data[0];
    res.json({
      success: true,
      data: { value: parseInt(payload.value), sentiment: payload.value_classification, timestamp: payload.timestamp }
    });
  } catch (error) { res.status(502).json({ success: false }); }
});

app.listen(PORT, () => console.log(`🚀 Server fully operational on port ${PORT}`));