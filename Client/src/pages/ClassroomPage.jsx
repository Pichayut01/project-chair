// src/pages/ClassroomPage.jsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import Navbar from '../components/Navbar';
import Loader from '../components/Loader';
import '../CSS/ClassroomPage.css';
import '../CSS/Navbar.css';
import '../CSS/Main.css';
import { getProfileImageSrc, isGoogleUser, handleImageError } from '../utils/profileImageHelper';
import Chair from '../components/Chair';
import ChairAssignModal from '../components/ChairAssignModal';
import ChairPresets from '../components/ChairPresets';
import ChairDropdown from '../components/ChairDropdown';
import StudentRatingModal from '../components/StudentRatingModal';
import { useSocket } from '../hooks/useSocket';


import { FaEdit, FaTh, FaRandom, FaBars, FaThLarge, FaChevronUp, FaChevronDown, FaExchangeAlt, FaChalkboardTeacher, FaObjectGroup, FaLink, FaTrash, FaUndo, FaHandPaper, FaSmile, FaComment, FaCheck, FaTimes, FaLayerGroup, FaChevronLeft, FaChevronRight, FaDice, FaQuestionCircle, FaBullhorn, FaCloud, FaPoll, FaTrophy, FaUser, FaUsers, FaUsersSlash } from 'react-icons/fa';
import ActionBar from '../components/ActionBar';
import { motion, AnimatePresence } from 'framer-motion';
import GroupOverlay from '../components/GroupOverlay';
import ClassroomEvent from '../components/ClassroomEvent';
import GroupingModal from '../components/GroupingModal';
import ViewToggle from '../components/ViewToggle'; // ✨ Import ViewToggle

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
const PRESETS_API_URL = process.env.REACT_APP_PRESETS_API_URL || 'http://localhost:5001';

