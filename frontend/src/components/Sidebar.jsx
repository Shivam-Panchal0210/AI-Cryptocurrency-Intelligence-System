function Sidebar() {
  return (
    <div className="w-64 h-screen bg-slate-950 border-r border-slate-800 p-5 overflow-y-auto">

      <h1 className="text-3xl font-bold text-cyan-400">
        CryptoIQ
      </h1>

      <ul className="mt-10 space-y-6 text-gray-300">

        <li className="hover:text-cyan-400 cursor-pointer transition-all">
          Dashboard
        </li>

        <li className="hover:text-cyan-400 cursor-pointer transition-all">
          Markets
        </li>

        <li className="hover:text-cyan-400 cursor-pointer transition-all">
          Portfolio
        </li>

        <li className="hover:text-cyan-400 cursor-pointer transition-all">
          Risk Assessment
        </li>

        <li className="hover:text-cyan-400 cursor-pointer transition-all">
          Settings
        </li>

      </ul>

    </div>
  )
}

export default Sidebar