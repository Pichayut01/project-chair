// src/component/Main.jsx

import React, { useState } from "react";
import { useNavigate } from 'react-router-dom'; // ✨ Add this import
import "../CSS/Main.css";
import { getProfileImageSrc, isGoogleUser, handleImageError } from '../utils/profileImageHelper';
import { FiShare2, FiUserPlus } from "react-icons/fi";
import { FaThumbtack } from "react-icons/fa";
import Swal from 'sweetalert2';
import { useTranslation } from 'react-i18next'; // ✨ Add useTranslation hook

import API_BASE_URL from '../config/api';

const Main = ({ isSidebarOpen, classrooms, user, onPinClass, setShowMenu, showMenu, handleLeaveClassroom, onClassActionClick }) => {
    const { t } = useTranslation(); // ✨ Apply hook
    const [openDropdownId, setOpenDropdownId] = useState(null);
    const navigate = useNavigate(); // 


    const toggleDropdown = (id, e) => {
        e.stopPropagation();
        setOpenDropdownId(openDropdownId === id ? null : id);
    };

    const handleShareClick = (classCode, e) => {
        e.stopPropagation();
        setOpenDropdownId(null);
        
        Swal.fire({
            title: t('dashboard.shareCode'),
            html: `
                <div style="background-color: #eaf6ea; border: 1px solid #d4ecd4; border-radius: 4px; padding: 12px 15px; font-size: 24px; font-weight: bold; color: #388e3c; word-break: break-all; margin: 15px 0;">
                    ${classCode}
                </div>`,
            showCancelButton: true,
            confirmButtonText: t('common.copyCode') === 'Copy Code' ? 'Copy Code' : 'คัดลอกรหัส', // Simplified translation mapping
            cancelButtonText: t('common.close'),
            customClass: {
                confirmButton: 'swal2-confirm',
            },
        }).then((result) => {
            if (result.isConfirmed) {
                navigator.clipboard.writeText(classCode);
                Swal.fire(t('common.copied') === 'Copied!' ? 'Copied!' : 'คัดลอกแล้ว!', t('common.copiedDesc') === 'Copied to clipboard' ? 'Class code has been copied to clipboard.' : 'คัดลอกรหัสชั้นเรียนไปยังคลิปบอร์ดแล้ว', 'success');
            }
        });
    };

    const handleCardClick = (classId) => {
        navigate(`/classroom/${classId}`);
    }; // 

    const renderClassroomCards = (classes) => (
        <div className="classroom-grid">
            {classes.map((room) => {
                const isPinned = user?.pinnedClasses?.includes(room._id);
                const creator = room.creator && room.creator[0];
                const allMembersRaw = [
                    ...(room.creator || []),
                    ...(room.participants || [])
                ];
                const seen = new Set();
                const allMembers = allMembersRaw.filter(m => {
                    if (!m._id || seen.has(m._id)) return false;
                    seen.add(m._id);
                    return true;
                });
                const totalMembers = allMembers.length;
                const displayAvatars = allMembers.slice(0, 4);
                const extraMembers = totalMembers - displayAvatars.length;

                return (
                    <div
                        key={room._id}
                        className={`classroom-card ${openDropdownId === room._id ? 'active-dropdown' : ''}`}
                        onClick={() => handleCardClick(room._id)}
                    >
                        {/* Left accent bar */}
                        <div
                            className="card-accent-bar"
                            style={{ backgroundColor: room.color }}
                        />

                        {/* Top section */}
                        <div className="card-top-section">
                            <div className="card-header-row">
                                <div className="card-title-area">
                                    <h3>{room.name}</h3>
                                    <p className="card-subname">{room.subname || 'General'}</p>
                                </div>
                                {/* Dropdown menu wrapper */}
                                <div className="classroom-options-wrapper" style={{ position: 'relative', top: 'auto', right: 'auto' }}>
                                    <div className="classroom-options-icon" onClick={(e) => toggleDropdown(room._id, e)}>
                                        &#x22EE;
                                    </div>
                                    {openDropdownId === room._id && (
                                        <div className="dropdown-menu" onClick={e => e.stopPropagation()}>
                                            <div className="dropdown-item" onClick={() => onPinClass(room._id)}>
                                                <FaThumbtack size={16} />
                                                <span>{isPinned ? t('dashboard.unpinClass') : t('dashboard.pinClass')}</span>
                                            </div>
                                            <div className="dropdown-item" onClick={(e) => handleShareClick(room.classCode, e)}>
                                                <FiShare2 size={16} />
                                                <span>{t('dashboard.shareCode')}</span>
                                            </div>
                                            <div
                                                className="dropdown-item"
                                                style={{ color: 'red' }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleLeaveClassroom(room._id);
                                                    setOpenDropdownId(null);
                                                }}
                                            >
                                                <span>{t('dashboard.exitRemove')}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Creator info */}
                            {creator && (
                                <div className="card-creator-info">
                                    <img referrerPolicy="no-referrer"
                                        src={getProfileImageSrc(creator.photoURL, isGoogleUser(creator))}
                                        alt={creator.displayName}
                                        className="card-creator-avatar"
                                        onError={handleImageError}
                                    />
                                    <div className="card-creator-details">
                                        <span className="card-creator-label">{t('dashboard.createdByLabel') || 'Created by'}</span>
                                        <span className="card-creator-name">{creator.displayName}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Divider */}
                        <div className="card-divider" />

                        {/* Bottom section: members */}
                        <div className="card-bottom-section">
                            <div className="card-member-count">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                                <span>{t('dashboard.members')} ({totalMembers})</span>
                            </div>
                            <div className="card-avatar-group">
                                {extraMembers > 0 && (
                                    <div className="card-avatar-extra">+{extraMembers}</div>
                                )}
                                {displayAvatars.map((member, index) => (
                                    <img referrerPolicy="no-referrer"
                                        key={member._id || index}
                                        src={getProfileImageSrc(member.photoURL, isGoogleUser(member))}
                                        alt={member.displayName || `Member ${index + 1}`}
                                        onError={handleImageError}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );

    const pinnedClasses = classrooms.filter(room => user?.pinnedClasses?.includes(room._id));
    const createdClasses = classrooms.filter(room => user?.createdClasses?.includes(room._id) && !user?.pinnedClasses?.includes(room._id));
    const joinedClasses = classrooms.filter(room => user?.enrolledClasses?.includes(room._id) && !user?.createdClasses?.includes(room._id) && !user?.pinnedClasses?.includes(room._id));

    const hasAnyClassrooms = pinnedClasses.length > 0 || createdClasses.length > 0 || joinedClasses.length > 0;

    return (
        <main className={`main__content ${isSidebarOpen ? 'shift' : ''}`}>
            <div className="main-content-scrollable-area">
                {!hasAnyClassrooms ? (
                    <div className="no-classrooms-container">
                        <div className="no-classrooms-message">
                            <h2>{t('dashboard.empty.title')}</h2>
                            <p>{t('dashboard.empty.message')}</p>
                            <div className="welcome-buttons">
                                <button 
                                    className="welcome-btn create-btn"
                                    onClick={() => onClassActionClick('create')}
                                >
                                    <FiShare2 />
                                    {t('dashboard.empty.createBtn')}
                                </button>
                                <button 
                                    className="welcome-btn join-btn"
                                    onClick={() => onClassActionClick('join')}
                                >
                                    <FiUserPlus />
                                    {t('dashboard.empty.joinBtn')}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        {pinnedClasses.length > 0 && (
                            <>
                                <h2 className="section-title">{t('dashboard.sections.pinned')} ({pinnedClasses.length})</h2>
                                {renderClassroomCards(pinnedClasses)}
                                {(createdClasses.length > 0 || joinedClasses.length > 0) && <hr className="section-divider" />}
                            </>
                        )}

                        {createdClasses.length > 0 && (
                            <>
                                <h2 className="section-title">{t('dashboard.sections.created')} ({createdClasses.length})</h2>
                                {renderClassroomCards(createdClasses)}
                                {joinedClasses.length > 0 && <hr className="section-divider" />}
                            </>
                        )}

                        {joinedClasses.length > 0 && (
                            <>
                                <h2 className="section-title">{t('dashboard.sections.joined')} ({joinedClasses.length})</h2>
                                {renderClassroomCards(joinedClasses)}
                            </>
                        )}
                    </>
                )}
            </div>
        </main>
    );
};

export default Main;

