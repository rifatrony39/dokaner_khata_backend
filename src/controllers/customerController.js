const Customer = require('../models/Customer');
const Entry = require('../models/Entry');
const { sendSuccess, sendError } = require('../utils/responseHandler');

// @desc    Get all customers for the authenticated store
// @route   GET /api/v1/customers
// @access  Private
exports.getCustomers = async (req, res, next) => {
  try {
    const { search, filter, page, limit } = req.query;
    const storeId = req.store._id;

    let query = { storeId, isDeleted: false };

    // Search query
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: searchRegex }, { phone: searchRegex }];
    }

    let sort = { totalDue: -1 }; // Default highest due first
    if (filter === 'byName') {
      sort = { name: 1 };
    } else if (filter === 'recent') {
      sort = { createdAt: -1 };
    }

    let customerQuery = Customer.find(query).sort(sort);

    if (page && limit) {
      const p = parseInt(page, 10) || 1;
      const l = parseInt(limit, 10) || 20;
      customerQuery = customerQuery.skip((p - 1) * l).limit(l);
    }

    const customers = await customerQuery;
    return sendSuccess(res, customers, 'গ্রাহকদের তালিকা লোড করা হয়েছে');
  } catch (error) {
    next(error);
  }
};

// @desc    Create new customer
// @route   POST /api/v1/customers
// @access  Private
exports.createCustomer = async (req, res, next) => {
  try {
    const {
      name,
      phone,
      initial_letters,
      initialLetters,
      total_due,
      totalDue,
      avatar_color_hex,
      avatarColorHex,
      address,
      clientRefId,
      client_ref_id
    } = req.body;

    if (!name || !phone) {
      return sendError(res, 'গ্রাহকের নাম ও ফোন নম্বর প্রয়োজন।', 400);
    }

    const dueAmount = parseFloat(totalDue !== undefined ? totalDue : (total_due || 0)) || 0;
    const initials = initialLetters || initial_letters || (name.trim().length >= 2 ? name.trim().substring(0, 2) : name.trim().substring(0, 1));
    const colorHex = avatarColorHex || avatar_color_hex || 0xFF16A085;

    const customer = await Customer.create({
      storeId: req.store._id,
      name: name.trim(),
      phone: phone.trim(),
      initialLetters: initials,
      totalDue: dueAmount,
      isSettled: dueAmount <= 0,
      avatarColorHex: colorHex,
      address: address || '',
      clientRefId: clientRefId || client_ref_id || null
    });

    // If initial due > 0, create an initial entry
    if (dueAmount > 0) {
      await Entry.create({
        storeId: req.store._id,
        customerId: customer._id,
        customerName: customer.name,
        customerInitials: customer.initialLetters,
        amount: dueAmount,
        type: 'gave',
        note: 'পূর্বের বাকি (প্রারম্ভিক ব্যালেন্স)',
        date: new Date(),
        avatarColorHex: customer.avatarColorHex
      });
    }

    return sendSuccess(res, customer, 'নতুন গ্রাহক সফলভাবে যুক্ত করা হয়েছে', 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Get customer by ID with transaction history
// @route   GET /api/v1/customers/:id
// @access  Private
exports.getCustomerById = async (req, res, next) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      storeId: req.store._id,
      isDeleted: false
    });

    if (!customer) {
      return sendError(res, 'গ্রাহক পাওয়া যায়নি', 404);
    }

    const entries = await Entry.find({
      customerId: customer._id,
      storeId: req.store._id,
      isDeleted: false
    })
    .populate('customerId', 'name initialLetters avatarColorHex')
    .sort({ createdAt: -1, date: -1 });

    return sendSuccess(res, {
      customer,
      entries
    }, 'গ্রাহকের বিস্তারিত লোড করা হয়েছে');
  } catch (error) {
    next(error);
  }
};

// @desc    Update customer
// @route   PUT /api/v1/customers/:id
// @access  Private
exports.updateCustomer = async (req, res, next) => {
  try {
    const { name, phone, address, avatarColorHex, avatar_color_hex } = req.body;

    const customer = await Customer.findOne({
      _id: req.params.id,
      storeId: req.store._id,
      isDeleted: false
    });

    if (!customer) {
      return sendError(res, 'গ্রাহক পাওয়া যায়নি', 404);
    }

    let infoChanged = false;
    if (name && name.trim() !== customer.name) {
      customer.name = name.trim();
      customer.initialLetters = customer.name.length >= 2 ? customer.name.substring(0, 2) : customer.name.substring(0, 1);
      infoChanged = true;
    }
    if (phone) customer.phone = phone.trim();
    if (address !== undefined) customer.address = address;
    if (avatarColorHex || avatar_color_hex) {
      customer.avatarColorHex = avatarColorHex || avatar_color_hex;
      infoChanged = true;
    }

    await customer.save();

    // Dynamically sync all previous entries of this customer with updated name/initials/color
    if (infoChanged) {
      await Entry.updateMany(
        { customerId: customer._id },
        {
          customerName: customer.name,
          customerInitials: customer.initialLetters,
          avatarColorHex: customer.avatarColorHex
        }
      );
    }

    return sendSuccess(res, customer, 'গ্রাহকের তথ্য আপডেট হয়েছে');
  } catch (error) {
    next(error);
  }
};

// @desc    Soft delete customer
// @route   DELETE /api/v1/customers/:id
// @access  Private
exports.deleteCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      storeId: req.store._id,
      isDeleted: false
    });

    if (!customer) {
      return sendError(res, 'গ্রাহক পাওয়া যায়নি', 404);
    }

    customer.isDeleted = true;
    await customer.save();

    return sendSuccess(res, null, 'গ্রাহক মুছে ফেলা হয়েছে');
  } catch (error) {
    next(error);
  }
};
