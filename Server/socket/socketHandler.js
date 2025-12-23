const Class = require('../models/Class');

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        // Join classroom room
        socket.on('join-classroom', (data) => {
            const { classId, userId, userName } = data;
            socket.join(classId);
            console.log(`User ${userName} (${userId}) joined classroom ${classId}`);
        });

        // Handle score updates
        socket.on('update-score', (data) => {
            console.log('Score update received:', data);
            const { classId, studentId, newScore, presetName, studentName, updatedBy, timestamp } = data;

            // Emit to all users in the classroom
            socket.to(classId).emit('score-updated', {
                studentId,
                newScore,
                presetName,
                studentName,
                updatedBy,
                timestamp
            });
        });

        // Handle broadcast score updates
        socket.on('broadcast-score-update', (data) => {
            console.log('Broadcasting score update:', data);
            const { classId } = data;

            // Broadcast to all users in the classroom including sender
            io.to(classId).emit('broadcast-score-update', data);
        });

        // Handle chair seating updates
        socket.on('chair-seating-update', (data) => {
            console.log('Chair seating update received:', data);
            const { classId, chairId, assignedUsers, action, userName, updatedBy, timestamp } = data;

            // Emit to all users in the classroom except sender
            socket.to(classId).emit('chair-seating-updated', {
                chairId,
                assignedUsers,
                action,
                userName,
                updatedBy,
                timestamp
            });
        });

        // Handle chair movement updates
        socket.on('chair-movement-update', (data) => {
            console.log('Chair movement update received:', data);
            const { classId, chairPositions, movedChairId, updatedBy, timestamp } = data;

            // Emit to all users in the classroom except sender
            socket.to(classId).emit('chair-moved', {
                chairPositions,
                movedChairId,
                updatedBy,
                timestamp
            });
        });

        // Handle chair group updates
        socket.on('chair-group-update', (data) => {
            console.log('Chair group update received:', data);
            const { classId, chairGroups, updatedBy, timestamp } = data;

            // Emit to all users in the classroom except sender
            socket.to(classId).emit('chair-groups-updated', {
                chairGroups,
                updatedBy,
                timestamp
            });
        });

        // ✨ Handle chat messages
        socket.on('chat-message', async (data) => {
            console.log('Chat message received:', data);
            const { classId, message, senderId, senderName, senderPhoto, timestamp } = data;

            try {
                // Save message to database
                console.log('💾 Saving chat message to database for classroom:', classId);
                await Class.findByIdAndUpdate(
                    classId,
                    {
                        $push: {
                            chatMessages: {
                                senderId,
                                senderName,
                                senderPhoto,
                                message,
                                timestamp
                            }
                        }
                    },
                    { new: true }
                );
                console.log('✅ Chat message saved successfully');

                // Broadcast to all users in the classroom INCLUDING sender (to confirm receipt/ordering)
                io.to(classId).emit('chat-message-received', {
                    message,
                    senderId,
                    senderName,
                    senderPhoto,
                    timestamp
                });
            } catch (error) {
                console.error('❌ Error saving chat message:', error);
                // Still broadcast even if save fails to maintain real-time functionality
                io.to(classId).emit('chat-message-received', {
                    message,
                    senderId,
                    senderName,
                    senderPhoto,
                    timestamp
                });
            }
        });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });
    });
};
