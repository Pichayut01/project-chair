const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

// @route   GET /api/public/stats
// @desc    Get public statistics for landing page
// @access  Public
router.get('/stats', publicController.getStats);

module.exports = router;
