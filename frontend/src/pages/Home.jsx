import { useState, useEffect } from "react";

const TICKERS = [
  { symbol: "BTC", price: "67,234.50", change: "+2.34%" },
  { symbol: "ETH", price: "3,521.80", change: "+1.87%" },
  { symbol: "SOL", price: "142.65", change: "-0.52%" },
  { symbol: "BNB", price: "598.30", change: "+3.11%" },
  { symbol: "XRP", price: "0.6821", change: "+0.94%" },
  { symbol: "ADA", price: "0.4532", change: "-1.23%" },
  { symbol: "AVAX", price: "38.74", change: "+4.20%" },
  { symbol: "DOGE", price: "0.1623", change: "+5.67%" },
];

const FEATURES = [
  {
    icon: "⚡",
    title: "Real-Time Intelligence",
    desc: "Live market data streamed directly from Binance WebSocket — zero latency, zero compromise.",
  },
  {
    icon: "🧠",
    title: "AI-Powered Signals",
    desc: "Machine learning models trained on decades of market behavior surface actionable signals before the crowd.",
  },
  {
    icon: "📊",
    title: "Advanced Charting",
    desc: "Professional-grade charts with 50+ indicators. Spot patterns. Confirm trends. Execute with confidence.",
  },
  {
    icon: "🔔",
    title: "Smart Alerts",
    desc: "Set threshold, pattern, and AI-triggered alerts. Get notified exactly when it matters — nothing more.",
  },
  {
    icon: "🛡️",
    title: "Risk Assessment",
    desc: "Portfolio-level risk scoring powered by volatility modeling and correlation analysis.",
  },
  {
    icon: "📁",
    title: "Portfolio Tracking",
    desc: "Unified view across wallets and exchanges. Real P&L, allocation breakdowns, and performance history.",
  },
];

const STATS = [
  { value: "2.4M+", label: "Trades Analyzed Daily" },
  { value: "99.97%", label: "Uptime" },
  { value: "<2ms", label: "Data Latency" },
  { value: "150+", label: "Assets Tracked" },
];

