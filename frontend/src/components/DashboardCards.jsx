function DashboardCards() {
  return (

    <div className="grid grid-cols-3 gap-6">

      <div className="bg-slate-800 p-6 rounded-2xl shadow-lg">
        <h2 className="text-gray-400 text-sm">
          Bitcoin Price
        </h2>

        <p className="text-3xl font-bold text-cyan-400 mt-3">
          $67,240
        </p>
      </div>

      <div className="bg-slate-800 p-6 rounded-2xl shadow-lg">
        <h2 className="text-gray-400 text-sm">
          AI Prediction
        </h2>

        <p className="text-3xl font-bold text-green-400 mt-3">
          Bullish ↑
        </p>
      </div>

      <div className="bg-slate-800 p-6 rounded-2xl shadow-lg">
        <h2 className="text-gray-400 text-sm">
          Market Sentiment
        </h2>

        <p className="text-3xl font-bold text-pink-400 mt-3">
          82%
        </p>
      </div>

    </div>

  )
}

export default DashboardCards