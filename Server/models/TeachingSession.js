const mongoose = require('mongoose');

const scoreChangeSchema = new mongoose.Schema({
    studentId: { type: String, required: true },
    studentName: { type: String, default: 'Unknown' },
    category: { type: String, required: true },
    pointsChange: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now }
}, { _id: false });

const topStudentSchema = new mongoose.Schema({
    studentId: { type: String, required: true },
    studentName: { type: String, default: 'Unknown' },
    photoURL: { type: String },
    totalPoints: { type: Number, default: 0 }
}, { _id: false });

const teachingSessionSchema = new mongoose.Schema({
    classroomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    startedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date },
    durationSeconds: { type: Number, default: 0 },
    scoreChanges: [scoreChangeSchema],
    summary: {
        totalScoreChanges: { type: Number, default: 0 },
        studentsScored: { type: Number, default: 0 },
        topStudents: [topStudentSchema]
    }
});

teachingSessionSchema.index({ classroomId: 1, startedAt: -1 });

module.exports = mongoose.model('TeachingSession', teachingSessionSchema);
