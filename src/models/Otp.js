const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    index: true
  },
  otp: {
    type: String,
    required: true
  },
  purpose: {
    type: String,
    enum: ['signup_verify', 'forgot_password', 'login_otp'],
    default: 'forgot_password'
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 } // MongoDB TTL index automatically removes document when expired
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Otp', otpSchema);
