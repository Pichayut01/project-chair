const express = require('express');
const router = express.Router();
const presetController = require('../controllers/presetController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, presetController.getAllPresets);
router.post('/', authMiddleware, presetController.createPreset);
router.get('/templates/public', authMiddleware, presetController.getPublicTemplates);
router.get('/:id', authMiddleware, presetController.getPresetById);
router.put('/:id', authMiddleware, presetController.updatePreset);
router.delete('/:id', authMiddleware, presetController.deletePreset);
router.post('/:id/use', authMiddleware, presetController.usePreset);
router.post('/:id/duplicate', authMiddleware, presetController.duplicatePreset);

module.exports = router;
