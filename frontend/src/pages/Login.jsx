import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { loginWithGoogle, loginWithEmail } from "../services/firebase";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const from     = location.state?.from?.pathname || "/dashboard";

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const [error,    setError]    = useState("");
  const [focused,  setFocused]  = useState(null);

  // ── Google sign-in ──────────────────────────────────────────────────────────
  const handleGoogle = async () => {
    setError("");
    setGLoading(true);
    try {
      await loginWithGoogle();
      navigate(from, { replace: true });
    } catch (err) {
      setError(friendlyError(err.code));
    } finally {
      setGLoading(false);
    }
  };

  // ── Email sign-in ───────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim())    { setError("Please enter your email.");    return; }
    if (!password.trim()) { setError("Please enter your password."); return; }

    setLoading(true);
    try {
      await loginWithEmail(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.root}>
      <div style={s.blob1} />
      <div style={s.blob2} />
      <div style={s.grid} />

      {/* Left panel */}
      <div style={s.left}>
        <a href="/" style={s.logo}>
          <span style={s.logoMark}>◈</span>
          <span style={s.logoText}>CryptoAI</span>
        </a>
        <div style={s.leftBody}>
          <div style={s.badge}>● LIVE MARKET FEED</div>
          <h2 style={s.leftTitle}>Your edge in<br /><span style={s.grad}>every trade</span></h2>
          <p style={s.leftSub}>Real-time AI signals, professional charts, and portfolio intelligence.</p>
          <div style={s.cards}>
            {[
              { sym: "BTC/USDT", price: "$67,234", chg: "+2.34%", up: true  },
              { sym: "ETH/USDT", price: "$3,521",  chg: "+1.87%", up: true  },
              { sym: "SOL/USDT", price: "$142.65", chg: "-0.52%", up: false },
            ].map((c, i) => (
              <div key={i} style={s.mktCard}>
                <div style={s.mktL}>
                  <div style={s.mktDot} />
                  <span style={s.mktSym}>{c.sym}</span>
                </div>
                <div style={s.mktR}>
                  <span style={s.mktPrice}>{c.price}</span>
                  <span style={{ ...s.mktChg, color: c.up ? "#00f5a0" : "#ff4d6d" }}>{c.chg}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p style={s.leftFoot}>Trusted by 50,000+ traders worldwide</p>
      </div>

      {/* Right panel */}
      <div style={s.right}>
        <div style={s.card}>
          <h1 style={s.title}>Welcome back</h1>
          <p style={s.sub}>Sign in to your trading dashboard</p>

          {error && <div style={s.errorBox}>⚠ {error}</div>}

          {/* Google button */}
          <button style={{ ...s.googleBtn, opacity: gLoading ? 0.7 : 1 }} onClick={handleGoogle} disabled={gLoading}>
            {gLoading ? <Dots color="#e2e8f0" /> : <><GoogleIcon /> Continue with Google</>}
          </button>

          <Divider text="or sign in with email" />

          <form onSubmit={handleSubmit} style={s.form}>
            <Field label="Email address">
              <InputWrap focused={focused === "email"}>
                <span style={s.icon}>✉</span>
                <input
                  type="email" placeholder="trader@example.com"
                  value={email} onChange={e => setEmail(e.target.value)}
                  onFocus={() => setFocused("email")} onBlur={() => setFocused(null)}
                  style={s.input} autoComplete="email"
                />
              </InputWrap>
            </Field>

            <Field label="Password" right={<a href="#" style={s.forgot}>Forgot password?</a>}>
              <InputWrap focused={focused === "password"}>
                <span style={s.icon}>🔒</span>
                <input
                  type={showPass ? "text" : "password"} placeholder="Enter your password"
                  value={password} onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocused("password")} onBlur={() => setFocused(null)}
                  style={s.input} autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPass(v => !v)} style={s.eye}>
                  {showPass ? "🙈" : "👁"}
                </button>
              </InputWrap>
            </Field>

            <button type="submit" style={{ ...s.submit, opacity: loading ? 0.7 : 1 }} disabled={loading}>
              {loading ? <Dots color="#030712" /> : <>Sign In &nbsp;→</>}
            </button>
          </form>

          <p style={s.switch}>
            Don't have an account?{" "}
            <a href="/register" style={s.switchLink}>Create one free</a>
          </p>
        </div>
      </div>

      <Styles />
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function friendlyError(code) {
  switch (code) {
    case "auth/user-not-found":       return "No account found with this email.";
    case "auth/wrong-password":       return "Incorrect password. Please try again.";
    case "auth/invalid-email":        return "Please enter a valid email address.";
    case "auth/too-many-requests":    return "Too many attempts. Please try again later.";
    case "auth/popup-closed-by-user": return "Google sign-in was cancelled.";
    case "auth/network-request-failed": return "Network error. Check your connection.";
    case "auth/invalid-credential":   return "Invalid email or password.";
    default: return "Something went wrong. Please try again.";
  }
}

function Field({ label, right, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <label style={s.label}>{label}</label>
        {right}
      </div>
      {children}
    </div>
  );
}

function InputWrap({ focused, children }) {
  return (
    <div style={{
      ...s.inputWrap,
      borderColor: focused ? "rgba(0,245,160,.5)" : "rgba(255,255,255,.08)",
      boxShadow:   focused ? "0 0 0 3px rgba(0,245,160,.08)" : "none",
    }}>{children}</div>
  );
}

function Divider({ text }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "0 0 24px" }}>
      <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,.06)" }} />
      <span style={{ fontSize: 12, color: "#475569", fontWeight: 600 }}>{text}</span>
      <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,.06)" }} />
    </div>
  );
}