export default function Home() {
  const [tickerOffset, setTickerOffset] = useState(0);
  const [activeFeature, setActiveFeature] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setTickerOffset((prev) => (prev - 1) % (TICKERS.length * 160));
    }, 20);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={styles.root}>
      {/* Ambient background */}
      <div style={styles.ambientBlob1} />
      <div style={styles.ambientBlob2} />
      <div style={styles.grid} />

      {/* Nav */}
      <nav style={styles.nav}>
        <div style={styles.navLogo}>
          <span style={styles.logoMark}>◈</span>
          <span style={styles.logoText}>CryptoIntel</span>
        </div>
        <div style={styles.navLinks}>
          <a href="#features" style={styles.navLink}>Features</a>
          <a href="#stats" style={styles.navLink}>Stats</a>
          <a href="/login" style={styles.navLink}>Login</a>
          <a href="/register" style={styles.navCta}>Get Started</a>
        </div>
      </nav>

      {/* Ticker Tape */}
      <div style={styles.tickerWrap}>
        <div style={styles.tickerFadeL} />
        <div style={styles.tickerFadeR} />
        <div style={{ ...styles.tickerTrack, transform: `translateX(${tickerOffset}px)` }}>
          {[...TICKERS, ...TICKERS, ...TICKERS].map((t, i) => (
            <span key={i} style={styles.tickerItem}>
              <span style={styles.tickerSymbol}>{t.symbol}</span>
              <span style={styles.tickerPrice}>${t.price}</span>
              <span style={{ ...styles.tickerChange, color: t.change.startsWith("+") ? "#00f5a0" : "#ff4d6d" }}>
                {t.change}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Hero */}
      <section style={styles.hero}>
        <div style={styles.heroBadge}>
          <span style={styles.heroBadgeDot} />
          Live Market Intelligence
        </div>
        <h1 style={styles.heroTitle}>
          Trade Smarter with<br />
          <span style={styles.heroGradient}>AI-Powered</span><br />
          Crypto Intelligence
        </h1>
        <p style={styles.heroSub}>
          Real-time signals, advanced analytics, and machine-learning insights — <br />
          engineered for traders who demand an edge.
        </p>
        <div style={styles.heroCtas}>
          <a href="/register" style={styles.btnPrimary}>
            Start Trading Free
            <span style={styles.btnArrow}>→</span>
          </a>
          <a href="/login" style={styles.btnSecondary}>
            Sign In
          </a>
        </div>
        <div style={styles.heroMeta}>
          <span>No credit card required</span>
          <span style={styles.dot}>·</span>
          <span>Free forever tier</span>
          <span style={styles.dot}>·</span>
          <span>Cancel anytime</span>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" style={styles.statsSection}>
        {STATS.map((s, i) => (
          <div key={i} style={styles.statCard}>
            <div style={styles.statValue}>{s.value}</div>
            <div style={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </section>

      {/* Features */}
      <section id="features" style={styles.featuresSection}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionTag}>CAPABILITIES</span>
          <h2 style={styles.sectionTitle}>Everything you need to<br /><span style={styles.heroGradient}>dominate the market</span></h2>
        </div>
        <div style={styles.featuresGrid}>
          {FEATURES.map((f, i) => (
            <div
              key={i}
              style={{
                ...styles.featureCard,
                ...(activeFeature === i ? styles.featureCardActive : {}),
              }}
              onMouseEnter={() => setActiveFeature(i)}
              onMouseLeave={() => setActiveFeature(null)}
            >
              <div style={styles.featureIcon}>{f.icon}</div>
              <h3 style={styles.featureTitle}>{f.title}</h3>
              <p style={styles.featureDesc}>{f.desc}</p>
              <div style={styles.featureGlow} />
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section style={styles.ctaBanner}>
        <div style={styles.ctaBannerInner}>
          <h2 style={styles.ctaTitle}>Ready to gain your edge?</h2>
          <p style={styles.ctaSub}>Join thousands of traders using AI-powered insights to stay ahead.</p>
          <a href="/register" style={styles.btnPrimary}>
            Create Free Account <span style={styles.btnArrow}>→</span>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerLogo}>
          <span style={styles.logoMark}>◈</span>
          <span style={styles.logoText}>CryptoIntel</span>
        </div>
        <p style={styles.footerText}>© 2026 CryptoIntel. Built for serious traders.</p>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        a { text-decoration: none; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        section { animation: fadeUp 0.7s ease both; }
      `}</style>
    </div>
  );
}

const styles = {
  root: {
    minHeight: "100vh",
    backgroundColor: "#030712",
    fontFamily: "'Syne', sans-serif",
    color: "#e2e8f0",
    overflowX: "hidden",
    position: "relative",
  },
  ambientBlob1: {
    position: "fixed", top: "-200px", left: "-200px",
    width: "700px", height: "700px",
    background: "radial-gradient(circle, rgba(0,245,160,0.07) 0%, transparent 70%)",
    borderRadius: "50%", pointerEvents: "none", zIndex: 0,
  },
  ambientBlob2: {
    position: "fixed", bottom: "-200px", right: "-100px",
    width: "600px", height: "600px",
    background: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)",
    borderRadius: "50%", pointerEvents: "none", zIndex: 0,
  },
  grid: {
    position: "fixed", inset: 0, zIndex: 0,
    backgroundImage: `linear-gradient(rgba(0,245,160,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,245,160,0.03) 1px, transparent 1px)`,
    backgroundSize: "60px 60px", pointerEvents: "none",
  },
  nav: {
    position: "sticky", top: 0, zIndex: 100,
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "16px 40px",
    background: "rgba(3,7,18,0.85)",
    backdropFilter: "blur(20px)",
    borderBottom: "1px solid rgba(0,245,160,0.08)",
  },
  navLogo: { display: "flex", alignItems: "center", gap: "10px" },
  logoMark: { fontSize: "22px", color: "#00f5a0" },
  logoText: { fontSize: "18px", fontWeight: "800", letterSpacing: "0.05em", color: "#f1f5f9" },
  navLinks: { display: "flex", alignItems: "center", gap: "28px" },
  navLink: { color: "#94a3b8", fontSize: "14px", fontWeight: "600", letterSpacing: "0.03em", transition: "color 0.2s" },
  navCta: {
    background: "linear-gradient(135deg, #00f5a0, #00d4ff)",
    color: "#030712", padding: "8px 20px", borderRadius: "8px",
    fontSize: "14px", fontWeight: "800", letterSpacing: "0.04em",
  },
  tickerWrap: {
    position: "relative", overflow: "hidden",
    background: "rgba(0,245,160,0.04)",
    borderBottom: "1px solid rgba(0,245,160,0.08)",
    padding: "10px 0", zIndex: 1,
  },
  tickerFadeL: {
    position: "absolute", left: 0, top: 0, bottom: 0, width: "80px", zIndex: 2,
    background: "linear-gradient(90deg, #030712, transparent)",
  },
  tickerFadeR: {
    position: "absolute", right: 0, top: 0, bottom: 0, width: "80px", zIndex: 2,
    background: "linear-gradient(-90deg, #030712, transparent)",
  },
  tickerTrack: { display: "flex", gap: "0", whiteSpace: "nowrap", transition: "none" },
  tickerItem: { display: "inline-flex", alignItems: "center", gap: "8px", padding: "0 30px", borderRight: "1px solid rgba(255,255,255,0.05)" },
  tickerSymbol: { fontSize: "12px", fontWeight: "700", color: "#94a3b8", letterSpacing: "0.08em", fontFamily: "'Space Mono', monospace" },
  tickerPrice: { fontSize: "13px", fontWeight: "700", color: "#f1f5f9", fontFamily: "'Space Mono', monospace" },
  tickerChange: { fontSize: "12px", fontWeight: "700", fontFamily: "'Space Mono', monospace" },
  hero: {
    position: "relative", zIndex: 1,
    display: "flex", flexDirection: "column", alignItems: "center",
    textAlign: "center", padding: "100px 40px 80px",
    gap: "24px",
  },
  heroBadge: {
    display: "inline-flex", alignItems: "center", gap: "8px",
    background: "rgba(0,245,160,0.08)", border: "1px solid rgba(0,245,160,0.2)",
    padding: "6px 16px", borderRadius: "100px",
    fontSize: "12px", fontWeight: "700", letterSpacing: "0.08em", color: "#00f5a0",
  },
  heroBadgeDot: {
    width: "6px", height: "6px", borderRadius: "50%",
    background: "#00f5a0", animation: "pulse 2s infinite",
  },
  heroTitle: {
    fontSize: "clamp(40px, 6vw, 76px)", fontWeight: "800",
    lineHeight: "1.05", letterSpacing: "-0.02em", color: "#f8fafc",
  },
  heroGradient: {
    background: "linear-gradient(135deg, #00f5a0 0%, #00d4ff 50%, #6366f1 100%)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
  },
  heroSub: {
    fontSize: "18px", color: "#64748b", lineHeight: "1.7",
    maxWidth: "580px", fontWeight: "400",
  },
  heroCtas: { display: "flex", gap: "16px", alignItems: "center", marginTop: "8px" },
  btnPrimary: {
    display: "inline-flex", alignItems: "center", gap: "8px",
    background: "linear-gradient(135deg, #00f5a0, #00d4ff)",
    color: "#030712", padding: "14px 28px", borderRadius: "10px",
    fontSize: "15px", fontWeight: "800", letterSpacing: "0.03em",
  },
  btnArrow: { fontSize: "18px" },
  btnSecondary: {
    display: "inline-flex", alignItems: "center",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "#94a3b8", padding: "14px 28px", borderRadius: "10px",
    fontSize: "15px", fontWeight: "600",
    background: "rgba(255,255,255,0.03)",
  },
  heroMeta: { display: "flex", gap: "12px", fontSize: "13px", color: "#475569", alignItems: "center" },
  dot: { color: "#334155" },
  statsSection: {
    position: "relative", zIndex: 1,
    display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
    gap: "1px", background: "rgba(255,255,255,0.05)",
    margin: "0 40px 80px",
    border: "1px solid rgba(255,255,255,0.05)", borderRadius: "16px", overflow: "hidden",
  },
  statCard: {
    background: "#060d1a", padding: "40px 24px", textAlign: "center",
  },
  statValue: {
    fontSize: "40px", fontWeight: "800",
    background: "linear-gradient(135deg, #00f5a0, #00d4ff)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
    fontFamily: "'Space Mono', monospace", marginBottom: "8px",
  },
  statLabel: { fontSize: "13px", color: "#64748b", fontWeight: "600", letterSpacing: "0.05em", textTransform: "uppercase" },
  featuresSection: {
    position: "relative", zIndex: 1,
    padding: "0 40px 100px",
  },
  sectionHeader: { textAlign: "center", marginBottom: "60px" },
  sectionTag: { fontSize: "11px", fontWeight: "700", letterSpacing: "0.15em", color: "#00f5a0", display: "block", marginBottom: "16px" },
  sectionTitle: { fontSize: "clamp(28px, 4vw, 48px)", fontWeight: "800", lineHeight: "1.15", letterSpacing: "-0.02em" },
  featuresGrid: {
    display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
    gap: "16px", maxWidth: "1100px", margin: "0 auto",
  },
  featureCard: {
    position: "relative", overflow: "hidden",
    background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "16px", padding: "36px 28px",
    transition: "border-color 0.3s, transform 0.3s",
    cursor: "default",
  },
  featureCardActive: {
    borderColor: "rgba(0,245,160,0.25)",
    transform: "translateY(-4px)",
    background: "rgba(0,245,160,0.03)",
  },
  featureIcon: { fontSize: "32px", marginBottom: "16px" },
  featureTitle: { fontSize: "18px", fontWeight: "700", color: "#f1f5f9", marginBottom: "10px" },
  featureDesc: { fontSize: "14px", color: "#64748b", lineHeight: "1.7" },
  featureGlow: {
    position: "absolute", bottom: "-40px", right: "-40px",
    width: "120px", height: "120px",
    background: "radial-gradient(circle, rgba(0,245,160,0.06), transparent 70%)",
    borderRadius: "50%",
  },
  ctaBanner: {
    position: "relative", zIndex: 1,
    margin: "0 40px 80px",
    background: "linear-gradient(135deg, rgba(0,245,160,0.08), rgba(99,102,241,0.08))",
    border: "1px solid rgba(0,245,160,0.12)",
    borderRadius: "20px", padding: "60px 40px",
    textAlign: "center",
    overflow: "hidden",
  },
  ctaBannerInner: { position: "relative", zIndex: 1 },
  ctaTitle: { fontSize: "clamp(24px, 3.5vw, 42px)", fontWeight: "800", marginBottom: "12px" },
  ctaSub: { fontSize: "16px", color: "#64748b", marginBottom: "32px" },
  footer: {
    position: "relative", zIndex: 1,
    padding: "32px 40px",
    borderTop: "1px solid rgba(255,255,255,0.05)",
    display: "flex", alignItems: "center", justifyContent: "space-between",
  },
  footerLogo: { display: "flex", alignItems: "center", gap: "8px" },
  footerText: { fontSize: "13px", color: "#334155" },
};