const Customer = require('../models/Customer');
const Entry = require('../models/Entry');
const { sendSuccess } = require('../utils/responseHandler');

// @desc    Batch sync offline data from mobile app SQLite
// @route   POST /api/v1/sync
// @access  Private
exports.batchSync = async (req, res, next) => {
  try {
    const storeId = req.store._id;
    const { customers = [], entries = [] } = req.body;

    const customerIdMap = {}; // Maps clientRefId (SQLite ID) -> MongoDB _id

    // 1. Sync Customers
    for (const c of customers) {
      const clientRef = (c.id || c.client_ref_id || c.clientRefId || '').toString();
      let customer;

      if (clientRef) {
        customer = await Customer.findOne({ storeId, clientRefId: clientRef });
      }

      if (customer) {
        // Update existing
        customer.name = c.name || customer.name;
        customer.phone = c.phone || customer.phone;
        customer.totalDue = c.total_due !== undefined ? c.total_due : (c.totalDue !== undefined ? c.totalDue : customer.totalDue);
        customer.isSettled = customer.totalDue <= 0;
        await customer.save();
      } else {
        // Create new
        const due = parseFloat(c.total_due || c.totalDue || 0);
        customer = await Customer.create({
          storeId,
          name: c.name,
          phone: c.phone,
          initialLetters: c.initial_letters || c.initialLetters || (c.name ? c.name.substring(0, 2) : ''),
          totalDue: due,
          isSettled: due <= 0,
          avatarColorHex: c.avatar_color_hex || c.avatarColorHex || 0xFF16A085,
          clientRefId: clientRef || null
        });
      }

      if (clientRef) {
        customerIdMap[clientRef] = customer._id;
      }
    }

    // 2. Sync Entries
    for (const e of entries) {
      const entryClientRef = (e.id || e.client_ref_id || e.clientRefId || '').toString();
      let existingEntry;

      if (entryClientRef) {
        existingEntry = await Entry.findOne({ storeId, clientRefId: entryClientRef });
      }

      if (!existingEntry) {
        const rawCustId = (e.customer_id || e.customerId || '').toString();
        // Resolve customerId to MongoDB ObjectId
        const resolvedCustomerId = customerIdMap[rawCustId] || (rawCustId.length === 24 ? rawCustId : null);

        if (resolvedCustomerId) {
          await Entry.create({
            storeId,
            customerId: resolvedCustomerId,
            customerName: e.customer_name || e.customerName || 'গ্রাহক',
            customerInitials: e.customer_initials || e.customerInitials || '',
            amount: parseFloat(e.amount || 0),
            type: e.type || 'gave',
            note: e.note || '',
            date: e.date ? new Date(e.date) : new Date(),
            avatarColorHex: e.avatar_color_hex || e.avatarColorHex || 0xFF16A085,
            clientRefId: entryClientRef || null
          });
        }
      }
    }

    // Return latest server state
    const allCustomers = await Customer.find({ storeId, isDeleted: false });
    const allEntries = await Entry.find({ storeId, isDeleted: false }).populate('customerId', 'name initialLetters avatarColorHex').sort({ createdAt: -1, date: -1 });

    return sendSuccess(res, {
      syncedAt: new Date().toISOString(),
      customerIdMap,
      customers: allCustomers,
      entries: allEntries
    }, 'ডেটা সফলভাবে সিঙ্ক সম্পন্ন হয়েছে');
  } catch (error) {
    next(error);
  }
};