function Dots({ color = "#030712" }) {
  return (
    <span style={{ display: "flex", gap: 5, alignItems: "center" }}>
      {[0, 0.15, 0.3].map((d, i) => (
        <span key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: color, animation: `bounce 1.2s infinite ${d}s` }} />
      ))}
    </span>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" style={{ flexShrink: 0 }}>
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
    </svg>
  );
}

function Styles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');
      *{margin:0;padding:0;box-sizing:border-box}
      input{outline:none}button{cursor:pointer;border:none}a{text-decoration:none}
      @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
      @keyframes bounce{0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}}
      @keyframes cardIn{from{opacity:0;transform:translateX(-16px)}to{opacity:1;transform:translateX(0)}}
    `}</style>
  );
}

const s = {
  root:      { minHeight:"100vh", display:"flex", backgroundColor:"#030712", fontFamily:"'Syne',sans-serif", color:"#e2e8f0", overflow:"hidden", position:"relative" },
  blob1:     { position:"fixed", top:-200, left:-100, width:600, height:600, background:"radial-gradient(circle,rgba(0,245,160,.08) 0%,transparent 70%)", borderRadius:"50%", pointerEvents:"none", zIndex:0 },
  blob2:     { position:"fixed", bottom:-150, right:0, width:500, height:500, background:"radial-gradient(circle,rgba(99,102,241,.07) 0%,transparent 70%)", borderRadius:"50%", pointerEvents:"none", zIndex:0 },
  grid:      { position:"fixed", inset:0, zIndex:0, backgroundImage:"linear-gradient(rgba(0,245,160,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,245,160,.025) 1px,transparent 1px)", backgroundSize:"60px 60px", pointerEvents:"none" },
  left:      { position:"relative", zIndex:1, width:"45%", minHeight:"100vh", background:"rgba(0,245,160,.02)", borderRight:"1px solid rgba(0,245,160,.08)", padding:"40px 48px", display:"flex", flexDirection:"column", justifyContent:"space-between" },
  logo:      { display:"flex", alignItems:"center", gap:10 },
  logoMark:  { fontSize:22, color:"#00f5a0" },
  logoText:  { fontSize:18, fontWeight:800, color:"#f1f5f9", letterSpacing:".05em" },
  leftBody:  { flex:1, display:"flex", flexDirection:"column", justifyContent:"center", gap:24 },
  badge:     { display:"inline-flex", alignItems:"center", gap:8, background:"rgba(0,245,160,.08)", border:"1px solid rgba(0,245,160,.2)", padding:"5px 14px", borderRadius:100, fontSize:11, fontWeight:700, letterSpacing:".1em", color:"#00f5a0", width:"fit-content" },
  leftTitle: { fontSize:"clamp(28px,3.5vw,48px)", fontWeight:800, lineHeight:1.1, letterSpacing:"-.02em" },
  grad:      { background:"linear-gradient(135deg,#00f5a0,#00d4ff)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" },
  leftSub:   { fontSize:15, color:"#64748b", lineHeight:1.7, maxWidth:360 },
  cards:     { display:"flex", flexDirection:"column", gap:10, marginTop:8 },
  mktCard:   { display:"flex", alignItems:"center", justifyContent:"space-between", background:"rgba(255,255,255,.03)", border:"1px solid rgba(255,255,255,.06)", borderRadius:12, padding:"14px 18px", animation:"cardIn .5s ease both" },
  mktL:      { display:"flex", alignItems:"center", gap:10 },
  mktDot:    { width:6, height:6, borderRadius:"50%", background:"#00f5a0", animation:"pulse 2s infinite" },
  mktSym:    { fontSize:13, fontWeight:700, color:"#94a3b8", fontFamily:"'Space Mono',monospace", letterSpacing:".05em" },
  mktR:      { display:"flex", alignItems:"center", gap:12 },
  mktPrice:  { fontSize:14, fontWeight:700, color:"#f1f5f9", fontFamily:"'Space Mono',monospace" },
  mktChg:    { fontSize:12, fontWeight:700, fontFamily:"'Space Mono',monospace" },
  leftFoot:  { fontSize:12, color:"#334155", fontWeight:600 },
  right:     { flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:40, position:"relative", zIndex:1 },
  card:      { width:"100%", maxWidth:420, background:"rgba(255,255,255,.02)", border:"1px solid rgba(255,255,255,.07)", borderRadius:20, padding:"44px 40px", backdropFilter:"blur(20px)" },
  title:     { fontSize:28, fontWeight:800, color:"#f8fafc", marginBottom:6 },
  sub:       { fontSize:14, color:"#64748b", marginBottom:28 },
  errorBox:  { background:"rgba(255,77,109,.1)", border:"1px solid rgba(255,77,109,.3)", borderRadius:10, padding:"10px 14px", fontSize:13, color:"#ff4d6d", marginBottom:16 },
  googleBtn: { width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:10, background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.1)", borderRadius:10, padding:12, color:"#e2e8f0", fontSize:14, fontWeight:600, fontFamily:"'Syne',sans-serif", marginBottom:24, transition:"opacity .2s" },
  form:      { display:"flex", flexDirection:"column", gap:18 },
  label:     { fontSize:13, fontWeight:700, color:"#94a3b8", letterSpacing:".03em" },
  forgot:    { fontSize:12, color:"#00f5a0", fontWeight:600 },
  inputWrap: { display:"flex", alignItems:"center", gap:10, background:"rgba(255,255,255,.04)", border:"1px solid", borderRadius:10, padding:"0 14px", transition:"border-color .2s,box-shadow .2s" },
  icon:      { fontSize:15, opacity:.5, flexShrink:0 },
  input:     { flex:1, background:"transparent", border:"none", outline:"none", color:"#f1f5f9", fontSize:14, fontFamily:"'Syne',sans-serif", padding:"13px 0" },
  eye:       { background:"transparent", fontSize:14, opacity:.5 },
  submit:    { width:"100%", background:"linear-gradient(135deg,#00f5a0,#00d4ff)", border:"none", borderRadius:10, padding:14, color:"#030712", fontSize:15, fontWeight:800, fontFamily:"'Syne',sans-serif", display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginTop:6, transition:"opacity .2s" },
  switch:    { textAlign:"center", fontSize:13, color:"#64748b", marginTop:20 },
  switchLink:{ color:"#00f5a0", fontWeight:700 },
};