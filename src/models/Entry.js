const mongoose = require('mongoose');

const entrySchema = new mongoose.Schema({
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true,
    index: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
    index: true
  },
  customerName: {
    type: String,
    required: true
  },
  customerInitials: {
    type: String,
    default: ''
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than zero']
  },
  type: {
    type: String,
    enum: ['gave', 'got'],
    required: [true, 'Transaction type (gave/got) is required']
  },
  note: {
    type: String,
    default: ''
  },
  date: {
    type: Date,
    default: Date.now,
    index: true
  },
  billImageUrl: {
    type: String,
    default: null
  },
  avatarColorHex: {
    type: Number,
    default: 0xFF16A085
  },
  clientRefId: {
    type: String,
    default: null,
    index: true
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: true
});

entrySchema.index({ storeId: 1, customerId: 1, date: -1 });
entrySchema.index({ storeId: 1, isDeleted: 1 });

entrySchema.methods.toJSON = function () {
  const obj = this.toObject();
  const customer = obj.customerId && typeof obj.customerId === 'object' && obj.customerId.name
    ? obj.customerId
    : null;

  return {
    id: obj._id,
    _id: obj._id,
    store_id: obj.storeId,
    customer_id: customer ? customer._id : obj.customerId,
    customer_name: customer ? customer.name : obj.customerName,
    customer_initials: customer ? (customer.initialLetters || obj.customerInitials) : obj.customerInitials,
    amount: obj.amount,
    type: obj.type,
    note: obj.note,
    date: obj.date ? obj.date.toISOString() : new Date().toISOString(),
    time_ago: 'এখনই',
    avatar_color_hex: customer ? (customer.avatarColorHex || obj.avatarColorHex) : obj.avatarColorHex,
    bill_image_url: obj.billImageUrl,
    client_ref_id: obj.clientRefId,
    created_at: obj.createdAt ? obj.createdAt.toISOString() : new Date().toISOString()
  };
};

module.exports = mongoose.model('Entry', entrySchema);
