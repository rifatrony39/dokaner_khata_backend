const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Store = require('../models/Store');
const Otp = require('../models/Otp');
const { sendSuccess, sendError } = require('../utils/responseHandler');

const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'super_secret_jwt_key_dokaner_khata_2026',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// @desc    Register a new shop owner & store
// @route   POST /api/v1/auth/signup
// @access  Public
exports.signup = async (req, res, next) => {
  try {
    const { name, phone, password, storeName, email } = req.body;

    if (!name || !phone || !password) {
      return sendError(res, 'অনুগ্রহ করে নাম, ফোন নম্বর এবং পাসওয়ার্ড দিন।', 400);
    }

    if (password.length < 6) {
      return sendError(res, 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।', 400);
    }

    // Check existing phone
    const existingUser = await User.findOne({ phone: phone.trim() });
    if (existingUser) {
      return sendError(res, 'এই ফোন নম্বরটি দিয়ে ইতোমধ্যে একাউন্ট খোলা হয়েছে।', 400);
    }

    // 1. Create User
    const user = await User.create({
      name: name.trim(),
      phone: phone.trim(),
      password,
      email: email ? email.trim() : ''
    });

    // 2. Create Store
    const store = await Store.create({
      ownerId: user._id,
      storeName: storeName && storeName.trim() ? storeName.trim() : `${name.trim()}-এর দোকান`,
      phone: phone.trim(),
      greeting: 'Assalamu Alaikum,'
    });

    const token = generateToken(user._id);

    return sendSuccess(res, {
      token,
      user,
      store
    }, 'একাউন্ট সফলভাবে তৈরি হয়েছে!', 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Login shop owner
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return sendError(res, 'অনুগ্রহ করে ফোন নম্বর এবং পাসওয়ার্ড দিন।', 400);
    }

    const user = await User.findOne({ phone: phone.trim() }).select('+password');
    if (!user) {
      return sendError(res, 'ভুল ফোন নম্বর বা পাসওয়ার্ড।', 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return sendError(res, 'ভুল ফোন নম্বর বা পাসওয়ার্ড।', 401);
    }

    let store = await Store.findOne({ ownerId: user._id });
    if (!store) {
      store = await Store.create({
        ownerId: user._id,
        storeName: `${user.name}-এর দোকান`,
        phone: user.phone
      });
    }

    const token = generateToken(user._id);

    return sendSuccess(res, {
      token,
      user: user.toJSON(),
      store
    }, 'লগইন সফল হয়েছে!');
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user & store profile
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    return sendSuccess(res, {
      user: req.user,
      store: req.store
    }, 'ইউজার প্রোফাইল লোড সফল');
  } catch (error) {
    next(error);
  }
};

// @desc    Request Password Reset OTP
// @route   POST /api/v1/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return sendError(res, 'অনুগ্রহ করে ফোন নম্বর দিন।', 400);
    }

    const user = await User.findOne({ phone: phone.trim() });
    if (!user) {
      return sendError(res, 'এই ফোন নম্বরে কোনো একাউন্ট পাওয়া যায়নি।', 404);
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

    // Remove any previous OTPs for this phone
    await Otp.deleteMany({ phone: phone.trim() });

    await Otp.create({
      phone: phone.trim(),
      otp: otpCode,
      purpose: 'forgot_password',
      expiresAt
    });

    console.log(`[SMS Gateway Simulated] OTP for ${phone}: ${otpCode}`);

    return sendSuccess(res, {
      phone: phone.trim(),
      expiresInSeconds: 300,
      devOtp: process.env.NODE_ENV !== 'production' ? otpCode : undefined
    }, 'আপনার ফোনে OTP কোড পাঠানো হয়েছে।');
  } catch (error) {
    next(error);
  }
};

// @desc    Verify OTP
// @route   POST /api/v1/auth/verify-otp
// @access  Public
exports.verifyOtp = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return sendError(res, 'ফোন এবং OTP উভয়ই আবশ্যক।', 400);
    }

    const validOtp = await Otp.findOne({
      phone: phone.trim(),
      otp: otp.trim(),
      isUsed: false,
      expiresAt: { $gt: new Date() }
    });

    if (!validOtp) {
      return sendError(res, 'ভুল বা মেয়াদোত্তীর্ণ OTP কোড।', 400);
    }

    return sendSuccess(res, { verified: true }, 'OTP ভেরিফিকেশন সফল হয়েছে।');
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password with verified OTP
// @route   POST /api/v1/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    const { phone, otp, newPassword } = req.body;

    if (!phone || !otp || !newPassword) {
      return sendError(res, 'সকল তথ্য প্রদান করুন।', 400);
    }

    if (newPassword.length < 6) {
      return sendError(res, 'নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।', 400);
    }

    const validOtp = await Otp.findOne({
      phone: phone.trim(),
      otp: otp.trim(),
      isUsed: false,
      expiresAt: { $gt: new Date() }
    });

    if (!validOtp) {
      return sendError(res, 'অবৈধ বা মেয়াদোত্তীর্ণ OTP।', 400);
    }

    const user = await User.findOne({ phone: phone.trim() });
    if (!user) {
      return sendError(res, 'ইউজার পাওয়া যায়নি।', 404);
    }

    user.password = newPassword;
    await user.save();

    // Mark OTP as used
    validOtp.isUsed = true;
    await validOtp.save();

    return sendSuccess(res, null, 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে। নতুন পাসওয়ার্ড দিয়ে লগইন করুন।');
  } catch (error) {
    next(error);
  }
};
