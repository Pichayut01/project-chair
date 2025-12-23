const RatingPreset = require('../models/RatingPreset');

exports.getAllPresets = async (req, res) => {
    try {
        const { classroomId, includePublic } = req.query;
        const userId = req.user._id;

        let query = {};

        if (classroomId) {
            if (includePublic === 'true') {
                query = {
                    classroomId,
                    $or: [
                        { creator: userId },
                        { isPublic: true }
                    ]
                };
            } else {
                query = { classroomId, creator: userId };
            }
        } else {
            query = { creator: userId };
        }

        const presets = await RatingPreset.find(query)
            .populate('creator', 'displayName email photoURL')
            .populate('classroomId', 'name')
            .sort({ updatedAt: -1 });

        res.json({
            success: true,
            count: presets.length,
            data: presets
        });
    } catch (error) {
        console.error('Get presets error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching presets',
            error: error.message
        });
    }
};

exports.getPresetById = async (req, res) => {
    try {
        const preset = await RatingPreset.findById(req.params.id)
            .populate('creator', 'displayName email photoURL')
            .populate('classroomId', 'name');

        if (!preset) {
            return res.status(404).json({
                success: false,
                message: 'Preset not found'
            });
        }

        const userId = req.user._id;
        if (!preset.isPublic && !preset.creator._id.equals(userId)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this preset'
            });
        }

        res.json({
            success: true,
            data: preset
        });
    } catch (error) {
        console.error('Get preset error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching preset',
            error: error.message
        });
    }
};

exports.createPreset = async (req, res) => {
    try {
        const {
            name,
            description,
            classroomId,
            criteria,
            isPublic,
            isTemplate,
            tags,
            emoji,
            type,
            scoreType,
            scoreValue,
            notifyStudent
        } = req.body;

        if (!name || !classroomId || !criteria || criteria.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Name, classroom ID, and at least one criterion are required'
            });
        }

        for (let criterion of criteria) {
            if (!criterion.name || !criterion.maxScore) {
                return res.status(400).json({
                    success: false,
                    message: 'Each criterion must have a name and max score'
                });
            }
        }

        const newPreset = new RatingPreset({
            name,
            description,
            creator: req.user._id,
            creatorName: req.user.displayName || req.user.email,
            classroomId,
            criteria,
            isPublic: isPublic || false,
            isTemplate: isTemplate || false,
            tags: tags || [],
            emoji: emoji || '⭐',
            type: type || 'positive',
            scoreType: scoreType || 'add',
            scoreValue: scoreValue || 5,
            notifyStudent: notifyStudent !== undefined ? notifyStudent : true
        });

        const savedPreset = await newPreset.save();

        const populatedPreset = await RatingPreset.findById(savedPreset._id)
            .populate('creator', 'displayName email photoURL')
            .populate('classroomId', 'name');

        res.status(201).json({
            success: true,
            message: 'Preset created successfully',
            data: populatedPreset
        });
    } catch (error) {
        console.error('Create preset error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while creating preset',
            error: error.message
        });
    }
};

exports.updatePreset = async (req, res) => {
    try {
        const preset = await RatingPreset.findById(req.params.id);

        if (!preset) {
            return res.status(404).json({
                success: false,
                message: 'Preset not found'
            });
        }

        if (!preset.creator.equals(req.user._id)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only edit your own presets'
            });
        }

        const {
            name,
            description,
            criteria,
            isPublic,
            isTemplate,
            tags,
            emoji,
            type,
            scoreType,
            scoreValue,
            notifyStudent
        } = req.body;

        if (name) preset.name = name;
        if (description !== undefined) preset.description = description;
        if (criteria) preset.criteria = criteria;
        if (isPublic !== undefined) preset.isPublic = isPublic;
        if (isTemplate !== undefined) preset.isTemplate = isTemplate;
        if (tags) preset.tags = tags;
        if (emoji !== undefined) preset.emoji = emoji;
        if (type !== undefined) preset.type = type;
        if (scoreType !== undefined) preset.scoreType = scoreType;
        if (scoreValue !== undefined) preset.scoreValue = scoreValue;
        if (notifyStudent !== undefined) preset.notifyStudent = notifyStudent;

        const updatedPreset = await preset.save();

        const populatedPreset = await RatingPreset.findById(updatedPreset._id)
            .populate('creator', 'displayName email photoURL')
            .populate('classroomId', 'name');

        res.json({
            success: true,
            message: 'Preset updated successfully',
            data: populatedPreset
        });
    } catch (error) {
        console.error('Update preset error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating preset',
            error: error.message
        });
    }
};

exports.deletePreset = async (req, res) => {
    try {
        const preset = await RatingPreset.findById(req.params.id);

        if (!preset) {
            return res.status(404).json({
                success: false,
                message: 'Preset not found'
            });
        }

        if (!preset.creator.equals(req.user._id)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only delete your own presets'
            });
        }

        await RatingPreset.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Preset deleted successfully'
        });
    } catch (error) {
        console.error('Delete preset error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting preset',
            error: error.message
        });
    }
};

exports.usePreset = async (req, res) => {
    try {
        const preset = await RatingPreset.findById(req.params.id);

        if (!preset) {
            return res.status(404).json({
                success: false,
                message: 'Preset not found'
            });
        }

        const userId = req.user._id;
        if (!preset.isPublic && !preset.creator.equals(userId)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this preset'
            });
        }

        preset.usageCount += 1;
        preset.lastUsed = new Date();
        await preset.save();

        res.json({
            success: true,
            message: 'Preset usage recorded',
            data: {
                usageCount: preset.usageCount,
                lastUsed: preset.lastUsed
            }
        });
    } catch (error) {
        console.error('Record preset usage error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while recording preset usage',
            error: error.message
        });
    }
};

exports.getPublicTemplates = async (req, res) => {
    try {
        const templates = await RatingPreset.find({
            isTemplate: true,
            isPublic: true
        })
            .populate('creator', 'displayName email photoURL')
            .sort({ usageCount: -1, createdAt: -1 })
            .limit(20);

        res.json({
            success: true,
            count: templates.length,
            data: templates
        });
    } catch (error) {
        console.error('Get public templates error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching public templates',
            error: error.message
        });
    }
};

exports.duplicatePreset = async (req, res) => {
    try {
        const originalPreset = await RatingPreset.findById(req.params.id);

        if (!originalPreset) {
            return res.status(404).json({
                success: false,
                message: 'Preset not found'
            });
        }

        const userId = req.user._id;
        if (!originalPreset.isPublic && !originalPreset.creator.equals(userId)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this preset'
            });
        }

        const { classroomId, name } = req.body;

        if (!classroomId) {
            return res.status(400).json({
                success: false,
                message: 'Classroom ID is required for duplication'
            });
        }

        const duplicatedPreset = new RatingPreset({
            name: name || `${originalPreset.name} (Copy)`,
            description: originalPreset.description,
            creator: userId,
            creatorName: req.user.displayName || req.user.email,
            classroomId,
            criteria: originalPreset.criteria,
            isPublic: false,
            isTemplate: false,
            tags: originalPreset.tags
        });

        const savedPreset = await duplicatedPreset.save();

        const populatedPreset = await RatingPreset.findById(savedPreset._id)
            .populate('creator', 'displayName email photoURL')
            .populate('classroomId', 'name');

        res.status(201).json({
            success: true,
            message: 'Preset duplicated successfully',
            data: populatedPreset
        });
    } catch (error) {
        console.error('Duplicate preset error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while duplicating preset',
            error: error.message
        });
    }
};