const ClassroomPage = ({ user, isSidebarOpen, toggleSidebar, handleSignOut }) => {
    const { classId } = useParams();
    const navigate = useNavigate();
    const [classroom, setClassroom] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [seatingPositions, setSeatingPositions] = useState({});
    const [isEditing, setIsEditing] = useState(false);
    const [isLayoutMenuOpen, setIsLayoutMenuOpen] = useState(false); // ✨ State for hierarchical edit menu
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false); // ✨ State for grouping modal
    const [isChatSidebarOpen, setIsChatSidebarOpen] = useState(() => {
        // ✨ Read from localStorage, default to true (open) on desktop, false on mobile
        const saved = localStorage.getItem(`chat-sidebar-open-${classId}`);
        if (saved !== null) {
            return JSON.parse(saved);
        }
        // Default: closed on mobile, open on desktop
        const isMobile = window.innerWidth <= 768;
        return !isMobile;
    }); // ✨ Chat Sidebar State
    const [currentChairPositions, setCurrentChairPositions] = useState({});
    const [assignedUsers, setAssignedUsers] = useState({});
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedChairId, setSelectedChairId] = useState(null);
    const [isBannerCollapsed, setIsBannerCollapsed] = useState(true);
    const containerRef = useRef(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0 });
    const [selectedStudentChair, setSelectedStudentChair] = useState(null);
    const [ratingModalOpen, setRatingModalOpen] = useState(false);
    const [ratePresets, setRatePresets] = useState([]);
    const [studentScores, setStudentScores] = useState({});
    const [viewMode, setViewMode] = useState('seating'); // ✨ 'seating' or 'event'
    const [classroomEvents, setClassroomEvents] = useState([]); // ✨ State for classroom events
    const [attendance, setAttendance] = useState({}); // ✨ State for attendance
    const [attendanceDays, setAttendanceDays] = useState(0); // ✨ State for attendance days

    // Pan functionality state
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const [scrollStart, setScrollStart] = useState({ x: 0, y: 0 });
    const seatingWrapperRef = useRef(null);
    const [isTeacherView, setIsTeacherView] = useState(false); // ✨ State for toggling teacher view
    const [isViewChanging, setIsViewChanging] = useState(false); // ✨ State for loader animation

    const [chairGroups, setChairGroups] = useState([]); // ✨ State for chair groups
    const [isGroupingMode, setIsGroupingMode] = useState(false); // ✨ State for grouping mode
    const [groupSizeInput, setGroupSizeInput] = useState(2); // ✨ State for group size input
    const [selectedChairsForGroup, setSelectedChairsForGroup] = useState([]); // ✨ Selected chairs for creating a group

    // ✨ Raise Hand State
    const [raisedHands, setRaisedHands] = useState(new Set());

    // ✨ Emoji State
    const [activeEmojis, setActiveEmojis] = useState({}); // { userId: { emoji, timestamp } }
    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);


    // ✨ Chat State
    const [chatMessages, setChatMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const chatContainerRef = useRef(null);

    // Zoom functionality state (seating)
    const [zoomLevel, setZoomLevel] = useState(1);
    const minZoom = 0.5;
    const maxZoom = 3;

    // ✨ Separate zoom state for event view
    const [eventZoomLevel, setEventZoomLevel] = useState(1);
    const eventMinZoom = 0.3;
    const eventMaxZoom = 2;

    // Auto-collapse banner on mobile
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth <= 768) {
                setIsBannerCollapsed(true);
            }
        };

        // Check on initial load
        handleResize();

        // Add event listener
        window.addEventListener('resize', handleResize);

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // ✨ Persist chat sidebar state to localStorage
    useEffect(() => {
        localStorage.setItem(`chat-sidebar-open-${classId}`, JSON.stringify(isChatSidebarOpen));
    }, [isChatSidebarOpen, classId]);

    // Calculate isCreator early to avoid reference errors
    const isCreator = user && classroom?.creator && (
        (Array.isArray(classroom.creator) ? classroom.creator.some(c => c._id === user.id) : classroom.creator._id === user.id)
    );

    const handleScoreUpdate = useCallback((data) => {
        console.log('Received score update:', data);

        setStudentScores(prev => ({
            ...prev,
            [data.studentId]: data.newScore // data.newScore is now the full score object for the student
        }));

        if (data.updatedBy !== user.id) {
            const studentName = data.studentName || 'a student';
            Swal.fire({
                icon: 'info',
                title: 'Score Updated',
                text: `${data.presetName} applied to ${studentName}`,
                timer: 3000,
                showConfirmButton: false,
                position: 'top-end',
                toast: true,
            });
        }
    }, [user.id]);

    // Placeholder handlers for new interaction actions
    // Placeholder handlers for new interaction actions
    const handleRaiseHand = () => {
        const isRaised = raisedHands.has(user.id);
        const newRaisedState = !isRaised;

        // Optimistic update
        setRaisedHands(prev => {
            const next = new Set(prev);
            if (newRaisedState) {
                next.add(user.id);
            } else {
                next.delete(user.id);
            }
            return next;
        });

        emitRaiseHand(newRaisedState);

        // Show feedback
        if (newRaisedState) {
            Swal.fire({
                icon: 'info',
                title: 'Hand Raised',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 1500
            });
        }
    };

    const handleEmoji = () => {
        setIsEmojiPickerOpen(prev => !prev);
    };

    const handleSendEmoji = (emoji) => {
        // ✨ Check if hand is raised
        if (raisedHands.has(user.id)) {
            // Lower hand locally
            setRaisedHands(prev => {
                const next = new Set(prev);
                next.delete(user.id);
                return next;
            });
            // Emit raise hand false
            emitRaiseHand(false);
        }

        emitEmoji(emoji);
        setIsEmojiPickerOpen(false);
        // Optimistic local update
        setActiveEmojis(prev => ({
            ...prev,
            [user.id]: { emoji, timestamp: Date.now() }
        }));
        // Auto-remove local optimistic update
        setTimeout(() => {
            setActiveEmojis(prev => {
                const newState = { ...prev };
                if (newState[user.id] && newState[user.id].emoji === emoji) {
                    delete newState[user.id];
                }
                return newState;
            });
        }, 3000);
    };

    const handleChat = () => {
        setIsChatSidebarOpen(prev => !prev);
    };

    const handleChairUpdate = useCallback((data) => {
        console.log('Received chair seating update:', data);

        if (data.updatedBy !== user.id) {
            setAssignedUsers(data.assignedUsers);

            let message = '';
            switch (data.action) {
                case 'sit':
                    message = `${data.userName} sat down`;
                    break;
                case 'leave':
                    message = `${data.userName} left their seat`;
                    break;
                case 'move':
                    message = `${data.userName} moved to a different seat`;
                    break;
                default:
                    message = `${data.userName} updated their seating`;
            }

            Swal.fire({
                icon: 'info',
                title: 'Seating Update',
                text: message,
                timer: 2000,
                showConfirmButton: false,
                position: 'top-end',
                toast: true,
                background: '#f0fdf4',
                color: '#166534'
            });

            // ✨ Fallback: Ensure user is added to participants list when they sit
            if (data.action === 'sit' && data.userName) {
                 setClassroom(prev => {
                     const userId = data.userId; // Assuming data has userId
                     // Check if user exists in participants (by _id or id)
                     const exists = prev.participants.some(p => p._id === userId || p.id === userId);
                     
                     if (!exists) {
                         // Construct minimal user object
                         const newParticipant = {
                             _id: userId,
                             displayName: data.userName,
                             photoURL: data.userPhoto || null, // data might not have photo, acceptable
                             ...data
                         };
                         return {
                             ...prev,
                             participants: [...prev.participants, newParticipant]
                         };
                     }
                     return prev;
                 });
            }
        }
    }, [user.id]);

    const handleChairMovement = useCallback((data) => {
        console.log('Received chair movement update:', data);

        if (data.updatedBy !== user.id) {
            setCurrentChairPositions(data.chairPositions);
            setSeatingPositions(data.chairPositions);

            Swal.fire({
                icon: 'info',
                title: 'Chair Moved',
                text: 'A chair has been repositioned',
                timer: 1500,
                showConfirmButton: false,
                position: 'top-end',
                toast: true,
                background: '#fef3c7',
                color: '#92400e'
            });
        }
    }, [user.id]);

    const handleChairGroupUpdate = useCallback((data) => {
        console.log('Received chair group update:', data);

        if (data.updatedBy !== user.id) {
            setChairGroups(data.chairGroups);
        }
    }, [user.id]);

    const handleChatMessage = useCallback((data) => {
        setChatMessages(prev => [...prev, data]);
        setTimeout(() => {
            if (chatContainerRef.current) {
                chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
            }
        }, 100);
    }, []);

    // ✨ Handle incoming classroom events
    const handleClassroomEventAdded = useCallback((data) => {
        console.log('Classroom event added:', data);
        setClassroomEvents(prev => {
            // ✨ Prevent duplicates: Check if event ID already exists
            if (prev.some(e => e.id === data.id)) {
                return prev;
            }
            return [...prev, data];
        });

        Swal.fire({
            icon: 'success',
            title: 'New Event',
            text: `Event "${data.title}" added!`,
            timer: 2000,
            showConfirmButton: false,
            position: 'top-end',
            toast: true
        });
    }, []);

    // ✨ Handle incoming event triggers (updates)
    const handleClassroomEventTriggered = useCallback((data) => {
        console.log('Classroom event triggered:', data);
        const { eventId, updates } = data;

        setClassroomEvents(prev => prev.map(event => {
            if (event.id === eventId) {
                // ✨ Update updatedAt locally so animation triggers
                return { ...event, ...updates, updatedAt: Date.now() };
            }
            return event;
        }));

        // If results exist, show animation or notification
        // ✨ Removed the Swal here because the card now has animation
        // But maybe keep a toast?
        // if (updates.results && updates.results.length > 0) { ... }
    }, []);



    // ✨ Handle event deletion
    const handleClassroomEventDeleted = useCallback((data) => {
        console.log('Classroom event deleted:', data);
        setClassroomEvents(prev => prev.filter(e => e.id !== data.eventId));
    }, []);

    // ✨ Handle Raise Hand Update
    const handleRaiseHandUpdate = useCallback((data) => {
        const { userId, isRaised, userName } = data;
        setRaisedHands(prev => {
            const next = new Set(prev);
            if (isRaised) {
                next.add(userId);
                // Optional: Play sound or show toast for host
                if (isCreator && userId !== user.id) {
                    Swal.fire({
                        icon: 'info',
                        title: `${userName} raised hand`,
                        toast: true,
                        position: 'top-end',
                        showConfirmButton: false,
                        timer: 2000
                    });
                }
            } else {
                next.delete(userId);
            }
            return next;
        });
    }, [isCreator, user.id]);

    // ✨ Handle Incoming Emoji
    const handleEmojiSent = useCallback((data) => {
        const { userId, emoji } = data;
        setActiveEmojis(prev => ({
            ...prev,
            [userId]: { emoji, timestamp: Date.now() }
        }));

        // Auto-remove after 3 seconds
        setTimeout(() => {
            setActiveEmojis(prev => {
                const newState = { ...prev };
                if (newState[userId] && newState[userId].emoji === emoji) {
                    delete newState[userId];
                }
                return newState;
            });
        }, 3000);
    }, []);

    // ✨ Handle User Joined with Normalization
    const handleUserJoined = useCallback((data) => {
        console.log('User joined Raw:', data);
        let newUser = data.user || data; 
        
        // ✨ Normalize User Data
        if (!newUser._id && newUser.userId) {
            newUser = {
                _id: newUser.userId,
                displayName: newUser.userName || newUser.username || 'Unknown',
                photoURL: newUser.userPhoto || newUser.photoURL,
                email: newUser.email,
                ...newUser
            };
        }

        // Update classroom participants
        setClassroom(prev => {
            if (!prev) return prev;
            // Avoid duplicates check with both _id and id
            if (prev.participants.some(p => (p._id && newUser._id && p._id === newUser._id) || (p.id && newUser.id && p.id === newUser.id))) return prev;
            
            return {
                ...prev,
                participants: [...prev.participants, newUser]
            };
        });

        // Optional: Show toast
        Swal.fire({
            icon: 'info',
            text: `${newUser.displayName || newUser.username} joined the class`,
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 2000
        });

        // ✨ Force refresh classroom details to be sure (Fallback)
        // fetchClassroomDetails(); // If available
    }, []);

    // ✨ Handle User Left with Normalization
    const handleUserLeft = useCallback((data) => {
        console.log('User left Raw:', data);
        const userId = data.userId || data._id || data.id;

        setClassroom(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                participants: prev.participants.filter(p => (p._id !== userId && p.id !== userId))
            };
        });
    }, []);

    // ✨ Handle Full Classroom Update
    const handleClassroomUpdated = useCallback((data) => {
        console.log('Classroom updated:', data);
        const updatedClassroom = data.classroom || data;
        setClassroom(prev => ({
            ...prev,
            ...updatedClassroom
        }));
    }, []);

    const handleDeleteEvent = (event) => {
        Swal.fire({
            title: 'Delete Event?',
            text: "Are you sure you want to delete this event?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                emitDeleteClassroomEvent(event.id);
            }
        });
    };

    const {
        emitScoreUpdate,
        emitChairSeatingUpdate,
        emitChairMovement,
        emitChairGroupUpdate,
        emitChatMessage,
        emitSystemMessage, // ✨ Destructure system message emitter
        emitAddClassroomEvent,
        emitTriggerClassroomEvent, // ✨ Destructure new emitter
        emitDeleteClassroomEvent, // ✨ Destructure delete emitter
        emitSubmitEventAnswer, // ✨ Destructure submit answer emitter
        emitRaiseHand, // ✨ Destructure raise hand emitter
        emitEmoji // ✨ Destructure emoji emitter
    } = useSocket(
        classId,
        user,
        handleScoreUpdate,
        handleChairUpdate,
        handleChairMovement,
        handleChairGroupUpdate,
        handleChatMessage,
        handleClassroomEventAdded,
        handleClassroomEventTriggered, // ✨ Pass new listener
        handleClassroomEventDeleted, // ✨ Pass delete listener
        handleRaiseHandUpdate, // ✨ Pass raise hand listener
        handleEmojiSent, // ✨ Pass emoji listener
        handleUserJoined, // ✨ Pass user joined listener
        handleUserLeft, // ✨ Pass user left listener
        handleClassroomUpdated // ✨ Pass full update listener
    );

    // ✨ Handler for adding new events via ClassroomEvent component
    const handleAddEvent = (eventConfig) => {
        // support string (old way) or object (new way)
        let newEvent = {
            id: `event-${Date.now()}`,
            description: 'New classroom event started',
            type: 'default',
            createdAt: Date.now(),
            createdBy: user.id
        };

        if (typeof eventConfig === 'string') {
            newEvent.title = eventConfig;
        } else {
            // Config object
            if (eventConfig.type === 'random') {
                newEvent.title = 'Random Student';
            } else if (eventConfig.type === 'question') {
                newEvent.title = 'Question';
            } else if (eventConfig.type === 'buzz') {
                newEvent.title = 'Buzz Button';
            } else if (eventConfig.type === 'wordcloud') {
                newEvent.title = 'Word Cloud';
            } else if (eventConfig.type === 'poll') {
                newEvent.title = 'Poll';
            }
            newEvent.type = eventConfig.type;
            newEvent.config = eventConfig.config 
                ? { ...eventConfig, ...eventConfig.config }
                : eventConfig; // Flatten nested config
        }

        // Emit via socket
        emitAddClassroomEvent(newEvent);
        // socket.to(classId).emit('classroom-event-added', event); -> EXCLUDES SENDER.
        // So we MUST add it locally for the sender.
        setClassroomEvents(prev => [...prev, { ...newEvent, createdBy: user.id, createdAt: Date.now() }]);
    };

    // ✨ Handler for creating student groups
    const handleCreateGroups = (groups) => {
        const newEvent = {
            id: `event-${Date.now()}`,
            title: 'Student Groups',
            description: 'Join your group!',
            type: 'grouping',
            config: {
                type: 'grouping',
                groups: groups
            },
            results: [],
            status: 'active',
            createdAt: Date.now(),
            createdBy: user.id
        };

        emitAddClassroomEvent(newEvent);
        setClassroomEvents(prev => [...prev, { ...newEvent }]);

        // ✨ Send grouping card to chat as special JSON message
        const chatPayload = JSON.stringify({
            type: 'grouping',
            eventId: newEvent.id,
            groups: groups
        });
        emitChatMessage(chatPayload);
    };

    // ✨ Handler for triggering an event (Creator only)
    const handleTriggerEvent = (event, updates) => {
        // ✨ Generic trigger support (Buzz Button, etc.)
        if (updates) {
            emitTriggerClassroomEvent(event.id, updates);
            return;
        }

        // ✨ Existing Random Student Logic
        if (event.type === 'random') {
            const count = event.config?.count || 1;

            // Get all seated users (excluding creator if they are seated?)
            // Usually creator is teacher, students are in assignedUsers.
            // assignedUsers is object: { chairId: { userId, userName, ... } }
            const students = Object.values(assignedUsers);

            if (students.length === 0) {
                Swal.fire('No Students', 'No students are currently seated to select from.', 'warning');
                return;
            }

            // Shuffle and pick N
            const shuffled = [...students].sort(() => 0.5 - Math.random());
            const selected = shuffled.slice(0, count);

            // Format results
            const results = selected.map(s => ({
                userId: s.userId,
                userName: s.userName,
                photoSrc: getProfileImageSrc(s.photoURL, isGoogleUser(s))
            }));

            // Emit trigger
            emitTriggerClassroomEvent(event.id, { results, animationDuration: 3500 });

            // ✨ Send result to chat after animation (approx 3.5s)
            setTimeout(() => {
                const winnerNames = results.map(r => r.userName).join(', ');
                emitSystemMessage(`Random Selection Result: ${winnerNames}`);
            }, 3500);
        }
    };

    // ✨ Handle Answer Submission
    const handleSubmitAnswer = (event, answerText) => {
        console.log('handleSubmitAnswer called in Page. EventID:', event?.id, 'Text:', answerText);
        if (!event || !event.id) {
            console.error('Invalid event object:', event);
            return;
        }
        emitSubmitEventAnswer(event.id, answerText);
    };

    // ✨ Handle End & Score Event — awards points to participants
    const handleEndAndScoreEvent = async (event) => {
        if (!event) return;
        
        // Non-scoring events: just end them
        if (!event.config?.scoring?.enabled) {
            emitTriggerClassroomEvent(event.id, { status: 'ended' });
            return;
        }
        
        const basePoints = event.config.scoring.points;
        const category = `${event.title || event.type} (Event)`;
        const hasPerOptionScoring = event.type === 'poll' && event.config?.scoreConfig?.optionScores;
        
        // Determine who gets scored and how many points
        let scoredEntries = []; // { userId, userName, points }
        
        if (event.type === 'buzz') {
            // Only the winner (first result)
            if (event.results?.length > 0) {
                scoredEntries = [{ userId: event.results[0].userId, userName: event.results[0].userName, points: basePoints }];
            }
        } else if (event.type === 'poll') {
            if (event.results?.length > 0) {
                const seen = new Set();
                scoredEntries = event.results.filter(r => {
                    if (seen.has(r.userId)) return false;
                    seen.add(r.userId);
                    return true;
                }).map(r => {
                    let pts = basePoints;
                    if (hasPerOptionScoring && r.text) {
                        const optScore = event.config.scoreConfig.optionScores[r.text];
                        if (optScore) {
                            pts = optScore.action === 'subtract' ? -(optScore.points || 0) : (optScore.points || 0);
                        }
                    }
                    return { userId: r.userId, userName: r.userName, points: pts };
                });
            }
        } else if (event.type === 'wordcloud' || event.type === 'question') {
            if (event.results?.length > 0) {
                const seen = new Set();
                scoredEntries = event.results.filter(r => {
                    if (seen.has(r.userId)) return false;
                    seen.add(r.userId);
                    return true;
                }).map(r => ({ userId: r.userId, userName: r.userName, points: basePoints }));
            }
        } else if (event.type === 'random') {
            if (event.results?.length > 0) {
                scoredEntries = event.results.map(r => ({ userId: r.userId, userName: r.userName, points: basePoints }));
            }
        }

        if (scoredEntries.length === 0) {
            Swal.fire('No Participants', 'No students participated in this event to score.', 'info');
            return;
        }

        // Confirmation dialog
        const totalAwarded = scoredEntries.reduce((sum, e) => sum + e.points, 0);
        const confirm = await Swal.fire({
            title: '🏁 End & Score',
            html: `
                <div style="text-align:left;max-height:200px;overflow-y:auto;margin:10px 0;">
                    ${scoredEntries.map(s => `<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #f1f5f9;">
                        <span>${s.userName}</span>
                        <b style="color:${s.points >= 0 ? '#16a34a' : '#dc2626'}">${s.points >= 0 ? '+' : ''}${s.points} pts</b>
                    </div>`).join('')}
                </div>
                <p style="margin-top:8px;font-weight:600;">Total: ${totalAwarded >= 0 ? '+' : ''}${totalAwarded} pts to ${scoredEntries.length} student(s)</p>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: '🏆 Award Scores',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#f59e0b'
        });

        if (!confirm.isConfirmed) return;

        try {
            let updatedStudentScores = { ...studentScores };
            
            scoredEntries.forEach(entry => {
                const currentScores = updatedStudentScores[entry.userId] || {};
                const currentCategoryScore = currentScores[category] || 0;
                updatedStudentScores[entry.userId] = {
                    ...currentScores,
                    [category]: currentCategoryScore + entry.points
                };
            });

            // Save to database
            await axios.put(`${API_BASE_URL}/api/classrooms/${classId}/seating`, {
                studentScores: updatedStudentScores
            }, {
                headers: { 'x-auth-token': user.token }
            });

            setStudentScores(updatedStudentScores);

            // Emit real-time score updates
            scoredEntries.forEach(entry => {
                emitScoreUpdate(entry.userId, updatedStudentScores[entry.userId], category, entry.userName);
            });

            // ✨ Set event status to 'ended' — use direct trigger (NOT handleTriggerEvent which re-runs random)
            emitTriggerClassroomEvent(event.id, { status: 'ended' });

            Swal.fire({
                icon: 'success',
                title: '🏆 Scores Awarded!',
                html: `<b>${scoredEntries.length}</b> student(s) scored<br><small>Category: ${category}</small>`,
                timer: 2500,
                showConfirmButton: false
            });
        } catch (error) {
            console.error('Error scoring event:', error);
            Swal.fire('Error', 'Failed to award scores.', 'error');
        }
    };

    const handleShareClick = () => {
        if (!classroom) return;
        Swal.fire({
            title: 'Class Code',
            html: `
                <div style="background-color: #eaf6ea; border: 1px solid #d4ecd4; border-radius: 4px; padding: 12px 15px; text-align: center;">
                    <p style="font-size: 1.2em; font-weight: bold; margin: 0;">${classroom.classCode}</p>
                </div>
                <p style="margin-top: 15px; font-size: 0.9em; color: #555;">Give this code to your students so they can join this class.</p>
            `,
            showCancelButton: false,
            showConfirmButton: true,
            confirmButtonText: 'Copy Code',
            preConfirm: () => {
                navigator.clipboard.writeText(classroom.classCode);
                Swal.showValidationMessage('Copied!');
            }
        });
    };

    // Pan functionality handlers
    const handleMouseDown = useCallback((e) => {
        // Only start panning if clicking on empty area (not on chairs)
        if (e.target.classList.contains('seating-grid') || e.target.classList.contains('seating-container-wrapper')) {
            setIsPanning(true);
            setPanStart({ x: e.clientX, y: e.clientY });

            if (seatingWrapperRef.current) {
                setScrollStart({
                    x: seatingWrapperRef.current.scrollLeft,
                    y: seatingWrapperRef.current.scrollTop
                });
            }

            // Prevent text selection while dragging
        }
    }, []);

    const handleMouseMove = useCallback((e) => {
        if (!isPanning || !seatingWrapperRef.current) return;

        const deltaX = e.clientX - panStart.x;
        const deltaY = e.clientY - panStart.y;

        seatingWrapperRef.current.scrollLeft = scrollStart.x - deltaX;
        seatingWrapperRef.current.scrollTop = scrollStart.y - deltaY;

        e.preventDefault();
    }, [isPanning, panStart, scrollStart]);

    const handleMouseUp = useCallback(() => {
        setIsPanning(false);
    }, []);

    // Add global mouse event listeners for panning
    useEffect(() => {
        if (isPanning) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'grabbing';

            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
                document.body.style.cursor = 'default';
            };
        }
    }, [isPanning, handleMouseMove, handleMouseUp]);

    // Zoom functionality handlers (seating)
    const handleZoomIn = useCallback(() => {
        setZoomLevel(prev => Math.min(prev + 0.2, maxZoom));
    }, [maxZoom]);

    const handleZoomOut = useCallback(() => {
        setZoomLevel(prev => Math.max(prev - 0.2, minZoom));
    }, [minZoom]);

    const handleZoomReset = useCallback(() => {
        setZoomLevel(1);
    }, []);

    // ✨ Zoom functionality handlers (event view - scales individual cards)
    const handleEventZoomIn = useCallback(() => {
        setEventZoomLevel(prev => Math.min(prev + 0.1, eventMaxZoom));
    }, [eventMaxZoom]);

    const handleEventZoomOut = useCallback(() => {
        setEventZoomLevel(prev => Math.max(prev - 0.1, eventMinZoom));
    }, [eventMinZoom]);

    const handleEventZoomReset = useCallback(() => {
        setEventZoomLevel(1);
    }, []);

    const handleToggleView = useCallback(() => {
        setIsViewChanging(true);
        setTimeout(() => {
            setIsTeacherView(prev => !prev);
            setTimeout(() => {
                setIsViewChanging(false);
                // ✨ Manually calculate scroll to focus board WITHIN the wrapper
                const boardElement = document.getElementById('front-classroom-board');
                if (boardElement && seatingWrapperRef.current) {
                    const wrapper = seatingWrapperRef.current;
                    const boardRect = boardElement.getBoundingClientRect();
                    const wrapperRect = wrapper.getBoundingClientRect();

                    // Calculate position relative to the wrapper's current scroll
                    // Target: Board center in Wrapper center
                    const relativeTop = boardRect.top - wrapperRect.top;
                    const currentScroll = wrapper.scrollTop;
                    const targetScroll = currentScroll + relativeTop - (wrapper.clientHeight / 2) + (boardRect.height / 2);

                    wrapper.scrollTo({
                        top: targetScroll,
                        behavior: 'smooth'
                    });
                }
            }, 500); // Keep loader briefly after switch for smooth transition
        }, 1500); // Show loader for 1.5 seconds
    }, []);

    // ✨ Lock body scroll when loader is active
    useEffect(() => {
        if (isViewChanging) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isViewChanging]);

    const handleChairMove = useCallback((id, newX, newY) => {
        const updatedPositions = {
            ...currentChairPositions,
            [id]: { x: newX, y: newY }
        };

        setCurrentChairPositions(updatedPositions);

        // Emit real-time chair movement update
        if (isEditing && isCreator) {
            emitChairMovement(updatedPositions, id);
        }
    }, [currentChairPositions, isEditing, isCreator, emitChairMovement]);

    // ✨ Clear all groups
    const handleClearGroups = () => {
        if (window.confirm('Are you sure you want to clear all connections?')) {
            setChairGroups([]);
        }
    };

    // ✨ Undo last group
    const handleUndoGroup = () => {
        if (chairGroups.length > 0) {
            setChairGroups(prev => prev.slice(0, -1));
        }
    };

    const handleChairClick = (chairId, event) => {
        // ✨ Grouping Mode Logic
        if (isGroupingMode && isEditing) {
            // Toggle selection
            let newSelection = [...selectedChairsForGroup];
            if (newSelection.includes(chairId)) {
                newSelection = newSelection.filter(id => id !== chairId);
            } else {
                newSelection.push(chairId);
            }
            setSelectedChairsForGroup(newSelection);

            // Check if group is full
            if (newSelection.length >= groupSizeInput) {
                // Create Group
                const newGroup = {
                    id: `group-${Date.now()}`,
                    chairIds: newSelection,
                    label: `G${chairGroups.length + 1}`,
                    color: '#4CAF50' // Green as requested
                };

                setChairGroups([...chairGroups, newGroup]);
                setSelectedChairsForGroup([]);

                // Optional: Notify
                Swal.fire({
                    icon: 'success',
                    title: 'Group Created',
                    text: `Created group with ${newSelection.length} chairs`,
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 1500
                });
            }
            return;
        }

        // If creator clicks on a chair with a student (not in edit mode)
        if (isCreator && !isEditing && assignedUsers[chairId]) {
            const rect = event.target.getBoundingClientRect();
            setDropdownPosition({
                x: rect.left + rect.width / 2,
                y: rect.bottom + 5
            });
            setSelectedStudentChair(chairId);
            setDropdownOpen(true);
            return;
        }

        // Original chair assignment logic for students
        if (isEditing || isCreator) return;

        const currentSeatId = Object.keys(assignedUsers).find(
            key => assignedUsers[key]?.userId === user.id
        );
        const chairUser = assignedUsers[chairId];

        if (!currentSeatId && chairUser) {
            alert('This seat is already taken.');
            return;
        }
        if (!currentSeatId && !chairUser) {
            setSelectedChairId(chairId);
            setModalOpen(true);
            return;
        }
        if (currentSeatId) {
            if (currentSeatId === chairId) return;
            if (!chairUser) {
                if (window.confirm('Do you want to move to this seat?')) {
                    setSelectedChairId(chairId);
                    setModalOpen(true);
                }
                return;
            }
            if (chairUser) {
                alert('Cannot move to this seat, it is already taken.');
                return;
            }
        }
    };

    // Get default rate presets
    const getDefaultRatePresets = useCallback(() => {
        return [
            {
                _id: 'default-1',
                name: 'Good Participation',
                emoji: '👍',
                type: 'positive',
                scoreType: 'add',
                scoreValue: 5
            },
            {
                _id: 'default-2',
                name: 'Excellent Work',
                emoji: '⭐',
                type: 'positive',
                scoreType: 'add',
                scoreValue: 10
            },
            {
                _id: 'default-3',
                name: 'Late Arrival',
                emoji: '⏰',
                type: 'negative',
                scoreType: 'subtract',
                scoreValue: 2
            }
        ];
    }, []);

    // Fetch rate presets
    const fetchRatePresets = useCallback(async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/presets?classroomId=${classId}`, {
                headers: { 'x-auth-token': user.token }
            });

            // Handle both response structures (wrapped in data or direct array)
            const rawPresets = response.data.data || response.data;
            const presetsArray = Array.isArray(rawPresets) ? rawPresets : [];

            // Transform the new API response to match expected format
            const transformedPresets = presetsArray.map(preset => {
                // Determine type based on tags or preset name
                const isNegative = preset.tags?.includes('negative') ||
                    preset.name.toLowerCase().includes('late') ||
                    preset.name.toLowerCase().includes('absent') ||
                    preset.name.toLowerCase().includes('disrupt') ||
                    preset.type === 'negative';

                return {
                    _id: preset._id,
                    name: preset.name,
                    emoji: preset.emoji || (isNegative ? '⚠️' : '⭐'),
                    type: preset.type || (isNegative ? 'negative' : 'positive'),
                    notifyStudent: preset.notifyStudent !== undefined ? preset.notifyStudent : true,
                    scoreType: preset.scoreType || (isNegative ? 'subtract' : 'add'),
                    scoreValue: preset.scoreValue || 5,
                    criteria: preset.criteria
                };
            });

            // Merge with default presets instead of replacing them
            const defaultPresets = getDefaultRatePresets();
            const allPresets = [...defaultPresets, ...transformedPresets];

            // Remove duplicates based on name to avoid conflicts
            const uniquePresets = allPresets.filter((preset, index, self) =>
                index === self.findIndex(p => p.name === preset.name)
            );

            setRatePresets(uniquePresets);
        } catch (error) {
            console.error('Error fetching rate presets:', error);
            // If API fails, only use default presets
            const defaultPresets = getDefaultRatePresets();
            setRatePresets(defaultPresets);
        }
    }, [classId, getDefaultRatePresets, user.token]);

    // Handle dropdown actions
    const handleRateStudent = () => {
        setDropdownOpen(false);
        setRatingModalOpen(true);
    };

    const handleCheckAttendance = async () => {
        setDropdownOpen(false);
        const studentUser = assignedUsers[selectedStudentChair];
        if (!studentUser) return;

        const currentDays = attendanceDays || 20;
        const days = Array.from({ length: currentDays }, (_, i) => i + 1);
        const dayOptions = days.map(day => `<option value="${day}">Day ${day}</option>`).join('');
        const photoSrc = getProfileImageSrc(studentUser.photoURL);

        const { value: formValues } = await Swal.fire({
            title: 'Attendance Check',
            html: `
                <div class="attendance-modal-content">
                    <div class="attendance-student-info">
                        <img src="${photoSrc}" class="attendance-student-photo" onerror="this.src='https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'"/>
                        <div class="attendance-student-details">
                            <h3 class="attendance-student-name">${studentUser.userName}</h3>
                            <p class="attendance-student-role">Student</p>
                        </div>
                    </div>
                    
                    <div class="attendance-form-group">
                        <label class="attendance-form-label">
                            <i class="fas fa-calendar-day"></i> Select Day
                        </label>
                        <select id="swal-day" class="attendance-select-custom">
                            ${dayOptions}
                        </select>
                    </div>

                    <div class="attendance-form-group">
                        <label class="attendance-form-label">
                            <i class="fas fa-check-circle"></i> Status
                        </label>
                        <div class="attendance-status-grid">
                            <div class="attendance-status-btn present" data-status="present">
                                <span class="attendance-status-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                </span>
                                <span class="attendance-status-label">Present</span>
                            </div>
                            <div class="attendance-status-btn absent" data-status="absent">
                                <span class="attendance-status-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </span>
                                <span class="attendance-status-label">Absent</span>
                            </div>
                            <div class="attendance-status-btn late" data-status="late">
                                <span class="attendance-status-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                </span>
                                <span class="attendance-status-label">Late</span>
                            </div>
                            <div class="attendance-status-btn leave" data-status="leave">
                                <span class="attendance-status-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                </span>
                                <span class="attendance-status-label">Leave</span>
                            </div>
                        </div>
                    </div>
                </div>
            `,
            focusConfirm: false,
            showConfirmButton: false,
            showCancelButton: true,
            cancelButtonText: 'Cancel',
            cancelButtonColor: '#6c757d',
            customClass: {
                popup: 'attendance-swal-popup',
                cancelButton: 'attendance-swal-cancel'
            },
            didOpen: () => {
                const buttons = Swal.getHtmlContainer().querySelectorAll('.attendance-status-btn');
                buttons.forEach(btn => {
                    btn.addEventListener('click', () => {
                        const status = btn.getAttribute('data-status');
                        const day = document.getElementById('swal-day').value;
                        Swal.clickConfirm();
                        Swal.close({ value: { day, status } });
                    });
                });
            }
        });

        if (formValues && formValues.status) {
            try {
                const studentId = studentUser.userId;
                const newAttendance = { ...attendance };
                if (!newAttendance[studentId]) newAttendance[studentId] = {};
                newAttendance[studentId][formValues.day] = formValues.status;

                setAttendance(newAttendance);

                await axios.put(`${API_BASE_URL}/api/classrooms/${classId}/attendance`, {
                    attendance: newAttendance
                }, {
                    headers: { 'x-auth-token': user.token }
                });

                Swal.fire({
                    icon: 'success',
                    title: 'Attendance Saved',
                    text: `${studentUser.userName} marked as ${formValues.status} for ${formValues.day}`,
                    timer: 2000,
                    showConfirmButton: false,
                    toast: true,
                    position: 'top-end'
                });

            } catch (error) {
                console.error('Error saving attendance:', error);
                Swal.fire('Error', 'Failed to save attendance.', 'error');
                fetchClassroomDetails();
            }
        }
    };

    const handleFunction3 = () => {
        setDropdownOpen(false);
        // Implement function 3 logic here
        console.log('Function 3 clicked for chair:', selectedStudentChair);
    };

    const handleFunction4 = () => {
        setDropdownOpen(false);
        // Implement function 4 logic here
        console.log('Function 4 clicked for chair:', selectedStudentChair);
    };

    const handleApplyRating = async (preset) => {
        try {
            const studentUser = assignedUsers[selectedStudentChair];
            if (!studentUser) return;

            const studentId = studentUser.userId;
            const currentScores = studentScores[studentId] || {};
            const category = preset.name;
            const currentCategoryScore = currentScores[category] || 0;
            const scoreChange = preset.scoreType === 'subtract' ? -preset.scoreValue : preset.scoreValue;

            // Update the score for the specific category
            const updatedCategoryScore = currentCategoryScore + scoreChange;

            const updatedStudentScores = {
                ...studentScores,
                [studentId]: {
                    ...currentScores,
                    [category]: updatedCategoryScore
                }
            };

            // Save the entire updated scores object to the database
            await axios.put(`${API_BASE_URL}/api/classrooms/${classId}/seating`, {
                studentScores: updatedStudentScores
            }, {
                headers: { 'x-auth-token': user.token }
            });

            // Update local state
            setStudentScores(updatedStudentScores);

            // Emit real-time update
            emitScoreUpdate(studentId, updatedStudentScores[studentId], preset.name, studentUser.userName);

            Swal.fire({
                icon: 'success',
                title: 'Score Updated',
                text: `${preset.name} applied to ${studentUser.userName}`,
                timer: 2000,
                showConfirmButton: false,
                position: 'top-end',
                toast: true
            });

        } catch (error) {
            console.error('Error applying rating:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to apply rating. Please try again.'
            });
        }
    };

    const fetchClassroomDetails = useCallback(async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/classrooms/${classId}`, {
                headers: { 'x-auth-token': user.token }
            });
            setClassroom(response.data);
            const fetchedPositions = response.data.seatingPositions || {};
            const fetchedAssignedUsers = response.data.assignedUsers || {};
            const fetchedScores = response.data.studentScores || {};
            const fetchedGroups = response.data.chairGroups || []; // Load groups

            console.log('Fetched scores from server:', fetchedScores);

            setSeatingPositions(fetchedPositions);
            setCurrentChairPositions(fetchedPositions);
            setAssignedUsers(fetchedAssignedUsers);
            setStudentScores(fetchedScores);
            setChairGroups(fetchedGroups); // Set groups
            setAttendance(response.data.attendance || {}); // ✨ Load attendance
            setAttendanceDays(response.data.attendanceDays || 20); // ✨ Load attendance days (default to 20)

            // ✨ Initialize classroom events
            const fetchedEvents = response.data.classroomEvents || [];
            setClassroomEvents(fetchedEvents);

            setLoading(false);
        } catch (err) {
            if (err.response?.status === 403 && err.response?.data?.requiresInvitation) {
                // Redirect to private classroom page
                navigate(`/classroom/${classId}/private`);
                return;
            } else {
                // Redirect to error page
                navigate(`/classroom/${classId}/error`);
                return;
            }
            setLoading(false);
        }
    }, [classId, user, navigate]);

    // ✨ Fetch chat history on mount
    const fetchChatHistory = useCallback(async () => {
        try {
            console.log('🔄 Fetching chat history for classroom:', classId);
            const response = await axios.get(`${API_BASE_URL}/api/classrooms/${classId}/chat`, {
                headers: { 'x-auth-token': user.token }
            });

            console.log('📦 Chat API Response:', response.data);

            const { chatMessages } = response.data;

            // Ensure chatMessages is always an array
            const messages = Array.isArray(chatMessages) ? chatMessages : [];
            setChatMessages(messages);
            console.log('✅ Loaded chat history:', messages.length, 'messages');

            // Auto-scroll to bottom after loading chat history
            setTimeout(() => {
                if (chatContainerRef.current) {
                    chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
                    console.log('📜 Auto-scrolled chat to bottom');
                }
            }, 200);
        } catch (err) {
            console.error('❌ Error fetching chat history:', err);
            console.error('❌ Error details:', err.response?.data || err.message);
            // Don't show error to user, just start with empty chat
            setChatMessages([]);
        }
    }, [classId, user]);

    useEffect(() => {
        if (!user || !user.token || !classId) return;

        setLoading(true);
        fetchClassroomDetails();
        fetchChatHistory(); // ✨ Load chat history whenever classId changes

        if (isCreator) {
            fetchRatePresets();
        }
    }, [classId, user, fetchClassroomDetails, fetchChatHistory, fetchRatePresets, isCreator]);

    // ✨ Polling Fallback: Fetch classroom details every 5 seconds to ensure member list is up-to-date
    // (Since server join events are not reliably broadcasting)
    useEffect(() => {
        if (!classId || !user?.token) return;

        const interval = setInterval(() => {
            // Silently fetch updates (don't set loading state)
            fetchClassroomDetails();
        }, 5000);

        return () => clearInterval(interval);
    }, [classId, user, fetchClassroomDetails]);

    const handleAssign = async (name) => {
        if (!selectedChairId || !user) return;

        // ลบที่เดิมถ้ามี
        const prevSeatId = Object.keys(assignedUsers).find(
            key => assignedUsers[key]?.userId === user.id
        );
        const newAssignedUsers = { ...assignedUsers };
        let action = 'sit';

        if (prevSeatId) {
            delete newAssignedUsers[prevSeatId];
            action = 'move';
        }

        // จองที่ใหม่
        newAssignedUsers[selectedChairId] = {
            userName: name,
            userId: user.id,
            photoURL: user.photoURL,
        };

        setAssignedUsers(newAssignedUsers);
        setModalOpen(false);

        // Emit real-time chair seating update
        emitChairSeatingUpdate(selectedChairId, newAssignedUsers, action, name);

        try {
            await axios.put(
                `${API_BASE_URL}/api/classrooms/${classId}/seating`,
                {
                    seatingPositions,
                    assignedUsers: newAssignedUsers
                },
                { headers: { 'x-auth-token': user.token } }
            );
            fetchClassroomDetails();
        } catch (e) {
            alert('Save failed.');
        }
    };

    const handleSavePositions = async () => {
        try {
            await axios.put(`${API_BASE_URL}/api/classrooms/${classId}/seating`, {
                seatingPositions: currentChairPositions,
                chairGroups: chairGroups // ✨ Save groups
            }, {
                headers: { 'x-auth-token': user.token }
            });

            setSeatingPositions(currentChairPositions);
            setIsEditing(false);
            setIsGroupingMode(false); // Exit grouping mode on save
            setSelectedChairsForGroup([]); // Clear selected chairs

            // Emit final chair positions to all users
            emitChairMovement(currentChairPositions, null);
            // ✨ Emit chair groups
            emitChairGroupUpdate(chairGroups);

            Swal.fire('Saved!', 'Seating arrangement updated successfully.', 'success');
        } catch (error) {
            console.error('Failed to save seating positions:', error);
            Swal.fire('Error', 'Failed to save seating arrangement.', 'error');
        }
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setCurrentChairPositions(seatingPositions);
        setIsGroupingMode(false); // Exit grouping mode on cancel
        setSelectedChairsForGroup([]); // Clear selected chairs
    };

    const handleToggleEditMode = () => {
        if (!isCreator) return;
        setIsEditing(prev => !prev);
        setIsGroupingMode(false); // Exit grouping mode when toggling edit mode
        setSelectedChairsForGroup([]); // Clear selected chairs
    };

    const handleLeaveSeat = async () => {
        if (!user) return;
        const seatId = Object.keys(assignedUsers).find(
            key => assignedUsers[key]?.userId === user.id
        );
        if (!seatId) return;

        const currentUser = assignedUsers[seatId];
        const newAssignedUsers = { ...assignedUsers };
        delete newAssignedUsers[seatId];
        setAssignedUsers(newAssignedUsers);

        // Emit real-time chair seating update
        emitChairSeatingUpdate(seatId, newAssignedUsers, 'leave', currentUser?.userName || user.displayName);

        try {
            await axios.put(
                `${API_BASE_URL}/api/classrooms/${classId}/seating`,
                {
                    seatingPositions,
                    assignedUsers: newAssignedUsers
                },
                { headers: { 'x-auth-token': user.token } }
            );
            fetchClassroomDetails();
        } catch (e) {
            alert('Failed to leave the seat.');
        }
    };

    const handleResetAllChairs = async () => {
        if (!isCreator) return;

        const result = await Swal.fire({
            title: 'Reset All Chairs?',
            text: "Are you sure you want to make all students leave their chairs? This cannot be undone.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, Reset All',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            try {
                // Optimistic update
                const emptyAssignedUsers = {};
                setAssignedUsers(emptyAssignedUsers);

                // Save to DB
                await axios.put(`${API_BASE_URL}/api/classrooms/${classId}/seating`, {
                    assignedUsers: emptyAssignedUsers
                }, {
                    headers: { 'x-auth-token': user.token }
                });

                // Emit socket update
                emitChairSeatingUpdate(null, emptyAssignedUsers, 'leave_all', 'Instructor');

                Swal.fire({
                    icon: 'success',
                    title: 'Chairs Reset',
                    text: 'All students have been moved out of their chairs.',
                    timer: 2000,
                    showConfirmButton: false,
                    toast: true,
                    position: 'top-end'
                });
            } catch (error) {
                console.error('Error resetting chairs:', error);
                Swal.fire('Error', 'Failed to reset chairs.', 'error');
                fetchClassroomDetails(); // Rollback if error
            }
        }
    };

    const onPromoteMember = async (memberId, memberName) => {
        try {
            const result = await Swal.fire({
                title: `Promote ${memberName} to Creator?`,
                text: "This user will gain the same permissions as the classroom owner.",
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Promote',
                cancelButtonText: 'Cancel'
            });
            if (result.isConfirmed) {
                await axios.put(
                    `${API_BASE_URL}/api/classrooms/${classId}/promote`,
                    { userId: memberId },
                    { headers: { 'x-auth-token': user.token } }
                );
                Swal.fire('Success', `${memberName} has been promoted to Creator.`, 'success');
                fetchClassroomDetails();
            }
        } catch (err) {
            Swal.fire('Error', 'Could not promote the member.', 'error');
        }
    };

    const onDemoteMember = async (memberId, memberName) => {
        try {
            const result = await Swal.fire({
                title: `Demote ${memberName}?`,
                text: "This user will lose their Creator permissions.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#e74c3c',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Demote',
                cancelButtonText: 'Cancel'
            });
            if (result.isConfirmed) {
                await axios.put(
                    `${API_BASE_URL}/api/classrooms/${classId}/demote`,
                    { userId: memberId },
                    { headers: { 'x-auth-token': user.token } }
                );
                Swal.fire('Success', `${memberName} has been demoted to a participant.`, 'success');
                fetchClassroomDetails();
            }
        } catch (err) {
            Swal.fire('Error', err.response?.data?.msg || 'Could not demote the member.', 'error');
        }
    };

    const handleKickMember = async (memberId, memberName) => {
        const result = await Swal.fire({
            title: `Kick ${memberName} from the classroom?`,
            text: "This user will be removed from the classroom.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Kick',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#e74c3c'
        });
        if (result.isConfirmed) {
            try {
                await axios.put(
                    `${API_BASE_URL}/api/classrooms/${classId}/kick`,
                    { userId: memberId },
                    { headers: { 'x-auth-token': user.token } }
                );
                Swal.fire('Success', `${memberName} has been kicked from the classroom.`, 'success');
                fetchClassroomDetails();
            } catch (err) {
                Swal.fire('Error', 'Could not kick the member.', 'error');
            }
        }
    };

    const handleEditClassroom = () => {
        navigate(`/classroom/${classId}/edit`);
    };

    const handleClassDetail = () => {
        navigate(`/classroom/${classId}/detail`);
    };

    const handleApplyPreset = async (presetType) => {
        if (!containerRef.current) return;

        const containerRect = containerRef.current.getBoundingClientRect();
        const chairCount = Object.keys(currentChairPositions).length;

        if (chairCount === 0) {
            Swal.fire('No Chairs', 'Please add some chairs first before applying presets.', 'info');
            return;
        }

        const result = await Swal.fire({
            title: `Apply ${presetType.charAt(0).toUpperCase() + presetType.slice(1)} Layout?`,
            text: "This will rearrange all chairs according to the selected preset.",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Apply Layout',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            const newPositions = ChairPresets.generatePreset(
                presetType,
                chairCount,
                containerRect.width || 800,
                containerRect.height || 600
            );

            // Map existing chair IDs to new positions
            const chairIds = Object.keys(currentChairPositions);
            const updatedPositions = {};

            chairIds.forEach((chairId, index) => {
                const presetKey = `chair-${index + 1}`;
                if (newPositions[presetKey]) {
                    updatedPositions[chairId] = newPositions[presetKey];
                } else {
                    updatedPositions[chairId] = currentChairPositions[chairId];
                }
            });

            setCurrentChairPositions(updatedPositions);
            Swal.fire('Success', `${presetType.charAt(0).toUpperCase() + presetType.slice(1)} layout applied!`, 'success');
        }
    };

    const calculateContainerSize = () => {
        const positions = isEditing ? currentChairPositions : seatingPositions;
        // ✨ Filter for valid chairs only to prevent outliers (like 0,0 defaults) from breaking bounds
        const chairList = Object.values(positions).filter(pos => pos && typeof pos.x === 'number');
        const chairCount = chairList.length;

        // Base minimum size calculations
        if (chairCount === 0) {
            const sidebarWidth = isSidebarOpen ? 250 : 0;
            return {
                width: Math.round((window.innerWidth - sidebarWidth - 40) * 0.8) + 'px',
                height: Math.round((window.innerHeight - 200) * 0.8) + 'px'
            };
        }

        // Chair dimensions from CSS (approximately)
        const chairWidth = 80;
        const chairHeight = 100;

        // Calculate bounds from chair positions (assuming pos.x/y is top-left corner)
        const bounds = chairList.reduce((acc, pos) => {
            return {
                minX: Math.min(acc.minX, pos.x),
                maxX: Math.max(acc.maxX, pos.x),
                minY: Math.min(acc.minY, pos.y),
                maxY: Math.max(acc.maxY, pos.y)
            };
        }, {
            minX: Infinity,
            maxX: -Infinity,
            minY: Infinity,
            maxY: -Infinity
        });

        // To center the chairs exactly: 
        // We want the left margin (minX) to match the right margin.
        // Right boundary of chairs is maxX + chairWidth.
        // Container width should be (maxX + chairWidth) + minX.
        // This ensures space on right equals space on left (minX).

        // ✨ Calculate exact content dimensions
        const contentWidth = bounds.maxX + chairWidth - bounds.minX;
        const contentHeight = bounds.maxY + chairHeight - bounds.minY;

        // ✨ Define uniform padding (visual breathing room inside the white box)
        const padding = 100;

        // ✨ Final Container Size = Content + Padding * 2
        // This ensures the box is exactly centered around the cluster of chairs
        const finalWidth = contentWidth + (padding * 2);
        const finalHeight = contentHeight + (padding * 2);

        return {
            width: Math.round(finalWidth),
            height: Math.round(finalHeight),
            minX: bounds.minX,
            minY: bounds.minY,
            padding: padding
        };
    };

    const renderSeatingChart = () => {
        if (!seatingPositions || Object.keys(seatingPositions).length === 0) {
            return <div className="no-seating-chart">No seating chart available.</div>;
        }

        const positions = isEditing ? currentChairPositions : seatingPositions;
        // ✨ Filter valid chairs for rendering logic to match bounds
        const chairList = Object.entries(positions).filter(([_, pos]) => pos && typeof pos.x === 'number');
        const containerSize = calculateContainerSize();

        return (
            <div style={{ position: 'relative' }}>
                <AnimatePresence>
                    {isViewChanging && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5 }}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                zIndex: 9999,
                                pointerEvents: 'all'
                            }}
                        >
                            <Loader contained={true} />
                        </motion.div>
                    )}
                </AnimatePresence>
                <div
                    className="seating-container-wrapper"
                    ref={seatingWrapperRef}
                    onMouseDown={handleMouseDown}
                    style={{
                        width: '100%',
                        overflowX: 'auto',
                        overflowY: 'auto',
                        maxHeight: '70vh',
                        borderRadius: '12px',
                        backgroundColor: '#f8fafc',
                        backgroundColor: '#f8fafc',
                        padding: '0px',
                        cursor: isPanning ? 'grabbing' : 'grab',
                        display: 'flex', // Enable Flexbox for margin: auto centering
                        // Remove alignItems/justifyContent to let margin: auto handle safe centering
                    }}>

                    <div className="seating-grid-wrapper" style={{
                        position: 'relative',
                        width: `${containerSize.width * zoomLevel}px`,
                        height: `${containerSize.height * zoomLevel}px`,
                        // ✨ Increase padding to 120px to provide generous buffer for board and edges
                        padding: `${120 * zoomLevel}px`,
                        margin: 'auto',
                        boxSizing: 'content-box', // ✨ FORCE content-box so padding doesn't eat width
                    }}>
                        <div className="seating-grid" ref={containerRef} style={{
                            position: 'relative',
                            width: `${containerSize.width}px`,
                            height: `${containerSize.height}px`,
                            border: '1px solid #ccc',
                            borderRadius: '8px',
                            backgroundColor: '#f9f9f9',
                            // ✨ Grid background only in Edit Mode
                            backgroundImage: isEditing ? 'radial-gradient(circle, #e0e0e0 1px, transparent 1px)' : 'none',
                            backgroundSize: '20px 20px',
                            cursor: isPanning ? 'grabbing' : 'grab',
                            transform: `scale(${zoomLevel})`,
                            transformOrigin: 'top left',
                            transition: 'transform 0.5s ease',
                        }}>
                            <div className="rotation-wrapper" style={{
                                width: '100%',
                                height: '100%',
                                // Remove padding here, use transform instead for precise positioning
                                position: 'relative',
                                transform: `rotate(${isTeacherView ? 180 : 0}deg)`,
                                transformOrigin: 'center center',
                                transition: 'transform 0.5s ease'
                            }}>
                                {/* Front of classroom blackboard */}
                                <div
                                    id="front-classroom-board"
                                    className="front-classroom-board"
                                    style={{
                                        transform: `translateX(-50%) rotate(${isTeacherView ? 180 : 0}deg)`, // ✨ Rotate text
                                        transition: 'transform 0.5s ease'
                                    }}>
                                    <span className="board-label">FRONT OF CLASSROOM</span>
                                </div>

                                {/* ✨ Centering Group for Chairs */}
                                <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    // ✨ Shift chairs: -minX + Padding
                                    // This moves the cluster to start exactly at 'Padding' px from top/left
                                    transform: `translate(${-containerSize.minX + containerSize.padding}px, ${-containerSize.minY + containerSize.padding}px)`,
                                    pointerEvents: 'none' // Let clicks pass through to chairs
                                }}>

                                    {/* ✨ Render Group Overlay */}
                                    <GroupOverlay
                                        groups={[
                                            ...chairGroups,
                                            // Render current selection as a temporary group
                                            ...(selectedChairsForGroup.length > 0 ? [{
                                                id: 'temp-group',
                                                chairIds: selectedChairsForGroup,
                                                label: `${selectedChairsForGroup.length}/${groupSizeInput}`,
                                                color: '#90cdf4'
                                            }] : [])
                                        ]}
                                        chairPositions={isEditing ? currentChairPositions : seatingPositions}
                                        rotation={isTeacherView ? -180 : 0} // ✨ Counter-rotate labels
                                    />

                                    {chairList.map(([id, pos]) => {
                                        const assignedUser = assignedUsers[id];
                                        const photoURL = getProfileImageSrc(assignedUser?.photoURL, isGoogleUser(assignedUser));
                                        const userName = assignedUser?.userName || null;

                                        const userScoreRecord = assignedUser ? studentScores[assignedUser.userId] || {} : {};
                                        const userScore = Object.values(userScoreRecord).reduce((sum, score) => sum + score, 0);

                                        // Calculate min and max scores for relative scaling
                                        const allScores = Object.values(studentScores).map(record => Object.values(record).reduce((sum, score) => sum + score, 0));
                                        const hasAnyScores = allScores.some(score => score > 0);
                                        const minScore = hasAnyScores ? Math.min(...allScores.filter(score => score >= 0)) : 0;
                                        const maxScore = hasAnyScores ? Math.max(...allScores) : 0;

                                        console.log(`Rendering Chair ${id}: userScore=${userScore}, maxScore=${maxScore}`);

                                        // ✨ Determine group color for this chair
                                        let groupColor = null;
                                        if (assignedUser) {
                                            const activeGroupingEvent = classroomEvents?.find(e => e.type === 'grouping' && e.status === 'active');
                                            if (activeGroupingEvent) {
                                                const userResult = activeGroupingEvent.results?.find(r => r.userId === assignedUser.userId);
                                                if (userResult) {
                                                    const group = activeGroupingEvent.config?.groups?.find(g => (g.id || g.name) === userResult.text);
                                                    if (group) {
                                                        groupColor = group.color;
                                                    }
                                                }
                                            }
                                        }

                                        return (
                                            <Chair
                                                key={`${id}-${userScore}`} // ✨ Removed Date.now() to prevent remounting on drag
                                                id={id}
                                                initialPosition={pos}
                                                onChairMove={handleChairMove}
                                                containerRef={containerRef}
                                                isDraggable={isEditing && !isGroupingMode} // ✨ Disable drag when grouping
                                                userPhotoURL={photoURL}
                                                userName={userName}
                                                onChairClick={handleChairClick}
                                                userScore={userScore}
                                                minScore={minScore}
                                                maxScore={maxScore}
                                                hasAnyScores={hasAnyScores}
                                                isCreator={isCreator}
                                                rotation={isTeacherView ? -180 : 0} // ✨ Counter-rotate chairs
                                                isSelectedForGroup={selectedChairsForGroup.includes(id)} // Highlight selected chairs
                                                selectionIndex={selectedChairsForGroup.indexOf(id) !== -1 ? selectedChairsForGroup.indexOf(id) + 1 : 0} // ✨ Pass selection index
                                                zoomScale={zoomLevel} // ✨ Pass zoom level for drag correction
                                                isHandRaised={assignedUser && raisedHands.has(assignedUser.userId)} // ✨ Pass raised hand state
                                                currentEmoji={assignedUser && activeEmojis[assignedUser.userId]?.emoji} // ✨ Pass current emoji
                                                groupColor={groupColor}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return <Loader />;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    if (!classroom) {
        return <div>Classroom not found.</div>;
    }



    const userSeatId = Object.keys(assignedUsers).find(
        key => assignedUsers[key]?.userId === user.id
    );

    const actionBarActions = [
        ...(!isCreator ? [{
            id: 'raise-hand',
            icon: <FaHandPaper />,
            label: 'Raise Hand',
            onClick: handleRaiseHand,
            isActive: raisedHands.has(user.id) // ✨ Show active state
        }] : []),
        ...(!isCreator ? [{
            id: 'emoji',
            icon: <FaSmile />,
            label: 'Emoji',
            onClick: handleEmoji,
            isActive: isEmojiPickerOpen,
            isPopover: true,
            popoverContent: (
                <div className="emoji-picker-popover">
                    {['👍', '👎', '😂', '😮', '❤️', '🎉', '👋', '🤔'].map(emoji => (
                        <button key={emoji} onClick={() => handleSendEmoji(emoji)} className="emoji-btn">
                            {emoji}
                        </button>
                    ))}
                </div>
            )
        }] : []),
        {
            id: 'chat',
            icon: <FaComment />,
            label: 'Chat',
            onClick: handleChat,
            isActive: isChatSidebarOpen
        },
        ...(isCreator ? [{
            id: 'grouping',
            icon: <FaUsers />,
            label: 'Create Groups',
            onClick: () => setIsGroupModalOpen(true),
            isActive: isGroupModalOpen
        }] : []),
        {
            id: 'view',
            icon: <FaChalkboardTeacher />,
            label: 'Toggle View',
            onClick: handleToggleView,
            isActive: isTeacherView
        }
    ];

    const handleConnectClick = async () => {
        if (isGroupingMode) {
            setIsGroupingMode(false);
            setSelectedChairsForGroup([]);
        } else {
            const { value: size } = await Swal.fire({
                title: 'Group Size',
                text: 'Enter number of chairs to connect (max 5)',
                input: 'number',
                inputValue: groupSizeInput,
                showCancelButton: true,
                inputValidator: (value) => {
                    if (!value || value < 2 || value > 5) {
                        return 'Please enter a number between 2 and 5';
                    }
                }
            });

            if (size) {
                setGroupSizeInput(parseInt(size));
                setIsGroupingMode(true);
            }
        }
    };

    if (isCreator) {
        // ✨ Remove Start: Remove Raise Hand for Creator
        const raiseHandIndex = actionBarActions.findIndex(a => a.id === 'raise-hand');
        if (raiseHandIndex !== -1) {
            actionBarActions.splice(raiseHandIndex, 1);
        }
        // ✨ Remove End

        if (isEditing) {
            // Edit Mode Tools
            actionBarActions.push(
                {
                    id: 'layout-rows',
                    icon: <FaTh />,
                    label: 'Rows Layout',
                    onClick: () => handleApplyPreset('rows'),
                    isActive: false
                },
                {
                    id: 'layout-grid',
                    icon: <FaThLarge />,
                    label: 'Grid Layout',
                    onClick: () => handleApplyPreset('grid'),
                    isActive: false
                },
                {
                    id: 'layout-groups',
                    icon: <FaObjectGroup />,
                    label: 'Groups Layout',
                    onClick: () => handleApplyPreset('groups'),
                    isActive: false
                },
                {
                    id: 'connect',
                    icon: <FaLink />,
                    label: isGroupingMode ? 'Finish Connecting' : 'Connect Chairs',
                    onClick: handleConnectClick,
                    isActive: isGroupingMode
                }
            );

            if (chairGroups.length > 0 || isGroupingMode) {
                actionBarActions.push({
                    id: 'undo',
                    icon: <FaUndo />,
                    label: 'Undo Connection',
                    onClick: handleUndoGroup,
                    isActive: false
                });
                actionBarActions.push({
                    id: 'reset',
                    icon: <FaTrash />,
                    label: 'Reset Connections',
                    onClick: handleClearGroups,
                    isActive: false
                });
            }

            // Save/Finish Button
            actionBarActions.push({
                id: 'save',
                icon: <FaCheck />,
                label: 'Save & Exit',
                onClick: handleSavePositions,
                isActive: true
            });
        } else {
            // Enter Edit Mode Button
            actionBarActions.push({
                id: 'edit',
                icon: <FaEdit />,
                label: 'Edit Layout',
                onClick: handleToggleEditMode,
                isActive: false
            });

            actionBarActions.push({
                id: 'reset-all',
                icon: <FaUsersSlash />, // Assuming FaUsersSlash is imported from 'react-icons/fa'
                label: 'Reset All Chairs',
                onClick: handleResetAllChairs,
                isActive: false
            });
        }
    }

    return (
        <>
            <Navbar
                isSidebarOpen={isSidebarOpen}
                toggleSidebar={toggleSidebar}
                user={user}
                onClassActionClick={() => { }}
                classrooms={[]}
                handleSignOut={handleSignOut}
                isClassroomPage={true}
                onShareClick={handleShareClick}
                classroomMembers={{ creator: classroom.creator, participants: classroom.participants }}
                isCreator={isCreator}
                isEditing={isEditing}
                onToggleEditMode={handleToggleEditMode}
                onSavePositions={handleSavePositions}
                onCancelEdit={handleCancelEdit}
                userSeatId={userSeatId}
                onLeaveSeat={handleLeaveSeat}
                onPromoteMember={onPromoteMember}
                onDemoteMember={onDemoteMember}
                onKickMember={handleKickMember}
                classroom={classroom}
                onClassroomBackClick={() => navigate('/')}
            >
                {/* ✨ Navbar Children removed - Tools moved to ActionBar */}
            </Navbar>



            <main className={`main__content ${isSidebarOpen ? 'shift' : ''}`}>
                <div
                    className={`classroom-header ${isBannerCollapsed ? 'collapsed' : ''}`}
                    style={{
                        borderLeftColor: classroom.color,
                        backgroundImage: classroom.bannerUrl ? `url(${API_BASE_URL}${classroom.bannerUrl})` : 'none'
                    }}
                >
                    <div className="classroom-header-overlay"></div>
                    <div className="classroom-header-content">
                        <h1>{classroom.name}</h1>
                        <p>{classroom.subname}</p>
                    </div>
                    {isCreator && (
                        <div className="classroom-header-actions">
                            <span className="classroom-edit-btn" title="Edit Classroom Settings" onClick={handleEditClassroom} style={{ marginBottom: '-13px' }}>
                                <FaEdit size={20} />
                            </span>
                        </div>
                    )}

                    {/* Banner toggle button */}
                    <button
                        className="banner-collapse-btn"
                        onClick={() => setIsBannerCollapsed(!isBannerCollapsed)}
                        title={isBannerCollapsed ? "Expand banner" : "Collapse banner"}
                    >
                        {isBannerCollapsed ? <FaChevronDown /> : <FaChevronUp />}
                    </button>
                </div>
                <div className="classroom-layout-container">
                    <div className="seating-chart-section">
                        {/* ✨ Inner Card for White Background */}
                        <div className="seating-area-card">
                            <div className="seating-header">
                                {/* ✨ Styled View Toggle Switch */}
                                <ViewToggle activeView={viewMode} onViewChange={setViewMode} />

                                <div className="seating-controls">
                                    {/* Zoom Controls - use separate handlers per view */}
                                    <div className="zoom-controls">
                                        <button
                                            className="zoom-btn zoom-out"
                                            onClick={viewMode === 'seating' ? handleZoomOut : handleEventZoomOut}
                                            disabled={viewMode === 'seating' ? zoomLevel <= minZoom : eventZoomLevel <= eventMinZoom}
                                            title="Zoom Out"
                                        >
                                            -
                                        </button>
                                        <span className="zoom-level">{Math.round((viewMode === 'seating' ? zoomLevel : eventZoomLevel) * 100)}%</span>
                                        <button
                                            className="zoom-btn zoom-in"
                                            onClick={viewMode === 'seating' ? handleZoomIn : handleEventZoomIn}
                                            disabled={viewMode === 'seating' ? zoomLevel >= maxZoom : eventZoomLevel >= eventMaxZoom}
                                            title="Zoom In"
                                        >
                                            +
                                        </button>
                                        <button
                                            className="zoom-btn zoom-reset"
                                            onClick={viewMode === 'seating' ? handleZoomReset : handleEventZoomReset}
                                            title="Reset Zoom"
                                        >
                                            Reset
                                        </button>

                                        {/* View Toggle Button (seating only) */}
                                        {viewMode === 'seating' && isCreator && (
                                            <button
                                                className={`zoom-btn ${isTeacherView ? 'active' : ''}`}
                                                onClick={handleToggleView}
                                                title={isTeacherView ? "Switch to Back View" : "Switch to Teacher (Front) View"}
                                                style={{ marginLeft: '10px' }}
                                            >
                                                <FaChalkboardTeacher size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Render Content Based on View Mode */}
                            {viewMode === 'seating' ? (
                                <>
                                    {renderSeatingChart()}
                                    {/* ✨ Show Events below Seating Chart */}
                                    <div style={{ marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                                        <h3 style={{ fontSize: '1.1rem', color: '#4b5563', marginBottom: '15px' }}>Classroom Events</h3>
                                        <ClassroomEvent
                                            isCreator={isCreator}
                                            events={classroomEvents}
                                            onAddEvent={handleAddEvent}
                                            onTriggerEvent={handleTriggerEvent}
                                            onDeleteEvent={handleDeleteEvent}
                                            onSubmitAnswer={handleSubmitAnswer}
                                            onEndEvent={handleEndAndScoreEvent}
                                            candidates={Object.values(assignedUsers).map(u => ({
                                                name: u.userName,
                                                photoSrc: getProfileImageSrc(u.photoURL, isGoogleUser(u))
                                            }))}
                                            currentUser={user}
                                        />
                                    </div>
                                </>
                            ) : (
                                <ClassroomEvent
                                    isCreator={isCreator}
                                    events={classroomEvents}
                                    onAddEvent={handleAddEvent}
                                    onTriggerEvent={handleTriggerEvent}
                                    onDeleteEvent={handleDeleteEvent}
                                    onSubmitAnswer={handleSubmitAnswer}
                                    onEndEvent={handleEndAndScoreEvent}
                                    candidates={Object.values(assignedUsers).map(u => ({
                                        name: u.userName,
                                        photoSrc: getProfileImageSrc(u.photoURL, isGoogleUser(u))
                                    }))}
                                    currentUser={user}
                                    zoomScale={eventZoomLevel}
                                />
                            )}
                        </div>

                        {/* ✨ Action Bar outside the white card */}
                        <ActionBar actions={actionBarActions} />
                    </div>

                    {/* ✨ Chat Split Card (Side-by-Side) */}
                    <div className={`chat-split-card ${isChatSidebarOpen ? 'open' : ''}`}>
                        <div className="edit-sidebar-header" style={{
                            padding: '15px 20px',
                            background: '#f8f9fa',
                            borderBottom: '1px solid #eee',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Class Chat</h3>
                            <button
                                className="close-edit-sidebar"
                                onClick={() => setIsChatSidebarOpen(false)}
                                title="Close Chat"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                            >
                                <FaTimes size={18} color="#666" />
                            </button>
                        </div>

                        <div className="edit-sidebar-content" style={{ padding: '0', display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <div
                                ref={chatContainerRef}
                                style={{ flex: 1, overflowY: 'auto', padding: '15px' }}
                            >
                                <div style={{ textAlign: 'center', color: '#888', fontSize: '0.85rem', marginBottom: '15px' }}>
                                    {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </div>

                                {chatMessages.length === 0 ? (
                                    <div style={{ textAlign: 'center', color: '#aaa', marginTop: '20px', fontStyle: 'italic' }}>
                                        No messages yet. Start the conversation!
                                    </div>
                                ) : (
                                    chatMessages.map((msg, index) => {
                                        const isMe = msg.senderId === user.id;
                                        const isSystem = msg.senderId === 'system' || msg.isSystem;

                                        if (isSystem) {
                                            return (
                                                <div key={index} style={{
                                                    textAlign: 'center',
                                                    margin: '15px 0',
                                                    color: '#666',
                                                    fontSize: '0.85rem',
                                                    background: '#f8f9fa',
                                                    padding: '8px 15px',
                                                    borderRadius: '20px',
                                                    border: '1px solid #eee',
                                                    alignSelf: 'center',
                                                    width: 'fit-content',
                                                    marginLeft: 'auto',
                                                    marginRight: 'auto'
                                                }}>
                                                    {msg.message}
                                                </div>
                                            );
                                        }

                                        // ✨ Check if this is a grouping card message
                                        let groupingData = null;
                                        try {
                                            if (typeof msg.message === 'string' && msg.message.startsWith('{"type":"grouping"')) {
                                                groupingData = JSON.parse(msg.message);
                                            }
                                        } catch (e) { /* not JSON */ }

                                        if (groupingData) {
                                            const groupEvent = classroomEvents.find(ev => ev.id === groupingData.eventId);
                                            const hasJoined = groupEvent?.results?.some(r => r.userId === user.id);
                                            return (
                                                <div key={index} style={{ marginBottom: '12px', maxWidth: '85%', marginLeft: isMe ? 'auto' : '0', marginRight: isMe ? '0' : 'auto' }}>
                                                    <div style={{
                                                        background: 'linear-gradient(135deg, #10b981, #059669)',
                                                        borderRadius: '14px',
                                                        overflow: 'hidden',
                                                        boxShadow: '0 3px 12px rgba(16,185,129,0.25)'
                                                    }}>
                                                        <div style={{ padding: '14px 16px', color: 'white' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                                <FaUsers />
                                                                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Student Groups</span>
                                                            </div>
                                                            <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.85 }}>Choose your group below</p>
                                                        </div>
                                                        <div style={{ background: 'white', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                            {groupingData.groups.map((group, gIdx) => {
                                                                const members = groupEvent?.results?.filter(r => r.text === (group.id || group.name)) || [];
                                                                const maxMembers = group.maxMembers || 99;
                                                                const percentage = Math.min(100, Math.round((members.length / maxMembers) * 100));
                                                                const isFull = members.length >= maxMembers;
                                                                return (
                                                                    <button
                                                                        key={gIdx}
                                                                        onClick={() => {
                                                                            if (!isCreator && !hasJoined && !isFull && groupEvent) {
                                                                                handleSubmitAnswer(groupEvent, group.id || group.name);
                                                                            }
                                                                        }}
                                                                        disabled={isCreator || hasJoined || isFull}
                                                                        style={{
                                                                            display: 'flex',
                                                                            flexDirection: 'column',
                                                                            width: '100%',
                                                                            padding: '10px 12px',
                                                                            border: '1px solid #e5e7eb',
                                                                            borderLeft: `4px solid ${group.color}`,
                                                                            borderRadius: '8px',
                                                                            background: isFull ? '#fef2f2' : hasJoined ? '#f0fdf4' : '#fff',
                                                                            cursor: (isCreator || hasJoined || isFull) ? 'default' : 'pointer',
                                                                            transition: 'all 0.2s',
                                                                            textAlign: 'left',
                                                                            opacity: (isCreator || hasJoined || isFull) ? 0.7 : 1,
                                                                        }}
                                                                    >
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                                                                            <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: group.color, flexShrink: 0 }} />
                                                                            <span style={{ flex: 1, fontSize: '0.88rem', fontWeight: 500, color: '#1f2937' }}>{group.name}</span>
                                                                            <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{members.length}/{maxMembers}</span>
                                                                            {isFull && <span style={{ padding: '1px 5px', background: '#ef4444', color: '#fff', borderRadius: '3px', fontSize: '0.6rem', fontWeight: 700 }}>FULL</span>}
                                                                        </div>
                                                                        {/* Avatar stack */}
                                                                        {members.length > 0 && (
                                                                            <div style={{ display: 'flex', alignItems: 'center', marginTop: '6px' }}>
                                                                                {members.slice(0, 5).map((m, mIdx) => (
                                                                                    <img
                                                                                        key={mIdx}
                                                                                        src={getProfileImageSrc(m.photoURL)}
                                                                                        alt={m.userName}
                                                                                        style={{
                                                                                            width: '22px', height: '22px', borderRadius: '50%', border: '2px solid #fff',
                                                                                            objectFit: 'cover', marginLeft: mIdx === 0 ? 0 : '-6px',
                                                                                            boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                                                                        }}
                                                                                        onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(m.userName || '?')}&background=random&size=24`; }}
                                                                                    />
                                                                                ))}
                                                                                {members.length > 5 && (
                                                                                    <span style={{
                                                                                        width: '22px', height: '22px', borderRadius: '50%', background: '#e5e7eb',
                                                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                                        fontSize: '0.6rem', color: '#6b7280', fontWeight: 600, marginLeft: '-6px', border: '2px solid #fff'
                                                                                    }}>+{members.length - 5}</span>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                        {/* Progress bar */}
                                                                        <div style={{ width: '100%', height: '4px', background: '#e5e7eb', borderRadius: '2px', marginTop: '6px', overflow: 'hidden' }}>
                                                                            <div style={{
                                                                                height: '100%', borderRadius: '2px',
                                                                                width: `${percentage}%`,
                                                                                background: isFull ? '#ef4444' : group.color,
                                                                                transition: 'width 0.5s ease'
                                                                            }} />
                                                                        </div>
                                                                    </button>
                                                                );
                                                            })}
                                                            {hasJoined && (
                                                                <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#059669', fontWeight: 500, padding: '4px 0' }}>
                                                                    ✅ You've joined a group
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div style={{ fontSize: '11px', color: '#999', marginTop: '3px', textAlign: isMe ? 'right' : 'left' }}>
                                                        {msg.senderName} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            );
                                        }

                                        return (
                                            <div key={index} style={{
                                                marginBottom: '10px',
                                                display: 'flex',
                                                gap: '10px',
                                                flexDirection: isMe ? 'row-reverse' : 'row'
                                            }}>
                                                <img
                                                    src={getProfileImageSrc(msg.senderPhoto, false)}
                                                    alt={msg.senderName}
                                                    onError={handleImageError}
                                                    style={{ width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0, objectFit: 'cover' }}
                                                />
                                                <div style={{ alignItems: isMe ? 'flex-end' : 'flex-start', display: 'flex', flexDirection: 'column', maxWidth: '70%' }}>
                                                    <div style={{
                                                        background: isMe ? '#e3f2fd' : '#f1f1f1',
                                                        padding: '8px 12px',
                                                        borderRadius: isMe ? '12px 12px 0 12px' : '12px 12px 12px 0',
                                                        wordBreak: 'break-word'
                                                    }}>
                                                        {msg.message}
                                                    </div>
                                                    <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>
                                                        {isMe ? 'Me' : msg.senderName} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}

                            </div>

                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    if (newMessage.trim()) {
                                        emitChatMessage(newMessage.trim());
                                        setNewMessage('');
                                    }
                                }}
                                style={{
                                    padding: '15px',
                                    borderTop: '1px solid #eee',
                                    display: 'flex',
                                    gap: '10px',
                                    background: '#fff'
                                }}>
                                <input
                                    type="text"
                                    placeholder="Type a message..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    style={{
                                        flex: 1,
                                        padding: '10px 15px',
                                        borderRadius: '20px',
                                        border: '1px solid #ddd',
                                        fontSize: '14px',
                                        outline: 'none',
                                        transition: 'border-color 0.2s'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#4CAF50'}
                                    onBlur={(e) => e.target.style.borderColor = '#ddd'}
                                />
                                <button type="submit" style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    background: '#4CAF50',
                                    color: 'white',
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                                }}>
                                    <FaChevronRight size={18} />
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </main>
            <ChairAssignModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onConfirm={handleAssign}
                defaultName={user?.displayName}
            />
            <ChairDropdown
                isOpen={dropdownOpen}
                    onClose={() => setDropdownOpen(false)}
                    position={dropdownPosition}
                    onRateStudent={handleRateStudent}
                    onCheckAttendance={handleCheckAttendance}
                    onFunction3={handleFunction3}
                onFunction4={handleFunction4}
            />
            <StudentRatingModal
                isOpen={ratingModalOpen}
                onClose={() => setRatingModalOpen(false)}
                onRate={handleApplyRating}
                studentName={selectedStudentChair ? assignedUsers[selectedStudentChair]?.userName : ''}
                ratePresets={ratePresets}
            />
            {/* ✨ Grouping Modal */}
            <GroupingModal
                isOpen={isGroupModalOpen}
                onClose={() => setIsGroupModalOpen(false)}
                onCreateGroups={handleCreateGroups}
                activeGroupingEvent={classroomEvents?.find(e => e.type === 'grouping' && e.status === 'active')}
                onCancelGrouping={(event) => handleEndAndScoreEvent(event)}
            />
        </>
    );
};

export default ClassroomPage;
