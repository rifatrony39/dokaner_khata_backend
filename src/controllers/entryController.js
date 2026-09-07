const Entry = require('../models/Entry');
const Customer = require('../models/Customer');
const { sendSuccess, sendError } = require('../utils/responseHandler');

// @desc    Get entries list
// @route   GET /api/v1/entries
// @access  Private
exports.getEntries = async (req, res, next) => {
  try {
    const { customerId, customer_id, limit, page } = req.query;
    const storeId = req.store._id;

    let query = { storeId, isDeleted: false };
    const custId = customerId || customer_id;
    if (custId) {
      query.customerId = custId;
    }

    let entryQuery = Entry.find(query)
      .populate('customerId', 'name initialLetters avatarColorHex')
      .sort({ createdAt: -1, date: -1 });

    if (limit) {
      const l = parseInt(limit, 10) || 20;
      const p = parseInt(page, 10) || 1;
      entryQuery = entryQuery.skip((p - 1) * l).limit(l);
    }

    const entries = await entryQuery;
    return sendSuccess(res, entries, 'লেনদেনের তালিকা লোড করা হয়েছে');
  } catch (error) {
    next(error);
  }
};

// @desc    Add new transaction entry (gave or got)
// @route   POST /api/v1/entries
// @access  Private
exports.createEntry = async (req, res, next) => {
  try {
    const {
      customerId,
      customer_id,
      amount,
      type,
      note,
      date,
      billImageUrl,
      bill_image_url,
      clientRefId,
      client_ref_id
    } = req.body;

    const targetCustomerId = customerId || customer_id;
    const numericAmount = parseFloat(amount);

    if (!targetCustomerId) {
      return sendError(res, 'গ্রাহক নির্বাচন করুন', 400);
    }

    if (!numericAmount || numericAmount <= 0) {
      return sendError(res, 'বৈধ টাকার পরিমাণ প্রদান করুন', 400);
    }

    if (!['gave', 'got'].includes(type)) {
      return sendError(res, 'লেনদেনের ধরন (gave অথবা got) হতে হবে', 400);
    }

    const customer = await Customer.findOne({
      _id: targetCustomerId,
      storeId: req.store._id,
      isDeleted: false
    });

    if (!customer) {
      return sendError(res, 'গ্রাহক পাওয়া যায়নি', 404);
    }

    // 1. Create Entry
    const entry = await Entry.create({
      storeId: req.store._id,
      customerId: customer._id,
      customerName: customer.name,
      customerInitials: customer.initialLetters,
      amount: numericAmount,
      type,
      note: note || (type === 'gave' ? 'চাল-ডাল বাকি' : 'পরিশোধ'),
      date: date ? new Date(date) : new Date(),
      billImageUrl: billImageUrl || bill_image_url || null,
      avatarColorHex: customer.avatarColorHex,
      clientRefId: clientRefId || client_ref_id || null
    });

    // 2. Adjust customer balance
    if (type === 'gave') {
      customer.totalDue += numericAmount;
    } else {
      customer.totalDue = Math.max(0, customer.totalDue - numericAmount);
    }
    customer.isSettled = customer.totalDue <= 0;
    await customer.save();

    return sendSuccess(res, {
      entry,
      updatedTotalDue: customer.totalDue,
      isSettled: customer.isSettled
    }, 'লেনদেন সফলভাবে লিপিবদ্ধ করা হয়েছে', 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete entry (Soft delete & reverse balance)
// @route   DELETE /api/v1/entries/:id
// @access  Private
exports.deleteEntry = async (req, res, next) => {
  try {
    const entry = await Entry.findOne({
      _id: req.params.id,
      storeId: req.store._id,
      isDeleted: false
    });

    if (!entry) {
      return sendError(res, 'লেনদেন এন্ট্রি পাওয়া যায়নি', 404);
    }

    // Reverse balance on customer
    const customer = await Customer.findOne({
      _id: entry.customerId,
      storeId: req.store._id
    });

    if (customer) {
      if (entry.type === 'gave') {
        customer.totalDue = Math.max(0, customer.totalDue - entry.amount);
      } else {
        customer.totalDue += entry.amount;
      }
      customer.isSettled = customer.totalDue <= 0;
      await customer.save();
    }

    entry.isDeleted = true;
    await entry.save();

    return sendSuccess(res, null, 'লেনদেন সফলভাবে বাতিল করা হয়েছে');
  } catch (error) {
    next(error);
  }
};
