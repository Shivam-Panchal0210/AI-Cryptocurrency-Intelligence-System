import { create } from 'zustand'

const useCryptoStore = create((set) => ({
  prices: {},
  priceHistory: [],
  fearGreed: null,
  signals: [],
  flashState: {}, // { BTC: 'up' | 'down' | null }

  setPrices: (updater) =>
  set((state) => ({
    prices: typeof updater === 'function' ? updater(state.prices) : updater,
  })),
  setPriceHistory: (priceHistory) => set({ priceHistory }),
  setFearGreed: (fearGreed) => set({ fearGreed }),
  setSignals: (signals) => set({ signals }),
  setFlash: (coin, direction) =>
    set((state) => ({
      flashState: { ...state.flashState, [coin]: direction },
    })),
  clearFlash: (coin) =>
    set((state) => ({
      flashState: { ...state.flashState, [coin]: null },
    })),
}))

export default useCryptoStore