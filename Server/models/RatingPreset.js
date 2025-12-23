// presets-backend/models/RatingPreset.js

const mongoose = require('mongoose');

const ratingPresetSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    creatorName: {
        type: String,
        required: true
    },
    classroomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: true
    },
    criteria: [{
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 50
        },
        maxScore: {
            type: Number,
            required: true,
            min: 1,
            max: 100,
            default: 10
        },
        weight: {
            type: Number,
            min: 0,
            max: 1,
            default: 1
        },
        description: {
            type: String,
            trim: true,
            maxlength: 200
        }
    }],
    totalMaxScore: {
        type: Number,
        min: 1,
        default: 1
    },
    isPublic: {
        type: Boolean,
        default: false
    },
    isTemplate: {
        type: Boolean,
        default: false
    },
    tags: [{
        type: String,
        trim: true,
        maxlength: 30
    }],
    emoji: {
        type: String,
        trim: true,
        maxlength: 10,
        default: '⭐'
    },
    type: {
        type: String,
        enum: ['positive', 'negative'],
        default: 'positive'
    },
    scoreType: {
        type: String,
        enum: ['add', 'subtract'],
        default: 'add'
    },
    scoreValue: {
        type: Number,
        min: 1,
        max: 100,
        default: 5
    },
    notifyStudent: {
        type: Boolean,
        default: true
    },
    usageCount: {
        type: Number,
        default: 0
    },
    lastUsed: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt field before saving
ratingPresetSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Calculate total max score before saving
ratingPresetSchema.pre('save', function(next) {
    if (this.criteria && this.criteria.length > 0) {
        this.totalMaxScore = this.criteria.reduce((total, criterion) => {
            return total + (criterion.maxScore * (criterion.weight || 1));
        }, 0);
    } else {
        // If no criteria, set a default value
        this.totalMaxScore = 1;
    }
    next();
});

// Index for better query performance
ratingPresetSchema.index({ creator: 1, classroomId: 1 });
ratingPresetSchema.index({ isPublic: 1, isTemplate: 1 });
ratingPresetSchema.index({ createdAt: -1 });

const RatingPreset = mongoose.model('RatingPreset', ratingPresetSchema);

module.exports = RatingPreset;
