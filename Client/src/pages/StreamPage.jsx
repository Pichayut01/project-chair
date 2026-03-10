// src/pages/StreamPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Loader from '../components/Loader';
import CreatePostBox from '../components/CreatePostBox'; 
import StreamPost from '../components/StreamPost'; 
import ClassChat from '../components/ClassChat';
import ClassworkSection from '../components/ClassworkSection';
import CalendarSection from '../components/CalendarSection';
import { useSocket } from '../hooks/useSocket';
import '../CSS/ClassDetailPage.css';
import '../CSS/ClassroomPage.css'; 
import '../CSS/Navbar.css';
import '../CSS/Main.css';
import '../CSS/StreamPage.css';
import { useTranslation } from 'react-i18next';

const API_BASE_URL = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000';

const StreamPage = ({ user, isSidebarOpen, toggleSidebar, handleSignOut }) => {
    const { classId } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [classroom, setClassroom] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const location = useLocation();
    const [activeSection, setActiveSection] = useState(location.state?.activeTab || 'stream');
    const [posts, setPosts] = useState([]); 
    const [isBannerCollapsed, setIsBannerCollapsed] = useState(false); // ✨ State for banner collapse

    // ✨ Chat State
    const [chatMessages, setChatMessages] = useState([]);
    const [classroomEvents, setClassroomEvents] = useState([]);

    const handleChatMessage = useCallback((data) => {
        setChatMessages(prev => [...prev, data]);
    }, []);

    const handleClassroomEventAdded = useCallback((data) => {
        setClassroomEvents(prev => {
            if (prev.some(e => e.id === data.id)) return prev;
            return [...prev, data];
        });
    }, []);

    // Placeholder listeners for useSocket
    const noop = () => {};

    const { emitChatMessage, emitSubmitEventAnswer } = useSocket(
        classId,
        user,
        noop, // onScoreUpdate
        noop, // onChairUpdate
        noop, // onChairMove
        noop, // onChairGroupUpdate
        handleChatMessage,
        handleClassroomEventAdded, 
        noop, // onClassroomEventTriggered
        noop, // onClassroomEventDeleted
        noop, // onRaiseHandUpdated
        noop, // onEmojiSent
        noop, // onUserJoined
        noop, // onUserLeft
        noop, // onClassroomUpdated
        noop, // onGroupMemberRemoved
        noop  // onGroupMemberMoved
    );

    // Add check for creator
    const isCreator = classroom?.creator?.some(c => 
        (typeof c === 'string' && c === user.id) || 
        (c._id && c._id === user.id)
    ) || false;

    const fetchClassroomDetails = useCallback(async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/classrooms/${classId}`, {
                headers: { 'x-auth-token': user.token }
            });
            setClassroom(response.data);
            
            // ✨ Load initial chat history and events
            if (response.data.chatMessages) {
                setChatMessages(response.data.chatMessages);
            }
            if (response.data.classroomEvents) {
                setClassroomEvents(response.data.classroomEvents);
            }
            
            setLoading(false);
        } catch (err) {
            if (err.response?.status === 403 && err.response?.data?.requiresInvitation) {
                setError(t('streamPage.privateClassError') || 'This classroom is private and requires an invitation to access.');
            } else {
                setError(t('streamPage.loadError') || 'Failed to load classroom details.');
            }
            setLoading(false);
            console.error("Error fetching classroom details:", err);
        }
    }, [classId, user]);

    useEffect(() => {
        if (!user || !user.token || !classId) return;
        fetchClassroomDetails();
    }, [classId, user, fetchClassroomDetails]);

    // ✨ Fetch Posts
    const fetchStreamPosts = useCallback(async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/stream/${classId}`, {
                headers: { 'x-auth-token': user.token }
            });
            setPosts(res.data);
        } catch (err) {
            console.error('Error fetching stream posts:', err);
        }
    }, [classId, user]);

    useEffect(() => {
        if (classroom) {
            fetchStreamPosts();
        }
    }, [classroom, fetchStreamPosts]);

    const handlePostCreated = (newPost) => {
        setPosts(prev => [newPost, ...prev]);
    };

    const handlePostDeleted = (deletedPostId) => {
        setPosts(prev => prev.filter(post => post._id !== deletedPostId));
    };

    const handleAddComment = async (postId, text) => {
        try {
            const res = await axios.post(`${API_BASE_URL}/api/stream/${classId}/${postId}/comment`, { text }, {
                headers: { 'x-auth-token': user.token }
            });
            // Update the specific post in the state
            setPosts(prev => prev.map(post => post._id === postId ? res.data : post));
        } catch (err) {
            console.error('Error adding comment:', err);
            throw err; // Let the component handle the error
        }
    };

    const handleDeleteComment = async (postId, commentId) => {
        try {
            await axios.delete(`${API_BASE_URL}/api/stream/${classId}/${postId}/comment/${commentId}`, {
                headers: { 'x-auth-token': user.token }
            });
            // Update the specific post's comments in the state
            setPosts(prev => prev.map(post => {
                if (post._id === postId) {
                    return { ...post, comments: post.comments.filter(c => c._id !== commentId) };
                }
                return post;
            }));
        } catch (err) {
            console.error('Error deleting comment:', err);
            throw err; 
        }
    };

    const handleSectionChange = (section) => {
        setActiveSection(section);
    };

    const renderContent = () => {
        switch (activeSection) {
            case 'stream':
                return (
                    <div className="stream-page-container">
                        {/* Hero Banner */}
                        {!isBannerCollapsed && (
                            <div 
                                className="sp-hero-banner"
                                style={{
                                    backgroundImage: classroom?.bannerUrl ? `url(${API_BASE_URL}${classroom.bannerUrl})` : undefined,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    borderLeft: `6px solid ${classroom?.color || '#1a73e8'}`
                                }}
                            >
                                <div className="sp-hero-overlay" />
                                <div className="sp-hero-content">
                                    <h1 className="sp-hero-title">{classroom?.name}</h1>
                                    {classroom?.subname && <p className="sp-hero-subtitle">{classroom.subname}</p>}
                                    {classroom?.classCode && (
                                        <span 
                                            className="sp-hero-code"
                                            onClick={() => {
                                                navigator.clipboard.writeText(classroom.classCode);
                                                // Ideally use Swal here instead of alert, but alert is fine for now
                                            }}
                                            title={t('streamPage.copyCodeTitle') || "Click to copy class code"}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                                            {classroom.classCode}
                                        </span>
                                    )}
                                </div>
                                <button className="sp-hero-collapse-btn" onClick={() => setIsBannerCollapsed(true)} title={t('streamPage.collapseBannerTitle') || "Collapse banner"}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
                                </button>
                            </div>
                        )}
                        {isBannerCollapsed && (
                            <div className="sp-show-banner-wrap">
                                <button 
                                    className="sp-show-banner-btn"
                                    onClick={() => setIsBannerCollapsed(false)}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                                    {t('streamPage.showBannerBtn') || 'Show banner'}
                                </button>
                            </div>
                        )}

                        {/* Two Column Layout */}
                        <div className="sp-two-col">
                            {/* Feed */}
                            <div className="sp-feed-col">
                                {isCreator && (
                                    <CreatePostBox classId={classId} user={user} onPostCreated={handlePostCreated} />
                                )}
                                <div className="stream-feed">
                                    {posts.length === 0 ? (
                                        <div className="sp-empty-state">
                                            <div className="sp-empty-icon">
                                                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#0aa158" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                                                </svg>
                                            </div>
                                            <h3>{t('streamPage.noPostsTitle') || 'No posts yet'}</h3>
                                            <p>{t('streamPage.noPostsText') || 'Announcements, assignments, and materials posted by your teacher will appear here.'}</p>
                                        </div>
                                    ) : (
                                        posts.map(post => (
                                            <StreamPost 
                                                key={post._id} 
                                                post={post} 
                                                user={user} 
                                                isCreator={isCreator} 
                                                classId={classId}
                                                onDelete={handlePostDeleted}
                                                onAddComment={handleAddComment}
                                                onDeleteComment={handleDeleteComment}
                                            />
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Sidebar */}
                            <div className="sp-sidebar-col">
                                <div className="sp-sidebar-card">
                                    <ClassChat 
                                        classId={classId} 
                                        user={user} 
                                        isCreator={isCreator} 
                                        chatMessages={chatMessages}
                                        classroomEvents={classroomEvents}
                                        emitChatMessage={emitChatMessage}
                                        onSubmitAnswer={(event, answer) => emitSubmitEventAnswer(event.id, answer)}
                                    />
                                </div>
                                <div className="sp-sidebar-card sp-about-card">
                                    <h4 className="sp-about-title">{t('streamPage.aboutClassTitle') || 'About This Class'}</h4>
                                    <p className="sp-about-text">
                                        {t('streamPage.aboutClassText') || 'Announcements, assignments, and class materials shared by your teacher appear in the stream.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'classwork':
                return (
                    <ClassworkSection 
                        classId={classId} 
                        user={user} 
                        isCreator={isCreator} 
                    />
                );
            case 'calendar':
                return (
                    <CalendarSection
                        classId={classId}
                        user={user}
                        isCreator={isCreator}
                        classroom={classroom}
                    />
                );
            default:
                return null;
        }
    };

    if (loading) {
        return <Loader />;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    if (!classroom) {
        return <div className="error">{t('streamPage.notFoundError') || 'Classroom not found.'}</div>;
    }

    return (
        <>
            <Navbar
                isSidebarOpen={isSidebarOpen}
                toggleSidebar={toggleSidebar}
                user={user}
                handleSignOut={handleSignOut}
                isStreamPage={true}
                streamActiveSection={activeSection}
                onStreamSectionChange={handleSectionChange}
                onClassroomBackClick={() => navigate(`/classroom/${classId}`)}
                classroom={classroom}
            />
            <main className={`main__content ${isSidebarOpen ? 'shift' : ''}`}>
                <div className="class-detail-container">
                    {renderContent()}
                </div>
            </main>
        </>
    );
};

export default StreamPage;
