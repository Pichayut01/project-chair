// src/components/ClassChat.jsx

import React, { useState, useEffect, useRef } from 'react';
import { FaTimes, FaUsers, FaChevronRight } from 'react-icons/fa';
import { getProfileImageSrc, handleImageError } from '../utils/profileImageHelper';

const ClassChat = ({ 
    user, 
    isCreator, 
    chatMessages, 
    classroomEvents, 
    emitChatMessage, 
    onSubmitAnswer,
    isSidebarMode = false, 
    onClose 
}) => {
    const [newMessage, setNewMessage] = useState('');
    const chatContainerRef = useRef(null);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatMessages]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (newMessage.trim()) {
            emitChatMessage(newMessage.trim());
            setNewMessage('');
        }
    };

    return (
        <div className={`chat-container ${isSidebarMode ? 'sidebar-mode' : ''}`} style={{
            background: '#fff',
            borderRadius: isSidebarMode ? '0' : '12px',
            border: isSidebarMode ? 'none' : '1px solid #dadce0',
            display: 'flex',
            flexDirection: 'column',
            height: isSidebarMode ? '100%' : '600px',
            overflow: 'hidden',
            boxShadow: isSidebarMode ? 'none' : '0 1px 3px rgba(0,0,0,0.1)'
        }}>
            <div className="chat-header" style={{
                padding: '15px 20px',
                borderBottom: '1px solid #eee',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                margin: '0px'
            }}>
                <h3 style={{ fontSize: '1.1rem', margin: 0, color: '#3c4043' }}>Class Chat</h3>
                {isSidebarMode && onClose && (
                    <button
                        onClick={onClose}
                        title="Close Chat"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                        <FaTimes size={18} color="#666" />
                    </button>
                )}
            </div>

            <div className="chat-messages" ref={chatContainerRef} style={{
                flex: 1,
                overflowY: 'auto',
                padding: '15px',
                display: 'flex',
                flexDirection: 'column'
            }}>
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
                            const groupEvent = classroomEvents?.find(ev => ev.id === groupingData.eventId);
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
                                                            if (!isCreator && !hasJoined && !isFull && groupEvent && onSubmitAnswer) {
                                                                onSubmitAnswer(groupEvent, group.id || group.name);
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
                                                                    <img referrerPolicy="no-referrer"
                                                                        key={mIdx}
                                                                        src={getProfileImageSrc(m.photoURL, false)} // Simplify google user check as photoURl usually handles it via profileImageHelper if it's already a full URL or fallback
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
                                <img referrerPolicy="no-referrer"
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
                                        wordBreak: 'break-word',
                                        color: '#202124',
                                        fontSize: '0.9rem',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
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

            <form onSubmit={handleSubmit} style={{
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
    );
};

export default ClassChat;

