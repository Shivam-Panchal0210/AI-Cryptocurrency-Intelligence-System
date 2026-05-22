const mongoose = require('mongoose')

const alertSchema = new mongoose.Schema({
  user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  symbol:    { type: String, required: true, uppercase: true },
  type:      { type: String, enum: ['above', 'below'], required: true },
  targetPrice: { type: Number, required: true, min: 0 },
  active:    { type: Boolean, default: true },
  triggered: { type: Boolean, default: false },
  triggeredAt: { type: Date },
  triggeredPrice: { type: Number },
  notifyEmail: { type: Boolean, default: false },
  notifyPush:  { type: Boolean, default: true  },
}, { timestamps: true })

// Index for fast alert lookups during price checks
alertSchema.index({ symbol: 1, active: 1, triggered: 1 })
alertSchema.index({ user: 1 })

module.exports = mongoose.model('Alert', alertSchema)