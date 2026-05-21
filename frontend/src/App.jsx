import { useEffect, useState, useCallback } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { Toaster, toast } from 'react-hot-toast'

import { auth, logout as firebaseLogout, onAuthChange } from './services/firebase'

import { useBinanceSocket } from './hooks/useBinanceSocket'
import { useCryptoData } from './hooks/useCryptoData'
import { usePriceAlerts } from './hooks/usePriceAlerts'

import PriceCard from './components/PriceCard'
import PriceChart from './components/PriceChart'
import FearGreed from './components/FearGreed'
import TickerTape from './components/TickerTape'
import OrderBook from './components/OrderBook'
import RecentTrades from './components/RecentTrades'

import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Markets from './pages/Markets'
import Portfolio from './pages/Portfolio'
import RiskAssessment from './pages/RiskAssessment'
import Settings from './pages/Settings'

import './App.css'

// ─── Constants ────────────────────────────────────────────────────────────────
const COINS = ['BTC', 'ETH', 'SOL', 'XRP', 'BNB']

const NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: '⚡', path: '/dashboard' },
  { key: 'markets',   label: 'Markets',   icon: '📊', path: '/markets'   },
  { key: 'portfolio', label: 'Portfolio', icon: '💼', path: '/portfolio' },
  { key: 'risk',      label: 'Risk',      icon: '🛡️', path: '/risk'      },
  { key: 'settings',  label: 'Settings',  icon: '⚙️', path: '/settings'  },
]

const DEFAULT_SETTINGS = {
  darkMode: true,
  priceAlerts: true,
  sound: false,
  language: 'en',
  refreshInterval: 30,
  alerts: {
    BTC_above: 80000, BTC_below: 70000,
    ETH_above: 3000,  ETH_below: 1800,
    SOL_above: 200,   SOL_below: 80,
  },
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={sk.card}>
      <div style={sk.line1} />
      <div style={sk.line2} />
      <div style={sk.line3} />
    </div>
  )
}
const sk = {
  card:  { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 },
  line1: { height: 14, width: '45%', borderRadius: 6, background: 'var(--skeleton)', animation: 'shimmer 1.4s infinite' },
  line2: { height: 28, width: '70%', borderRadius: 6, background: 'var(--skeleton)', animation: 'shimmer 1.4s infinite 0.1s' },
  line3: { height: 12, width: '35%', borderRadius: 6, background: 'var(--skeleton)', animation: 'shimmer 1.4s infinite 0.2s' },
}

// ─── Alert badge ──────────────────────────────────────────────────────────────
function AlertBadge({ count }) {
  if (!count) return null
  return (
    <span style={{
      position: 'absolute', top: 6, right: 6,
      minWidth: 18, height: 18, borderRadius: 9,
      background: '#ff4d6d', color: '#fff',
      fontSize: 10, fontWeight: 800,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '0 4px',
    }}>{count > 9 ? '9+' : count}</span>
  )
}

