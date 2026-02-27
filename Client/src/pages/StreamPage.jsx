// src/pages/StreamPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Loader from '../components/Loader';
import CreatePostBox from '../components/CreatePostBox'; 
import StreamPost from '../components/StreamPost'; 
import ClassChat from '../components/ClassChat'; // ✨ Import ClassChat
import ClassworkSection from '../components/ClassworkSection'; // ✨ Import ClassworkSection
import { FaChevronUp, FaChevronDown, FaEdit } from 'react-icons/fa'; 
import { useSocket } from '../hooks/useSocket'; // ✨ Import useSocket
import '../CSS/ClassDetailPage.css';
import '../CSS/ClassroomPage.css'; 
import '../CSS/Navbar.css';
import '../CSS/Main.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const StreamPage = ({ user, isSidebarOpen, toggleSidebar, handleSignOut }) => {
    const { classId } = useParams();
    const navigate = useNavigate();
    const [classroom, setClassroom] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeSection, setActiveSection] = useState('stream');
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
                setError('This classroom is private and requires an invitation to access.');
            } else {
                setError('Failed to load classroom details.');
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
                    <div className="stream-page-layout-container" style={{ width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
                        {/* Stream Header Banner (Matching ClassroomPage style) */}
                        <div 
                            className={`classroom-header ${isBannerCollapsed ? 'collapsed' : ''}`}
                            style={{
                                borderLeftColor: classroom?.color || '#1a73e8',
                                backgroundImage: classroom?.bannerUrl ? `url(${API_BASE_URL}${classroom.bannerUrl})` : 'none',
                                position: 'relative',
                                marginBottom: '24px',
                                marginLeft: '0px',
                                marginRight: '0px'
                            }}
                        >
                            <div className="classroom-header-overlay"></div>
                            <div className="classroom-header-content">
                                <h1>{classroom?.name}</h1>
                                <p>{classroom?.subname}</p>
                                {classroom?.classCode && (
                                    <div style={{ marginTop: '8px', fontSize: '0.9rem', opacity: 0.9 }}>
                                        Class Code: <strong>{classroom.classCode}</strong>
                                    </div>
                                )}
                            </div>

                            <button
                                className="banner-collapse-btn"
                                onClick={() => setIsBannerCollapsed(!isBannerCollapsed)}
                                title={isBannerCollapsed ? "Expand banner" : "Collapse banner"}
                            >
                                {isBannerCollapsed ? <FaChevronDown /> : <FaChevronUp />}
                            </button>
                        </div>

                        {/* Stream Content Area (Two Columns) */}
                        <div style={{ 
                            display: 'flex', 
                            gap: '10px', 
                            padding: '0px', // Match banner horizontal padding
                            flexWrap: 'wrap', // Stack on small screens
                            alignItems: 'flex-start'
                        }}>
                            {/* Left Column: Posts (65%) */}
                            <div style={{ flex: '7.5', minWidth: '320px' }}>
                                {isCreator && (
                                    <CreatePostBox classId={classId} user={user} onPostCreated={handlePostCreated} />
                                )}
                                
                                <div className="stream-feed">
                                    {posts.length === 0 ? (
                                        <div style={{ 
                                            textAlign: 'center', padding: '60px 20px', backgroundColor: '#fff', 
                                            borderRadius: '12px', border: '1px solid #dadce0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                                        }}>
                                            <h3 style={{ color: '#202124', fontWeight: '500', fontSize: '1.25rem' }}>No posts yet</h3>
                                            <p style={{ color: '#5f6368', marginTop: '8px' }}>Announcements and materials will appear here.</p>
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

                            {/* Right Column: Chat (35%) */}
                            <div className="stream-chat-column" style={{ flex: '2.5', minWidth: '300px', position: 'sticky', top: '15px' }}>
                                <div style={{ 
                                    background: '#fff', 
                                    borderRadius: '12px', 
                                    border: '1px solid #dadce0', 
                                    boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                                    overflow: 'hidden' 
                                }}>
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
                                
                                {/* Info Box */}
                                <div style={{ 
                                    marginTop: '24px', 
                                    padding: '20px', 
                                    backgroundColor: '#fff', 
                                    borderRadius: '12px', 
                                    border: '1px solid #dadce0',
                                    boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                                    fontSize: '0.95rem',
                                    color: '#5f6368',
                                    lineHeight: '1.5'
                                }}>
                                    <h4 style={{ margin: '0 0 10px 0', color: '#3c4043', fontSize: '1.1rem' }}>About Stream</h4>
                                    <p style={{ margin: 0 }}>This is where you can see announcements, assignments, and communicate with your class in real-time.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'classwork':
                return (
                    <div className="class-detail-content" style={{ padding: 0 }}>
                        <ClassworkSection 
                            classId={classId} 
                            user={user} 
                            isCreator={isCreator} 
                        />
                    </div>
                );
            default:
                return (
                    <div className="class-detail-content">
                        <h2>Stream</h2>
                    </div>
                );
        }
    };

    if (loading) {
        return <Loader />;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    if (!classroom) {
        return <div className="error">Classroom not found.</div>;
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
