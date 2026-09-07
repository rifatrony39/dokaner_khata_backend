const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/', storeController.getStoreInfo);
router.put('/', storeController.updateStoreInfo);

module.exports = router;
