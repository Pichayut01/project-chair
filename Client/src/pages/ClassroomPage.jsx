// src/pages/ClassroomPage.jsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import Navbar from '../component/Navbar';
import Loader from '../component/Loader';
import '../CSS/ClassroomPage.css';
import '../CSS/Navbar.css';
import '../CSS/Main.css';
import { getProfileImageSrc, isGoogleUser, handleImageError } from '../utils/profileImageHelper';
import Chair from '../component/Chair';
import ChairAssignModal from '../component/ChairAssignModal';
import ChairPresets from '../component/ChairPresets';
import ChairDropdown from '../component/ChairDropdown';
import StudentRatingModal from '../component/StudentRatingModal';
import { useSocket } from '../hooks/useSocket';


import { FaEdit, FaTh, FaRandom, FaBars, FaThLarge, FaChevronUp, FaChevronDown, FaExchangeAlt, FaChalkboardTeacher, FaObjectGroup, FaLink, FaTrash, FaUndo, FaHandPaper, FaSmile, FaComment, FaCheck, FaTimes, FaLayerGroup, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import ActionBar from '../component/ActionBar';
import { motion, AnimatePresence } from 'framer-motion';
import GroupOverlay from '../component/GroupOverlay';

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
    const [isChatSidebarOpen, setIsChatSidebarOpen] = useState(false); // ✨ Chat Sidebar State
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

    // ✨ Chat State
    const [chatMessages, setChatMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const chatContainerRef = useRef(null);

    // Zoom functionality state
    const [zoomLevel, setZoomLevel] = useState(1);
    const minZoom = 0.5;
    const maxZoom = 3;

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
    const handleRaiseHand = () => {
        Swal.fire('Raised Hand', 'You raised your hand!', 'info');
    };

    const handleEmoji = () => {
        Swal.fire('Emoji', 'Emoji picker would open here.', 'question');
    };

    const handleChat = () => {
        setIsChatSidebarOpen(prev => !prev);
    };

    // Handle real-time chair seating updates
    const handleChairUpdate = useCallback((data) => {
        console.log('Received chair seating update:', data);

        if (data.updatedBy !== user.id) {
            // Update assigned users state
            setAssignedUsers(data.assignedUsers);

            // Show notification based on action
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
        }
    }, [user.id]);

    // Handle real-time chair movement updates
    const handleChairMovement = useCallback((data) => {
        console.log('Received chair movement update:', data);

        if (data.updatedBy !== user.id) {
            // Update chair positions
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

    // ✨ Handle real-time chair group updates
    const handleChairGroupUpdate = useCallback((data) => {
        console.log('Received chair group update:', data);

        if (data.updatedBy !== user.id) {
            setChairGroups(data.chairGroups);
            /*
            Swal.fire({
                icon: 'info',
                title: 'Groups Updated',
                text: 'Chair groupings have been updated',
                timer: 1500,
                showConfirmButton: false,
                position: 'top-end',
                toast: true,
                background: '#e0f2f1',
                color: '#00695c'
            });
            */
        }
    }, [user.id]);

    // ✨ Handle incoming chat messages
    const handleChatMessage = useCallback((data) => {
        setChatMessages(prev => [...prev, data]);
        // Auto-scroll to bottom using container scrollTop to avoid page jumping
        setTimeout(() => {
            if (chatContainerRef.current) {
                chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
            }
        }, 100);
    }, []);

    // Initialize socket connection
    const { emitScoreUpdate, emitChairSeatingUpdate, emitChairMovement, emitChairGroupUpdate, emitChatMessage } = useSocket(
        classId,
        user,
        handleScoreUpdate,
        handleChairUpdate,
        handleChairMovement,
        handleChairGroupUpdate,
        handleChatMessage // ✨ Pass chat handler
    );


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

    // Zoom functionality handlers
    const handleZoomIn = useCallback(() => {
        setZoomLevel(prev => Math.min(prev + 0.2, maxZoom));
    }, [maxZoom]);

    const handleZoomOut = useCallback(() => {
        setZoomLevel(prev => Math.max(prev - 0.2, minZoom));
    }, [minZoom]);

    const handleZoomReset = useCallback(() => {
        setZoomLevel(1);
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
            const response = await axios.get(`${PRESETS_API_URL}/api/presets?classroomId=${classId}`, {
                headers: { 'x-auth-token': user.token }
            });

            // Transform the new API response to match expected format
            const transformedPresets = response.data.data?.map(preset => {
                // Determine type based on tags or preset name
                const isNegative = preset.tags?.includes('negative') ||
                    preset.name.toLowerCase().includes('late') ||
                    preset.name.toLowerCase().includes('absent') ||
                    preset.name.toLowerCase().includes('disrupt');

                return {
                    _id: preset._id,
                    name: preset.name,
                    emoji: isNegative ? '⚠️' : '⭐',
                    type: isNegative ? 'negative' : 'positive',
                    notifyStudent: true,
                    scoreType: isNegative ? 'subtract' : 'add',
                    scoreValue: preset.scoreValue || 5,
                    criteria: preset.criteria
                };
            }) || [];

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

    const handleFunction2 = () => {
        setDropdownOpen(false);
        // Implement function 2 logic here
        console.log('Function 2 clicked for chair:', selectedStudentChair);
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
                        border: '2px solid #e5e7eb',
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
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
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
        {
            id: 'raise-hand',
            icon: <FaHandPaper />,
            label: 'Raise Hand',
            onClick: handleRaiseHand,
            isActive: false
        },
        {
            id: 'emoji',
            icon: <FaSmile />,
            label: 'Emoji',
            onClick: handleEmoji,
            isActive: false
        },
        {
            id: 'chat',
            icon: <FaComment />,
            label: 'Chat',
            onClick: handleChat,
            isActive: isChatSidebarOpen
        },
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
                    <div className="seating-chart-section" >
                        <div className="seating-header">
                            <h2 className="section-title">Seating Arrangement</h2>
                            <div className="seating-controls">
                                {/* Zoom Controls */}
                                <div className="zoom-controls">
                                    <button
                                        className="zoom-btn zoom-out"
                                        onClick={handleZoomOut}
                                        disabled={zoomLevel <= minZoom}
                                        title="Zoom Out"
                                    >
                                        -
                                    </button>
                                    <span className="zoom-level">{Math.round(zoomLevel * 100)}%</span>
                                    <button
                                        className="zoom-btn zoom-in"
                                        onClick={handleZoomIn}
                                        disabled={zoomLevel >= maxZoom}
                                        title="Zoom In"
                                    >
                                        +
                                    </button>
                                    <button
                                        className="zoom-btn zoom-reset"
                                        onClick={handleZoomReset}
                                        title="Reset Zoom"
                                    >
                                        Reset
                                    </button>

                                    {/* Layout Presets (Edit Mode Only) - Removed from here, moved to bottom right */}
                                    {/* View Toggle Button */}
                                    {isCreator && (
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

                        {/* Render Seating Chart */}
                        {renderSeatingChart()}

                        {/* ✨ Action Bar inside Seating Section implies it fits the width */}
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
                onFunction2={handleFunction2}
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
        </>
    );
};

export default ClassroomPage;
