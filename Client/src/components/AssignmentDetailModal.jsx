import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../CSS/AssignmentDetailModal.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const AssignmentDetailModal = ({ isOpen, onClose, assignment, classId, user, isCreator, onUpdate }) => {
    const [loading, setLoading] = useState(false);
    const [submissions, setSubmissions] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [attachmentUrl, setAttachmentUrl] = useState('');
    const [error, setError] = useState(null);
    const [gradingSubmission, setGradingSubmission] = useState(null);
    const [pointsAwarded, setPointsAwarded] = useState('');

    useEffect(() => {
        if (isOpen && isCreator) {
            fetchSubmissions();
        }
    }, [isOpen, isCreator]);

    const fetchSubmissions = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE_URL}/api/classwork/${classId}/${assignment._id}/submissions`, {
                headers: { 'x-auth-token': user.token }
            });
            setSubmissions(res.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching submissions:', err);
            setError('Failed to load submissions');
            setLoading(false);
        }
    };

    const handleTurnIn = async () => {
        try {
            setSubmitting(true);
            setError(null);
            
            const attachments = attachmentUrl ? [{ url: attachmentUrl, filename: 'Attachment' }] : [];
            
            const res = await axios.post(`${API_BASE_URL}/api/classwork/${classId}/${assignment._id}/submit`, 
                { attachments }, 
                { headers: { 'x-auth-token': user.token } }
            );

            // Update local state to reflect submission
            onUpdate({
                ...assignment,
                submission: res.data
            });
            
            setSubmitting(false);
            onClose();
        } catch (err) {
            console.error('Error submitting assignment:', err);
            setError(err.response?.data?.msg || 'Failed to submit assignment');
            setSubmitting(false);
        }
    };

    const handleGrade = async (submissionId) => {
        try {
            setSubmitting(true);
            const res = await axios.put(`${API_BASE_URL}/api/classwork/${classId}/${assignment._id}/grade/${submissionId}`, 
                { pointsAwarded: Number(pointsAwarded) }, 
                { headers: { 'x-auth-token': user.token } }
            );
            
            // Update local submission list
            setSubmissions(prev => prev.map(s => s._id === submissionId ? res.data : s));
            setGradingSubmission(null);
            setSubmitting(false);
        } catch (err) {
            console.error('Error grading:', err);
            setError('Failed to save grade');
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content assignment-detail-modal">
                <button className="close-btn" onClick={onClose}>&times;</button>
                <div className="assignment-detail-header">
                    <h2>{assignment.title}</h2>
                    <div className="assignment-meta">
                        <span className="points">{assignment.points} points</span>
                        {assignment.dueDate && (
                            <span className="due-date">
                                Due {new Date(assignment.dueDate).toLocaleString()}
                            </span>
                        )}
                    </div>
                </div>

                <div className="assignment-description">
                    {assignment.description ? (
                        <p>{assignment.description}</p>
                    ) : (
                        <p className="no-description">No instructions provided.</p>
                    )}
                </div>

                {error && <div className="error-message">{error}</div>}

                {isCreator ? (
                    <div className="submissions-section">
                        <h3>Student Submissions ({submissions.length})</h3>
                        {loading ? (
                            <p>Loading submissions...</p>
                        ) : submissions.length === 0 ? (
                            <p className="no-submissions">No submissions yet.</p>
                        ) : (
                            <div className="submissions-list">
                                {submissions.map(sub => (
                                    <div key={sub._id} className="submission-card">
                                        <div className="student-info">
                                            {sub.studentId?.displayName || sub.studentId?.email || 'Unknown Student'}
                                        </div>
                                        <div className="submission-status-info">
                                            Status: <span className={`status-badge ${sub.status}`}>{sub.status}</span>
                                        </div>
                                        {sub.attachments && sub.attachments.length > 0 && (
                                            <div className="attachment-link">
                                                <a href={sub.attachments[0].url} target="_blank" rel="noreferrer">
                                                    View Attachment
                                                </a>
                                            </div>
                                        )}
                                        <div className="grading-area">
                                            {gradingSubmission === sub._id ? (
                                                <div className="grade-input-group">
                                                    <input 
                                                        type="number" 
                                                        value={pointsAwarded}
                                                        onChange={(e) => setPointsAwarded(e.target.value)}
                                                        placeholder={`/ ${assignment.points}`}
                                                        max={assignment.points}
                                                        min="0"
                                                    />
                                                    <button 
                                                        onClick={() => handleGrade(sub._id)}
                                                        disabled={submitting}
                                                        className="save-grade-btn"
                                                    >
                                                        Save
                                                    </button>
                                                    <button 
                                                        onClick={() => setGradingSubmission(null)}
                                                        className="cancel-grade-btn"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="grade-display">
                                                    {sub.status === 'graded' ? (
                                                        <span><strong>{sub.pointsAwarded}</strong> / {assignment.points}</span>
                                                    ) : (
                                                        <span>Not graded</span>
                                                    )}
                                                    <button 
                                                        className="grade-btn" 
                                                        onClick={() => {
                                                            setGradingSubmission(sub._id);
                                                            setPointsAwarded(sub.pointsAwarded !== undefined ? sub.pointsAwarded : '');
                                                        }}
                                                    >
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
                ) : (
                    <div className="student-work-section">
                        <div className="work-panel">
                            <div className="work-panel-header">
                                <h3>Your work</h3>
                                <span className={`status-text ${assignment.submission ? assignment.submission.status : 'assigned'}`}>
                                    {assignment.submission ? assignment.submission.status : 'Assigned'}
                                </span>
                            </div>
                            
                            {assignment.submission?.status === 'graded' && assignment.showScoreToStudents && (
                                <div className="score-display">
                                    Score: {assignment.submission.pointsAwarded} / {assignment.points}
                                </div>
                            )}

                            {!assignment.submission || assignment.submission?.status !== 'graded' ? (
                                <>
                                    <div className="add-work">
                                        <input 
                                            type="url" 
                                            placeholder="Add a link to your work (optional)" 
                                            value={attachmentUrl}
                                            onChange={(e) => setAttachmentUrl(e.target.value)}
                                            className="attachment-input"
                                        />
                                    </div>
                                    <button 
                                        className="turn-in-btn" 
                                        onClick={handleTurnIn}
                                        disabled={submitting}
                                    >
                                        {submitting ? 'Turning in...' : (assignment.submission ? 'Resubmit' : 'Turn in')}
                                    </button>
                                </>
                            ) : (
                                <div className="graded-message">
                                    This assignment has been graded and cannot be resubmitted.
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AssignmentDetailModal;
