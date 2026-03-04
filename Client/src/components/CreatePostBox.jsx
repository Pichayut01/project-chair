// src/components/CreatePostBox.jsx

import React, { useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { getProfileImageSrc, isGoogleUser } from '../utils/profileImageHelper';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

// SVG Icons (inline to avoid dependency on react-icons for consistency)
const LinkIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
);

const PaperclipIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
    </svg>
);

const SendIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
    </svg>
);

const CloseIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
);

const FileDocIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
        <polyline points="13 2 13 9 20 9"/>
    </svg>
);

const CreatePostBox = ({ classId, user, onPostCreated }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [attachments, setAttachments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploadingFile, setUploadingFile] = useState(false);
    const [linkInput, setLinkInput] = useState('');
    const [showLinkInput, setShowLinkInput] = useState(false);

    const handleAddLink = () => {
        if (!linkInput.trim()) return;
        setAttachments(prev => [...prev, { type: 'link', url: linkInput, name: linkInput }]);
        setLinkInput('');
        setShowLinkInput(false);
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 20 * 1024 * 1024) {
             Swal.fire('File too large', 'Please select a file smaller than 20MB', 'error');
             return;
        }

        const formData = new FormData();
        formData.append('file', file);

        setUploadingFile(true);
        try {
             const response = await axios.post(`${API_BASE_URL}/api/upload`, formData, {
                 headers: {
                     'Content-Type': 'multipart/form-data',
                     'x-auth-token': user.token
                 }
             });

             const isImage = file.type.startsWith('image/');
             setAttachments(prev => [...prev, { 
                 type: isImage ? 'image' : 'file', 
                 url: response.data.url, 
                 name: file.name 
             }]);
        } catch (error) {
             console.error('Upload Error:', error);
             Swal.fire('Upload Failed', 'There was an error uploading your file.', 'error');
        } finally {
             setUploadingFile(false);
             e.target.value = null;
        }
    };

    const handleRemoveAttachment = (index) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim()) {
            Swal.fire('Error', 'Please enter a title for your post.', 'error');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(`${API_BASE_URL}/api/stream/${classId}`, {
                title,
                content,
                attachments
            }, {
                headers: { 'x-auth-token': user.token }
            });

            onPostCreated(response.data);
            
            setTitle('');
            setContent('');
            setAttachments([]);
            setIsExpanded(false);
            Swal.fire('Success', 'Post created successfully!', 'success');
        } catch (error) {
            console.error('Error creating post:', error);
            Swal.fire('Error', 'Failed to create post. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setIsExpanded(false);
        setTitle('');
        setContent('');
        setAttachments([]);
        setShowLinkInput(false);
        setLinkInput('');
    };

    return (
        <div className={`cpb-container ${isExpanded ? 'cpb-container--expanded' : ''}`}>
            {!isExpanded ? (
                <div className="cpb-placeholder" onClick={() => setIsExpanded(true)}>
                    <img 
                        className="cpb-avatar"
                        src={getProfileImageSrc(user?.photoURL, user ? isGoogleUser(user) : false)} 
                        alt="Profile" 
                        onError={(e) => { e.target.src = 'https://ui-avatars.com/api/?name=Me'; }}
                    />
                    <div className="cpb-placeholder-text">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                        Announce something to your class
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="cpb-form">
                    <div className="cpb-form-fields">
                        <input
                            className="cpb-title-input"
                            type="text"
                            placeholder="Post Title (Required)"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            autoFocus
                        />
                        <textarea
                            className="cpb-content-input"
                            placeholder="Announce something to your class..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={4}
                        />
                    </div>

                    {/* Attachments List */}
                    {attachments.length > 0 && (
                        <div className="cpb-attachments">
                            {attachments.map((att, i) => (
                                <div key={i} className="cpb-attachment-item">
                                    <div className="cpb-attachment-info">
                                        <span className="cpb-attachment-icon">
                                            {att.type === 'link' ? <LinkIcon /> : <FileDocIcon />}
                                        </span>
                                        <a href={att.url} target="_blank" rel="noopener noreferrer" className="cpb-attachment-name">
                                            {att.name || att.url}
                                        </a>
                                    </div>
                                    <button type="button" className="cpb-attachment-remove" onClick={() => handleRemoveAttachment(i)}>
                                        <CloseIcon />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Link Input area */}
                    {showLinkInput && (
                        <div className="cpb-link-input-row">
                            <input
                                className="cpb-link-input"
                                type="url"
                                placeholder="Paste link here..."
                                value={linkInput}
                                onChange={(e) => setLinkInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddLink())}
                                autoFocus
                            />
                            <button type="button" className="cpb-link-add-btn" onClick={handleAddLink}>Add</button>
                            <button type="button" className="cpb-link-cancel-btn" onClick={() => setShowLinkInput(false)}>
                                <CloseIcon />
                            </button>
                        </div>
                    )}

                    {/* Action Bar */}
                    <div className="cpb-actions">
                        <div className="cpb-actions-left">
                            <button type="button" className="cpb-action-btn" onClick={() => setShowLinkInput(true)}>
                                <LinkIcon /> Link
                            </button>
                            <label className={`cpb-action-btn ${uploadingFile ? 'cpb-action-btn--disabled' : ''}`}>
                                <PaperclipIcon /> {uploadingFile ? 'Uploading...' : 'File'}
                                <input 
                                    type="file" 
                                    onChange={handleFileUpload} 
                                    style={{ display: 'none' }} 
                                    disabled={uploadingFile}
                                />
                            </label>
                        </div>
                        <div className="cpb-actions-right">
                            <button type="button" className="cpb-cancel-btn" onClick={handleCancel}>
                                Cancel
                            </button>
                            <button type="submit" className={`cpb-submit-btn ${loading ? 'cpb-submit-btn--loading' : ''}`} disabled={loading}>
                                <SendIcon /> {loading ? 'Posting...' : 'Post'}
                            </button>
                        </div>
                    </div>
                </form>
            )}
        </div>
    );
};

export default CreatePostBox;
