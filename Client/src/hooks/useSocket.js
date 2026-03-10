// src/hooks/useSocket.js

import { useEffect, useRef } from 'react';
import io from 'socket.io-client';

// In production behind reverse proxy, Socket.IO connects to the same host (nginx handles routing)
// In development, connect directly to localhost:5000
const SOCKET_URL = process.env.NODE_ENV === 'production'
    ? window.location.origin
    : (process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000');

export const useSocket = (classId, user, onScoreUpdate, onChairUpdate, onChairMove, onChairGroupUpdate, onChatMessage, onClassroomEventAdded, onClassroomEventTriggered, onClassroomEventDeleted, onRaiseHandUpdated, onEmojiSent, onUserJoined, onUserLeft, onClassroomUpdated, onGroupMemberRemoved, onGroupMemberMoved) => { // ✨ Added group editors
    const socketRef = useRef(null);

    useEffect(() => {
        // ... (dependencies)

        if (!classId || !user) return;

        // ... (connection logic)
        socketRef.current = io(SOCKET_URL, {
            auth: {
                token: user.token,
                classId: classId,
                userId: user.id
            },
            forceNew: true
        });

        socketRef.current.emit('join-classroom', {
            classId: classId,
            userId: user.id,
            userName: user.displayName
        });

        // ... (listeners)
        socketRef.current.on('score-updated', (data) => onScoreUpdate && onScoreUpdate(data));
        socketRef.current.on('broadcast-score-update', (data) => onScoreUpdate && onScoreUpdate(data));
        socketRef.current.on('chair-seating-updated', (data) => onChairUpdate && onChairUpdate(data));
        socketRef.current.on('chair-moved', (data) => onChairMove && onChairMove(data));
        socketRef.current.on('chair-groups-updated', (data) => onChairGroupUpdate && onChairGroupUpdate(data));
        socketRef.current.on('chat-message-received', (data) => onChatMessage && onChatMessage(data));

        socketRef.current.on('raise-hand-updated', (data) => {
            console.log('Socket received raise hand update:', data);
            if (onRaiseHandUpdated) {
                onRaiseHandUpdated(data);
            }
        });

        // ✨ Listen for emojis
        socketRef.current.on('emoji-sent', (data) => {
            console.log('Socket received emoji:', data);
            if (onEmojiSent) {
                onEmojiSent(data);
            }
        });

        // ... (classroom events listeners)
        socketRef.current.on('classroom-event-added', (data) => onClassroomEventAdded && onClassroomEventAdded(data));
        socketRef.current.on('classroom-event-triggered', (data) => onClassroomEventTriggered && onClassroomEventTriggered(data));
        socketRef.current.on('classroom-event-deleted', (data) => onClassroomEventDeleted && onClassroomEventDeleted(data));
        socketRef.current.on('classroom-event-updated', (data) => onClassroomEventTriggered && onClassroomEventTriggered(data));

        // ✨ Listen for classroom updates (generic)
        socketRef.current.on('classroom-updated', (data) => {
            console.log('Socket received classroom-updated:', data);
            if (onClassroomUpdated) onClassroomUpdated(data);
        });

        // ✨ Listen for group edits
        socketRef.current.on('group-member-removed', (data) => {
            console.log('Socket received group member removed:', data);
            if (onGroupMemberRemoved) onGroupMemberRemoved(data);
        });
        socketRef.current.on('group-member-moved', (data) => {
            console.log('Socket received group member moved:', data);
            if (onGroupMemberMoved) onGroupMemberMoved(data);
        });

        // ✨ Listen for user joined (Shotgun approach)
        const handleUserJoinedEvent = (data) => {
            console.log('Socket received user join event:', data);
            if (onUserJoined) onUserJoined(data);
        };
        [
            'user-joined', 'member-joined', 'participant-joined', 'new-member',
            'user:joined', 'member:joined', 'participant:joined',
            'join-room', 'user-connected'
        ].forEach(event => {
            socketRef.current.on(event, handleUserJoinedEvent);
        });

        // ✨ Listen for user left (Shotgun approach)
        const handleUserLeftEvent = (data) => {
            console.log('Socket received user left event:', data);
            if (onUserLeft) onUserLeft(data);
        };
        [
            'user-left', 'member-left', 'participant-left', 'left-room',
            'user:left', 'member:left', 'participant:left',
            'leave-room', 'user-disconnected'
        ].forEach(event => {
            socketRef.current.on(event, handleUserLeftEvent);
        });

        // ... (connect/disconnect)
        socketRef.current.on('connect', () => console.log('Socket connected successfully'));
        socketRef.current.on('connect_error', (error) => console.error('Socket connection error:', error));
        socketRef.current.on('disconnect', () => console.log('Socket disconnected'));

        return () => {
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, [classId, user, onScoreUpdate, onChairUpdate, onChairMove, onChairGroupUpdate, onChatMessage, onClassroomEventAdded, onClassroomEventTriggered, onClassroomEventDeleted, onRaiseHandUpdated, onEmojiSent, onUserJoined, onUserLeft, onClassroomUpdated, onGroupMemberRemoved, onGroupMemberMoved]);

    // ... (emitters)

    const emitScoreUpdate = (studentId, newScore, presetName, studentName) => {
        if (socketRef.current?.connected) {
            const updateData = { classId, studentId, newScore, presetName, studentName, updatedBy: user.id, timestamp: Date.now() };
            socketRef.current.emit('update-score', updateData);
            socketRef.current.emit('broadcast-score-update', updateData);
        }
    };

    // ... (other emitters omitted for brevity, keeping them locally)
    const emitChairSeatingUpdate = (chairId, assignedUsers, action, userName) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('chair-seating-update', { classId, chairId, assignedUsers, action, userName, updatedBy: user.id, timestamp: Date.now() });
        }
    };

    const emitChairMovement = (chairPositions, movedChairId) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('chair-movement-update', { classId, chairPositions, movedChairId, updatedBy: user.id, timestamp: Date.now() });
        }
    };

    const emitChairGroupUpdate = (chairGroups) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('chair-group-update', { classId, chairGroups, updatedBy: user.id, timestamp: Date.now() });
        }
    };

    const emitChatMessage = (message) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('chat-message', { classId, message, senderId: user.id, senderName: user.displayName, senderPhoto: user.photoURL, timestamp: Date.now() });
        }
    };

    const emitSystemMessage = (message) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('chat-message', {
                classId,
                message,
                senderId: 'system',
                senderName: 'System',
                senderPhoto: null,
                timestamp: Date.now(),
                isSystem: true
            });
        }
    };

    const emitAddClassroomEvent = (event) => {
        if (socketRef.current && socketRef.current.connected) {
            const eventData = {
                classId,
                event: { ...event, createdBy: user.id, createdAt: Date.now() }
            };
            console.log('Emitting add classroom event:', eventData);
            socketRef.current.emit('add-classroom-event', eventData);
        }
    };

    const emitTriggerClassroomEvent = (eventId, updates) => {
        if (socketRef.current && socketRef.current.connected) {
            const data = {
                classId,
                eventId,
                updates,
                updatedBy: user.id
            };
            console.log('Emitting trigger event:', data);
            socketRef.current.emit('trigger-classroom-event', data);
        }
    };

    const emitDeleteClassroomEvent = (eventId) => {
        if (socketRef.current && socketRef.current.connected) {
            const data = {
                classId,
                eventId
            };
            console.log('Emitting delete event:', data);
            socketRef.current.emit('delete-classroom-event', data);
        }
    };

    const emitSubmitEventAnswer = (eventId, answerText) => {
        if (socketRef.current && socketRef.current.connected) {
            const data = {
                classId,
                eventId,
                answer: {
                    userId: user.id,
                    userName: user.displayName,
                    photoURL: user.photoURL,
                    text: answerText,
                    timestamp: Date.now()
                }
            };
            console.log('Emitting answer submission:', data);
            socketRef.current.emit('submit-event-answer', data);
        }
    };

    const emitRaiseHand = (isRaised) => {
        if (socketRef.current && socketRef.current.connected) {
            const data = {
                classId,
                userId: user.id,
                userName: user.displayName,
                userPhoto: user.photoURL, // ✨ Added photo
                isRaised
            };
            console.log('Emitting raise hand:', data);
            socketRef.current.emit('raise-hand', data);
        }
    };

    // ✨ Added emitEmoji
    const emitEmoji = (emoji) => {
        if (socketRef.current && socketRef.current.connected) {
            const data = {
                classId,
                userId: user.id,
                userName: user.displayName,
                userPhoto: user.photoURL, // ✨ Added photo
                emoji
            };
            console.log('Emitting emoji:', data);
            socketRef.current.emit('send-emoji', data);
        }
    };

    // ✨ Added group editing emitters
    const emitRemoveStudentFromGroup = (eventId, studentId, source) => {
        if (socketRef.current && socketRef.current.connected) {
            const data = { classId, eventId, studentId, source };
            console.log('Emitting remove student from group:', data);
            socketRef.current.emit('remove-student-from-group', data);
        }
    };

    const emitMoveStudentGroup = (eventId, studentId, newGroupId, newGroupName, source, userName, userPhoto) => {
        if (socketRef.current && socketRef.current.connected) {
            const data = { classId, eventId, studentId, newGroupId, newGroupName, source, userName, userPhoto };
            console.log('Emitting move student group:', data);
            socketRef.current.emit('move-student-group', data);
        }
    };


    return {
        emitScoreUpdate,
        emitChairSeatingUpdate,
        emitChairMovement,
        emitChairGroupUpdate,
        emitChatMessage,
        emitSystemMessage,
        emitAddClassroomEvent,
        emitTriggerClassroomEvent,
        emitDeleteClassroomEvent,
        emitSubmitEventAnswer,
        emitRaiseHand,
        emitEmoji, // ✨ Exported
        emitRemoveStudentFromGroup,
        emitMoveStudentGroup
    };
};
