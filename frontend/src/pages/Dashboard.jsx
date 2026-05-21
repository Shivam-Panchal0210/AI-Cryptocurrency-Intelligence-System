import PriceCard from '../components/PriceCard'
import PriceChart from '../components/PriceChart'
import AISignals from '../components/AISignals'
import FearGreed from '../components/FearGreed'

export default function Dashboard() {

  return (
    <>
      
      <div className="page-header">

        <div>
          <h1>AI Crypto Dashboard</h1>
          <p>Real-time AI powered crypto insights</p>
        </div>

        <button className="wallet-btn">
          Connect Wallet
        </button>

      </div>

      <div className="price-grid">

        {['BTC', 'ETH', 'SOL', 'XRP', 'BNB'].map((sym) => (
          <PriceCard
            key={sym}
            symbol={sym}
          />
        ))}

      </div>

      <div className="chart-row">

        <PriceChart />

        <FearGreed />

      </div>

      <AISignals />

    </>
  )
}