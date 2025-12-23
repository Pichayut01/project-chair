// src/hooks/useSocket.js

import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

export const useSocket = (classId, user, onScoreUpdate, onChairUpdate, onChairMove, onChairGroupUpdate, onChatMessage) => { // ✨ Added onChatMessage
    const socketRef = useRef(null);

    useEffect(() => {
        if (!classId || !user) return;

        // Initialize socket connection
        socketRef.current = io(API_BASE_URL, {
            auth: {
                token: user.token,
                classId: classId,
                userId: user.id
            },
            forceNew: true
        });

        // Join classroom room
        socketRef.current.emit('join-classroom', {
            classId: classId,
            userId: user.id,
            userName: user.displayName
        });

        // Listen for score updates
        socketRef.current.on('score-updated', (data) => {
            console.log('Socket received score update:', data);
            if (onScoreUpdate) {
                onScoreUpdate(data);
            }
        });

        // Listen for broadcast score updates
        socketRef.current.on('broadcast-score-update', (data) => {
            console.log('Socket received broadcast score update:', data);
            if (onScoreUpdate) {
                onScoreUpdate(data);
            }
        });

        // Listen for chair seating updates
        socketRef.current.on('chair-seating-updated', (data) => {
            console.log('Socket received chair seating update:', data);
            if (onChairUpdate) {
                onChairUpdate(data);
            }
        });

        // Listen for chair movement updates
        socketRef.current.on('chair-moved', (data) => {
            console.log('Socket received chair movement update:', data);
            if (onChairMove) {
                onChairMove(data);
            }
        });

        // ✨ Listen for chair group updates
        socketRef.current.on('chair-groups-updated', (data) => {
            console.log('Socket received chair groups update:', data);
            if (onChairGroupUpdate) {
                onChairGroupUpdate(data);
            }
        });

        // ✨ Listen for chat messages
        socketRef.current.on('chat-message-received', (data) => {
            console.log('Socket received chat message:', data);
            if (onChatMessage) {
                onChatMessage(data);
            }
        });

        // Handle connection events
        socketRef.current.on('connect', () => {
            console.log('Socket connected successfully');
        });

        socketRef.current.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });

        socketRef.current.on('disconnect', () => {
            console.log('Socket disconnected');
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [classId, user, onScoreUpdate, onChairUpdate, onChairMove, onChairGroupUpdate, onChatMessage]); // ✨ Added dependency

    const emitScoreUpdate = (studentId, newScore, presetName, studentName) => {
        if (socketRef.current && socketRef.current.connected) {
            const updateData = {
                classId,
                studentId,
                newScore,
                presetName,
                studentName,
                updatedBy: user.id,
                timestamp: Date.now()
            };
            console.log('Emitting score update:', updateData);
            socketRef.current.emit('update-score', updateData);

            // Also broadcast to all users in room
            socketRef.current.emit('broadcast-score-update', updateData);
        } else {
            console.error('Socket not connected, cannot emit score update');
        }
    };

    const emitChairSeatingUpdate = (chairId, assignedUsers, action, userName) => {
        if (socketRef.current && socketRef.current.connected) {
            const updateData = {
                classId,
                chairId,
                assignedUsers,
                action, // 'sit', 'leave', 'move'
                userName,
                updatedBy: user.id,
                timestamp: Date.now()
            };
            console.log('Emitting chair seating update:', updateData);
            socketRef.current.emit('chair-seating-update', updateData);
        } else {
            console.error('Socket not connected, cannot emit chair seating update');
        }
    };

    const emitChairMovement = (chairPositions, movedChairId) => {
        if (socketRef.current && socketRef.current.connected) {
            const updateData = {
                classId,
                chairPositions,
                movedChairId,
                updatedBy: user.id,
                timestamp: Date.now()
            };
            console.log('Emitting chair movement update:', updateData);
            socketRef.current.emit('chair-movement-update', updateData);
        } else {
            console.error('Socket not connected, cannot emit chair movement update');
        }
    };

    // ✨ Added emitChairGroupUpdate
    const emitChairGroupUpdate = (chairGroups) => {
        if (socketRef.current && socketRef.current.connected) {
            const updateData = {
                classId,
                chairGroups,
                updatedBy: user.id,
                timestamp: Date.now()
            };
            console.log('Emitting chair group update:', updateData);
            socketRef.current.emit('chair-group-update', updateData);
        } else {
            console.error('Socket not connected, cannot emit chair group update');
        }
    };

    // ✨ Added emitChatMessage
    const emitChatMessage = (message) => {
        if (socketRef.current && socketRef.current.connected) {
            const messageData = {
                classId,
                message,
                senderId: user.id,
                senderName: user.displayName,
                senderPhoto: user.photoURL,
                timestamp: Date.now()
            };
            console.log('Emitting chat message:', messageData);
            socketRef.current.emit('chat-message', messageData);
        } else {
            console.error('Socket not connected, cannot emit chat message');
        }
    };

    return { emitScoreUpdate, emitChairSeatingUpdate, emitChairMovement, emitChairGroupUpdate, emitChatMessage }; // ✨ Exported
};
