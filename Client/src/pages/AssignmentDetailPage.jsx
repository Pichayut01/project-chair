import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Loader from '../components/Loader';
import CreateAssignmentModal from '../components/CreateAssignmentModal';
import { getProfileImageSrc, isGoogleUser } from '../utils/profileImageHelper';
import '../CSS/AssignmentDetailPage.css';

const API_BASE_URL = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000';

/* ───────── SVG Icons ───────── */
const SvgClipboard = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
        <rect x="9" y="3" width="6" height="4" rx="2"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>
    </svg>
);
const SvgEdit = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
);
const SvgTrash = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
    </svg>
);
const SvgBack = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6"/>
    </svg>
);
const SvgUsers = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
);
const SvgChat = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
);
const SvgUpload = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
    </svg>
);
const SvgFile = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/>
    </svg>
);
const SvgSend = () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
);
const SvgCheckCircle = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
);
const SvgClock = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
);
const SvgStar = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
);

const AssignmentDetailPage = ({ user, isSidebarOpen, toggleSidebar, handleSignOut }) => {
    const { classId, assignmentId } = useParams();
    const navigate = useNavigate();
    
    const [classroom, setClassroom] = useState(null);
    const [assignment, setAssignment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Teacher states
    const [submissions, setSubmissions] = useState([]);
    const [gradingSubmission, setGradingSubmission] = useState(null);
    const [pointsAwarded, setPointsAwarded] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    
    // Student states
    const [attachmentUrl, setAttachmentUrl] = useState('');
    const [attachmentFile, setAttachmentFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [uploadingFile, setUploadingFile] = useState(false);
    const [isResubmitting, setIsResubmitting] = useState(false);

    // Comment states
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);

    const isCreator = classroom?.creator?.some(c => 
        (typeof c === 'string' && c === user.id) || 
        (c._id && c._id === user.id)
    ) || false;

    const fetchDetails = useCallback(async () => {
        try {
            setLoading(true);
            const classRes = await axios.get(`${API_BASE_URL}/api/classrooms/${classId}`, {
                headers: { 'x-auth-token': user.token }
            });
            setClassroom(classRes.data);
            
            const amICreator = classRes.data.creator?.some(c => 
                (typeof c === 'string' && c === user.id) || (c._id && c._id === user.id)
            ) || false;

            const assignRes = await axios.get(`${API_BASE_URL}/api/classwork/${classId}/${assignmentId}`, {
                headers: { 'x-auth-token': user.token }
            });
            setAssignment(assignRes.data);

            if (!amICreator && assignRes.data.submission?.attachments?.length > 0) {
                 const existingAttachment = assignRes.data.submission.attachments[0];
                 if (existingAttachment.filename === 'Attachment' || !existingAttachment.filename) {
                     setAttachmentUrl(existingAttachment.url);
                 } else {
                     setAttachmentFile({
                         url: existingAttachment.url,
                         originalname: existingAttachment.filename,
                         mimetype: 'application/octet-stream'
                     });
                 }
            }

            if (amICreator) {
                const subsRes = await axios.get(`${API_BASE_URL}/api/classwork/${classId}/${assignmentId}/submissions`, {
                    headers: { 'x-auth-token': user.token }
                });
                setSubmissions(subsRes.data);
            }

            try {
                const commentsRes = await axios.get(`${API_BASE_URL}/api/classwork/${classId}/${assignmentId}/comments`, {
                    headers: { 'x-auth-token': user.token }
                });
                setComments(commentsRes.data || []);
            } catch {
                setComments([]);
            }
            
            setLoading(false);
        } catch (err) {
            console.error('Error fetching assignment details:', err);
            setError('Failed to load assignment details.');
            setLoading(false);
        }
    }, [classId, assignmentId, user]);

    useEffect(() => {
        fetchDetails();
    }, [fetchDetails]);

    const handleFileUploadChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            setUploadingFile(true);
            setError(null);
            const formData = new FormData();
            formData.append('file', file);
            const res = await axios.post(`${API_BASE_URL}/api/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data', 'x-auth-token': user.token }
            });
            setAttachmentFile({ url: res.data.url, originalname: res.data.originalname, filename: res.data.filename, mimetype: res.data.mimetype });
            setAttachmentUrl('');
            setUploadingFile(false);
        } catch (err) {
            console.error('Error uploading file:', err);
            setError('Failed to upload file.');
            setUploadingFile(false);
        }
    };

    const handleRemoveAttachment = () => { setAttachmentFile(null); setAttachmentUrl(''); };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || submittingComment) return;
        try {
            setSubmittingComment(true);
            const res = await axios.post(`${API_BASE_URL}/api/classwork/${classId}/${assignmentId}/comment`, { text: newComment.trim() }, { headers: { 'x-auth-token': user.token } });
            setComments(res.data);
            setNewComment('');
        } catch (err) { console.error('Error adding comment:', err); }
        finally { setSubmittingComment(false); }
    };

    const handleDeleteComment = async (commentId) => {
        try {
            await axios.delete(`${API_BASE_URL}/api/classwork/${classId}/${assignmentId}/comment/${commentId}`, { headers: { 'x-auth-token': user.token } });
            setComments(prev => prev.filter(c => c._id !== commentId));
        } catch (err) { console.error('Error deleting comment:', err); }
    };

    const handleTurnIn = async () => {
        try {
            setSubmitting(true);
            setError(null);
            let attachments = [];
            if (attachmentFile) { attachments.push({ url: attachmentFile.url, filename: attachmentFile.originalname }); }
            else if (attachmentUrl) { attachments.push({ url: attachmentUrl, filename: 'Attachment' }); }
            const res = await axios.post(`${API_BASE_URL}/api/classwork/${classId}/${assignmentId}/submit`, { attachments }, { headers: { 'x-auth-token': user.token } });
            setAssignment(prev => ({ ...prev, submission: res.data }));
            setSubmitting(false);
        } catch (err) {
            console.error('Error submitting assignment:', err);
            setError(err.response?.data?.msg || 'Failed to submit assignment');
            setSubmitting(false);
        }
    };

    const handleGrade = async (submissionId) => {
        try {
            setSubmitting(true);
            const res = await axios.put(`${API_BASE_URL}/api/classwork/${classId}/${assignmentId}/grade/${submissionId}`, { pointsAwarded: Number(pointsAwarded) }, { headers: { 'x-auth-token': user.token } });
            setSubmissions(prev => prev.map(s => s._id === submissionId ? res.data : s));
            setGradingSubmission(null);
            setSubmitting(false);
        } catch (err) {
            console.error('Error grading:', err);
            setError('Failed to save grade');
            setSubmitting(false);
        }
    };

    const handleDeleteAssignment = async () => {
        if (!window.confirm('Are you sure you want to delete this assignment? All submissions and comments will be permanently removed.')) return;
        try {
            setLoading(true);
            await axios.delete(`${API_BASE_URL}/api/classwork/${classId}/${assignmentId}`, { headers: { 'x-auth-token': user.token } });
            navigate(`/classroom/${classId}/stream`, { state: { activeTab: 'classwork' } });
        } catch (err) {
            console.error('Error deleting assignment:', err);
            alert(err.response?.data?.msg || 'Failed to delete assignment');
            setLoading(false);
        }
    };

    const handleAssignmentUpdate = (updatedAssignment) => { setAssignment(updatedAssignment); };

    if (loading) return <Loader />;
    if (error && !assignment) return <div className="ad-error-page">{error}</div>;
    if (!assignment) return <div className="ad-error-page">Assignment not found</div>;

    const turnedIn = submissions.filter(s => s.status === 'submitted' || s.status === 'late').length;
    const graded = submissions.filter(s => s.status === 'graded').length;
    const isDue = assignment.dueDate && new Date() > new Date(assignment.dueDate);

    return (
        <>
            <Navbar
                isSidebarOpen={isSidebarOpen}
                toggleSidebar={toggleSidebar}
                user={user}
                handleSignOut={handleSignOut}
                classroom={classroom}
                isAssignmentDetailPage={true}
                classId={classId}
                onClassroomBackClick={() => navigate(`/classroom/${classId}/stream`, { state: { activeTab: 'classwork' } })}
            />
            <main className={`main__content ${isSidebarOpen ? 'shift' : ''}`}>
                <div className="class-detail-container">
                    <div className="ad-container">
                        {/* ═══ Back Button ═══ */}

                        {/* ═══ BENTO GRID ═══ */}
                        <div className="ad-bento">
                            {/* ── Tile: Header ── */}
                            <div className="ad-tile ad-header-tile" style={{ '--delay': '0' }}>
                                <div className="ad-header-top">
                                    <div className="ad-header-icon"><SvgClipboard /></div>
                                    <div className="ad-header-info">
                                        <h1>{assignment.title}</h1>
                                        <div className="ad-header-meta">
                                            <span className="ad-meta-chip points"><SvgStar /> {assignment.points} points</span>
                                            {assignment.dueDate && (
                                                <span className={`ad-meta-chip due ${isDue ? 'overdue' : ''}`}>
                                                    <SvgClock /> Due {new Date(assignment.dueDate).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            )}
                                            {assignment.allowLateSubmission && (
                                                <span className="ad-meta-chip late-ok">Late OK</span>
                                            )}
                                        </div>
                                    </div>
                                    {isCreator && (
                                        <div className="ad-header-actions">
                                            <button className="ad-action-btn edit" onClick={() => setIsEditModalOpen(true)} title="Edit"><SvgEdit /></button>
                                            <button className="ad-action-btn delete" onClick={handleDeleteAssignment} title="Delete"><SvgTrash /></button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ── Tile: Instructions ── */}
                            <div className="ad-tile ad-instructions-tile" style={{ '--delay': '1' }}>
                                <div className="ad-tile-header">
                                    <SvgClipboard />
                                    <h3>Instructions</h3>
                                </div>
                                {assignment.description ? (
                                    <p className="ad-instructions-text">{assignment.description}</p>
                                ) : (
                                    <p className="ad-instructions-text ad-empty-text">No instructions provided for this assignment.</p>
                                )}

                                {/* ── Attachments Display ── */}
                                {assignment.attachments && assignment.attachments.length > 0 && (
                                    <div className="ad-attachments-display">
                                        <div className="ad-attachments-title">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                                            </svg>
                                            Attachments ({assignment.attachments.length})
                                        </div>
                                        <div className="ad-attachments-grid">
                                            {assignment.attachments.map((att, i) => {
                                                const fullUrl = att.url.startsWith('http') ? att.url : `${API_BASE_URL}${att.url}`;
                                                
                                                if (att.type === 'image') {
                                                    return (
                                                        <a key={i} href={fullUrl} target="_blank" rel="noreferrer" className="ad-attach-card ad-attach-image">
                                                            <div className="ad-attach-img-preview">
                                                                <img referrerPolicy="no-referrer" src={fullUrl} alt={att.filename} onError={e => { e.target.style.display = 'none'; }} />
                                                            </div>
                                                            <span className="ad-attach-label">{att.filename}</span>
                                                        </a>
                                                    );
                                                }

                                                return (
                                                    <a key={i} href={fullUrl} target="_blank" rel="noreferrer" className={`ad-attach-card ad-attach-${att.type}`}>
                                                        <div className={`ad-attach-icon-box ad-attach-icon--${att.type}`}>
                                                            {att.type === 'link' ? (
                                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                                                                </svg>
                                                            ) : (
                                                                <SvgFile />
                                                            )}
                                                        </div>
                                                        <span className="ad-attach-label">{att.filename}</span>
                                                        <svg className="ad-attach-external" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                                                        </svg>
                                                    </a>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* ── Tile: Student Work (Student View) ── */}
                            {!isCreator && (
                                <div className="ad-tile ad-work-tile" style={{ '--delay': '2' }}>
                                    <div className="ad-tile-header">
                                        <SvgUpload />
                                        <h3>Your Work</h3>
                                        <span className={`ad-status-badge ${assignment.submission ? assignment.submission.status : 'assigned'}`}>
                                            {assignment.submission ? assignment.submission.status : 'Assigned'}
                                        </span>
                                    </div>

                                    {assignment.submission?.status === 'graded' && assignment.showScoreToStudents && (
                                        <div className="ad-score-display">
                                            <span className="ad-score-val">{assignment.submission.pointsAwarded}</span>
                                            <span className="ad-score-total">/ {assignment.points}</span>
                                        </div>
                                    )}

                                    {(!assignment.submission || assignment.submission?.status !== 'graded') ? (
                                        <>
                                            {/* ---- Already submitted & NOT in resubmit mode ---- */}
                                            {assignment.submission && !isResubmitting ? (
                                                <>
                                                    {/* Show current submission */}
                                                    {assignment.submission.attachments?.length > 0 && (
                                                        <div className="ad-attachment-area">
                                                            {assignment.submission.attachments.map((att, i) => (
                                                                <div key={i} className="ad-uploaded-file">
                                                                    <div className="ad-file-info">
                                                                        <SvgFile />
                                                                        <span className="ad-file-name" title={att.filename || att.url}>{att.filename || att.url}</span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    <button
                                                        className="ad-turnin-btn resubmit"
                                                        onClick={() => {
                                                            setIsResubmitting(true);
                                                            setAttachmentFile(null);
                                                            setAttachmentUrl('');
                                                        }}
                                                    >
                                                        <SvgCheckCircle /> Resubmit
                                                    </button>
                                                </>
                                            ) : (
                                                /* ---- Not yet submitted OR in resubmit mode ---- */
                                                <>
                                                    <div className="ad-attachment-area">
                                                        {attachmentFile ? (
                                                            <div className="ad-uploaded-file">
                                                                <div className="ad-file-info">
                                                                    <SvgFile />
                                                                    <span className="ad-file-name" title={attachmentFile.originalname}>{attachmentFile.originalname}</span>
                                                                </div>
                                                                <button className="ad-file-remove" onClick={handleRemoveAttachment} title="Remove">
                                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <input
                                                                    type="url"
                                                                    placeholder="Paste a link to your work..."
                                                                    value={attachmentUrl}
                                                                    onChange={(e) => setAttachmentUrl(e.target.value)}
                                                                    className="ad-url-input"
                                                                    disabled={uploadingFile}
                                                                />
                                                                <div className="ad-separator">OR</div>
                                                                <label className="ad-upload-btn">
                                                                    {uploadingFile ? 'Uploading...' : (<><SvgUpload /> Upload File</>)}
                                                                    <input type="file" style={{ display: 'none' }} onChange={handleFileUploadChange} disabled={uploadingFile || !!attachmentUrl} />
                                                                </label>
                                                            </>
                                                        )}
                                                    </div>
                                                    {error && <div className="ad-inline-error">{error}</div>}
                                                    <button
                                                        className={`ad-turnin-btn ${isResubmitting ? 'resubmit' : ''}`}
                                                        onClick={async () => {
                                                            await handleTurnIn();
                                                            setIsResubmitting(false);
                                                        }}
                                                        disabled={submitting || uploadingFile || (!attachmentFile && !attachmentUrl)}
                                                    >
                                                        <SvgCheckCircle />
                                                        {submitting ? 'Turning in...' : (isResubmitting ? 'Resubmit' : 'Turn In')}
                                                    </button>
                                                    {isResubmitting && (
                                                        <button
                                                            className="ad-turnin-btn resubmit"
                                                            style={{ marginTop: '8px', background: 'transparent', border: '1.5px solid #e2e8f0', color: '#64748b', boxShadow: 'none' }}
                                                            onClick={() => {
                                                                setIsResubmitting(false);
                                                                setAttachmentFile(null);
                                                                setAttachmentUrl('');
                                                            }}
                                                        >
                                                            Cancel
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </>
                                    ) : (
                                        <div className="ad-graded-msg">This assignment has been graded and cannot be resubmitted.</div>
                                    )}
                                </div>
                            )}

                            {/* ── Tile: Teacher Stats (Teacher View) ── */}
                            {isCreator && (
                                <div className="ad-tile ad-teacher-stats-tile" style={{ '--delay': '2' }}>
                                    <div className="ad-tile-header">
                                        <SvgUsers />
                                        <h3>Submission Overview</h3>
                                    </div>
                                    <div className="ad-stats-mini-grid">
                                        <div className="ad-stat-card turned-in">
                                            <span className="ad-stat-num">{turnedIn}</span>
                                            <span className="ad-stat-label">Turned In</span>
                                        </div>
                                        <div className="ad-stat-card graded-stat">
                                            <span className="ad-stat-num">{graded}</span>
                                            <span className="ad-stat-label">Graded</span>
                                        </div>
                                        <div className="ad-stat-card not-sub">
                                            <span className="ad-stat-num">{Math.max(0, submissions.length - turnedIn - graded)}</span>
                                            <span className="ad-stat-label">Pending</span>
                                        </div>
                                    </div>
                                    {submissions.length > 0 && (
                                        <div className="ad-progress-row">
                                            <div className="ad-progress-bar-lg">
                                                <div className="ad-progress-fill-lg graded-fill" style={{ width: `${submissions.length > 0 ? (graded / submissions.length) * 100 : 0}%` }}></div>
                                                <div className="ad-progress-fill-lg turned-fill" style={{ width: `${submissions.length > 0 ? (turnedIn / submissions.length) * 100 : 0}%` }}></div>
                                            </div>
                                            <span className="ad-progress-label">{graded + turnedIn}/{submissions.length} complete</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── Tile: Student Submissions (Teacher View) ── */}
                            {isCreator && (
                                <div className="ad-tile ad-submissions-tile" style={{ '--delay': '3' }}>
                                    <div className="ad-tile-header">
                                        <SvgUsers />
                                        <h3>Student Submissions ({submissions.length})</h3>
                                    </div>
                                    {submissions.length === 0 ? (
                                        <div className="ad-no-submissions">No submissions yet.</div>
                                    ) : (
                                        <div className="ad-submissions-grid">
                                            {submissions.map(sub => (
                                                <div key={sub._id} className="ad-sub-card">
                                                    <div className="ad-sub-top">
                                                        <div className="ad-sub-student">
                                                            <img referrerPolicy="no-referrer" 
                                                                className="ad-sub-avatar" 
                                                                src={getProfileImageSrc(sub.studentId?.photoURL, isGoogleUser(sub.studentId)) || `https://ui-avatars.com/api/?name=${encodeURIComponent(sub.studentId?.displayName || '?')}&background=random`} 
                                                                alt="" 
                                                                onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(sub.studentId?.displayName || '?')}&background=random`; }} 
                                                            />
                                                            <span className="ad-sub-name">{sub.studentId?.displayName || sub.studentId?.email || 'Unknown'}</span>
                                                        </div>
                                                        <span className={`ad-sub-pill ${sub.status}`}>{sub.status}</span>
                                                    </div>

                                                    {sub.attachments && sub.attachments.length > 0 ? (
                                                        <a href={sub.attachments[0].url.startsWith('http') ? sub.attachments[0].url : `${API_BASE_URL}${sub.attachments[0].url}`} target="_blank" rel="noreferrer" className="ad-sub-attachment">
                                                            <SvgFile />
                                                            {sub.attachments[0].filename === 'Attachment' ? 'View Link' : sub.attachments[0].filename}
                                                        </a>
                                                    ) : (
                                                        <div className="ad-sub-no-file">No attachments</div>
                                                    )}

                                                    <div className="ad-sub-grade-section">
                                                        {gradingSubmission === sub._id ? (
                                                            <div className="ad-grade-input-area">
                                                                <input 
                                                                    type="number" 
                                                                    value={pointsAwarded}
                                                                    onChange={(e) => setPointsAwarded(e.target.value)}
                                                                    placeholder={`/ ${assignment.points}`}
                                                                    max={assignment.points}
                                                                    min="0"
                                                                    className="ad-grade-input"
                                                                />
                                                                <div className="ad-grade-btns">
                                                                    <button onClick={() => handleGrade(sub._id)} disabled={submitting} className="ad-btn-save">Save</button>
                                                                    <button onClick={() => setGradingSubmission(null)} className="ad-btn-cancel">Cancel</button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="ad-grade-display">
                                                                <div className="ad-current-grade">
                                                                    {sub.status === 'graded' ? (
                                                                        <span><span className="ad-score-awarded">{sub.pointsAwarded}</span> / {assignment.points}</span>
                                                                    ) : (
                                                                        <span className="ad-not-graded">Not graded</span>
                                                                    )}
                                                                </div>
                                                                <button className="ad-btn-grade" onClick={() => {
                                                                    setGradingSubmission(sub._id);
                                                                    setPointsAwarded(sub.pointsAwarded !== undefined ? sub.pointsAwarded : '');
                                                                }}>
                                                                    {sub.status === 'graded' ? 'Regrade' : 'Grade'}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── Tile: Comments ── */}
                            <div className="ad-tile ad-comments-tile" style={{ '--delay': '4' }}>
                                <div className="ad-tile-header">
                                    <SvgChat />
                                    <h3>Class Comments ({comments.length})</h3>
                                </div>

                                {comments.length > 0 && (
                                    <div className="ad-comments-list">
                                        {comments.map(comment => {
                                            const cImg = getProfileImageSrc(comment.author?.photoURL, comment.author ? isGoogleUser(comment.author) : false);
                                            const isOwn = comment.author?._id === user?.id || comment.author?.id === user?.id;
                                            const canDel = isCreator || isOwn;
                                            return (
                                                <div key={comment._id} className="ad-comment-item">
                                                    <img referrerPolicy="no-referrer" className="ad-comment-avatar" src={cImg || 'https://ui-avatars.com/api/?name=U'} alt="" onError={e => { e.target.src = 'https://ui-avatars.com/api/?name=U'; }} />
                                                    <div className="ad-comment-body">
                                                        <div className="ad-comment-meta">
                                                            <span className="ad-comment-author">{comment.author?.displayName || 'Unknown'}</span>
                                                            <span className="ad-comment-time">{new Date(comment.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                        <p className="ad-comment-text">{comment.text}</p>
                                                    </div>
                                                    {canDel && (
                                                        <button className="ad-comment-del" onClick={() => handleDeleteComment(comment._id)} title="Delete">
                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                <form className="ad-comment-form" onSubmit={handleAddComment}>
                                    <img referrerPolicy="no-referrer" className="ad-comment-avatar" src={getProfileImageSrc(user?.photoURL, isGoogleUser(user)) || 'https://ui-avatars.com/api/?name=Me'} alt="" onError={e => { e.target.src = 'https://ui-avatars.com/api/?name=Me'; }} />
                                    <div className="ad-comment-input-row">
                                        <input
                                            type="text"
                                            className="ad-comment-input"
                                            placeholder="Add a class comment..."
                                            value={newComment}
                                            onChange={e => setNewComment(e.target.value)}
                                            disabled={submittingComment}
                                        />
                                        <button type="submit" className={`ad-comment-send ${newComment.trim() ? 'active' : ''}`} disabled={!newComment.trim() || submittingComment}>
                                            <SvgSend />
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {isCreator && (
                <CreateAssignmentModal 
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    classId={classId}
                    user={user}
                    onAssignmentCreated={handleAssignmentUpdate}
                    assignment={assignment}
                />
            )}
        </>
    );
};

export default AssignmentDetailPage;

