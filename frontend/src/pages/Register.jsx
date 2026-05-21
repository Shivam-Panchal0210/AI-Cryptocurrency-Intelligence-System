import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginWithGoogle, registerWithEmail } from "../services/firebase";

const PLANS = [
  { id: "free",  name: "Free",  price: "$0",  per: "",    desc: "For casual observers", perks: ["5 tracked assets", "Delayed data (15 min)", "Basic charts"] },
  { id: "pro",   name: "Pro",   price: "$29", per: "/mo", desc: "For serious traders",  perks: ["Unlimited assets", "Real-time data", "AI signals", "Advanced charts"], popular: true },
  { id: "elite", name: "Elite", price: "$79", per: "/mo", desc: "For professionals",    perks: ["Everything in Pro", "API access", "Portfolio AI", "Priority support"] },
];

export default function Register() {
  const navigate = useNavigate();

  const [step,     setStep]     = useState(1);
  const [plan,     setPlan]     = useState("pro");
  const [form,     setForm]     = useState({ name: "", email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [focused,  setFocused]  = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const [agree,    setAgree]    = useState(false);
  const [error,    setError]    = useState("");

  // ── password strength ───────────────────────────────────────────────────────
  const strength = (() => {
    const p = form.password;
    if (!p) return 0;
    return [p.length >= 8, /[A-Z]/.test(p), /[0-9]/.test(p), /[^a-zA-Z0-9]/.test(p)].filter(Boolean).length;
  })();
  const STRENGTH_COLORS = ["", "#ff4d6d", "#ff9500", "#f5c518", "#00f5a0"];
  const STRENGTH_LABELS = ["", "Weak", "Fair", "Good", "Strong"];

  // ── Google sign-up ──────────────────────────────────────────────────────────
  const handleGoogle = async () => {
    setError("");
    setGLoading(true);
    try {
      await loginWithGoogle();
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(friendlyError(err.code));
    } finally {
      setGLoading(false);
    }
  };

  // ── Step 1 validation ───────────────────────────────────────────────────────
  const handleStep1 = (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim())     { setError("Please enter your name.");     return; }
    if (!form.email.trim())    { setError("Please enter your email.");    return; }
    if (!form.password.trim()) { setError("Please enter a password.");    return; }
    if (strength < 2)          { setError("Password too weak — add uppercase letters or numbers."); return; }
    if (!agree)                { setError("Please accept the Terms of Service to continue."); return; }
    setStep(2);
  };

  // ── Step 2 — Firebase register ──────────────────────────────────────────────
  const handleFinish = async () => {
    setError("");
    setLoading(true);
    try {
      await registerWithEmail(form.name.trim(), form.email.trim(), form.password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(friendlyError(err.code));
      setStep(1); // send back to fix the error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.root}>
      <div style={s.blob1} />
      <div style={s.blob2} />
      <div style={s.grid} />

      <nav style={s.nav}>
        <a href="/" style={s.logo}>
          <span style={s.logoMark}>◈</span>
          <span style={s.logoText}>CryptoAI</span>
        </a>
        <span style={s.navRight}>
          Already have an account?{" "}
          <a href="/login" style={s.navLink}>Sign in</a>
        </span>
      </nav>

      <div style={s.main}>
        {/* ── Progress bar ── */}
        <div style={s.progress}>
          {[1, 2].map((n) => (
            <div key={n} style={s.progressStep}>
              <div style={{
                ...s.progressDot,
                background: step >= n ? "linear-gradient(135deg,#00f5a0,#00d4ff)" : "rgba(255,255,255,.1)",
                boxShadow:  step === n ? "0 0 12px rgba(0,245,160,.4)" : "none",
                color:      step >= n ? "#030712" : "#475569",
              }}>
                {step > n ? "✓" : n}
              </div>
              <span style={{ ...s.progressLabel, color: step >= n ? "#94a3b8" : "#334155" }}>
                {n === 1 ? "Account" : "Choose Plan"}
              </span>
              {n < 2 && (
                <div style={{ ...s.progressLine, background: step > n ? "rgba(0,245,160,.4)" : "rgba(255,255,255,.07)" }} />
              )}
            </div>
          ))}
        </div>

        {/* ── Step 1: Account details ── */}
        {step === 1 && (
          <div style={s.card}>
            <h1 style={s.title}>Create your account</h1>
            <p style={s.sub}>Start trading with AI-powered intelligence</p>

            {error && <div style={s.errorBox}>⚠ {error}</div>}

            <button
              style={{ ...s.googleBtn, opacity: gLoading ? 0.7 : 1 }}
              type="button"
              onClick={handleGoogle}
              disabled={gLoading}
            >
              {gLoading ? <Dots color="#e2e8f0" /> : <><GoogleIcon /> Continue with Google</>}
            </button>

            <Divider text="or register with email" />

            <form onSubmit={handleStep1} style={s.form}>
              {/* Name */}
              <Field label="Full name">
                <InputWrap focused={focused === "name"}>
                  <span style={s.icon}>👤</span>
                  <input
                    type="text" placeholder="Your full name"
                    value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    onFocus={() => setFocused("name")} onBlur={() => setFocused(null)}
                    style={s.input} autoComplete="name"
                  />
                </InputWrap>
              </Field>

              {/* Email */}
              <Field label="Email address">
                <InputWrap focused={focused === "email"}>
                  <span style={s.icon}>✉</span>
                  <input
                    type="email" placeholder="trader@example.com"
                    value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    onFocus={() => setFocused("email")} onBlur={() => setFocused(null)}
                    style={s.input} autoComplete="email"
                  />
                </InputWrap>
              </Field>

              {/* Password + strength */}
              <Field label="Password">
                <InputWrap focused={focused === "password"}>
                  <span style={s.icon}>🔒</span>
                  <input
                    type={showPass ? "text" : "password"} placeholder="Create a strong password"
                    value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                    onFocus={() => setFocused("password")} onBlur={() => setFocused(null)}
                    style={s.input} autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowPass(v => !v)} style={s.eye}>
                    {showPass ? "🙈" : "👁"}
                  </button>
                </InputWrap>
                {form.password && (
                  <div style={s.strRow}>
                    <div style={s.strBars}>
                      {[1,2,3,4].map(i => (
                        <div key={i} style={{ ...s.strBar, background: i <= strength ? STRENGTH_COLORS[strength] : "rgba(255,255,255,.08)" }} />
                      ))}
                    </div>
                    <span style={{ ...s.strLabel, color: STRENGTH_COLORS[strength] }}>{STRENGTH_LABELS[strength]}</span>
                  </div>
                )}
              </Field>

              {/* Terms */}
              <div style={s.checkRow}>
                <div
                  style={{ ...s.checkbox, borderColor: agree ? "#00f5a0" : "rgba(255,255,255,.15)", background: agree ? "rgba(0,245,160,.15)" : "transparent" }}
                  onClick={() => setAgree(v => !v)}
                >
                  {agree && <span style={{ color: "#00f5a0", fontSize: 12, fontWeight: 800 }}>✓</span>}
                </div>
                <span style={s.checkLabel}>
                  I agree to the <a href="#" style={s.checkLink}>Terms of Service</a> and <a href="#" style={s.checkLink}>Privacy Policy</a>
                </span>
              </div>

              <button type="submit" style={s.submit}>
                Continue &nbsp;→
              </button>
            </form>

            <p style={s.switch}>
              Already have an account?{" "}
              <a href="/login" style={s.switchLink}>Sign in</a>
            </p>
          </div>
        )}

        {/* ── Step 2: Plan picker ── */}
        {step === 2 && (
          <div style={s.planStep}>
            <h1 style={s.title}>Choose your plan</h1>
            <p style={s.sub}>Pick the plan that fits your trading style. Upgrade anytime.</p>

            {error && <div style={{ ...s.errorBox, maxWidth: 860, width: "100%" }}>⚠ {error}</div>}

            <div style={s.plansGrid}>
              {PLANS.map(p => (
                <div
                  key={p.id}
                  style={{
                    ...s.planCard,
                    borderColor: plan === p.id ? "rgba(0,245,160,.4)" : "rgba(255,255,255,.07)",
                    background:  plan === p.id ? "rgba(0,245,160,.04)" : "rgba(255,255,255,.02)",
                    transform:   plan === p.id ? "translateY(-4px)" : "none",
                  }}
                  onClick={() => setPlan(p.id)}
                >
                  {p.popular && <div style={s.popularBadge}>MOST POPULAR</div>}
                  <div style={s.planName}>{p.name}</div>
                  <div style={s.planPrice}>
                    {p.price}<span style={s.planPer}>{p.per}</span>
                  </div>
                  <div style={s.planDesc}>{p.desc}</div>
                  <div style={s.planPerks}>
                    {p.perks.map((perk, i) => (
                      <div key={i} style={s.perk}><span style={{ color: "#00f5a0" }}>✓</span> {perk}</div>
                    ))}
                  </div>
                  <div style={{ ...s.radio, borderColor: plan === p.id ? "#00f5a0" : "rgba(255,255,255,.2)" }}>
                    {plan === p.id && <div style={s.radioDot} />}
                  </div>
                </div>
              ))}
            </div>

            <button
              style={{ ...s.submit, maxWidth: 380, opacity: loading ? 0.7 : 1 }}
              onClick={handleFinish}
              disabled={loading}
            >
              {loading ? <Dots color="#030712" /> : `Start with ${PLANS.find(p => p.id === plan)?.name} →`}
            </button>

            <button style={s.backBtn} onClick={() => { setError(""); setStep(1); }}>
              ← Back
            </button>
          </div>
        )}
      </div>

      <Styles />
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function friendlyError(code) {
  switch (code) {
    case "auth/email-already-in-use":   return "An account with this email already exists. Try signing in.";
    case "auth/invalid-email":          return "Please enter a valid email address.";
    case "auth/weak-password":          return "Password must be at least 6 characters.";
    case "auth/popup-closed-by-user":   return "Google sign-in was cancelled.";
    case "auth/network-request-failed": return "Network error. Check your connection.";
    default: return "Something went wrong. Please try again.";
  }
}

function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <label style={s.label}>{label}</label>
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
    `}</style>
  );
}

const s = {
  root:        { minHeight:"100vh", backgroundColor:"#030712", fontFamily:"'Syne',sans-serif", color:"#e2e8f0", overflowX:"hidden", position:"relative" },
  blob1:       { position:"fixed", top:-200, right:-100, width:600, height:600, background:"radial-gradient(circle,rgba(0,245,160,.07) 0%,transparent 70%)", borderRadius:"50%", pointerEvents:"none", zIndex:0 },
  blob2:       { position:"fixed", bottom:-200, left:-100, width:500, height:500, background:"radial-gradient(circle,rgba(99,102,241,.07) 0%,transparent 70%)", borderRadius:"50%", pointerEvents:"none", zIndex:0 },
  grid:        { position:"fixed", inset:0, zIndex:0, backgroundImage:"linear-gradient(rgba(0,245,160,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,245,160,.025) 1px,transparent 1px)", backgroundSize:"60px 60px", pointerEvents:"none" },
  nav:         { position:"relative", zIndex:1, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"20px 40px", borderBottom:"1px solid rgba(255,255,255,.05)" },
  logo:        { display:"flex", alignItems:"center", gap:10 },
  logoMark:    { fontSize:22, color:"#00f5a0" },
  logoText:    { fontSize:18, fontWeight:800, color:"#f1f5f9", letterSpacing:".05em" },
  navRight:    { fontSize:13, color:"#64748b" },
  navLink:     { color:"#00f5a0", fontWeight:700 },
  main:        { position:"relative", zIndex:1, display:"flex", flexDirection:"column", alignItems:"center", padding:"40px 20px 60px" },
  progress:    { display:"flex", alignItems:"center", marginBottom:40 },
  progressStep:{ display:"flex", alignItems:"center", gap:10 },
  progressDot: { width:32, height:32, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:800, transition:"all .3s" },
  progressLabel:{ fontSize:13, fontWeight:600, transition:"color .3s" },
  progressLine:{ width:60, height:1, margin:"0 10px", transition:"background .3s" },
  card:        { width:"100%", maxWidth:440, background:"rgba(255,255,255,.02)", border:"1px solid rgba(255,255,255,.07)", borderRadius:20, padding:"44px 40px", backdropFilter:"blur(20px)" },
  title:       { fontSize:26, fontWeight:800, color:"#f8fafc", marginBottom:6, textAlign:"center" },
  sub:         { fontSize:14, color:"#64748b", marginBottom:28, textAlign:"center" },
  errorBox:    { background:"rgba(255,77,109,.1)", border:"1px solid rgba(255,77,109,.3)", borderRadius:10, padding:"10px 14px", fontSize:13, color:"#ff4d6d", marginBottom:16 },
  googleBtn:   { width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:10, background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.1)", borderRadius:10, padding:12, color:"#e2e8f0", fontSize:14, fontWeight:600, fontFamily:"'Syne',sans-serif", marginBottom:24, transition:"opacity .2s" },
  form:        { display:"flex", flexDirection:"column", gap:16 },
  label:       { fontSize:13, fontWeight:700, color:"#94a3b8", letterSpacing:".03em" },
  inputWrap:   { display:"flex", alignItems:"center", gap:10, background:"rgba(255,255,255,.04)", border:"1px solid", borderRadius:10, padding:"0 14px", transition:"border-color .2s,box-shadow .2s" },
  icon:        { fontSize:15, opacity:.5, flexShrink:0 },
  input:       { flex:1, background:"transparent", border:"none", outline:"none", color:"#f1f5f9", fontSize:14, fontFamily:"'Syne',sans-serif", padding:"13px 0" },
  eye:         { background:"transparent", fontSize:14, opacity:.5 },
  strRow:      { display:"flex", alignItems:"center", gap:10, marginTop:6 },
  strBars:     { display:"flex", gap:4, flex:1 },
  strBar:      { flex:1, height:3, borderRadius:2, transition:"background .3s" },
  strLabel:    { fontSize:11, fontWeight:700, width:40, textAlign:"right", transition:"color .3s" },
  checkRow:    { display:"flex", alignItems:"flex-start", gap:10, marginTop:4 },
  checkbox:    { width:18, height:18, borderRadius:4, border:"1px solid", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", transition:"all .2s", marginTop:1 },
  checkLabel:  { fontSize:13, color:"#64748b", lineHeight:1.5 },
  checkLink:   { color:"#00f5a0", fontWeight:600 },
  submit:      { width:"100%", background:"linear-gradient(135deg,#00f5a0,#00d4ff)", border:"none", borderRadius:10, padding:14, color:"#030712", fontSize:15, fontWeight:800, fontFamily:"'Syne',sans-serif", display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginTop:8, transition:"opacity .2s" },
  switch:      { textAlign:"center", fontSize:13, color:"#64748b", marginTop:20 },
  switchLink:  { color:"#00f5a0", fontWeight:700 },
  planStep:    { width:"100%", maxWidth:860, display:"flex", flexDirection:"column", alignItems:"center", gap:32 },
  plansGrid:   { display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, width:"100%" },
  planCard:    { position:"relative", border:"1px solid", borderRadius:16, padding:"28px 24px", cursor:"pointer", transition:"all .25s", display:"flex", flexDirection:"column", gap:8 },
  popularBadge:{ position:"absolute", top:-10, left:"50%", transform:"translateX(-50%)", background:"linear-gradient(135deg,#00f5a0,#00d4ff)", color:"#030712", fontSize:10, fontWeight:800, padding:"3px 12px", borderRadius:100, letterSpacing:".08em", whiteSpace:"nowrap" },
  planName:    { fontSize:16, fontWeight:800, color:"#f1f5f9", marginBottom:4 },
  planPrice:   { fontSize:32, fontWeight:800, color:"#00f5a0", fontFamily:"'Space Mono',monospace" },
  planPer:     { fontSize:14, color:"#64748b", fontFamily:"'Syne',sans-serif", fontWeight:600 },
  planDesc:    { fontSize:13, color:"#64748b", marginBottom:12 },
  planPerks:   { display:"flex", flexDirection:"column", gap:8, flex:1 },
  perk:        { fontSize:13, color:"#94a3b8", display:"flex", gap:8 },
  radio:       { width:18, height:18, borderRadius:"50%", border:"2px solid", display:"flex", alignItems:"center", justifyContent:"center", marginTop:12, transition:"border-color .2s" },
  radioDot:    { width:8, height:8, borderRadius:"50%", background:"#00f5a0" },
  backBtn:     { background:"transparent", border:"none", color:"#64748b", fontSize:14, fontWeight:600, fontFamily:"'Syne',sans-serif", cursor:"pointer" },
};