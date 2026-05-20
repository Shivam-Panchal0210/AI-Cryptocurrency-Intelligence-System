import { useEffect, useState } from 'react'
import { Toaster } from 'react-hot-toast'

import { useBinanceSocket } from './hooks/useBinanceSocket'
import { useCryptoData } from './hooks/useCryptoData'
import { usePriceAlerts } from './hooks/usePriceAlerts'

import PriceCard from './components/PriceCard'
import PriceChart from './components/PriceChart'
import FearGreed from './components/FearGreed'
import TickerTape from './components/TickerTape'

import Markets from './pages/Markets'
import Portfolio from './pages/Portfolio'
import RiskAssessment from './pages/RiskAssessment'
import Settings from './pages/Settings'

import './App.css'

const COINS = ['BTC', 'ETH', 'SOL', 'XRP', 'BNB']

const NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: '⚡' },
  { key: 'markets', label: 'Markets', icon: '📊' },
  { key: 'portfolio', label: 'Portfolio', icon: '💼' },
  { key: 'risk', label: 'Risk Assessment', icon: '🛡️' },
  { key: 'settings', label: 'Settings', icon: '⚙️' },
]

export default function App() {
  useBinanceSocket()
  useCryptoData()
  usePriceAlerts()

  const [activePage, setActivePage] = useState('dashboard')

  const [settings, setSettings] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('crypto_settings')) || {
        darkMode: true,
        priceAlerts: true,
        sound: false,
        language: 'en',
        refreshInterval: 30,
        alerts: {
          BTC_above: 80000,
          BTC_below: 70000,
          ETH_above: 3000,
          ETH_below: 1800,
          SOL_above: 200,
          SOL_below: 80,
        },
      }
    } catch {
      return {
        darkMode: true,
        priceAlerts: true,
        sound: false,
        language: 'en',
      }
    }
  })

  useEffect(() => {
    localStorage.setItem('crypto_settings', JSON.stringify(settings))
  }, [settings])

  const logout = () => {
    localStorage.removeItem('crypto_settings')
    localStorage.removeItem('cryptoai_portfolio')
    setActivePage('dashboard')
    window.location.reload()
  }

  return (
    <div className="shell">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#0A0F1A',
            color: '#E8EDF5',
            border: '1px solid #1E2A40',
          },
        }}
      />

      <TickerTape />

      <div className="layout">
        <aside className="sidebar">
          <div className="brand">⚡ CryptoAI </div>

          <nav>
            {NAV.map(item => (
              <div
                key={item.key}
                className={`nav-item ${activePage === item.key ? 'active' : ''}`}
                onClick={() => setActivePage(item.key)}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </div>
            ))}
          </nav>
        </aside>

        <main className="main">

          {activePage === 'dashboard' && (
            <>
              <div className="page-header">
                <div>
                  <h1>AI Crypto Dashboard</h1>
                  <p>Real-time crypto insights</p>
                </div>
                <button className="wallet-btn">Connect Wallet</button>
              </div>

              <div className="price-grid">
                {COINS.map(sym => (
                  <PriceCard key={sym} symbol={sym} />
                ))}
              </div>

              <div className="chart-row">
                <PriceChart />
                <FearGreed />
              </div>
            </>
          )}

          {activePage === 'markets' && <Markets />}
          {activePage === 'portfolio' && <Portfolio />}
          {activePage === 'risk' && <RiskAssessment />}

          {activePage === 'settings' && (
            <Settings
              settings={settings}
              setSettings={setSettings}
              logout={logout}
            />
          )}

        </main>
      </div>
    </div>
  )
}