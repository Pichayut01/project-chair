// src/component/Navbar.jsx

import React, { useState, useEffect, useRef } from "react";
import "../CSS/Navbar.css";
import icon from "../image/icon.ico";
import { FiPlus, FiLogOut, FiArrowLeft, FiShare2, FiEdit2, FiSave, FiX, FiChevronDown, FiChevronRight, FiBell } from "react-icons/fi"; // ✨ เพิ่ม icon ใหม่
import { FaCog, FaCrown } from 'react-icons/fa'; // ✨ เพิ่ม FaCrown icon
import { useNavigate, Link } from 'react-router-dom';
import { getProfileImageSrc, getCurrentUserProfileImageSrc, isGoogleUser, handleImageError } from '../utils/profileImageHelper';
import axios from 'axios';
import Swal from 'sweetalert2';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const Navbar = ({
    isSidebarOpen, toggleSidebar, user, handleSignOut, onClassActionClick, classrooms = [],
    isClassroomPage, onShareClick, classroomMembers, isAccountSettingPage,
    onPromoteMember,
    onKickMember,
    onDemoteMember,
    isCreator, isEditing, onToggleEditMode, onSavePositions, onCancelEdit, userSeatId, onLeaveSeat, classroom,
    isEditClassroomPage, onBackClick, // เพิ่ม props สำหรับ EditClassroomPage
    editActiveSection, onEditSectionChange, // เพิ่ม props สำหรับ EditClassroomPage navigation
    accountActiveSection, onAccountSectionChange, // เพิ่ม props สำหรับ AccountSetting navigation
    onClassroomBackClick, // เพิ่ม props สำหรับ ClassroomPage back navigation
    isLoginPage = false, // เพิ่ม props สำหรับ Login page
    isAppSettingPage, appActiveSection, onAppSectionChange, // เพิ่ม props สำหรับ AppSettings page
    isClassDetailPage, classDetailActiveSection, onClassDetailSectionChange, // เพิ่ม props สำหรับ ClassDetail page

    onAddNotification, // ✨ Prop สำหรับรับฟังก์ชันเพิ่มการแจ้งเตือน
    children // ✨ Allow custom children content

}) => {
    const navigate = useNavigate();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [notifications, setNotifications] = useState([
        { id: 1, message: 'This is a sample notification to test scrolling.', time: Date.now() - 100000 },
        { id: 2, message: 'Another sample notification to make the list longer.', time: Date.now() - 200000 },
        { id: 3, message: 'You have a new message from a student.', time: Date.now() - 300000 },
        { id: 4, message: 'Classroom "Physics 101" has been updated.', time: Date.now() - 400000 },
        { id: 5, message: 'A new student has joined your "Art History" class.', time: Date.now() - 500000 },
        { id: 6, message: 'Reminder: Your subscription will renew soon.', time: Date.now() - 600000 },
    ]);
    const [hasUnread, setHasUnread] = useState(false);
    const [isCreatedByMeExpanded, setIsCreatedByMeExpanded] = useState(true);
    const [isJoinedExpanded, setIsJoinedExpanded] = useState(true);
    const [isCreatorsExpanded, setIsCreatorsExpanded] = useState(true);
    const [isParticipantsExpanded, setIsParticipantsExpanded] = useState(true);

    // Remove duplicate functions - using imported ones from profileImageHelper

    const handleSignInClick = () => {
        navigate('/login');
    };

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
        setIsNotificationOpen(false); // ปิด dropdown แจ้งเตือนเมื่อเปิดโปรไฟล์
    };

    const toggleNotificationDropdown = () => {
        setIsNotificationOpen(!isNotificationOpen);
        setIsDropdownOpen(false); // ปิด dropdown โปรไฟล์เมื่อเปิดแจ้งเตือน
        if (hasUnread) {
            setHasUnread(false); // ✨ เมื่อเปิดดู ให้ถือว่าอ่านแล้ว
        }
    };

    // ✨ Hook สำหรับตรวจจับการเปลี่ยนแปลงของ props
    function usePrevious(value) {
        const ref = useRef();
        useEffect(() => {
            ref.current = value;
        });
        return ref.current;
    }

    const addNotification = (message) => {
        const newNotification = {
            id: Date.now(),
            message: message,
            time: Date.now(), // ✨ เก็บเวลาเป็น timestamp
        };
        setNotifications(prev => [newNotification, ...prev]);
        setHasUnread(true);
    };

    // ✨ ส่งฟังก์ชัน addNotification กลับไปให้ parent component
    useEffect(() => {
        if (onAddNotification) {
            onAddNotification(() => addNotification);
        }
    }, [onAddNotification]);

    const prevUser = usePrevious(user);

    useEffect(() => {
        // ✨ ตรวจสอบถ้าผู้ใช้เพิ่งล็อกอินเข้ามา
        if (!prevUser && user) {
            addNotification(`Welcome back, ${user.displayName}!`);
        }
    }, [user, prevUser]);

    const handleAccountSettingClick = () => {
        navigate('/account-setting');
        setIsDropdownOpen(false);
    };

    const handleAppSettingClick = () => {
        navigate('/app-settings');
        setIsDropdownOpen(false);
    };

    const handleSignOutClick = async () => {
        await handleSignOut();
        setIsDropdownOpen(false);
        window.location.reload();
    };

    const handleClassroomClick = (classId) => {
        navigate(`/classroom/${classId}`);
        toggleSidebar();
    };

    const handleBackClick = () => {
        navigate(-1);
    };

    const listItemStyle = {
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: '100%',
        display: 'block'
    };

    const memberContainerStyle = {
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        minWidth: 0
    };

    const memberNameStyle = {
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        flex: 1,
        minWidth: 0
    };

    const crownStyle = {
        marginLeft: '8px',
        color: '#f1c40f',
        flexShrink: 0
    };

    const handleMemberMenu = (member) => {
        // ✨ แก้ไข: ตรวจสอบ isTargetCreator ให้รองรับทั้ง Object และ Array
        const creators = Array.isArray(classroomMembers.creator)
            ? classroomMembers.creator
            : [classroomMembers.creator].filter(Boolean);
        const isTargetCreator = creators.some(c => c && c._id === member._id);

        // ป้องกันไม่ให้ creator จัดการตัวเอง
        if (user.id === member._id) return;

        if (isTargetCreator) {
            // Menu for Co-Creators - เฉพาะ Original Creator เท่านั้นที่สามารถจัดการได้
            if (isOriginalCreator) {
                Swal.fire({
                    title: member.displayName,
                    showDenyButton: false,
                    showCancelButton: true,
                    confirmButtonText: 'Demote to Participant',
                    cancelButtonText: 'Cancel',
                    icon: 'info',
                    confirmButtonColor: '#e74c3c',
                }).then(async (result) => {
                    if (result.isConfirmed) {
                        await onDemoteMember(member._id, member.displayName);
                    }
                });
            } else {
                // ถ้าไม่ใช่ Original Creator ให้แสดงข้อมูลเท่านั้น
                Swal.fire({
                    title: member.displayName,
                    text: 'This is a Co-Creator. Only the Original Creator can manage this member.',
                    icon: 'info',
                    showConfirmButton: true,
                    confirmButtonText: 'OK'
                });
            }
        } else {
            // Menu for Participants
            Swal.fire({
                title: member.displayName,
                showDenyButton: true,
                showCancelButton: true,
                confirmButtonText: 'Promote to Creator',
                denyButtonText: 'Kick from Classroom',
                cancelButtonText: 'Cancel',
                icon: 'info'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    await onPromoteMember(member._id, member.displayName);
                } else if (result.isDenied && isCreator) { // Creator ทุกคนสามารถเตะได้
                    await onKickMember(member._id, member.displayName);
                }
            });
        }
    };

    // ตรวจสอบว่าผู้ใช้ปัจจุบันเป็น "ผู้สร้างห้องคนแรก" หรือไม่
    const isOriginalCreator = classroomMembers?.creator && user && classroomMembers.creator[0]?._id === user.id;

    return (
        <>
            <nav className="navbar">
                <div className="navbar__logo">
                    <button className="navbar__burger" onClick={toggleSidebar}>
                        &#9776;
                    </button>
                    <img src={icon} alt="Logo" className="navbar__logo-image" />
                    <h1 style={{ color: "#414141ff", fontSize: "24px" }}>EChair</h1>
                </div>

                {/* ✨ ย้ายปุ่มมาไว้ตรงกลาง Navbar เพื่อให้แสดงผลถูกต้อง */}
                <div className="navbar-center">
                    {isClassroomPage && isCreator && (
                        isEditing ? (
                            <>
                                <button className="navbar-action-button save" onClick={onSavePositions} title="Save Seating">
                                    <FiSave size={20} />
                                    <span>Save</span>
                                </button>
                                <button className="navbar-action-button cancel" onClick={onCancelEdit} title="Cancel">
                                    <FiX size={20} />
                                    <span>Cancel</span>
                                </button>
                                {children} {/* ✨ Custom actions (e.g. Grouping) from parent */}
                            </>
                        ) : (
                            <button className="navbar-action-button" onClick={onToggleEditMode} title="Edit Seating">
                                <FiEdit2 size={20} />
                                <span>Edit</span>
                            </button>
                        )
                    )}
                </div>

                <div className="navbar__right">
                    {user && (
                        <div className="navbar__notification" onClick={toggleNotificationDropdown}>
                            <FiBell size={22} />
                            {hasUnread && <span className="notification-badge"></span>}
                            {isNotificationOpen && (
                                <div className="notification-dropdown">
                                    <div className="notification-header">
                                        <h3>Notifications</h3>
                                    </div>
                                    <ul className="notification-list">
                                        {notifications.length > 0 ? (
                                            notifications.map(notif => (
                                                <li key={notif.id} className="notification-item">
                                                    <p>{notif.message}</p>
                                                    <span className="notification-time">{new Date(notif.time).toLocaleString()}</span>
                                                </li>
                                            ))
                                        ) : (
                                            <li className="notification-item empty">
                                                <p>No new notifications</p>
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                    <div className="navbar__profile" onClick={toggleDropdown}>
                        {user ? (
                            <img
                                src={getCurrentUserProfileImageSrc(user.photoURL, isGoogleUser(user))}
                                alt="User Profile"
                                className="navbar-profile-image"
                                onError={handleImageError}
                            />
                        ) : !isLoginPage ? (
                            <button onClick={handleSignInClick} className="navbar__signin-button">
                                Sign In
                            </button>
                        ) : null}
                        {isDropdownOpen && user && (
                            <div className="dropdown-menu">
                                <div className="dropdown-user-info">
                                    <img
                                        src={getCurrentUserProfileImageSrc(user.photoURL, isGoogleUser(user))}
                                        alt="User Profile"
                                        className="dropdown-profile-image"
                                        onError={handleImageError}
                                    />
                                    <div className="user-details">
                                        <span className="user-name">{user.displayName}</span>
                                        <br />
                                        <span className="user-email">{user.email}</span>
                                    </div>
                                </div>
                                <hr style={{ border: "none", height: "1px", backgroundColor: "#dadce0", margin: "8px 0" }} />
                                <div className="dropdown-list">
                                    <span className="dropdown-item" onClick={handleAccountSettingClick}>
                                        Account Setting
                                    </span>
                                    <span className="dropdown-item" onClick={handleAppSettingClick}>
                                        App Settings
                                    </span>
                                    <span className="dropdown-item" onClick={handleSignOutClick}>
                                        <FiLogOut />
                                        Sign Out
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </nav>
            <aside className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
                <ul
                    className="sidebar-list"
                    style={{
                        listStyleType: 'none',
                        padding: '10px',
                        margin: '10px 0',
                        overflowY: 'auto',
                        flexGrow: 1
                    }}
                >
                    {/* ✨ เพิ่มโค้ดนี้: เพิ่มเงื่อนไขสำหรับหน้า Account Setting และ Edit Classroom */}
                    {isLoginPage ? (
                        <li className="sidebar-list-item" style={{ textAlign: 'center', color: '#666', fontStyle: 'italic' }}>
                            Welcome to Chair
                        </li>
                    ) : isAccountSettingPage ? (
                        <>
                            <li className="sidebar-list-item sidebar-back-button" onClick={handleBackClick}>
                                <FiArrowLeft size={18} />
                                <span>Back</span>
                            </li>
                            <hr className="divider" style={{
                                margin: "8px 0",
                                border: "none",
                                height: "1px",
                                backgroundColor: "#e2e8f0",
                                width: "100%",
                                display: "block"
                            }} />
                            <li
                                className={`sidebar-list-item ${accountActiveSection === 'account' ? 'active' : ''}`}
                                onClick={() => onAccountSectionChange && onAccountSectionChange('account')}
                            >
                                <span>Account Settings</span>
                            </li>
                            <li
                                className={`sidebar-list-item ${accountActiveSection === 'security' ? 'active' : ''}`}
                                onClick={() => onAccountSectionChange && onAccountSectionChange('security')}
                            >
                                <span>Security</span>
                            </li>
                            <li
                                className={`sidebar-list-item ${accountActiveSection === 'privacy' ? 'active' : ''}`}
                                onClick={() => onAccountSectionChange && onAccountSectionChange('privacy')}
                            >
                                <span>Privacy</span>
                            </li>
                            <li
                                className={`sidebar-list-item ${accountActiveSection === 'notifications' ? 'active' : ''}`}
                                onClick={() => onAccountSectionChange && onAccountSectionChange('notifications')}
                            >
                                <span>Notifications</span>
                            </li>
                        </>
                    ) : isAppSettingPage ? (
                        <>
                            <li className="sidebar-list-item sidebar-back-button" onClick={handleBackClick}>
                                <FiArrowLeft size={18} />
                                <span>Back</span>
                            </li>
                            <hr className="divider" style={{
                                margin: "8px 0",
                                border: "none",
                                height: "1px",
                                backgroundColor: "#e2e8f0",
                                width: "100%",
                                display: "block"
                            }} />
                            <li
                                className={`sidebar-list-item ${appActiveSection === 'general' ? 'active' : ''}`}
                                onClick={() => onAppSectionChange && onAppSectionChange('general')}
                            >
                                <span>General</span>
                            </li>
                            <li
                                className={`sidebar-list-item ${appActiveSection === 'data' ? 'active' : ''}`}
                                onClick={() => onAppSectionChange && onAppSectionChange('data')}
                            >
                                <span>Data Management</span>
                            </li>
                            <li
                                className={`sidebar-list-item ${appActiveSection === 'security' ? 'active' : ''}`}
                                onClick={() => onAppSectionChange && onAppSectionChange('security')}
                            >
                                <span>Security</span>
                            </li>
                            <li
                                className={`sidebar-list-item ${appActiveSection === 'notifications' ? 'active' : ''}`}
                                onClick={() => onAppSectionChange && onAppSectionChange('notifications')}
                            >
                                <span>Notifications</span>
                            </li>
                            <li
                                className={`sidebar-list-item ${appActiveSection === 'users' ? 'active' : ''}`}
                                onClick={() => onAppSectionChange && onAppSectionChange('users')}
                            >
                                <span>User Management</span>
                            </li>
                            <li
                                className={`sidebar-list-item ${appActiveSection === 'integration' ? 'active' : ''}`}
                                onClick={() => onAppSectionChange && onAppSectionChange('integration')}
                            >
                                <span>Integration</span>
                            </li>
                            <li
                                className={`sidebar-list-item ${appActiveSection === 'help' ? 'active' : ''}`}
                                onClick={() => onAppSectionChange && onAppSectionChange('help')}
                            >
                                <span>Help & Support</span>
                            </li>
                        </>
                    ) : isClassDetailPage ? (
                        <>
                            <li className="sidebar-list-item sidebar-back-button" onClick={onClassroomBackClick || handleBackClick}>
                                <FiArrowLeft size={18} />
                                <span>Back to Classroom</span>
                            </li>
                            <hr className="divider" style={{
                                margin: "8px 0",
                                border: "none",
                                height: "1px",
                                backgroundColor: "#e2e8f0",
                                width: "100%",
                                display: "block"
                            }} />
                            <li
                                className={`sidebar-list-item ${classDetailActiveSection === '1' ? 'active' : ''}`}
                                onClick={() => onClassDetailSectionChange && onClassDetailSectionChange('1')}
                            >
                                <span>Assign Rate</span>
                            </li>
                            <li
                                className={`sidebar-list-item ${classDetailActiveSection === 'scoreboard' ? 'active' : ''}`}
                                onClick={() => onClassDetailSectionChange && onClassDetailSectionChange('scoreboard')}
                            >
                                <span>Scoreboard</span>
                            </li>
                            <li
                                className={`sidebar-list-item ${classDetailActiveSection === '3' ? 'active' : ''}`}
                                onClick={() => onClassDetailSectionChange && onClassDetailSectionChange('3')}
                            >
                                <span>3</span>
                            </li>
                            <li
                                className={`sidebar-list-item ${classDetailActiveSection === '4' ? 'active' : ''}`}
                                onClick={() => onClassDetailSectionChange && onClassDetailSectionChange('4')}
                            >
                                <span>4</span>
                            </li>
                            <li
                                className={`sidebar-list-item ${classDetailActiveSection === '5' ? 'active' : ''}`}
                                onClick={() => onClassDetailSectionChange && onClassDetailSectionChange('5')}
                            >
                                <span>5</span>
                            </li>
                            <li
                                className={`sidebar-list-item ${classDetailActiveSection === '6' ? 'active' : ''}`}
                                onClick={() => onClassDetailSectionChange && onClassDetailSectionChange('6')}
                            >
                                <span>6</span>
                            </li>
                        </>
                    ) : isEditClassroomPage ? (
                        <>
                            <li className="sidebar-list-item sidebar-back-button" onClick={onBackClick}>
                                <FiArrowLeft size={18} />
                                <span>Back to Classroom</span>
                            </li>
                            <hr className="divider" style={{
                                margin: "8px 0",
                                border: "none",
                                height: "1px",
                                backgroundColor: "#e2e8f0",
                                width: "100%",
                                display: "block"
                            }} />
                            <li
                                className={`sidebar-list-item ${editActiveSection === 'theme' ? 'active' : ''}`}
                                onClick={() => onEditSectionChange('theme')}
                            >
                                <span>Theme</span>
                            </li>
                            <li
                                className={`sidebar-list-item ${editActiveSection === 'role' ? 'active' : ''}`}
                                onClick={() => onEditSectionChange('role')}
                            >
                                <span>Role</span>
                            </li>
                            <li
                                className={`sidebar-list-item ${editActiveSection === 'other' ? 'active' : ''}`}
                                onClick={() => onEditSectionChange('other')}
                            >
                                <span>Other</span>
                            </li>
                        </>
                    ) : isClassroomPage ? (
                        <>
                            <li className="sidebar-list-item sidebar-back-button" onClick={onClassroomBackClick || handleBackClick}>
                                <FiArrowLeft size={18} />
                                <span>Back</span>
                            </li>
                            {/* ✨ การแก้ไข: เพิ่มการตรวจสอบ user ก่อนแสดงส่วนนี้เพื่อป้องกัน error */}
                            {user && (
                                <li className="sidebar-list-item sidebar-share-class" onClick={onShareClick}>
                                    <FiShare2 size={18} />
                                    <span>Share Class</span>
                                </li>
                            )}
                            {/* ✨ เพิ่ม Class Detail button สำหรับ creator เท่านั้น */}
                            {isCreator && (
                                <li className="sidebar-list-item sidebar-class-detail" onClick={() => navigate(`/classroom/${classroom?._id}/detail`)}>
                                    <FiEdit2 size={18} />
                                    <span>Class Detail</span>
                                </li>
                            )}

                            {/* ส่วนแสดงสมาชิก */}
                            {classroomMembers?.creator && (Array.isArray(classroomMembers.creator) ? classroomMembers.creator.length > 0 : classroomMembers.creator) && (
                                <>
                                    <hr className="divider" style={{
                                        margin: "8px 0",
                                        border: "none",
                                        height: "1px",
                                        backgroundColor: "#e2e8f0",
                                        width: "100%",
                                        display: "block"
                                    }} />
                                    <li
                                        className="sidebar-category-header"
                                        onClick={() => setIsCreatorsExpanded(!isCreatorsExpanded)}
                                    >
                                        {isCreatorsExpanded ?
                                            <FiChevronDown size={16} /> :
                                            <FiChevronRight size={16} />
                                        }
                                        <span>Creators ({Array.isArray(classroomMembers.creator) ? classroomMembers.creator.length : 1})</span>
                                    </li>
                                    {/* ✨ แก้ไข: แสดงผล creator ให้รองรับทั้ง Object และ Array */}
                                    {isCreatorsExpanded && (Array.isArray(classroomMembers.creator) ? classroomMembers.creator : [classroomMembers.creator]).map(c => (
                                        c && <li key={c._id} className="sidebar-list-item sidebar-member-item sidebar-member-nested" onClick={() => isCreator && handleMemberMenu(c)}>
                                            <img
                                                src={getProfileImageSrc(c.photoURL, isGoogleUser(c))}
                                                alt={c.displayName}
                                                onError={handleImageError}
                                                className="sidebar-profile-image"
                                            />
                                            <div style={memberContainerStyle}>
                                                <span style={memberNameStyle}>{c.displayName}</span>
                                                {/* ✨ เพิ่ม: แสดงไอคอนมงกุฎสำหรับผู้สร้างห้องคนแรก */}
                                                {classroomMembers.creator[0]?._id === c._id && <FaCrown style={crownStyle} title="Original Creator" />}
                                            </div>
                                            {/* ✨ แก้ไข: แสดงปุ่มเมนูเฉพาะสำหรับ Original Creator เท่านั้น */}
                                            {isOriginalCreator && user.id !== c._id && (
                                                <button
                                                    className="menu-btn"
                                                    onClick={(e) => { e.stopPropagation(); handleMemberMenu(c); }}
                                                    title="Member options"
                                                >
                                                    <FaCog />
                                                </button>
                                            )}
                                        </li>
                                    ))}
                                </>
                            )}

                            {classroomMembers?.participants?.length > 0 && (
                                <>
                                    {/* ✨ แก้ไข: การนับจำนวน Participants ให้ถูกต้อง */}
                                    {(() => {
                                        const creatorIds = Array.isArray(classroomMembers.creator)
                                            ? classroomMembers.creator.map(c => c._id)
                                            : [classroomMembers.creator?._id].filter(Boolean);
                                        const participantsOnly = classroomMembers.participants.filter(p => !creatorIds.includes(p._id));
                                        return participantsOnly.length > 0 ? (
                                            <>
                                                <li
                                                    className="sidebar-category-header"
                                                    onClick={() => setIsParticipantsExpanded(!isParticipantsExpanded)}
                                                >
                                                    {isParticipantsExpanded ?
                                                        <FiChevronDown size={16} /> :
                                                        <FiChevronRight size={16} />
                                                    }
                                                    <span>Participants ({participantsOnly.length})</span>
                                                </li>
                                                {isParticipantsExpanded && classroomMembers.participants
                                                    .filter(p => !creatorIds.includes(p._id))
                                                    .map(participant => (
                                                        <li key={participant._id} className="sidebar-list-item sidebar-member-item sidebar-member-nested" onClick={() => isCreator && handleMemberMenu(participant)}>
                                                            <img
                                                                src={getProfileImageSrc(participant.photoURL, isGoogleUser(participant))}
                                                                alt={participant.displayName}
                                                                className="sidebar-profile-image"
                                                                onError={handleImageError}
                                                            />
                                                            <span style={listItemStyle}>{participant.displayName}</span>
                                                            {/* ✨ แก้ไข: ตรวจสอบ user.id ก่อนแสดงปุ่ม */}
                                                            {isCreator && user.id !== participant._id && (
                                                                <button
                                                                    className="menu-btn"
                                                                    onClick={(e) => { e.stopPropagation(); handleMemberMenu(participant); }}
                                                                    title="Member options"
                                                                >
                                                                    <FaCog />
                                                                </button>
                                                            )}
                                                        </li>
                                                    ))}
                                            </>
                                        ) : null;
                                    })()}
                                </>
                            )}
                            {isClassroomPage && userSeatId && (
                                <button
                                    className="leave-seat-btn"
                                    style={{
                                        width: '90%',
                                        margin: '20px auto 10px auto',
                                        display: 'block',
                                        background: '#f44336',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '6px',
                                        padding: '10px 0',
                                        fontWeight: 'bold',
                                        cursor: 'pointer'
                                    }}
                                    onClick={onLeaveSeat}
                                >
                                    Leave Seat
                                </button>
                            )}
                        </>
                    ) : (
                        <>
                            {/* ✨ การแก้ไข: เพิ่มการตรวจสอบ user ก่อนแสดงส่วนนี้เพื่อป้องกัน error */}
                            {user && (
                                <li className="sidebar-list-item sidebar-create-class" onClick={onClassActionClick}>
                                    <FiPlus size={18} />
                                    <span>Class</span>
                                </li>
                            )}
                            <hr style={{ border: "none", height: "1px", backgroundColor: "#dadce0", margin: "8px 0" }} />
                            {(() => {
                                // แยกห้องเรียนตามประเภท
                                const createdByMe = classrooms.filter(room =>
                                    room.creator && Array.isArray(room.creator) &&
                                    room.creator.some(creator => creator._id === user?.id)
                                );
                                const joinedRooms = classrooms.filter(room =>
                                    !room.creator || !Array.isArray(room.creator) ||
                                    !room.creator.some(creator => creator._id === user?.id)
                                );

                                return (
                                    <>
                                        {/* ห้องที่สร้างเอง */}
                                        {createdByMe.length > 0 && (
                                            <>
                                                <li
                                                    className="sidebar-category-header"
                                                    onClick={() => setIsCreatedByMeExpanded(!isCreatedByMeExpanded)}
                                                >
                                                    {isCreatedByMeExpanded ?
                                                        <FiChevronDown size={16} /> :
                                                        <FiChevronRight size={16} />
                                                    }
                                                    <span>Created by me ({createdByMe.length})</span>
                                                </li>
                                                {isCreatedByMeExpanded && createdByMe.map((room) => (
                                                    <li
                                                        key={room._id}
                                                        className="sidebar-list-item sidebar-classroom-item sidebar-classroom-nested"
                                                        onClick={() => handleClassroomClick(room._id)}
                                                    >
                                                        <img
                                                            src={getProfileImageSrc(room.creator?.[0]?.photoURL, isGoogleUser(room.creator?.[0]))}
                                                            alt="Creator Profile"
                                                            className="sidebar-profile-image"
                                                            onError={handleImageError}
                                                        />
                                                        <span className="sidebar-classroom-name">{room.name}</span>
                                                    </li>
                                                ))}
                                            </>
                                        )}

                                        {/* ห้องที่เข้าร่วม */}
                                        {joinedRooms.length > 0 && (
                                            <>
                                                <li
                                                    className="sidebar-category-header"
                                                    onClick={() => setIsJoinedExpanded(!isJoinedExpanded)}
                                                >
                                                    {isJoinedExpanded ?
                                                        <FiChevronDown size={16} /> :
                                                        <FiChevronRight size={16} />
                                                    }
                                                    <span>Joined ({joinedRooms.length})</span>
                                                </li>
                                                {isJoinedExpanded && joinedRooms.map((room) => (
                                                    <li
                                                        key={room._id}
                                                        className="sidebar-list-item sidebar-classroom-item sidebar-classroom-nested"
                                                        onClick={() => handleClassroomClick(room._id)}
                                                    >
                                                        <img
                                                            src={getProfileImageSrc(room.creator?.[0]?.photoURL, isGoogleUser(room.creator?.[0]))}
                                                            alt="Creator Profile"
                                                            className="sidebar-profile-image"
                                                            onError={handleImageError}
                                                        />
                                                        <span className="sidebar-classroom-name">{room.name}</span>
                                                    </li>
                                                ))}
                                            </>
                                        )}

                                        {/* แสดงข้อความเมื่อไม่มีห้องเรียน */}
                                        {classrooms.length === 0 && (
                                            <li className="sidebar-no-class-text">
                                                No classes joined.
                                            </li>
                                        )}
                                    </>
                                );
                            })()}
                        </>
                    )}
                </ul>
            </aside>
        </>
    );
};

export default Navbar;
