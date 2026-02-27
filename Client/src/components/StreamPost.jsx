// src/components/StreamPost.jsx

import React, { useState } from 'react';
import { FaPaperclip, FaLink, FaEllipsisV, FaTrash, FaDownload, FaImage, FaPaperPlane, FaTimes } from 'react-icons/fa';
import Swal from 'sweetalert2';
import axios from 'axios';
import { getProfileImageSrc, isGoogleUser } from '../utils/profileImageHelper';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const renderTextWithLinks = (text) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, i) => {
        if (part.match(urlRegex)) {
            return (
                <a 
                    key={i} 
                    href={part} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={{ color: '#1a73e8', textDecoration: 'none' }}
                    onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
                    onMouseOut={(e) => e.target.style.textDecoration = 'none'}
                >
                    {part}
                </a>
            );
        }
        return part;
    });
};

const StreamPost = ({ post, user, isCreator, classId, onDelete, onAddComment, onDeleteComment }) => {
    const [newComment, setNewComment] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const authorImage = getProfileImageSrc(post.author?.photoURL, post.author ? isGoogleUser(post.author) : false);
    const currentUserImage = getProfileImageSrc(user?.photoURL, user ? isGoogleUser(user) : false);

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || isSubmittingComment) return;
        setIsSubmittingComment(true);
        try {
            if (onAddComment) {
                await onAddComment(post._id, newComment);
                setNewComment('');
            }
        } catch (err) {
            Swal.fire('Error', 'Failed to add comment', 'error');
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const handleDeleteCommentClick = (commentId) => {
        if (!onDeleteComment) return;
        Swal.fire({
            title: 'Delete comment?',
            text: "Are you sure you want to delete this comment?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Delete'
        }).then((result) => {
            if (result.isConfirmed) {
                onDeleteComment(post._id, commentId);
            }
        });
    };

    const handleDelete = () => {
        Swal.fire({
            title: 'Delete post?',
            text: "This action cannot be undone.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await axios.delete(`${API_BASE_URL}/api/stream/${classId}/${post._id}`, {
                        headers: { 'x-auth-token': user.token }
                    });
                    onDelete(post._id);
                    Swal.fire('Deleted!', 'The post has been deleted.', 'success');
                } catch (error) {
                    console.error('Error deleting post:', error);
                    Swal.fire('Error', 'Failed to delete post.', 'error');
                }
            }
        });
    };

    return (
        <div className="stream-post" style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            border: '1px solid #dadce0',
            boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
            padding: '24px',
            marginBottom: '24px',
            position: 'relative'
        }}>
            {/* Header: Author info & options */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img 
                        src={authorImage || 'https://via.placeholder.com/40'} 
                        alt={post.author?.displayName || 'Unknown Author'} 
                        style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/40'; }}
                    />
                    <div>
                        <h4 style={{ margin: 0, fontSize: '15px', color: '#202124' }}>
                            {post.author?.displayName || 'Unknown Author'}
                        </h4>
                        <span style={{ fontSize: '12px', color: '#5f6368' }}>
                            {new Date(post.createdAt).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                </div>
                {isCreator && (
                    <button 
                        onClick={handleDelete}
                        style={{ background: 'none', border: 'none', color: '#5f6368', cursor: 'pointer', padding: '8px', borderRadius: '50%' }}
                        title="Delete post"
                    >
                        <FaTrash />
                    </button>
                )}
            </div>

            {/* Post Content */}
            <div style={{ marginBottom: '16px' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#1a73e8' }}>{post.title}</h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#3c4043', whiteSpace: 'pre-wrap', lineHeight: '1.5', wordBreak: 'break-word' }}>
                    {renderTextWithLinks(post.content)}
                </p>
            </div>

            {/* Attachments */}
            {post.attachments && post.attachments.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                    {post.attachments.map((att, index) => {
                        if (att.type === 'image') {
                            return (
                                <div key={index} style={{ 
                                    border: '1px solid #dadce0', 
                                    borderRadius: '8px', 
                                    overflow: 'hidden', 
                                    display: 'inline-block',
                                    backgroundColor: '#f8f9fa',
                                    maxWidth: '100%',
                                    width: 'fit-content'
                                }}>
                                    <a href={`${API_BASE_URL}${att.url}`} target="_blank" rel="noopener noreferrer" style={{ display: 'block' }}>
                                        <img 
                                            src={`${API_BASE_URL}${att.url}`} 
                                            alt={att.name || 'Attachment'} 
                                            style={{ display: 'block', maxWidth: '100%', maxHeight: '300px', objectFit: 'contain' }}
                                        />
                                    </a>
                                </div>
                            );
                        }

                        // For 'link' or 'file' types
                        const isLink = att.type === 'link';
                        const url = isLink ? att.url : `${API_BASE_URL}${att.url}`;
                        return (
                            <a 
                                key={index} 
                                href={url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
                                    border: '1px solid #dadce0', borderRadius: '8px', textDecoration: 'none', color: 'inherit',
                                    transition: 'background-color 0.2s', width: 'fit-content', minWidth: '250px', maxWidth: '100%'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                download={!isLink ? att.name || 'download' : undefined}
                            >
                                <div style={{
                                    width: '40px', height: '40px', backgroundColor: '#f1f3f4', borderRadius: '8px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5f6368', flexShrink: 0
                                }}>
                                    {isLink ? <FaLink size={20} /> : <FaPaperclip size={20} />}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#202124', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {att.name || att.url}
                                    </span>
                                    <span style={{ fontSize: '12px', color: '#5f6368', textTransform: 'capitalize' }}>
                                        {att.type}
                                    </span>
                                </div>
                                {!isLink && (
                                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', color: '#1a73e8' }}>
                                        <FaDownload />
                                    </div>
                                )}
                            </a>
                        );
                    })}
                </div>
            )}

            {/* Comments Section */}
            <div style={{ marginTop: '24px', borderTop: '1px solid #e8eaed', paddingTop: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#1a73e8' }}>
                        {post.comments ? post.comments.length : 0} class comment{post.comments?.length !== 1 ? 's' : ''}
                    </span>
                </div>

                {/* Render Comments */}
                {post.comments && post.comments.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
                        {post.comments.map(comment => {
                            const cAuthorImage = getProfileImageSrc(comment.author?.photoURL, comment.author ? isGoogleUser(comment.author) : false);
                            const isCommentAuthor = comment.author?._id === user?.id || comment.author?.id === user?.id; // fallback logic
                            const canDelete = isCreator || isCommentAuthor;

                            return (
                                <div key={comment._id} style={{ display: 'flex', gap: '12px', group: 'comment-item' }} className="comment-item">
                                    <img 
                                        src={cAuthorImage || 'https://via.placeholder.com/32'} 
                                        alt={comment.author?.displayName || 'Unknown'} 
                                        style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                                        onError={(e) => { e.target.src = 'https://via.placeholder.com/32'; }}
                                    />
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '13px', fontWeight: '600', color: '#202124' }}>
                                                {comment.author?.displayName || 'Unknown'}
                                            </span>
                                            <span style={{ fontSize: '12px', color: '#5f6368' }}>
                                                {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p style={{ margin: 0, fontSize: '13px', color: '#3c4043', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                                            {comment.text}
                                        </p>
                                    </div>
                                    {canDelete && (
                                        <button 
                                            onClick={() => handleDeleteCommentClick(comment._id)}
                                            style={{ 
                                                background: 'none', border: 'none', color: '#9aa0a6', cursor: 'pointer', 
                                                padding: '4px', borderRadius: '50%', width: '28px', height: '28px',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}
                                            onMouseOver={(e) => { e.currentTarget.style.color = '#d33'; e.currentTarget.style.backgroundColor = '#fce8e6'; }}
                                            onMouseOut={(e) => { e.currentTarget.style.color = '#9aa0a6'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                                            title="Delete comment"
                                        >
                                            <FaTimes size={12} />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Add Comment Input */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <img 
                        src={currentUserImage || 'https://via.placeholder.com/36'} 
                        alt="You" 
                        style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/36'; }}
                    />
                    <form 
                        onSubmit={handleCommentSubmit}
                        style={{ 
                            flex: 1, 
                            display: 'flex', 
                            alignItems: 'center',
                            border: '1px solid #dadce0', 
                            borderRadius: '24px', 
                            padding: '4px 16px',
                            backgroundColor: '#fff',
                            transition: 'box-shadow 0.2s, border-color 0.2s'
                        }}
                        onFocus={(e) => {
                            e.currentTarget.style.borderColor = '#1a73e8';
                            e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.1) inset';
                        }}
                        onBlur={(e) => {
                            e.currentTarget.style.borderColor = '#dadce0';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        <input
                            type="text"
                            placeholder="Add a class comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            style={{ 
                                flex: 1, 
                                border: 'none', 
                                outline: 'none', 
                                fontSize: '14px', 
                                backgroundColor: 'transparent',
                                padding: '8px 0',
                                color: '#3c4043'
                            }}
                            disabled={isSubmittingComment}
                        />
                        <button 
                            type="submit" 
                            disabled={!newComment.trim() || isSubmittingComment}
                            style={{ 
                                background: 'none', 
                                border: 'none', 
                                color: newComment.trim() ? '#1a73e8' : '#dadce0', 
                                cursor: newComment.trim() && !isSubmittingComment ? 'pointer' : 'default',
                                padding: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '50%',
                                transition: 'background-color 0.2s'
                            }}
                            onMouseOver={(e) => {
                                if (newComment.trim() && !isSubmittingComment) e.currentTarget.style.backgroundColor = '#f1f3f4';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                        >
                            <FaPaperPlane size={16} />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default StreamPost;
