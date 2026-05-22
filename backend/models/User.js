const mongoose = require('mongoose')
const bcrypt   = require('bcryptjs')

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true, maxlength: 80 },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, minlength: 6 },        // null for Google OAuth users
  firebaseUid: { type: String, unique: true, sparse: true }, // for Firebase Google auth
  plan:     { type: String, enum: ['free','pro','elite'], default: 'free' },
  avatar:   { type: String },
  settings: {
    darkMode:        { type: Boolean, default: true  },
    priceAlerts:     { type: Boolean, default: true  },
    emailAlerts:     { type: Boolean, default: false },
    sound:           { type: Boolean, default: false },
    language:        { type: String,  default: 'en'  },
    refreshInterval: { type: Number,  default: 30    },
  },
  lastLogin: { type: Date },
}, { timestamps: true })

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next()
  this.password = await bcrypt.hash(this.password, 12)
  next()
})

// Compare password
userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password)
}

// Strip sensitive fields from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject()
  delete obj.password
  delete obj.__v
  return obj
}

module.exports = mongoose.model('User', userSchema)