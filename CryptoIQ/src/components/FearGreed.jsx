import useCryptoStore from '../store/useCryptoStore'

const getColor = (val) => {
  if (val >= 75) return '#C8FF57'
  if (val >= 55) return '#5DDE4A'
  if (val >= 45) return '#FFB800'
  if (val >= 25) return '#FF8C61'
  return '#FF4560'
}

export default function FearGreed() {
  const { fearGreed } = useCryptoStore()

  if (!fearGreed) return <div className="fg-card skeleton" style={{ height: 120 }} />

  const val = parseInt(fearGreed.value)
  const color = getColor(val)
  const rotation = -90 + (val / 100) * 180 // needle rotation

  return (
    <div className="fg-card">
      <div className="fg-label">Fear & Greed Index</div>
      <div className="fg-gauge">
        <svg viewBox="0 0 140 80" width="140" height="80">
          <path d="M16,75 A54,54 0 0,1 124,75" fill="none" stroke="#0E1420" strokeWidth="10" strokeLinecap="round"/>
          <path d="M16,75 A54,54 0 0,1 124,75" fill="none" stroke={color} strokeWidth="10"
            strokeLinecap="round" strokeDasharray="170" strokeDashoffset={170 - (val / 100) * 170} />
          <g transform={`rotate(${rotation}, 70, 75)`}>
            <line x1="70" y1="75" x2="70" y2="28" stroke={color} strokeWidth="2" strokeLinecap="round"/>
          </g>
          <circle cx="70" cy="75" r="4" fill={color} />
        </svg>
      </div>
      <div className="fg-value" style={{ color }}>{val}</div>
      <div className="fg-class" style={{ color }}>{fearGreed.value_classification}</div>
    </div>
  )
}