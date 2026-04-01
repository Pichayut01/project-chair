import React, { useMemo, useState } from "react";
import { useNavigate } from 'react-router-dom';
import Lottie from 'lottie-react';
import Swal from 'sweetalert2';
import { useTranslation } from 'react-i18next';
import { FiPlusCircle, FiShare2, FiUserPlus } from "react-icons/fi";
import { FaThumbtack } from "react-icons/fa";
import dashboardEmptyResearchAnimation from '../assets/dashboard-empty-research.json';
import "../CSS/Main.css";
import { getProfileImageSrc, isGoogleUser, handleImageError } from '../utils/profileImageHelper';

const DASHBOARD_EMPTY_ANIMATION_COLORS = {
    '0.1000,0.1000,0.1000,1.0000': [0.0862745098, 0.1254901961, 0.1960784314, 1],
    '1.0000,1.0000,1.0000,1.0000': [1, 1, 1, 1],
    '0.0114,0.1086,0.0762,1.0000': [0.0196078431, 0.5882352941, 0.4117647059, 1],
    '0.4902,0.8235,0.7098,1.0000': [0.1294117647, 0.7215686275, 0.431372549, 1],
    '0.0298,0.9902,0.6701,1.0000': [0.2039215686, 0.8274509804, 0.6, 1]
};

const normalizeAnimationColor = (color = []) =>
    color.map((value) => Number(value).toFixed(4)).join(',');

const createThemedDashboardAnimation = (animationData) => {
    const themedAnimation = JSON.parse(JSON.stringify(animationData));

    const applyThemeToShapes = (shapes = []) => {
        shapes.forEach((shape) => {
            if ((shape?.ty === 'fl' || shape?.ty === 'st') && Array.isArray(shape?.c?.k)) {
                const nextColor = DASHBOARD_EMPTY_ANIMATION_COLORS[normalizeAnimationColor(shape.c.k)];
                if (nextColor) {
                    shape.c.k = nextColor;
                }
            }

            if (shape?.ty === 'gr' && Array.isArray(shape?.it)) {
                applyThemeToShapes(shape.it);
            }
        });
    };

    const applyThemeToLayers = (layers = []) => {
        layers.forEach((layer) => {
            if (Array.isArray(layer?.shapes)) {
                applyThemeToShapes(layer.shapes);
            }

            if (Array.isArray(layer?.layers)) {
                applyThemeToLayers(layer.layers);
            }
        });
    };

    applyThemeToLayers(themedAnimation.layers);
    themedAnimation.assets?.forEach((asset) => {
        if (Array.isArray(asset?.layers)) {
            applyThemeToLayers(asset.layers);
        }
    });

    return themedAnimation;
};

const Main = ({ isSidebarOpen, classrooms, user, onPinClass, handleLeaveClassroom, onClassActionClick }) => {
    const { t } = useTranslation();
    const [openDropdownId, setOpenDropdownId] = useState(null);
    const navigate = useNavigate();
    const themedDashboardEmptyAnimation = useMemo(
        () => createThemedDashboardAnimation(dashboardEmptyResearchAnimation),
        []
    );

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
            confirmButtonText: t('common.copyCode', { defaultValue: 'Copy Code' }),
            cancelButtonText: t('common.close', { defaultValue: 'Close' }),
            customClass: {
                confirmButton: 'swal2-confirm',
            },
        }).then((result) => {
            if (result.isConfirmed) {
                navigator.clipboard.writeText(classCode);
                Swal.fire(
                    t('common.copied', { defaultValue: 'Copied!' }),
                    t('common.copiedDesc', { defaultValue: 'Class code has been copied to clipboard.' }),
                    'success'
                );
            }
        });
    };

    const handleCardClick = (classId) => {
        navigate(`/classroom/${classId}`);
    };

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
                const allMembers = allMembersRaw.filter((member) => {
                    if (!member._id || seen.has(member._id)) {
                        return false;
                    }

                    seen.add(member._id);
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
                        <div
                            className="card-accent-bar"
                            style={{ backgroundColor: room.color }}
                        />

                        <div className="card-top-section">
                            <div className="card-header-row">
                                <div className="card-title-area">
                                    <h3>{room.name}</h3>
                                    <p className="card-subname">{room.subname || 'General'}</p>
                                </div>

                                <div className="classroom-options-wrapper" style={{ position: 'relative', top: 'auto', right: 'auto' }}>
                                    <div className="classroom-options-icon" onClick={(e) => toggleDropdown(room._id, e)}>
                                        &#x22EE;
                                    </div>

                                    {openDropdownId === room._id && (
                                        <div className="dropdown-menu" onClick={(e) => e.stopPropagation()}>
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

                            {creator && (
                                <div className="card-creator-info">
                                    <img
                                        referrerPolicy="no-referrer"
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

                        <div className="card-divider" />

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
                                    <img
                                        referrerPolicy="no-referrer"
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

    const pinnedClasses = classrooms.filter((room) => user?.pinnedClasses?.includes(room._id));
    const createdClasses = classrooms.filter((room) => user?.createdClasses?.includes(room._id) && !user?.pinnedClasses?.includes(room._id));
    const joinedClasses = classrooms.filter((room) => user?.enrolledClasses?.includes(room._id) && !user?.createdClasses?.includes(room._id) && !user?.pinnedClasses?.includes(room._id));

    const hasAnyClassrooms = pinnedClasses.length > 0 || createdClasses.length > 0 || joinedClasses.length > 0;

    return (
        <main className={`main__content ${isSidebarOpen ? 'shift' : ''}`}>
            <div className="main-content-scrollable-area">
                {!hasAnyClassrooms ? (
                    <div className="no-classrooms-container">
                        <div className="no-classrooms-shell" role="status" aria-live="polite">
                            <div className="no-classrooms-panel">
                                <div className="no-classrooms-copy">
                                    <span className="no-classrooms-kicker">
                                        {t('navbar.sidebar.class')}
                                    </span>

                                    <div className="no-classrooms-message">
                                        <h2>{t('dashboard.empty.title')}</h2>
                                        <p>{t('dashboard.empty.message')}</p>
                                    </div>

                                    <p className="no-classrooms-caption">
                                        {t('dashboard.noClassroomsDesc')}
                                    </p>

                                    <div className="welcome-buttons">
                                        <button
                                            className="welcome-btn create-btn"
                                            onClick={() => onClassActionClick('create')}
                                        >
                                            <FiPlusCircle />
                                            <span>{t('dashboard.empty.createBtn')}</span>
                                        </button>

                                        <button
                                            className="welcome-btn join-btn"
                                            onClick={() => onClassActionClick('join')}
                                        >
                                            <FiUserPlus />
                                            <span>{t('dashboard.empty.joinBtn')}</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="no-classrooms-art" aria-hidden="true">
                                    <div className="no-classrooms-art-frame">
                                        <div className="no-classrooms-art-glow" />
                                        <Lottie
                                            animationData={themedDashboardEmptyAnimation}
                                            loop
                                            autoplay
                                            className="no-classrooms-lottie"
                                        />
                                    </div>
                                </div>
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
