const Class = require('../models/Class');
const User = require('../models/User');

exports.getClassrooms = async (req, res) => {
    try {
        const userId = req.user._id;
        const classrooms = await Class.find({
            $or: [
                { creator: userId },
                { participants: userId }
            ]
        }).populate('creator', 'displayName photoURL _id');
        res.json(classrooms);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.createClassroom = async (req, res) => {
    const { name, subname, imageUrl, color, rows, cols, seatingPositions } = req.body;
    const userId = req.user._id;

    try {
        const classCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        const newClass = new Class({
            name,
            subname,
            imageUrl,
            color,
            creator: [userId],
            participants: [userId],
            classCode,
            rows,
            cols,
            seatingPositions
        });

        await newClass.save();

        await User.findByIdAndUpdate(userId, { $push: { createdClasses: newClass._id, enrolledClasses: newClass._id } });

        res.status(201).json({
            msg: 'Class created successfully!',
            class: newClass
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.joinClassroom = async (req, res) => {
    const { classCode } = req.body;
    const userId = req.user._id;

    try {
        const classToJoin = await Class.findOne({ classCode });

        if (!classToJoin) {
            return res.status(404).json({ msg: 'Invalid class code. Class not found.' });
        }

        if (classToJoin.participants.includes(userId)) {
            return res.status(400).json({ msg: 'You are already a participant in this class.' });
        }

        classToJoin.participants.push(userId);
        await classToJoin.save();
        await User.findByIdAndUpdate(userId, { $push: { enrolledClasses: classToJoin._id } });

        res.status(200).json({ msg: 'Joined class successfully!', class: classToJoin });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.getClassroom = async (req, res) => {
    try {
        const userId = req.user._id;
        const classroom = await Class.findById(req.params.id)
            .populate('creator', 'displayName photoURL _id')
            .populate('participants', 'displayName photoURL');

        if (!classroom) {
            return res.status(404).json({ msg: 'Classroom not found' });
        }

        const isCreator = classroom.creator.some(creator => creator._id.toString() === userId.toString());
        const isParticipant = classroom.participants.some(participant => participant._id.toString() === userId.toString());
        const isMember = isCreator || isParticipant;

        if (classroom.isPublic && !isMember) {
            classroom.participants.push(userId);
            await classroom.save();

            await User.findByIdAndUpdate(userId, {
                $addToSet: { enrolledClasses: classroom._id }
            });

            const updatedClassroom = await Class.findById(req.params.id)
                .populate('creator', 'displayName photoURL _id')
                .populate('participants', 'displayName photoURL');

            return res.json(updatedClassroom);
        }

        if (!classroom.isPublic && !isMember) {
            return res.status(403).json({
                msg: 'Access denied. This classroom is private and requires an invitation.',
                requiresInvitation: true
            });
        }

        res.json(classroom);
    } catch (err) {
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Classroom not found' });
        }
        res.status(500).send('Server Error');
    }
};

exports.updateSeating = async (req, res) => {
    const { classId } = req.params;
    const { seatingPositions, assignedUsers, studentScores, chairGroups } = req.body;
    try {
        const updateObj = {};
        if (seatingPositions) updateObj.seatingPositions = seatingPositions;
        if (assignedUsers) updateObj.assignedUsers = assignedUsers;
        if (studentScores) updateObj.studentScores = studentScores;
        if (chairGroups) updateObj.chairGroups = chairGroups;

        const classroom = await Class.findByIdAndUpdate(classId, updateObj, { new: true });
        if (!classroom) {
            return res.status(404).json({ msg: 'Classroom not found' });
        }

        res.json({
            msg: 'Seating positions updated',
            seatingPositions: classroom.seatingPositions,
            assignedUsers: classroom.assignedUsers,
            studentScores: classroom.studentScores,
            chairGroups: classroom.chairGroups
        });
    } catch (err) {
        console.error('Error updating seating positions:', err);
        res.status(500).send('Server error');
    }
};

exports.leaveClassroom = async (req, res) => {
    const { classId } = req.params;
    const userId = req.user._id;

    try {
        const classroom = await Class.findById(classId);
        if (!classroom) return res.status(404).json({ msg: 'Classroom not found' });

        const isCreator = classroom.creator.map(id => id.toString()).includes(userId.toString());

        if (isCreator) {
            if (classroom.creator.length > 1) {
                classroom.creator = classroom.creator.filter(id => id.toString() !== userId.toString());
                classroom.participants = classroom.participants.filter(id => id.toString() !== userId.toString());
                await classroom.save();
                await User.findByIdAndUpdate(userId, { $pull: { createdClasses: classId, enrolledClasses: classId, pinnedClasses: classId } });
                return res.json({ msg: 'You have left your creator role.' });
            } else {
                try {
                    await Class.findByIdAndDelete(classId);
                    await User.updateMany({}, { $pull: { createdClasses: classId, enrolledClasses: classId, pinnedClasses: classId } });
                    return res.json({ msg: 'Classroom deleted as you were the sole creator.' });
                } catch (deleteErr) {
                    return res.status(500).send('Server error during classroom deletion.');
                }
            }
        }

        await Class.findByIdAndUpdate(classId, {
            $pull: { participants: userId },
        });

        if (classroom.assignedUsers) {
            let changed = false;
            for (const seat in classroom.assignedUsers) {
                if (classroom.assignedUsers[seat]?.userId?.toString() === userId.toString()) {
                    delete classroom.assignedUsers[seat];
                    changed = true;
                }
            }
            if (changed) {
                classroom.markModified('assignedUsers');
                await classroom.save();
            }
        }

        await User.findByIdAndUpdate(userId, {
            $pull: {
                enrolledClasses: classId,
                pinnedClasses: classId
            }
        });

        res.json({ msg: 'Successfully left the classroom.' });
    } catch (err) {
        console.error('Error leaving classroom:', err);
        res.status(500).send('Server error');
    }
};

exports.kickUser = async (req, res) => {
    const { classId } = req.params;
    const { userId } = req.body;
    try {
        const classroom = await Class.findById(classId);
        if (!classroom) return res.status(404).json({ msg: 'Classroom not found' });

        if (!classroom.creator.map(id => id.toString()).includes(req.user.id.toString())) {
            return res.status(403).json({ msg: 'Only creator can kick members' });
        }

        if (classroom.creator.map(id => id.toString()).includes(userId)) {
            return res.status(403).json({ msg: 'Cannot kick another creator. Only the original creator can demote creators.' });
        }

        classroom.participants = classroom.participants.filter(id => id.toString() !== userId);

        for (const key in classroom.assignedUsers) {
            if (classroom.assignedUsers[key]?.userId === userId) {
                delete classroom.assignedUsers[key];
            }
        }

        classroom.markModified('assignedUsers');
        await classroom.save();
        res.json({ msg: 'Kicked successfully', classroom });
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.promoteUser = async (req, res) => {
    const { classId } = req.params;
    const { userId } = req.body;
    try {
        const classroom = await Class.findById(classId);
        if (!classroom) return res.status(404).json({ msg: 'Classroom not found' });

        if (!classroom.creator.map(id => id.toString()).includes(req.user.id.toString())) {
            return res.status(403).json({ msg: 'Only a creator can promote members' });
        }

        if (classroom.creator.map(id => id.toString()).includes(userId.toString())) {
            return res.status(400).json({ msg: 'User is already a creator' });
        }

        classroom.creator.push(userId);
        await classroom.save();
        await User.findByIdAndUpdate(userId, { $addToSet: { createdClasses: classId } });
        res.json({ msg: 'Promoted successfully', classroom });
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.demoteUser = async (req, res) => {
    const { classId } = req.params;
    const { userId } = req.body;

    try {
        const classroom = await Class.findById(classId);
        if (!classroom) return res.status(404).json({ msg: 'Classroom not found' });

        const originalCreatorId = classroom.creator[0]?.toString();
        if (req.user.id.toString() !== originalCreatorId) {
            return res.status(403).json({ msg: 'Only a creator can demote members' });
        }

        if (classroom.creator.length <= 1) {
            return res.status(400).json({ msg: 'Cannot demote the last creator of the classroom.' });
        }

        classroom.creator = classroom.creator.filter(id => id.toString() !== userId.toString());
        await classroom.save();

        await User.findByIdAndUpdate(userId, { $pull: { createdClasses: classId } });

        res.json({ msg: 'User demoted successfully', classroom });
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.updateTheme = async (req, res) => {
    const { classId } = req.params;
    const { name, subname, color, bannerUrl } = req.body;
    const userId = req.user.id;

    try {
        const classroom = await Class.findById(classId);
        if (!classroom) return res.status(404).json({ msg: 'Classroom not found' });

        if (!classroom.creator.map(id => id.toString()).includes(userId.toString())) {
            return res.status(403).json({ msg: 'Authorization denied. Only creators can edit the theme.' });
        }

        classroom.name = name || classroom.name;
        classroom.subname = subname || classroom.subname;
        classroom.color = color || classroom.color;
        classroom.bannerUrl = bannerUrl;

        const updatedClassroom = await classroom.save();
        res.json(updatedClassroom);
    } catch (err) {
        res.status(500).send('Server error');
    }
};

exports.getChatHistory = async (req, res) => {
    const { classId } = req.params;
    const limit = parseInt(req.query.limit) || 100; // Default to last 100 messages

    try {
        console.log('📥 Fetching chat history for classroom:', classId);

        const classroom = await Class.findById(classId);
        if (!classroom) {
            console.log('❌ Classroom not found:', classId);
            return res.status(404).json({ msg: 'Classroom not found' });
        }

        // Verify user is a member of the classroom
        const userId = req.user._id.toString();
        const isCreator = classroom.creator.some(id => id.toString() === userId);
        const isParticipant = classroom.participants.some(id => id.toString() === userId);

        if (!isCreator && !isParticipant) {
            console.log('🚫 Access denied for user:', userId);
            return res.status(403).json({ msg: 'Access denied. You are not a member of this classroom.' });
        }

        // ✨ CRITICAL FIX: Initialize chatMessages if undefined (for existing classrooms)
        if (!classroom.chatMessages) {
            console.log('⚠️ chatMessages undefined, initializing empty array');
            classroom.chatMessages = [];
            await classroom.save();
        }

        // Get the last N messages
        const chatMessages = classroom.chatMessages.slice(-limit);

        console.log('✅ Returning', chatMessages.length, 'chat messages for classroom:', classId);
        res.json({ chatMessages });
    } catch (err) {
        console.error('❌ Error fetching chat history:', err);
        res.status(500).send('Server error');
    }
};
