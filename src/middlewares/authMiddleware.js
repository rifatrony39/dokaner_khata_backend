const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Store = require('../models/Store');
const { sendError } = require('../utils/responseHandler');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return sendError(res, 'Authentication required. Please log in.', 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_dokaner_khata_2026');
    const user = await User.findById(decoded.id);

    if (!user) {
      return sendError(res, 'User no longer exists.', 401);
    }

    // Attach active store
    let store = await Store.findOne({ ownerId: user._id });
    if (!store) {
      // Auto create a default store for user if missing
      store = await Store.create({
        ownerId: user._id,
        storeName: `${user.name}-এর দোকান`,
        phone: user.phone,
        greeting: 'Assalamu Alaikum,'
      });
    }

    req.user = user;
    req.store = store;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, 'Session expired. Please log in again.', 401);
    }
    return sendError(res, 'Invalid authentication token.', 401);
  }
};

module.exports = { protect };
