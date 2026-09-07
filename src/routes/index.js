const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const storeRoutes = require('./storeRoutes');
const customerRoutes = require('./customerRoutes');
const entryRoutes = require('./entryRoutes');
const reportRoutes = require('./reportRoutes');
const syncRoutes = require('./syncRoutes');

router.use('/auth', authRoutes);
router.use('/store', storeRoutes);
router.use('/customers', customerRoutes);
router.use('/entries', entryRoutes);
router.use('/reports', reportRoutes);
router.use('/sync', syncRoutes);

module.exports = router;
