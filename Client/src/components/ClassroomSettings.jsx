// src/components/ClassroomSettings.jsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import '../CSS/EditClassroomPage.css';
import { getProfileImageSrc, isGoogleUser, handleImageError } from '../utils/profileImageHelper';
import { FaPalette, FaUsers, FaEllipsisH, FaCrown, FaUserGraduate, FaArrowUp, FaArrowDown, FaUserSlash, FaCopy, FaCheck, FaSpinner } from 'react-icons/fa';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
const DEBOUNCE_DELAY = 800;

const ClassroomSettings = ({ classId, user, classroom, onRefresh }) => {
    const [activeTab, setActiveTab] = useState('theme');

    // Auto-save status
    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState('');

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

    // Initialize state from classroom prop
    useEffect(() => {
        if (!classroom) return;

        setThemeData({
            name: classroom.name || '',
            subname: classroom.subname || '',
            color: classroom.color || '#4CAF50',
            bannerUrl: classroom.bannerUrl || ''
        });

        const creators = classroom.creator || [];
        const creatorIds = new Set(creators.map(c => c._id));
        const participants = (classroom.participants || []).filter(p => !creatorIds.has(p._id));
        setClassroomMembers({ creator: creators, participants });

        setOtherSettings({
            classCode: classroom.classCode || '',
            isPublic: classroom.isPublic || false,
            allowSelfJoin: classroom.allowSelfJoin !== false
        });
    }, [classroom]);

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
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus(''), 2000);
            if (onRefresh) onRefresh();
        } catch (error) {
            console.error('Failed to save theme:', error);
            setSaveStatus('error');
            setTimeout(() => setSaveStatus(''), 3000);
        } finally {
            setSaving(false);
        }
    }, [classId, user, onRefresh]);

    // Auto-save other settings
    const autoSaveSettings = useCallback(async (data) => {
        setSaving(true);
        setSaveStatus('saving');
        try {
            await axios.put(
                `${API_BASE_URL}/api/classrooms/${classId}/settings`,
                { isPublic: data.isPublic, allowSelfJoin: data.allowSelfJoin },
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
        if (themeDebounceRef.current) clearTimeout(themeDebounceRef.current);
        themeDebounceRef.current = setTimeout(() => {
            autoSaveTheme(newThemeData);
        }, DEBOUNCE_DELAY);
    }, [autoSaveTheme]);

    // Handle other settings change with debounce
    const handleOtherSettingsChange = useCallback((newSettings) => {
        setOtherSettings(newSettings);
        if (settingsDebounceRef.current) clearTimeout(settingsDebounceRef.current);
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

    // Role management handlers
    const handlePromoteMember = async (memberId, memberName) => {
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
                if (onRefresh) onRefresh();
            }
        } catch (err) {
            Swal.fire('Error', 'Could not promote the member.', 'error');
        }
    };

    const handleDemoteMember = async (memberId, memberName) => {
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
                if (onRefresh) onRefresh();
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
                if (onRefresh) onRefresh();
            } catch (err) {
                Swal.fire('Error', 'Could not kick the member.', 'error');
            }
        }
    };

    // === Render Sections ===

    const renderThemeSection = () => (
        <div className="edit-section">
            <h2 className="section-title">
                <FaPalette className="section-icon" />
                Theme Settings
            </h2>
            <div className="theme-settings-container">
                <div className="setting-item">
                    <div className="setting-header">
                        <span className="setting-title">Classroom Name</span>
                    </div>
                    <p className="setting-description">The display name for your classroom.</p>
                    <input
                        type="text"
                        value={themeData.name}
                        onChange={(e) => handleThemeChange({ ...themeData, name: e.target.value })}
                        placeholder="Enter classroom name"
                        className="theme-input"
                    />
                </div>
                <div className="setting-item">
                    <div className="setting-header">
                        <span className="setting-title">Description</span>
                    </div>
                    <p className="setting-description">A brief description of your classroom (e.g., subject, section).</p>
                    <input
                        type="text"
                        value={themeData.subname}
                        onChange={(e) => handleThemeChange({ ...themeData, subname: e.target.value })}
                        placeholder="Enter description"
                        className="theme-input"
                    />
                </div>
                <div className="setting-item">
                    <div className="setting-header">
                        <span className="setting-title">Theme Color</span>
                    </div>
                    <p className="setting-description">Choose a color to personalize your classroom.</p>
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
                Role Management
            </h2>
            <div className="role-section">
                <h3>
                    <FaCrown style={{ color: '#4CAF50' }} />
                    Creators
                    <span className="role-count">{classroomMembers.creator.length}</span>
                </h3>
                <div className="members-list">
                    {classroomMembers.creator.map(creator => (
                        <div key={creator._id} className="member-card creator">
                            <img src={getProfileImageSrc(creator.photoURL, isGoogleUser(creator))} alt={creator.displayName} onError={handleImageError} />
                            <div className="member-info">
                                <span className="member-name">{creator.displayName}</span>
                                {creator.email && <span className="member-email">{creator.email}</span>}
                                <span className="role-badge creator-badge">
                                    <FaCrown size={10} /> Creator
                                </span>
                            </div>
                            {user.id !== creator._id && (
                                <div className="member-actions">
                                    <button
                                        className="action-btn demote-btn"
                                        onClick={() => handleDemoteMember(creator._id, creator.displayName)}
                                        title="Demote to participant"
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
                    Participants
                    <span className="role-count">{classroomMembers.participants.length}</span>
                </h3>
                <div className="members-list">
                    {classroomMembers.participants.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#888', fontStyle: 'italic', width: '100%' }}>
                            No participants yet
                        </div>
                    ) : (
                        classroomMembers.participants.map(participant => (
                            <div key={participant._id} className="member-card participant">
                                <img src={getProfileImageSrc(participant.photoURL, isGoogleUser(participant))} alt={participant.displayName} onError={handleImageError} />
                                <div className="member-info">
                                    <span className="member-name">{participant.displayName}</span>
                                    {participant.email && <span className="member-email">{participant.email}</span>}
                                    <span className="role-badge participant-badge">
                                        <FaUserGraduate size={10} /> Student
                                    </span>
                                </div>
                                <div className="member-actions">
                                    <button
                                        className="action-btn promote-btn"
                                        onClick={() => handlePromoteMember(participant._id, participant.displayName)}
                                        title="Promote to creator"
                                    >
                                        <FaArrowUp />
                                    </button>
                                    <button
                                        className="action-btn kick-btn"
                                        onClick={() => handleKickMember(participant._id, participant.displayName)}
                                        title="Kick from classroom"
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
                General Settings
            </h2>
            <div className="other-settings-section">
                <div className="setting-item">
                    <div className="setting-header">
                        <span className="setting-title">Class Code</span>
                    </div>
                    <p className="setting-description">Share this code with students so they can join your classroom.</p>
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
                                    title: 'Copied!',
                                    text: 'Class code copied to clipboard.',
                                    timer: 1500,
                                    showConfirmButton: false,
                                    toast: true,
                                    position: 'top-end'
                                });
                            }}
                        >
                            <FaCopy /> Copy
                        </button>
                    </div>
                </div>
                <div className="setting-item">
                    <div className="setting-header">
                        <div>
                            <span className="setting-title">Public Classroom</span>
                            <p className="setting-description">Allow anyone to view this classroom without joining.</p>
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
                <div className="setting-item">
                    <div className="setting-header">
                        <div>
                            <span className="setting-title">Allow Self Join</span>
                            <p className="setting-description">Students can join using the class code without approval.</p>
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

    const tabs = [
        { id: 'theme', label: 'Theme', icon: <FaPalette /> },
        { id: 'members', label: 'Members', icon: <FaUsers /> },
        { id: 'general', label: 'General', icon: <FaEllipsisH /> }
    ];

    return (
        <div className="edit-classroom-container" style={{ padding: '0' }}>
            <div className="edit-header" style={{ marginBottom: '20px', position: 'relative' }}>
                <h1 style={{ fontSize: '1.5rem' }}>Classroom Settings</h1>
                <div className="save-status-indicator">
                    {saveStatus === 'saving' && (
                        <span className="status-saving">
                            <FaSpinner className="fa-spin" /> Saving...
                        </span>
                    )}
                    {saveStatus === 'saved' && (
                        <span className="status-saved">
                            <FaCheck /> Saved
                        </span>
                    )}
                    {saveStatus === 'error' && (
                        <span className="status-error">
                            Error Saving
                        </span>
                    )}
                </div>
            </div>

            {/* Tab Navigation */}
            <div style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '24px',
                borderBottom: '2px solid #e9ecef',
                paddingBottom: '0'
            }}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '12px 20px',
                            border: 'none',
                            background: activeTab === tab.id ? '#fff' : 'transparent',
                            color: activeTab === tab.id ? '#4CAF50' : '#666',
                            fontWeight: activeTab === tab.id ? '600' : '500',
                            fontSize: '0.95rem',
                            cursor: 'pointer',
                            borderBottom: activeTab === tab.id ? '3px solid #4CAF50' : '3px solid transparent',
                            marginBottom: '-2px',
                            transition: 'all 0.2s ease',
                            borderRadius: '8px 8px 0 0'
                        }}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="edit-main-content" style={{ boxShadow: 'none', padding: '0' }}>
                {activeTab === 'theme' && renderThemeSection()}
                {activeTab === 'members' && renderRoleSection()}
                {activeTab === 'general' && renderOtherSection()}
            </div>
        </div>
    );
};

export default ClassroomSettings;