// ─── Full-screen loading spinner (while Firebase resolves auth state) ─────────
function AuthLoading() {
  return (
    <div style={{ minHeight: '100vh', background: '#030712', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
      <span style={{ fontSize: 32, color: '#00f5a0' }}>◈</span>
      <div style={{ display: 'flex', gap: 6 }}>
        {[0, 0.15, 0.3].map((d, i) => (
          <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#00f5a0', animation: `bounce 1.2s infinite ${d}s` }} />
        ))}
      </div>
      <style>{`@keyframes bounce{0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}}`}</style>
    </div>
  )
}

// ─── Protected App Shell ──────────────────────────────────────────────────────
function AppShell({ user, settings, setSettings, alertCount, setAlertCount }) {
  const navigate      = useNavigate()
  const location      = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading,     setLoading]     = useState(true)
  const [walletConnected, setWalletConnected] = useState(false)

  useBinanceSocket()
  useCryptoData()
  usePriceAlerts()

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1400)
    return () => clearTimeout(t)
  }, [])

  const activeKey = NAV.find(n => location.pathname.startsWith(n.path))?.key ?? 'dashboard'
  const dark      = settings.darkMode

  const handleLogout = useCallback(async () => {
    try {
      await firebaseLogout()
      toast.success('Logged out')
      navigate('/', { replace: true })
    } catch {
      toast.error('Logout failed')
    }
  }, [navigate])

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) { toast.error('No wallet detected. Install MetaMask.'); return }
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' })
      setWalletConnected(true)
      toast.success('Wallet connected!')
    } catch {
      toast.error('Wallet connection rejected')
    }
  }, [])

  // Derive display name from Firebase user
  const displayName  = user?.displayName || user?.email?.split('@')[0] || 'Trader'
  const displayEmail = user?.email || ''
  const avatarLetter = displayName[0]?.toUpperCase() ?? 'U'

  return (
    <div className={`shell ${dark ? 'dark' : 'light'}`}>
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40, backdropFilter: 'blur(4px)' }}
        />
      )}

      <TickerTape />

      <div className="layout">
        {/* ── Sidebar ── */}
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="brand">
            <span style={{ color: '#00f5a0', fontSize: 22 }}>◈</span>
            <span>CryptoAI</span>
            <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>✕</button>
          </div>

          <nav>
            {NAV.map(item => (
              <div
                key={item.key}
                className={`nav-item ${activeKey === item.key ? 'active' : ''}`}
                onClick={() => { navigate(item.path); setSidebarOpen(false) }}
                style={{ position: 'relative' }}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
                {item.key === 'settings' && <AlertBadge count={alertCount} />}
              </div>
            ))}
          </nav>

          <div className="sidebar-footer">
            <div className="user-chip">
              <div className="user-avatar">{avatarLetter}</div>
              <div className="user-info">
                <span className="user-name">{displayName}</span>
                <span className="user-email">{displayEmail}</span>
              </div>
            </div>
            <button className="logout-btn" onClick={handleLogout}>↩ Logout</button>
          </div>
        </aside>

        {/* ── Main ── */}
        <main className="main">
          {/* Mobile topbar */}
          <div className="mobile-topbar">
            <button className="hamburger" onClick={() => setSidebarOpen(true)}>
              <span /><span /><span />
            </button>
            <span className="mobile-brand"><span style={{ color: '#00f5a0' }}>◈</span> CryptoAI</span>
            <button
              className="theme-toggle-mobile"
              onClick={() => setSettings(s => ({ ...s, darkMode: !s.darkMode }))}
            >{dark ? '☀️' : '🌙'}</button>
          </div>

          <Routes>
            <Route path="/dashboard" element={
              <>
                <div className="page-header">
                  <div>
                    <h1>AI Crypto Dashboard</h1>
                    <p>Welcome back, {displayName} 👋</p>
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <button
                      className="theme-toggle"
                      onClick={() => setSettings(s => ({ ...s, darkMode: !s.darkMode }))}
                      title="Toggle theme"
                    >{dark ? '☀️' : '🌙'}</button>
                    <button
                      className={`wallet-btn ${walletConnected ? 'connected' : ''}`}
                      onClick={connectWallet}
                    >{walletConnected ? '🟢 Wallet Connected' : '🔗 Connect Wallet'}</button>
                  </div>
                </div>

                <div className="price-grid">
                  {loading
                    ? COINS.map(s => <SkeletonCard key={s} />)
                    : COINS.map(sym => <PriceCard key={sym} symbol={sym} />)
                  }
                </div>

                <div className="chart-row">
                  <PriceChart />
                  <FearGreed />
                </div>

                <div className="chart-row">
                  <OrderBook />
                  <RecentTrades />
                </div>
              </>
            } />

            <Route path="/markets"   element={<Markets />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/risk"      element={<RiskAssessment />} />
            <Route path="/settings"  element={
              <Settings
                settings={settings}
                setSettings={setSettings}
                logout={handleLogout}
                onAlertFired={() => setAlertCount(c => c + 1)}
              />
            } />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

// ─── Auth guard ───────────────────────────────────────────────────────────────
function RequireAuth({ user, children }) {
  const location = useLocation()
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  return children
}

function LoginRedirect({ user, children }) {
  if (user) return <Navigate to="/dashboard" replace />
  return children
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  // Firebase user — null = logged out, undefined = still loading
  const [user,       setUser]       = useState(undefined)
  const [settings,   setSettings]   = useState(() => {
    try { return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem('crypto_settings')) } }
    catch { return DEFAULT_SETTINGS }
  })
  const [alertCount, setAlertCount] = useState(0)

  // Listen to Firebase auth state — single source of truth
  useEffect(() => {
    const unsub = onAuthChange((firebaseUser) => {
      setUser(firebaseUser) // null when signed out, object when signed in
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    localStorage.setItem('crypto_settings', JSON.stringify(settings))
    document.documentElement.setAttribute('data-theme', settings.darkMode ? 'dark' : 'light')
  }, [settings])

  // Still waiting for Firebase to resolve auth state
  if (user === undefined) return <AuthLoading />

  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#0A0F1A',
            color: '#E8EDF5',
            border: '1px solid #1E2A40',
            fontFamily: 'inherit',
          },
        }}
      />

      <Routes>
        {/* Public */}
        <Route path="/"         element={<Home />} />
        <Route path="/login"    element={<LoginRedirect user={user}><Login /></LoginRedirect>} />
        <Route path="/register" element={<LoginRedirect user={user}><Register /></LoginRedirect>} />

        {/* Protected */}
        <Route path="/*" element={
          <RequireAuth user={user}>
            <AppShell
              user={user}
              settings={settings}
              setSettings={setSettings}
              alertCount={alertCount}
              setAlertCount={setAlertCount}
            />
          </RequireAuth>
        } />
      </Routes>

      <style>{`
        @keyframes shimmer { 0%{opacity:.4} 50%{opacity:1} 100%{opacity:.4} }
        @keyframes bounce  { 0%,80%,100%{transform:scale(0)} 40%{transform:scale(1)} }

        :root[data-theme="dark"] {
          --bg:#030712; --card:#060d1a; --border:#1e2a40;
          --text:#e2e8f0; --muted:#64748b; --skeleton:#0f1e35;
        }
        :root[data-theme="light"] {
          --bg:#f0f4ff; --card:#ffffff; --border:#dde3f0;
          --text:#0f172a; --muted:#64748b; --skeleton:#e2e8f0;
        }

        .shell { background:var(--bg); color:var(--text); min-height:100vh; transition:background .3s,color .3s; }
        .sidebar { transition:transform .28s cubic-bezier(.4,0,.2,1); }
        .sidebar-close { display:none; background:transparent; border:none; color:var(--muted); font-size:18px; cursor:pointer; margin-left:auto; }

        @media(max-width:768px){
          .sidebar { position:fixed; top:0; left:0; height:100vh; z-index:50; transform:translateX(-100%); }
          .sidebar.open { transform:translateX(0); }
          .sidebar-close { display:block; }
          .mobile-topbar { display:flex !important; align-items:center; gap:12px; padding:12px 16px; border-bottom:1px solid var(--border); background:var(--card); }
          .page-header { display:none; }
          .theme-toggle { display:none; }
        }
        @media(min-width:769px){
          .mobile-topbar { display:none; }
          .sidebar-close { display:none; }
        }

        .mobile-topbar { display:none; }
        .hamburger { background:transparent; border:none; cursor:pointer; display:flex; flex-direction:column; gap:4px; padding:4px; }
        .hamburger span { display:block; width:20px; height:2px; background:var(--text); border-radius:2px; }
        .mobile-brand { font-size:16px; font-weight:800; flex:1; }
        .theme-toggle-mobile { background:transparent; border:none; font-size:18px; cursor:pointer; }

        .sidebar-footer { margin-top:auto; padding:16px; border-top:1px solid var(--border); display:flex; flex-direction:column; gap:10px; }
        .user-chip  { display:flex; align-items:center; gap:10px; }
        .user-avatar{ width:34px; height:34px; border-radius:50%; background:linear-gradient(135deg,#00f5a0,#00d4ff); display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:800; color:#030712; flex-shrink:0; }
        .user-info  { display:flex; flex-direction:column; min-width:0; }
        .user-name  { font-size:13px; font-weight:700; color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .user-email { font-size:11px; color:var(--muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .logout-btn { background:rgba(255,77,109,.1); border:1px solid rgba(255,77,109,.2); color:#ff4d6d; border-radius:8px; padding:8px 12px; font-size:13px; font-weight:600; cursor:pointer; text-align:left; transition:background .2s; font-family:inherit; }
        .logout-btn:hover { background:rgba(255,77,109,.18); }
        .wallet-btn.connected { background:rgba(0,245,160,.12)!important; border-color:rgba(0,245,160,.3)!important; color:#00f5a0!important; }
        .theme-toggle { background:var(--card); border:1px solid var(--border); border-radius:8px; padding:8px 12px; font-size:16px; cursor:pointer; transition:background .2s; }
      `}</style>
    </Router>
  )
}