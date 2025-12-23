const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/pin-class', authMiddleware, userController.pinClass);

module.exports = router;
