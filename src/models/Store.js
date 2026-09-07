const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  storeName: {
    type: String,
    required: [true, 'Store name is required'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Store phone number is required'],
    trim: true
  },
  greeting: {
    type: String,
    default: 'Assalamu Alaikum'
  },
  address: {
    type: String,
    default: ''
  },
  logoUrl: {
    type: String,
    default: null
  },
  settings: {
    language: {
      type: String,
      enum: ['bn', 'en'],
      default: 'bn'
    },
    isLargeFont: {
      type: Boolean,
      default: false
    },
    sendSmsReminder: {
      type: Boolean,
      default: true
    },
    smsFrequency: {
      type: String,
      default: 'every_friday'
    }
  }
}, {
  timestamps: true
});

// Format matching Flutter StoreModel
storeSchema.methods.toJSON = function () {
  const obj = this.toObject();
  return {
    id: obj._id,
    _id: obj._id,
    owner_id: obj.ownerId,
    store_name: obj.storeName,
    phone: obj.phone,
    greeting: obj.greeting,
    address: obj.address,
    logo_url: obj.logoUrl,
    settings: obj.settings,
    created_at: obj.createdAt,
    updated_at: obj.updatedAt
  };
};

module.exports = mongoose.model('Store', storeSchema);
