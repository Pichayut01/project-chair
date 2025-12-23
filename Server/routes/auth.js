const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Auth Routes
router.post('/google-login-verify', authController.googleLoginVerify);
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.get('/reset-token-info/:token', authController.getResetTokenInfo);
router.post('/reset-password/:token', authController.resetPassword);

// Protected Auth Routes
router.get('/me', authMiddleware, authController.getMe);
router.put('/change-password', authMiddleware, authController.changePassword);
router.post('/2fa/toggle', authMiddleware, authController.toggle2FA);
router.post('/2fa/verify', authMiddleware, authController.verify2FA);
router.get('/login-history', authMiddleware, authController.getLoginHistory);
router.get('/active-sessions', authMiddleware, authController.getActiveSessions);
router.delete('/sessions/:sessionId', authMiddleware, authController.terminateSession);

// Profile
router.put('/profile/update', authMiddleware, authController.updateProfile);
router.post('/profile/update-photo', [authMiddleware, upload], authController.updatePhoto);
router.delete('/profile/delete-photo', authMiddleware, authController.deletePhoto);

module.exports = router;
