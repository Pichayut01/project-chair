const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const userController = require('../controllers/userController'); // For toggle-pin
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, classController.getClassrooms);
router.post('/create', authMiddleware, classController.createClassroom);
router.post('/join', authMiddleware, classController.joinClassroom);
router.get('/:id', authMiddleware, classController.getClassroom);
router.put('/:classId/seating', authMiddleware, classController.updateSeating);
router.post('/:classId/leave', authMiddleware, classController.leaveClassroom);
router.put('/:classId/kick', authMiddleware, classController.kickUser);
router.put('/:classId/promote', authMiddleware, classController.promoteUser);
router.put('/:classId/demote', authMiddleware, classController.demoteUser);
router.put('/:classId/theme', authMiddleware, classController.updateTheme);

// Toggle pin route is technically under /api/classrooms/:classId/toggle-pin
router.post('/:classId/toggle-pin', authMiddleware, userController.togglePinClass);

module.exports = router;
