const Store = require('../models/Store');
const { sendSuccess, sendError } = require('../utils/responseHandler');

// @desc    Get store info
// @route   GET /api/v1/store
// @access  Private
exports.getStoreInfo = async (req, res, next) => {
  try {
    return sendSuccess(res, req.store, 'দোকানের তথ্য লোড করা হয়েছে');
  } catch (error) {
    next(error);
  }
};

// @desc    Update store info and settings
// @route   PUT /api/v1/store
// @access  Private
exports.updateStoreInfo = async (req, res, next) => {
  try {
    const {
      storeName,
      store_name,
      phone,
      greeting,
      address,
      settings
    } = req.body;

    const store = req.store;

    if (storeName || store_name) {
      store.storeName = storeName || store_name;
    }
    if (phone) {
      store.phone = phone;
    }
    if (greeting) {
      store.greeting = greeting;
    }
    if (address !== undefined) {
      store.address = address;
    }
    if (settings) {
      store.settings = {
        ...store.settings,
        ...settings
      };
    }

    await store.save();

    return sendSuccess(res, store, 'দোকানের তথ্য সফলভাবে আপডেট হয়েছে');
  } catch (error) {
    next(error);
  }
};
