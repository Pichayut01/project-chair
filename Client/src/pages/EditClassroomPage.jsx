// src/pages/EditClassroomPage.jsx

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import Navbar from '../components/Navbar';
import Loader from '../components/Loader';
import '../CSS/EditClassroomPage.css';
import '../CSS/Navbar.css';
import '../CSS/Main.css';
import '../CSS/ClassroomPage.css';
import { getProfileImageSrc, isGoogleUser, handleImageError } from '../utils/profileImageHelper';
import Chair from '../components/Chair';
import ChairPresets from '../components/ChairPresets';
import { FaPalette, FaUsers, FaEllipsisH, FaChair, FaTh, FaRandom, FaBars, FaThLarge, FaArrowUp, FaArrowDown, FaUserSlash, FaCopy, FaCheck, FaCrown, FaUserGraduate, FaSpinner, FaSave } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

const API_BASE_URL = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000';

// Debounce delay in milliseconds
const DEBOUNCE_DELAY = 800;

const EditClassroomPage = ({ user, isSidebarOpen, toggleSidebar, handleSignOut }) => {
    const { classId } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [classroom, setClassroom] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState('theme');

    // Auto-save status
    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState(''); // '', 'saving', 'saved', 'error'

    // Debounce refs
    const themeDebounceRef = useRef(null);
    const settingsDebounceRef = useRef(null);

    // Theme settings
    const [themeData, setThemeData] = useState({
        name: '',
        subname: '',
        color: '#4CAF50',
        bannerUrl: ''
    });

    // Role management
    const [classroomMembers, setClassroomMembers] = useState({
        creator: [],
        participants: []
    });

    // Other settings
    const [otherSettings, setOtherSettings] = useState({
        classCode: '',
        isPublic: false,
        allowSelfJoin: true
    });

    // Seating management
    const [seatingPositions, setSeatingPositions] = useState({});
    const [currentChairPositions, setCurrentChairPositions] = useState({});
    const [assignedUsers, setAssignedUsers] = useState({});
    const [isSeatingEditing, setIsSeatingEditing] = useState(false);
    const [bannerFile, setBannerFile] = useState(null);
    const [bannerPreview, setBannerPreview] = useState('');
    const containerRef = useRef(null);

    useEffect(() => {
        if (!user || !user.token || !classId) return;
        fetchClassroomDetails();
    }, [classId, user]);

    const fetchClassroomDetails = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/classrooms/${classId}`, {
                headers: { 'x-auth-token': user.token }
            });
            const data = response.data;
            setClassroom(data);

            // Set theme data
            setThemeData({
                name: data.name || '',
                subname: data.subname || '',
                color: data.color || '#4CAF50',
                bannerUrl: data.bannerUrl || ''
            });

            // Set banner preview if exists
            if (data.bannerUrl) {
                setBannerPreview(`${API_BASE_URL}${data.bannerUrl}`);
            }

            // Set classroom members
            const creators = data.creator || [];
            const creatorIds = new Set(creators.map(c => c._id));
            const participants = (data.participants || []).filter(p => !creatorIds.has(p._id));

            setClassroomMembers({
                creator: creators,
                participants: participants
            });

            // Set other settings
            setOtherSettings({
                classCode: data.classCode || '',
                isPublic: data.isPublic || false,
                allowSelfJoin: data.allowSelfJoin !== false
            });

            // Set seating data
            const fetchedPositions = data.seatingPositions || {};
            const fetchedAssignedUsers = data.assignedUsers || {};
            setSeatingPositions(fetchedPositions);
            setCurrentChairPositions(fetchedPositions);
            setAssignedUsers(fetchedAssignedUsers);

            setLoading(false);
        } catch (err) {
            console.error("Error fetching classroom details:", err);
            Swal.fire(t('common.error') || 'Error', t('editClassroomPage.loadError') || 'Failed to load classroom details.', 'error');
            setLoading(false);
        }
    };

    // Auto-save theme settings
    const autoSaveTheme = useCallback(async (data) => {
        setSaving(true);
        setSaveStatus('saving');
        try {
            const updatedThemeData = {
                name: data.name,
                subname: data.subname,
                color: data.color,
                bannerUrl: data.bannerUrl || ''
            };

            await axios.put(`${API_BASE_URL}/api/classrooms/${classId}/theme`, updatedThemeData, {
                headers: { 'x-auth-token': user.token }
            });

            setClassroom(prev => ({ ...prev, ...updatedThemeData }));
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus(''), 2000);
        } catch (error) {
            console.error('Failed to save theme:', error);
            setSaveStatus('error');
            setTimeout(() => setSaveStatus(''), 3000);
        } finally {
            setSaving(false);
        }
    }, [classId, user]);

    // Auto-save other settings
    const autoSaveSettings = useCallback(async (data) => {
        setSaving(true);
        setSaveStatus('saving');
        try {
            await axios.put(
                `${API_BASE_URL}/api/classrooms/${classId}/settings`,
                {
                    isPublic: data.isPublic,
                    allowSelfJoin: data.allowSelfJoin
                },
                { headers: { 'x-auth-token': user.token } }
            );
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus(''), 2000);
        } catch (err) {
            console.error("Failed to update settings:", err);
            setSaveStatus('error');
            setTimeout(() => setSaveStatus(''), 3000);
        } finally {
            setSaving(false);
        }
    }, [classId, user]);

    // Handle theme data change with debounce
    const handleThemeChange = useCallback((newThemeData) => {
        setThemeData(newThemeData);

        // Clear existing timeout
        if (themeDebounceRef.current) {
            clearTimeout(themeDebounceRef.current);
        }

        // Set new timeout for auto-save
        themeDebounceRef.current = setTimeout(() => {
            autoSaveTheme(newThemeData);
        }, DEBOUNCE_DELAY);
    }, [autoSaveTheme]);

    // Handle other settings change with debounce
    const handleOtherSettingsChange = useCallback((newSettings) => {
        setOtherSettings(newSettings);

        // Clear existing timeout
        if (settingsDebounceRef.current) {
            clearTimeout(settingsDebounceRef.current);
        }

        // Set new timeout for auto-save
        settingsDebounceRef.current = setTimeout(() => {
            autoSaveSettings(newSettings);
        }, DEBOUNCE_DELAY);
    }, [autoSaveSettings]);

    // Cleanup timeouts on unmount
    useEffect(() => {
        return () => {
            if (themeDebounceRef.current) clearTimeout(themeDebounceRef.current);
            if (settingsDebounceRef.current) clearTimeout(settingsDebounceRef.current);
        };
    }, []);

    const handlePromoteMember = async (memberId, memberName) => {
        try {
            const result = await Swal.fire({
                title: t('classroomPage.swal.promoteTitle', { memberName }) || `Promote ${memberName} to Creator?`,
                text: t('classroomPage.swal.promoteText') || "This user will gain the same permissions as the classroom owner.",
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: t('classroomPage.swal.promoteBtn') || 'Promote',
                cancelButtonText: t('common.cancel') || 'Cancel'
            });
            if (result.isConfirmed) {
                await axios.put(
                    `${API_BASE_URL}/api/classrooms/${classId}/promote`,
                    { userId: memberId },
                    { headers: { 'x-auth-token': user.token } }
                );
                Swal.fire(t('common.success') || 'Success', t('classroomPage.swal.promoteSuccess', { memberName }) || `${memberName} has been promoted to Creator.`, 'success');
                fetchClassroomDetails();
            }
        } catch (err) {
            Swal.fire(t('common.error') || 'Error', t('classroomPage.swal.promoteError') || 'Could not promote the member.', 'error');
        }
    };

    const handleDemoteMember = async (memberId, memberName) => {
        try {
            const result = await Swal.fire({
                title: t('classroomPage.swal.demoteTitle', { memberName }) || `Demote ${memberName}?`,
                text: t('classroomPage.swal.demoteText') || "This user will lose their Creator permissions.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#e74c3c',
                cancelButtonColor: '#3085d6',
                confirmButtonText: t('classroomPage.swal.demoteBtn') || 'Demote',
                cancelButtonText: t('common.cancel') || 'Cancel'
            });
            if (result.isConfirmed) {
                await axios.put(
                    `${API_BASE_URL}/api/classrooms/${classId}/demote`,
                    { userId: memberId },
                    { headers: { 'x-auth-token': user.token } }
                );
                Swal.fire(t('common.success') || 'Success', t('classroomPage.swal.demoteSuccess', { memberName }) || `${memberName} has been demoted to a participant.`, 'success');
                fetchClassroomDetails();
            }
        } catch (err) {
            Swal.fire(t('common.error') || 'Error', err.response?.data?.msg || t('classroomPage.swal.demoteError') || 'Could not demote the member.', 'error');
        }
    };

    const handleKickMember = async (memberId, memberName) => {
        const result = await Swal.fire({
            title: t('classroomPage.swal.kickTitle', { memberName }) || `Kick ${memberName} from the classroom?`,
            text: t('classroomPage.swal.kickText') || "This user will be removed from the classroom.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: t('classroomPage.swal.kickBtn') || 'Kick',
            cancelButtonText: t('common.cancel') || 'Cancel',
            confirmButtonColor: '#e74c3c'
        });
        if (result.isConfirmed) {
            try {
                await axios.put(
                    `${API_BASE_URL}/api/classrooms/${classId}/kick`,
                    { userId: memberId },
                    { headers: { 'x-auth-token': user.token } }
                );
                Swal.fire(t('common.success') || 'Success', t('classroomPage.swal.kickSuccess', { memberName }) || `${memberName} has been kicked from the classroom.`, 'success');
                fetchClassroomDetails();
            } catch (err) {
                Swal.fire(t('common.error') || 'Error', t('classroomPage.swal.kickError') || 'Could not kick the member.', 'error');
            }
        }
    };

    const handleBackToClassroom = () => {
        navigate(`/classroom/${classId}`);
    };

    const handleSectionChange = (section) => {
        setActiveSection(section);
    };

    const handleChairMove = useCallback((id, newX, newY) => {
        setCurrentChairPositions(prevPositions => ({
            ...prevPositions,
            [id]: { x: newX, y: newY }
        }));
    }, []);

    const handleApplyPreset = async (presetType) => {
        if (!containerRef.current) return;

        const containerRect = containerRef.current.getBoundingClientRect();
        const chairCount = Object.keys(currentChairPositions).length;

        if (chairCount === 0) {
            Swal.fire(t('editClassroomPage.seatingSection.noChairsTitle') || 'No Chairs', t('editClassroomPage.seatingSection.noChairsText') || 'Please add some chairs first before applying presets.', 'info');
            return;
        }

        const result = await Swal.fire({
            title: t('classroomPage.swal.applyLayoutTitle', { presetName: presetType.charAt(0).toUpperCase() + presetType.slice(1) }) || `Apply ${presetType.charAt(0).toUpperCase() + presetType.slice(1)} Layout?`,
            text: t('classroomPage.swal.applyLayoutText') || "This will rearrange all chairs according to the selected preset.",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: t('classroomPage.swal.applyLayoutBtn') || 'Apply Layout',
            cancelButtonText: t('common.cancel') || 'Cancel'
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
            Swal.fire(t('common.success') || 'Success', t('classroomPage.swal.applyLayoutSuccess', { presetName: presetType.charAt(0).toUpperCase() + presetType.slice(1) }) || `${presetType.charAt(0).toUpperCase() + presetType.slice(1)} layout applied!`, 'success');
        }
    };

    const handleBannerFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Check file type
            if (!file.type.startsWith('image/')) {
                Swal.fire(t('common.error') || 'Error', t('editClassroomPage.themeSection.imageError') || 'Please select an image file.', 'error');
                return;
            }

            // Check file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                Swal.fire(t('common.error') || 'Error', t('editClassroomPage.themeSection.imageSizeError') || 'Image size must be less than 5MB.', 'error');
                return;
            }

            setBannerFile(file);

            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setBannerPreview(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveBanner = () => {
        setBannerFile(null);
        setBannerPreview('');
        const newThemeData = { ...themeData, bannerUrl: '' };
        handleThemeChange(newThemeData);
    };

    const handleSaveSeating = async () => {
        try {
            await axios.put(`${API_BASE_URL}/api/classrooms/${classId}/seating`, {
                seatingPositions: currentChairPositions
            }, {
                headers: { 'x-auth-token': user.token }
            });
            setSeatingPositions(currentChairPositions);
            setIsSeatingEditing(false);
            Swal.fire(t('editClassroomPage.seatingSection.savedTitle') || 'Saved!', t('editClassroomPage.seatingSection.savedText') || 'Seating arrangement updated successfully.', 'success');
        } catch (error) {
            console.error('Failed to save seating positions:', error);
            Swal.fire(t('common.error') || 'Error', t('editClassroomPage.seatingSection.saveError') || 'Failed to save seating arrangement.', 'error');
        }
    };

    const handleCancelSeatingEdit = () => {
        setIsSeatingEditing(false);
        setCurrentChairPositions(seatingPositions);
    };

    const calculateContainerSize = () => {
        const positions = isSeatingEditing ? currentChairPositions : seatingPositions;
        const chairList = Object.values(positions);
        const chairCount = chairList.length;

        // Base minimum size calculations
        const sidebarWidth = isSidebarOpen ? 250 : 0;
        const navbarHeight = 120;
        const baseMinWidth = (window.innerWidth - sidebarWidth - 40) * 0.8;
        const baseMinHeight = (window.innerHeight - navbarHeight) * 0.8;

        if (chairCount === 0) {
            return {
                width: Math.round(baseMinWidth) + 'px',
                height: Math.round(baseMinHeight) + 'px'
            };
        }

        // Enhanced auto-sizing based on chair count
        const chairSize = 60;
        const chairRadius = chairSize / 2;
        const nameHeight = 20;
        const basePadding = 50; // Reduced from 80

        // Dynamic padding and spacing based on chair count - more conservative
        const scaleFactor = Math.max(1, Math.sqrt(chairCount / 30)); // Changed from 15 to 30
        const dynamicPadding = basePadding * scaleFactor;
        const minSpacing = 80 * scaleFactor; // Reduced from 100

        // Calculate bounds from chair positions
        const bounds = chairList.reduce((acc, pos) => {
            const left = pos.x - chairRadius;
            const right = pos.x + chairRadius;
            const top = pos.y - chairRadius;
            const bottom = pos.y + chairRadius + nameHeight;

            return {
                minX: Math.min(acc.minX, left),
                maxX: Math.max(acc.maxX, right),
                minY: Math.min(acc.minY, top),
                maxY: Math.max(acc.maxY, bottom)
            };
        }, {
            minX: Infinity,
            maxX: -Infinity,
            minY: Infinity,
            maxY: -Infinity
        });

        // Calculate content size with enhanced scaling
        const contentFromBounds = {
            width: bounds.maxX - bounds.minX + (2 * dynamicPadding),
            height: bounds.maxY - bounds.minY + (2 * dynamicPadding)
        };

        // Calculate optimal size based on chair count and arrangement - more compact
        const estimatedCols = Math.ceil(Math.sqrt(chairCount * 1.2)); // Reduced from 1.4
        const estimatedRows = Math.ceil(chairCount / estimatedCols);
        const optimalWidth = estimatedCols * minSpacing + (2 * dynamicPadding);
        const optimalHeight = estimatedRows * minSpacing + (2 * dynamicPadding);

        // Use the larger of calculated sizes to ensure proper spacing
        const finalWidth = Math.max(baseMinWidth, contentFromBounds.width, optimalWidth);
        const finalHeight = Math.max(baseMinHeight, contentFromBounds.height, optimalHeight);

        return {
            width: Math.round(finalWidth) + 'px',
            height: Math.round(finalHeight) + 'px'
        };
    };

    const addNewChair = () => {
        const chairId = `chair-${Date.now()}`;
        const newPosition = { x: 100, y: 100 };
        setCurrentChairPositions(prev => ({
            ...prev,
            [chairId]: newPosition
        }));
    };

    const renderThemeSection = () => (
        <div className="edit-section">
            <h2 className="section-title">
                <FaPalette className="section-icon" />
                {t('editClassroomPage.themeSection.title') || 'Theme Settings'}
            </h2>

            <div className="theme-settings-container">
                {/* Classroom Name */}
                <div className="setting-item">
                    <div className="setting-header">
                        <span className="setting-title">{t('editClassroomPage.themeSection.nameTitle') || 'Classroom Name'}</span>
                    </div>
                    <p className="setting-description">{t('editClassroomPage.themeSection.nameDesc') || 'The display name for your classroom.'}</p>
                    <input
                        type="text"
                        value={themeData.name}
                        onChange={(e) => handleThemeChange({ ...themeData, name: e.target.value })}
                        placeholder={t('editClassroomPage.themeSection.namePlaceholder') || 'Enter classroom name'}
                        className="theme-input"
                    />
                </div>

                {/* Description */}
                <div className="setting-item">
                    <div className="setting-header">
                        <span className="setting-title">{t('editClassroomPage.themeSection.descTitle') || 'Description'}</span>
                    </div>
                    <p className="setting-description">{t('editClassroomPage.themeSection.descDesc') || 'A brief description of your classroom (e.g., subject, section).'}</p>
                    <input
                        type="text"
                        value={themeData.subname}
                        onChange={(e) => handleThemeChange({ ...themeData, subname: e.target.value })}
                        placeholder={t('editClassroomPage.themeSection.descPlaceholder') || 'Enter description'}
                        className="theme-input"
                    />
                </div>

                {/* Theme Color */}
                <div className="setting-item">
                    <div className="setting-header">
                        <span className="setting-title">{t('editClassroomPage.themeSection.colorTitle') || 'Theme Color'}</span>
                    </div>
                    <p className="setting-description">{t('editClassroomPage.themeSection.colorDesc') || 'Choose a color to personalize your classroom.'}</p>
                    <div className="color-picker-container">
                        <input
                            type="color"
                            value={themeData.color}
                            onChange={(e) => handleThemeChange({ ...themeData, color: e.target.value })}
                            className="color-input"
                        />
                        <div className="color-preview" style={{ backgroundColor: themeData.color }}>
                            <span className="color-code">{themeData.color}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderRoleSection = () => (
        <div className="edit-section">
            <h2 className="section-title">
                <FaUsers className="section-icon" />
                {t('editClassroomPage.roleSection.title') || 'Role Management'}
            </h2>

            <div className="role-section">
                <h3>
                    <FaCrown style={{ color: '#4CAF50' }} />
                    {t('editClassroomPage.roleSection.creators') || 'Creators'}
                    <span className="role-count">{classroomMembers.creator.length}</span>
                </h3>
                <div className="members-list">
                    {classroomMembers.creator.map(creator => (
                        <div key={creator._id} className="member-card creator">
                            <img referrerPolicy="no-referrer" src={getProfileImageSrc(creator.photoURL, isGoogleUser(creator))} alt={creator.displayName} onError={handleImageError} />
                            <div className="member-info">
                                <span className="member-name">{creator.displayName}</span>
                                {creator.email && <span className="member-email">{creator.email}</span>}
                                <span className="role-badge creator-badge">
                                    <FaCrown size={10} /> {t('editClassroomPage.roleSection.creatorBadge') || 'Creator'}
                                </span>
                            </div>
                            {user.id !== creator._id && (
                                <div className="member-actions">
                                    <button
                                        className="action-btn demote-btn"
                                        onClick={() => handleDemoteMember(creator._id, creator.displayName)}
                                        title={t('editClassroomPage.roleSection.demoteBtn') || "Demote to participant"}
                                    >
                                        <FaArrowDown />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="role-section">
                <h3>
                    <FaUserGraduate style={{ color: '#2196F3' }} />
                    {t('editClassroomPage.roleSection.participants') || 'Participants'}
                    <span className="role-count">{classroomMembers.participants.length}</span>
                </h3>
                <div className="members-list">
                    {classroomMembers.participants.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#888', fontStyle: 'italic', width: '100%' }}>
                            {t('editClassroomPage.roleSection.noParticipants') || 'No participants yet'}
                        </div>
                    ) : (
                        classroomMembers.participants.map(participant => (
                            <div key={participant._id} className="member-card participant">
                                <img referrerPolicy="no-referrer" src={getProfileImageSrc(participant.photoURL, isGoogleUser(participant))} alt={participant.displayName} onError={handleImageError} />
                                <div className="member-info">
                                    <span className="member-name">{participant.displayName}</span>
                                    {participant.email && <span className="member-email">{participant.email}</span>}
                                    <span className="role-badge participant-badge">
                                        <FaUserGraduate size={10} /> {t('editClassroomPage.roleSection.studentBadge') || 'Student'}
                                    </span>
                                </div>
                                <div className="member-actions">
                                    <button
                                        className="action-btn promote-btn"
                                        onClick={() => handlePromoteMember(participant._id, participant.displayName)}
                                        title={t('editClassroomPage.roleSection.promoteBtn') || "Promote to creator"}
                                    >
                                        <FaArrowUp />
                                    </button>
                                    <button
                                        className="action-btn kick-btn"
                                        onClick={() => handleKickMember(participant._id, participant.displayName)}
                                        title={t('editClassroomPage.roleSection.kickBtn') || "Kick from classroom"}
                                    >
                                        <FaUserSlash />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );

    const renderOtherSection = () => (
        <div className="edit-section">
            <h2 className="section-title">
                <FaEllipsisH className="section-icon" />
                {t('editClassroomPage.otherSection.title') || 'Other Settings'}
            </h2>

            <div className="other-settings-section">
                {/* Class Code */}
                <div className="setting-item">
                    <div className="setting-header">
                        <span className="setting-title">{t('editClassroomPage.otherSection.classCodeTitle') || 'Class Code'}</span>
                    </div>
                    <p className="setting-description">{t('editClassroomPage.otherSection.classCodeDesc') || 'Share this code with students so they can join your classroom.'}</p>
                    <div className="class-code-display" style={{ marginTop: '12px' }}>
                        <input
                            type="text"
                            value={otherSettings.classCode}
                            readOnly
                            className="readonly-input"
                        />
                        <button
                            className="copy-btn"
                            onClick={() => {
                                navigator.clipboard.writeText(otherSettings.classCode);
                                Swal.fire({
                                    icon: 'success',
                                    title: t('editClassroomPage.otherSection.copiedTitle') || 'Copied!',
                                    text: t('editClassroomPage.otherSection.copiedText') || 'Class code copied to clipboard.',
                                    timer: 1500,
                                    showConfirmButton: false,
                                    toast: true,
                                    position: 'top-end'
                                });
                            }}
                        >
                            <FaCopy /> {t('editClassroomPage.otherSection.copyBtn') || 'Copy'}
                        </button>
                    </div>
                </div>

                {/* Public Setting */}
                <div className="setting-item">
                    <div className="setting-header">
                        <div>
                            <span className="setting-title">{t('editClassroomPage.otherSection.publicTitle') || 'Public Classroom'}</span>
                            <p className="setting-description">{t('editClassroomPage.otherSection.publicDesc') || 'Allow anyone to view this classroom without joining.'}</p>
                        </div>
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={otherSettings.isPublic}
                                onChange={(e) => handleOtherSettingsChange({ ...otherSettings, isPublic: e.target.checked })}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>
                </div>

                {/* Self Join Setting */}
                <div className="setting-item">
                    <div className="setting-header">
                        <div>
                            <span className="setting-title">{t('editClassroomPage.otherSection.selfJoinTitle') || 'Allow Self Join'}</span>
                            <p className="setting-description">{t('editClassroomPage.otherSection.selfJoinDesc') || 'Students can join using the class code without approval.'}</p>
                        </div>
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={otherSettings.allowSelfJoin}
                                onChange={(e) => handleOtherSettingsChange({ ...otherSettings, allowSelfJoin: e.target.checked })}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderSeatingSection = () => (
        <div className="edit-section">
            <h2 className="section-title">
                <FaChair className="section-icon" />
                {t('editClassroomPage.seatingSection.title') || 'Seating Management'}
            </h2>

            <div className="seating-preview">
                {Object.keys(seatingPositions).length === 0 ? (
                    <div className="no-seating-chart">
                        {t('editClassroomPage.seatingSection.noChart') || 'No seating chart available. Click "Edit Seating" to start creating one.'}
                    </div>
                ) : (
                    <div className="seating-container-wrapper" style={{
                        width: '100%',
                        overflowX: 'auto',
                        overflowY: 'auto',
                        maxHeight: '60vh',
                        border: '2px solid #e5e7eb',
                        borderRadius: '12px',
                        backgroundColor: '#f8fafc',
                        padding: '10px'
                    }}>
                        <div className="seating-grid" ref={containerRef} style={{
                            position: 'relative',
                            width: calculateContainerSize().width,
                            height: calculateContainerSize().height,
                            border: '1px solid #ccc',
                            borderRadius: '8px',
                            backgroundColor: '#f9f9f9',
                            margin: '0 auto',
                            minWidth: '100%'
                        }}>
                            {Object.entries(isSeatingEditing ? currentChairPositions : seatingPositions).map(([id, pos]) => {
                                const assignedUser = assignedUsers[id];
                                const photoURL = getProfileImageSrc(assignedUser?.photoURL, isGoogleUser(assignedUser));
                                const userName = assignedUser?.userName || null;

                                return (
                                    <Chair
                                        key={id}
                                        id={id}
                                        initialPosition={pos}
                                        onChairMove={handleChairMove}
                                        containerRef={containerRef}
                                        isDraggable={isSeatingEditing}
                                        userPhotoURL={photoURL}
                                        userName={userName}
                                    />
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {isSeatingEditing && (
                <div className="seating-edit-footer">
                    <button className="save-btn" onClick={handleSaveSeating}>
                        <FaSave />
                        {t('editClassroomPage.seatingSection.saveBtn') || 'Save Seating'}
                    </button>
                    <button className="cancel-btn" onClick={handleCancelSeatingEdit}>
                        {t('common.cancel') || 'Cancel'}
                    </button>
                </div>
            )}
        </div>
    );


    if (loading) {
        return <Loader />;
    }

    if (!classroom) {
        return <div className="error">{t('editClassroomPage.notFoundError') || 'Classroom not found.'}</div>;
    }

    const isCreator = user && classroom?.creator && (
        (Array.isArray(classroom.creator) ? classroom.creator.some(c => c._id === user.id) : classroom.creator._id === user.id)
    );

    if (!isCreator) {
        return <div className="error">{t('editClassroomPage.noPermissionError') || 'You don\'t have permission to edit this classroom.'}</div>;
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
                isEditClassroomPage={true}
                onBackClick={handleBackToClassroom}
                classroom={classroom}
                editActiveSection={activeSection}
                onEditSectionChange={handleSectionChange}
            />

            <main className={`main__content ${isSidebarOpen ? 'shift' : ''}`}>
                <div className="edit-classroom-container">
                    <div className="edit-header">
                        <h1>{t('editClassroomPage.pageTitle') || 'Edit Classroom Settings'}</h1>
                        <div className="save-status-indicator">
                            {saveStatus === 'saving' && (
                                <span className="status-saving">
                                    <FaSpinner className="fa-spin" /> {t('editClassroomPage.saveStatus.saving') || 'Saving...'}
                                </span>
                            )}
                            {saveStatus === 'saved' && (
                                <span className="status-saved">
                                    <FaCheck /> {t('editClassroomPage.saveStatus.saved') || 'Saved'}
                                </span>
                            )}
                            {saveStatus === 'error' && (
                                <span className="status-error">
                                    {t('editClassroomPage.saveStatus.error') || 'Error Saving'}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="edit-main-content">
                        {activeSection === 'theme' && renderThemeSection()}
                        {activeSection === 'role' && renderRoleSection()}
                        {activeSection === 'other' && renderOtherSection()}
                        {activeSection === 'seating' && renderSeatingSection()}
                    </div>
                </div>
            </main>
        </>
    );
};

export default EditClassroomPage;

