const express = require('express');
const router = express.Router();
const entryController = require('../controllers/entryController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/', entryController.getEntries);
router.post('/', entryController.createEntry);
router.delete('/:id', entryController.deleteEntry);

module.exports = router;
