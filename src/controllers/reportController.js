const Customer = require('../models/Customer');
const Entry = require('../models/Entry');
const { sendSuccess } = require('../utils/responseHandler');

// @desc    Get dashboard metrics and summaries
// @route   GET /api/v1/reports/dashboard
// @access  Private
exports.getDashboardSummary = async (req, res, next) => {
  try {
    const storeId = req.store._id;

    // Start and end of today
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // Start and end of current month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // 1. Total due from customers
    const totalDueAgg = await Customer.aggregate([
      { $match: { storeId, isDeleted: false } },
      { $group: { _id: null, totalDue: { $sum: '$totalDue' }, count: { $sum: 1 } } }
    ]);

    const totalDue = totalDueAgg.length > 0 ? totalDueAgg[0].totalDue : 0;
    const totalCustomersCount = totalDueAgg.length > 0 ? totalDueAgg[0].count : 0;

    // 2. Today's entries count
    const todaysEntriesCount = await Entry.countDocuments({
      storeId,
      isDeleted: false,
      date: { $gte: startOfToday, $lte: endOfToday }
    });

    // 3. Monthly given and received aggregates
    const monthlyAgg = await Entry.aggregate([
      {
        $match: {
          storeId,
          isDeleted: false,
          date: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: '$type',
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    let monthlyGiven = 0;
    let monthlyReceived = 0;

    monthlyAgg.forEach(item => {
      if (item._id === 'gave') monthlyGiven = item.totalAmount;
      if (item._id === 'got') monthlyReceived = item.totalAmount;
    });

    return sendSuccess(res, {
      totalDue,
      totalCustomersCount,
      todaysEntriesCount,
      monthlyGiven,
      monthlyReceived
    }, 'ড্যাশবোর্ড সামারি লোড করা হয়েছে');
  } catch (error) {
    next(error);
  }
};

// @desc    Get monthly reports and weekly trends
// @route   GET /api/v1/reports/monthly
// @access  Private
exports.getMonthlyReport = async (req, res, next) => {
  try {
    const storeId = req.store._id;
    const { year, month } = req.query;

    const now = new Date();
    const targetYear = year ? parseInt(year, 10) : now.getFullYear();
    const targetMonth = month ? parseInt(month, 10) - 1 : now.getMonth();

    const startOfMonth = new Date(targetYear, targetMonth, 1);
    const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

    const monthlyEntries = await Entry.find({
      storeId,
      isDeleted: false,
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });

    let totalGiven = 0;
    let totalReceived = 0;

    // Calculate 4 weekly buckets
    const weekBuckets = [0, 0, 0, 0];

    monthlyEntries.forEach(entry => {
      if (entry.type === 'gave') totalGiven += entry.amount;
      if (entry.type === 'got') totalReceived += entry.amount;

      const day = new Date(entry.date).getDate();
      const weekIndex = Math.min(Math.floor((day - 1) / 7), 3);
      weekBuckets[weekIndex] += entry.amount;
    });

    const maxWeek = Math.max(...weekBuckets, 1);
    const weeklyTrendRatios = weekBuckets.map(amount => parseFloat((amount / maxWeek).toFixed(2)));

    // Top 5 debtors for the report
    const topDuesCustomers = await Customer.find({
      storeId,
      isDeleted: false,
      totalDue: { $gt: 0 }
    }).sort({ totalDue: -1 }).limit(5);

    return sendSuccess(res, {
      year: targetYear,
      month: targetMonth + 1,
      totalGivenMonth: totalGiven,
      totalReceivedMonth: totalReceived,
      weeklyTrendRatios,
      topDuesCustomers
    }, 'মাসিক রিপোর্ট লোড করা হয়েছে');
  } catch (error) {
    next(error);
  }
};

// @desc    Get top customers with highest due
// @route   GET /api/v1/reports/top-dues
// @access  Private
exports.getTopDues = async (req, res, next) => {
  try {
    const storeId = req.store._id;
    const topDues = await Customer.find({
      storeId,
      isDeleted: false,
      totalDue: { $gt: 0 }
    }).sort({ totalDue: -1 }).limit(10);

    return sendSuccess(res, topDues, 'শীর্ষ বকেয়া তালিকা লোড করা হয়েছে');
  } catch (error) {
    next(error);
  }
};
