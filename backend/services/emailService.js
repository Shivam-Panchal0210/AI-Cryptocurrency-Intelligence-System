const nodemailer = require('nodemailer')

let transporter = null

function getTransporter() {
  if (transporter) return transporter
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠️  Email not configured — set EMAIL_USER and EMAIL_PASS in .env')
    return null
  }
  transporter = nodemailer.createTransport({
    host:   process.env.EMAIL_HOST || 'smtp.gmail.com',
    port:   parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })
  return transporter
}

// ─── Send price alert email ───────────────────────────────────────────────────
async function sendAlertEmail(email, name, alert, triggeredPrice) {
  const t = getTransporter()
  if (!t) return

  const direction = alert.type === 'above' ? '📈 risen above' : '📉 fallen below'
  const subject   = `🔔 CryptoAI Alert: ${alert.symbol} has ${alert.type === 'above' ? 'surpassed' : 'dropped below'} $${alert.targetPrice}`

  const html = `
    <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; background: #030712; color: #e2e8f0; border-radius: 16px; padding: 32px; border: 1px solid #1e2a40;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 32px;">◈</span>
        <h2 style="color: #00f5a0; margin: 8px 0 0;">CryptoAI Alert Triggered</h2>
      </div>

      <p style="color: #94a3b8;">Hi ${name},</p>
      <p style="color: #94a3b8;">Your price alert for <strong style="color: #f1f5f9;">${alert.symbol}</strong> has been triggered.</p>

      <div style="background: #060d1a; border: 1px solid #1e2a40; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
        <div style="font-size: 13px; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px;">${alert.symbol} Price</div>
        <div style="font-size: 32px; font-weight: 800; color: ${alert.type === 'above' ? '#00f5a0' : '#ff4d6d'};">$${parseFloat(triggeredPrice).toLocaleString()}</div>
        <div style="font-size: 13px; color: #64748b; margin-top: 8px;">has ${direction} your target of $${alert.targetPrice.toLocaleString()}</div>
      </div>

      <div style="text-align: center; margin-top: 24px;">
        <a href="${process.env.CLIENT_URL}/dashboard" style="background: linear-gradient(135deg, #00f5a0, #00d4ff); color: #030712; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 800; font-size: 14px;">
          View Dashboard →
        </a>
      </div>

      <p style="color: #334155; font-size: 12px; text-align: center; margin-top: 24px;">
        © 2026 CryptoAI · <a href="${process.env.CLIENT_URL}" style="color: #00f5a0;">cryptoai.app</a>
      </p>
    </div>
  `

  await t.sendMail({
    from:    `"CryptoAI" <${process.env.EMAIL_USER}>`,
    to:      email,
    subject,
    html,
  })

  console.log(`📧 Alert email sent to ${email}`)
}

// ─── Send welcome email ───────────────────────────────────────────────────────
async function sendWelcomeEmail(email, name) {
  const t = getTransporter()
  if (!t) return

  await t.sendMail({
    from:    `"CryptoAI" <${process.env.EMAIL_USER}>`,
    to:      email,
    subject: `Welcome to CryptoAI, ${name}! 🚀`,
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; background: #030712; color: #e2e8f0; border-radius: 16px; padding: 32px; border: 1px solid #1e2a40;">
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="font-size: 32px;">◈</span>
          <h2 style="color: #00f5a0;">Welcome to CryptoAI</h2>
        </div>
        <p style="color: #94a3b8;">Hi ${name}, your account is ready. Start exploring real-time crypto intelligence.</p>
        <div style="text-align: center; margin-top: 24px;">
          <a href="${process.env.CLIENT_URL}/dashboard" style="background: linear-gradient(135deg, #00f5a0, #00d4ff); color: #030712; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 800; font-size: 14px;">
            Go to Dashboard →
          </a>
        </div>
      </div>
    `,
  })
}

module.exports = { sendAlertEmail, sendWelcomeEmail }