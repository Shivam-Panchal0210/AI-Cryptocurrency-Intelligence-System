import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

const STORAGE_KEY = 'cryptoai_settings'

const DEFAULT_SETTINGS = {
  alerts: {
    BTC_above: 80000,
    BTC_below: 70000,
    ETH_above: 3000,
    ETH_below: 1800,
    SOL_above: 200,
    SOL_below: 80,
  },
  refreshInterval: 30,
  theme: 'dark',
  notifications: true,
}

export default function Settings() {
  const [settings, setSettings] = useState(() => {
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(STORAGE_KEY)) }
    } catch { return DEFAULT_SETTINGS }
  })

  const save = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    toast.success('Settings saved!')
  }

  const reset = () => {
    setSettings(DEFAULT_SETTINGS)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS))
    toast.success('Settings reset to defaults')
  }

  const setAlert = (key, val) =>
    setSettings((s) => ({ ...s, alerts: { ...s.alerts, [key]: parseFloat(val) } }))

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p>Configure alerts and preferences</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="outline-btn" onClick={reset}>Reset</button>
          <button className="wallet-btn" onClick={save}>Save Settings</button>
        </div>
      </div>

      <div className="settings-grid">

        {/* Price Alerts */}
        <div className="settings-card">
          <div className="settings-card-title">🔔 Price Alerts</div>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>
            Get toast notifications when prices cross these thresholds.
          </p>

          {[
            { sym: 'BTC', above: 'BTC_above', below: 'BTC_below' },
            { sym: 'ETH', above: 'ETH_above', below: 'ETH_below' },
            { sym: 'SOL', above: 'SOL_above', below: 'SOL_below' },
          ].map(({ sym, above, below }) => (
            <div key={sym} className="alert-row">
              <span className="alert-sym">{sym}</span>
              <div className="alert-inputs">
                <div className="alert-input-group">
                  <label>Above $</label>
                  <input
                    className="form-input"
                    type="number"
                    value={settings.alerts[above]}
                    onChange={(e) => setAlert(above, e.target.value)}
                  />
                </div>
                <div className="alert-input-group">
                  <label>Below $</label>
                  <input
                    className="form-input"
                    type="number"
                    value={settings.alerts[below]}
                    onChange={(e) => setAlert(below, e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* General */}
        <div className="settings-card">
          <div className="settings-card-title">⚙️ General</div>

          <div className="settings-field">
            <label>Price Refresh Interval</label>
            <div className="risk-pct-row">
              {[15, 30, 60].map((s) => (
                <button
                  key={s}
                  className={`pct-btn ${settings.refreshInterval === s ? 'active' : ''}`}
                  onClick={() => setSettings((st) => ({ ...st, refreshInterval: s }))}
                >
                  {s}s
                </button>
              ))}
            </div>
          </div>

          <div className="settings-field">
            <label>Toast Notifications</label>
            <div
              className={`toggle ${settings.notifications ? 'on' : ''}`}
              onClick={() => setSettings((s) => ({ ...s, notifications: !s.notifications }))}
            >
              <div className="toggle-thumb" />
            </div>
          </div>

          <div className="settings-field">
            <label>Currency Display</label>
            <select className="form-select" defaultValue="USD">
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="INR">INR (₹)</option>
            </select>
          </div>
        </div>

        {/* About */}
        <div className="settings-card" style={{ gridColumn: '1 / -1' }}>
          <div className="settings-card-title">ℹ️ About</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginTop: 8 }}>
            {[
              { label: 'Price Data',    val: 'Binance API' },
              { label: 'WebSocket',     val: 'Binance Stream' },
              { label: 'Fear & Greed',  val: 'Alternative.me' },
              { label: 'Refresh Rate',  val: `${settings.refreshInterval}s` },
            ].map((item) => (
              <div key={item.label} className="about-cell">
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{item.label}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)', marginTop: 4 }}>
                  {item.val}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  )
}