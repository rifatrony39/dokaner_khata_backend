const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Customer phone is required'],
    trim: true
  },
  initialLetters: {
    type: String,
    default: ''
  },
  avatarColorHex: {
    type: Number,
    default: 0xFF16A085
  },
  totalDue: {
    type: Number,
    default: 0.0
  },
  isSettled: {
    type: Boolean,
    default: true
  },
  address: {
    type: String,
    default: ''
  },
  clientRefId: {
    type: String,
    default: null,
    index: true // Links with SQLite id during offline sync
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: true
});

// Auto generate initialLetters if empty
customerSchema.pre('save', function (next) {
  if (!this.initialLetters && this.name) {
    const trimmed = this.name.trim();
    this.initialLetters = trimmed.length >= 2 ? trimmed.substring(0, 2) : trimmed.substring(0, 1);
  }
  this.isSettled = this.totalDue <= 0;
  next();
});

// Compound indexes
customerSchema.index({ storeId: 1, name: 1 });
customerSchema.index({ storeId: 1, totalDue: -1 });
customerSchema.index({ storeId: 1, isDeleted: 1 });

customerSchema.methods.toJSON = function () {
  const obj = this.toObject();
  return {
    id: obj._id,
    _id: obj._id,
    store_id: obj.storeId,
    name: obj.name,
    phone: obj.phone,
    initial_letters: obj.initialLetters,
    total_due: obj.totalDue,
    is_settled: obj.isSettled ? 1 : 0,
    avatar_color_hex: obj.avatarColorHex,
    address: obj.address,
    client_ref_id: obj.clientRefId,
    created_at: obj.createdAt ? obj.createdAt.toISOString() : new Date().toISOString(),
    updated_at: obj.updatedAt ? obj.updatedAt.toISOString() : new Date().toISOString()
  };
};

module.exports = mongoose.model('Customer', customerSchema);
