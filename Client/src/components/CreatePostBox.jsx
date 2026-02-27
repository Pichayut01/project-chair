// src/components/CreatePostBox.jsx

import React, { useState } from 'react';
import axios from 'axios';
import { FaPaperclip, FaLink, FaPaperPlane, FaTimes } from 'react-icons/fa';
import Swal from 'sweetalert2';
import { getProfileImageSrc, isGoogleUser } from '../utils/profileImageHelper';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

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

        // Optional: validate size on client side
        if (file.size > 20 * 1024 * 1024) {
             Swal.fire('File too large', 'Please select a file smaller than 20MB', 'error');
             return;
        }

        const formData = new FormData();
        formData.append('file', file);

        setUploadingFile(true);
        try {
             // Reusing the general upload endpoint
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
             // clear the input
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
            
            // Reset form
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

    return (
        <div className="create-post-box" style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            border: '1px solid #dadce0',
            boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
            padding: '24px',
            marginBottom: '24px'
        }}>
            {!isExpanded ? (
                <div 
                    className="create-post-placeholder" 
                    onClick={() => setIsExpanded(true)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        cursor: 'pointer',
                    }}
                >
                    <img 
                        src={getProfileImageSrc(user?.photoURL, user ? isGoogleUser(user) : false)} 
                        alt="Profile" 
                        style={{ 
                            width: '40px', 
                            height: '40px', 
                            borderRadius: '50%', 
                            objectFit: 'cover',
                            border: '1px solid #dadce0'
                        }}
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/40'; }}
                    />
                    <div style={{
                        flex: 1,
                        backgroundColor: '#fff',
                        border: '1px solid #dadce0',
                        borderRadius: '24px',
                        padding: '12px 20px',
                        color: '#5f6368',
                        fontSize: '14px',
                        transition: 'background-color 0.2s, box-shadow 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.02) inset'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8f9fa';
                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05) inset';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#fff';
                        e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.02) inset';
                    }}
                    >
                        Announce something to your class
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '16px' }}>
                        <input
                            type="text"
                            placeholder="Post Title (Required)"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                fontSize: '16px',
                                border: 'none',
                                borderBottom: '2px solid #007bff',
                                outline: 'none',
                                marginBottom: '12px',
                                fontWeight: '500'
                            }}
                            autoFocus
                        />
                        <textarea
                            placeholder="Announce something to your class..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={4}
                            style={{
                                width: '100%',
                                padding: '12px',
                                fontSize: '15px',
                                border: '1px solid #e0e0e0',
                                borderRadius: '4px',
                                outline: 'none',
                                resize: 'vertical'
                            }}
                        />
                    </div>

                    {/* Attachments List */}
                    {attachments.length > 0 && (
                        <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {attachments.map((att, i) => (
                                <div key={i} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '8px 12px', backgroundColor: '#f8f9fa', border: '1px solid #dadce0', borderRadius: '4px'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                                        {att.type === 'link' ? <FaLink color="#5f6368" /> : <FaPaperclip color="#5f6368" />}
                                        <a href={att.url} target="_blank" rel="noopener noreferrer" style={{
                                            color: '#1a73e8', textDecoration: 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                                        }}>{att.name || att.url}</a>
                                    </div>
                                    <button type="button" onClick={() => handleRemoveAttachment(i)} style={{
                                        background: 'none', border: 'none', color: '#5f6368', cursor: 'pointer', padding: '4px'
                                    }}>
                                        <FaTimes />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Link Input area */}
                    {showLinkInput && (
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                            <input
                                type="url"
                                placeholder="Paste link here..."
                                value={linkInput}
                                onChange={(e) => setLinkInput(e.target.value)}
                                style={{ flex: 1, padding: '8px 12px', border: '1px solid #dadce0', borderRadius: '4px' }}
                            />
                            <button type="button" onClick={handleAddLink} style={{
                                padding: '8px 16px', backgroundColor: '#f1f3f4', border: 'none', borderRadius: '4px', cursor: 'pointer'
                            }}>Add Link</button>
                            <button type="button" onClick={() => setShowLinkInput(false)} style={{
                                padding: '8px 16px', background: 'none', border: 'none', cursor: 'pointer', color: '#5f6368'
                            }}>Cancel</button>
                        </div>
                    )}

                    {/* Action Bar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button type="button" 
                                onClick={() => setShowLinkInput(true)}
                                style={{
                                display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px',
                                backgroundColor: 'transparent', border: '1px solid #dadce0', borderRadius: '24px', cursor: 'pointer', color: '#5f6368', fontWeight: '500'
                            }}>
                                <FaLink /> Add Link
                            </button>
                            <label style={{
                                display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px',
                                backgroundColor: 'transparent', border: '1px solid #dadce0', borderRadius: '24px', 
                                cursor: uploadingFile ? 'not-allowed' : 'pointer', color: '#5f6368', fontWeight: '500',
                                opacity: uploadingFile ? 0.6 : 1
                            }}>
                                <FaPaperclip /> {uploadingFile ? 'Uploading...' : 'Add File'}
                                <input 
                                    type="file" 
                                    onChange={handleFileUpload} 
                                    style={{ display: 'none' }} 
                                    disabled={uploadingFile}
                                />
                            </label>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button type="button" onClick={() => {
                                setIsExpanded(false);
                                setTitle('');
                                setContent('');
                                setAttachments([]);
                            }} style={{
                                padding: '8px 16px', background: 'none', border: 'none', color: '#5f6368', fontWeight: '500', cursor: 'pointer'
                            }}>
                                Cancel
                            </button>
                            <button type="submit" disabled={loading} style={{
                                padding: '8px 24px', backgroundColor: '#1a73e8', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: '500', cursor: loading ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', gap: '8px'
                            }}>
                                {loading ? 'Posting...' : <><FaPaperPlane /> Post</>}
                            </button>
                        </div>
                    </div>
                </form>
            )}
        </div>
    );
};

export default CreatePostBox;
