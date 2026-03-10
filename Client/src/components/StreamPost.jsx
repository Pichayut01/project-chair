// src/components/StreamPost.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import axios from 'axios';
import { getProfileImageSrc, isGoogleUser } from '../utils/profileImageHelper';

const API_BASE_URL = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000';

// SVG Icons
const TrashIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
        <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
);

const CloseIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
);

const SendIcon = () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
    </svg>
);

const LinkIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
);

const FileIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
        <polyline points="13 2 13 9 20 9"/>
    </svg>
);

const AssignmentChip = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
        <rect x="9" y="3" width="6" height="4" rx="2"/>
    </svg>
);

const ClockIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
);

const StarIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
);

const renderTextWithLinks = (text) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, i) => {
        if (part.match(urlRegex)) {
            return (
                <a key={i} href={part} target="_blank" rel="noopener noreferrer"
                   style={{ color: '#1a73e8', textDecoration: 'none' }}
                   onMouseOver={e => e.target.style.textDecoration = 'underline'}
                   onMouseOut={e => e.target.style.textDecoration = 'none'}
                >{part}</a>
            );
        }
        return part;
    });
};

const StreamPost = ({ post, user, isCreator, classId, onDelete, onAddComment, onDeleteComment }) => {
    const [newComment, setNewComment] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const navigate = useNavigate();

    const authorImage = getProfileImageSrc(post.author?.photoURL, post.author ? isGoogleUser(post.author) : false);
    const currentUserImage = getProfileImageSrc(user?.photoURL, user ? isGoogleUser(user) : false);

    const isAssignmentPost = post.type === 'assignment';
    const isOverdue = isAssignmentPost && post.assignmentMeta?.dueDate && new Date() > new Date(post.assignmentMeta.dueDate);

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
        Swal.fire({ title: 'Delete comment?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Delete' })
            .then(r => r.isConfirmed && onDeleteComment && onDeleteComment(post._id, commentId));
    };

    const handleDelete = () => {
        Swal.fire({ title: 'Delete post?', text: 'This cannot be undone.', icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Delete' })
            .then(async r => {
                if (r.isConfirmed) {
                    try {
                        await axios.delete(`${API_BASE_URL}/api/stream/${classId}/${post._id}`, { headers: { 'x-auth-token': user.token } });
                        onDelete(post._id);
                    } catch { Swal.fire('Error', 'Failed to delete post.', 'error'); }
                }
            });
    };

    return (
        <div className={`sp-card ${isAssignmentPost ? 'sp-card--assignment' : ''}`}>
            {isAssignmentPost && (
                <div className="sp-assignment-banner">
                    <div className="sp-assignment-chip">
                        <AssignmentChip />
                        Assignment
                    </div>
                    <div className="sp-assignment-meta">
                        {post.assignmentMeta?.points != null && (
                            <span className="sp-meta-item sp-points">
                                <StarIcon />
                                {post.assignmentMeta.points} pts
                            </span>
                        )}
                        {post.assignmentMeta?.dueDate && (
                            <span className={`sp-meta-item sp-due ${isOverdue ? 'sp-due--overdue' : ''}`}>
                                <ClockIcon />
                                Due {new Date(post.assignmentMeta.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="sp-header">
                <div className="sp-author">
                    <img referrerPolicy="no-referrer" className="sp-avatar" src={authorImage || 'https://ui-avatars.com/api/?name=User'} alt={post.author?.displayName || '?'}
                         onError={e => { e.target.src = 'https://ui-avatars.com/api/?name=User'; }} />
                    <div>
                        <div className="sp-author-name">{post.author?.displayName || 'Unknown'}</div>
                        <div className="sp-timestamp">{new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                </div>
                {isCreator && (
                    <button className="sp-delete-btn" onClick={handleDelete} title="Delete post">
                        <TrashIcon />
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="sp-body">
                <h3 className="sp-title">{isAssignmentPost ? post.title.replace(/^📋 New Assignment: /, '') : post.title}</h3>
                {post.content && (
                    <p className="sp-content">{renderTextWithLinks(post.content)}</p>
                )}
            </div>

            {/* Assignment CTA */}
            {isAssignmentPost && post.assignmentId && (
                <div className="sp-assignment-cta">
                    <button
                        className="sp-view-assignment-btn"
                        onClick={() => navigate(`/classroom/${classId}/classwork/${post.assignmentId}`)}
                    >
                        View Assignment →
                    </button>
                </div>
            )}

            {/* Regular Attachments */}
            {!isAssignmentPost && post.attachments && post.attachments.length > 0 && (
                <div className="sp-attachments">
                    {post.attachments.map((att, i) => {
                        if (att.type === 'image') {
                            return (
                                <a key={i} href={`${API_BASE_URL}${att.url}`} target="_blank" rel="noopener noreferrer" className="sp-att-image-wrap">
                                    <img referrerPolicy="no-referrer" src={`${API_BASE_URL}${att.url}`} alt={att.name || 'Image'} className="sp-att-image" />
                                </a>
                            );
                        }
                        const isLink = att.type === 'link';
                        const url = isLink ? att.url : `${API_BASE_URL}${att.url}`;
                        return (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="sp-att-link" download={!isLink ? att.name : undefined}>
                                <div className="sp-att-icon">{isLink ? <LinkIcon /> : <FileIcon />}</div>
                                <div className="sp-att-info">
                                    <span className="sp-att-name">{att.name || att.url}</span>
                                    <span className="sp-att-type">{att.type}</span>
                                </div>
                            </a>
                        );
                    })}
                </div>
            )}

            {/* Comments */}
            <div className="sp-comments">
                <div className="sp-comment-count">
                    {(post.comments?.length || 0)} class comment{post.comments?.length !== 1 ? 's' : ''}
                </div>

                {post.comments && post.comments.length > 0 && (
                    <div className="sp-comment-list">
                        {post.comments.map(comment => {
                            const cImg = getProfileImageSrc(comment.author?.photoURL, comment.author ? isGoogleUser(comment.author) : false);
                            const isOwn = comment.author?._id === user?.id || comment.author?.id === user?.id;
                            const canDel = isCreator || isOwn;
                            return (
                                <div key={comment._id} className="sp-comment">
                                    <img referrerPolicy="no-referrer" className="sp-comment-avatar" src={cImg || 'https://ui-avatars.com/api/?name=U'} alt="" onError={e => { e.target.src = 'https://ui-avatars.com/api/?name=U'; }} />
                                    <div className="sp-comment-body">
                                        <div className="sp-comment-meta">
                                            <span className="sp-comment-author">{comment.author?.displayName || 'Unknown'}</span>
                                            <span className="sp-comment-time">{new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <p className="sp-comment-text">{comment.text}</p>
                                    </div>
                                    {canDel && (
                                        <button className="sp-comment-del-btn" onClick={() => handleDeleteCommentClick(comment._id)} title="Delete">
                                            <CloseIcon />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Add Comment */}
                <div className="sp-comment-form-wrap">
                    <img referrerPolicy="no-referrer" className="sp-comment-avatar" src={currentUserImage || 'https://ui-avatars.com/api/?name=Me'} alt="You" onError={e => { e.target.src = 'https://ui-avatars.com/api/?name=Me'; }} />
                    <form className="sp-comment-form" onSubmit={handleCommentSubmit}>
                        <input
                            className="sp-comment-input"
                            type="text"
                            placeholder="Add a class comment..."
                            value={newComment}
                            onChange={e => setNewComment(e.target.value)}
                            disabled={isSubmittingComment}
                        />
                        <button type="submit" className={`sp-send-btn ${newComment.trim() ? 'sp-send-btn--active' : ''}`} disabled={!newComment.trim() || isSubmittingComment}>
                            <SendIcon />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default StreamPost;

