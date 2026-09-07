const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/dashboard', reportController.getDashboardSummary);
router.get('/monthly', reportController.getMonthlyReport);
router.get('/top-dues', reportController.getTopDues);

module.exports = router;
