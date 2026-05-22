const mongoose = require('mongoose')

const holdingSchema = new mongoose.Schema({
  symbol:    { type: String, required: true, uppercase: true },
  name:      { type: String },
  amount:    { type: Number, required: true, min: 0 },
  buyPrice:  { type: Number, required: true, min: 0 },
  buyDate:   { type: Date,   default: Date.now },
  notes:     { type: String, maxlength: 500 },
}, { timestamps: true })

const portfolioSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  holdings: [holdingSchema],
  totalInvested: { type: Number, default: 0 },
}, { timestamps: true })

// Auto-calculate totalInvested before save
portfolioSchema.pre('save', function (next) {
  this.totalInvested = this.holdings.reduce((sum, h) => sum + h.amount * h.buyPrice, 0)
  next()
})

module.exports = mongoose.model('Portfolio', portfolioSchema)