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

        // Helper to save and broadcast chat messages
        const saveAndBroadcastChat = async (classId, message, senderId, senderName, senderPhoto, timestamp = Date.now()) => {
            try {
                // Save message to database
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

                // Broadcast to all users in the classroom
                io.to(classId).emit('chat-message-received', {
                    message,
                    senderId,
                    senderName,
                    senderPhoto,
                    timestamp
                });
            } catch (error) {
                console.error('❌ Error saving chat message:', error);
                // Still broadcast even if save fails
                io.to(classId).emit('chat-message-received', {
                    message,
                    senderId,
                    senderName,
                    senderPhoto,
                    timestamp
                });
            }
        };

        // ✨ Handle chat messages
        socket.on('chat-message', async (data) => {
            console.log('Chat message received:', data);
            const { classId, message, senderId, senderName, senderPhoto, timestamp } = data;
            await saveAndBroadcastChat(classId, message, senderId, senderName, senderPhoto, timestamp);
        });

        // ... (other events)

        // ✨ Handle Raise Hand
        socket.on('raise-hand', async (data) => {
            console.log('Raise hand received:', data);
            const { classId, userId, isRaised, userName, userPhoto } = data; // Added userPhoto

            // Broadcast to all users in the classroom (including sender, to confirm)
            io.to(classId).emit('raise-hand-updated', {
                userId,
                isRaised,
                userName
            });

            // ✨ Auto-log to chat if raised
            if (isRaised) {
                await saveAndBroadcastChat(classId, '✋ Raised Hand', userId, userName, userPhoto);
            }
        });

        // ✨ Handle Emoji
        socket.on('send-emoji', async (data) => {
            console.log('Emoji received:', data);
            const { classId, userId, emoji, userName, userPhoto } = data; // Added userPhoto

            // Broadcast to all users in the classroom (including sender for confirmation/sync)
            io.to(classId).emit('emoji-sent', {
                userId,
                emoji,
                userName,
                timestamp: Date.now()
            });

            // ✨ Auto-log to chat
            await saveAndBroadcastChat(classId, emoji, userId, userName, userPhoto);
        });

        // ✨ Handle adding classroom events
        socket.on('add-classroom-event', async (data) => {
            console.log('Add classroom event received:', data);
            const { classId, event } = data;

            try {
                // Save event to database
                await Class.findByIdAndUpdate(
                    classId,
                    {
                        $push: {
                            classroomEvents: event
                        }
                    },
                    { new: true }
                );

                // Broadcast to all users in the classroom
                io.to(classId).emit('classroom-event-added', event);
            } catch (error) {
                console.error('❌ Error saving classroom event:', error);
                // Still broadcast for UI responsiveness
                io.to(classId).emit('classroom-event-added', event);
            }
        });


        // ✨ Handle triggering classroom events (e.g., Random Student)
        socket.on('trigger-classroom-event', async (data) => {
            console.log('Trigger classroom event received:', data);
            const { classId, eventId, updates } = data;

            try {
                // Update specific event in database
                // We need to find the class, then find the subdocument in classroomEvents array matches eventId
                // and update its fields (e.g. results)

                await Class.findOneAndUpdate(
                    { _id: classId, "classroomEvents.id": eventId },
                    {
                        $set: {
                            "classroomEvents.$.results": updates.results,
                            "classroomEvents.$.status": "completed" // Optional status
                        }
                    },
                    { new: true }
                );

                // Broadcast trigger update to all users in the classroom
                io.to(classId).emit('classroom-event-triggered', { eventId, updates });

            } catch (error) {
                console.error('❌ Error triggering classroom event:', error);
                // Still broadcast for UI responsiveness
                io.to(classId).emit('classroom-event-triggered', { eventId, updates });
            }
        });

        // ✨ Handle deleting classroom events
        socket.on('delete-classroom-event', async (data) => {
            console.log('Delete classroom event received:', data);
            const { classId, eventId } = data;

            try {
                // Remove event from database
                await Class.findByIdAndUpdate(
                    classId,
                    {
                        $pull: {
                            classroomEvents: { id: eventId }
                        }
                    },
                    { new: true }
                );

                // Broadcast deletion to all users in the classroom
                io.to(classId).emit('classroom-event-deleted', { eventId });
                console.log(`✅ Event ${eventId} deleted from class ${classId}`);
            } catch (error) {
                console.error('❌ Error deleting classroom event:', error);
            }
        });

        // ✨ Handle Answer Submission
        socket.on('submit-event-answer', async (data) => {
            console.log('Submit event answer received:', data);
            const { classId, eventId, answer } = data;

            try {
                // Find class and push answer to specific event results
                await Class.findOneAndUpdate(
                    { _id: classId, "classroomEvents.id": eventId },
                    {
                        $push: {
                            "classroomEvents.$.results": answer
                        }
                    },
                    { new: true }
                );

                // Broadcast update to all clients
                // We construct the update payload to match what the frontend expects
                // Frontend expects { eventId, updates: { results: [...] } }
                // But wait, broadcasting the WHOLE results array is safer to ensure sync.
                // Or just the new answer? 

                // Let's get the updated doc to be sure
                const updatedClass = await Class.findById(classId);
                const updatedEvent = updatedClass.classroomEvents.find(e => e.id === eventId);

                io.to(classId).emit('classroom-event-updated', {
                    eventId,
                    updates: { results: updatedEvent.results }
                });

                console.log(`✅ Answer added to event ${eventId}`);

            } catch (error) {
                console.error('❌ Error submitting answer:', error);
            }
        });

        // ✨ Handle Raise Hand
        socket.on('raise-hand', (data) => {
            console.log('Raise hand received:', data);
            const { classId, userId, isRaised, userName } = data;

            // Broadcast to all users in the classroom (including sender, to confirm)
            io.to(classId).emit('raise-hand-updated', {
                userId,
                isRaised,
                userName
            });
        });

        // ✨ Handle Emoji
        socket.on('send-emoji', (data) => {
            console.log('Emoji received:', data);
            const { classId, userId, emoji, userName } = data;

            // Broadcast to all users in the classroom (including sender for confirmation/sync)
            io.to(classId).emit('emoji-sent', {
                userId,
                emoji,
                userName,
                timestamp: Date.now()
            });
        });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });
    });
};
