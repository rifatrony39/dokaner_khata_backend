const express = require('express');
const router = express.Router();
const syncController = require('../controllers/syncController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.post('/', syncController.batchSync);

module.exports = router;
