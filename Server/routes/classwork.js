const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const Class = require('../models/Class');

// @route   POST /api/classwork/:classId
// @desc    Create a new assignment
// @access  Private (Teacher only)
router.post('/:classId', auth, async (req, res) => {
    try {
        const { title, description, dueDate, points, allowLateSubmission, showScoreToStudents } = req.body;
        const classId = req.params.classId;

        // Verify class exists and user is creator
        const classroom = await Class.findById(classId);
        if (!classroom) {
            return res.status(404).json({ msg: 'Classroom not found' });
        }

        // Check if user is the creator (teacher)
        const isCreator = classroom.creator.some(c => c.toString() === req.user.id);
        if (!isCreator) {
            return res.status(403).json({ msg: 'Not authorized to create assignments in this class' });
        }

        const newAssignment = new Assignment({
            classId,
            title,
            description,
            dueDate: dueDate ? new Date(dueDate) : null,
            points: points || 100,
            allowLateSubmission: allowLateSubmission || false,
            showScoreToStudents: showScoreToStudents !== undefined ? showScoreToStudents : true,
            creator: req.user.id
        });

        const assignment = await newAssignment.save();
        res.json(assignment);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/classwork/:classId
// @desc    Get all assignments for a class
// @access  Private
router.get('/:classId', auth, async (req, res) => {
    try {
        const classId = req.params.classId;

        // Ensure user is part of the class
        const classroom = await Class.findById(classId);
        if (!classroom) {
            return res.status(404).json({ msg: 'Classroom not found' });
        }

        const isCreator = classroom.creator.some(c => c.toString() === req.user.id);
        const isStudent = classroom.participants.some(p => p.toString() === req.user.id);

        if (!isCreator && !isStudent) {
            return res.status(403).json({ msg: 'Not authorized to view assignments' });
        }

        const assignments = await Assignment.find({ classId }).sort({ createdAt: -1 });

        // If user is a student, we also want to attach their submission status
        if (isStudent && !isCreator) {
            const studentAssignments = await Promise.all(assignments.map(async (assignment) => {
                const submission = await AssignmentSubmission.findOne({
                    assignmentId: assignment._id,
                    studentId: req.user.id
                });

                return {
                    ...assignment.toObject(),
                    submission: submission || null
                };
            }));
            return res.json(studentAssignments);
        }

        res.json(assignments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/classwork/:classId/:assignmentId
// @desc    Get single assignment details
// @access  Private
router.get('/:classId/:assignmentId', auth, async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.assignmentId);
        if (!assignment) {
            return res.status(404).json({ msg: 'Assignment not found' });
        }
        res.json(assignment);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/classwork/:classId/:assignmentId/submit
// @desc    Submit an assignment (Student)
// @access  Private
router.post('/:classId/:assignmentId/submit', auth, async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const { attachments } = req.body;

        const assignment = await Assignment.findById(assignmentId);
        if (!assignment) {
            return res.status(404).json({ msg: 'Assignment not found' });
        }

        let isLate = false;
        if (assignment.dueDate && new Date() > assignment.dueDate) {
            if (!assignment.allowLateSubmission) {
                return res.status(400).json({ msg: 'Late submissions are not allowed' });
            }
            isLate = true;
        }

        let submission = await AssignmentSubmission.findOne({
            assignmentId,
            studentId: req.user.id
        });

        if (submission) {
            // Update existing submission
            submission.attachments = attachments || submission.attachments;
            submission.status = isLate ? 'late' : 'submitted';
            submission.submittedAt = Date.now();
            await submission.save();
        } else {
            // Create new submission
            submission = new AssignmentSubmission({
                assignmentId,
                studentId: req.user.id,
                attachments: attachments || [],
                status: isLate ? 'late' : 'submitted'
            });
            await submission.save();
        }

        res.json(submission);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/classwork/:classId/:assignmentId/submissions
// @desc    Get all submissions for an assignment (Teacher only)
// @access  Private
router.get('/:classId/:assignmentId/submissions', auth, async (req, res) => {
    try {
        const { classId, assignmentId } = req.params;

        const classroom = await Class.findById(classId);
        if (!classroom) {
            return res.status(404).json({ msg: 'Classroom not found' });
        }

        const isCreator = classroom.creator.some(c => c.toString() === req.user.id);
        if (!isCreator) {
            return res.status(403).json({ msg: 'Not authorized' });
        }

        const submissions = await AssignmentSubmission.find({ assignmentId })
            .populate('studentId', 'displayName email photoURL');

        res.json(submissions);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/classwork/:classId/:assignmentId/grade/:submissionId
// @desc    Grade a submission (Teacher only)
// @access  Private
router.put('/:classId/:assignmentId/grade/:submissionId', auth, async (req, res) => {
    try {
        const { classId, submissionId } = req.params;
        const { pointsAwarded } = req.body;

        const classroom = await Class.findById(classId);
        if (!classroom) {
            return res.status(404).json({ msg: 'Classroom not found' });
        }

        const isCreator = classroom.creator.some(c => c.toString() === req.user.id);
        if (!isCreator) {
            return res.status(403).json({ msg: 'Not authorized' });
        }

        const submission = await AssignmentSubmission.findById(submissionId);
        if (!submission) {
            return res.status(404).json({ msg: 'Submission not found' });
        }

        submission.pointsAwarded = pointsAwarded;
        submission.status = 'graded';
        await submission.save();

        res.json(submission);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
