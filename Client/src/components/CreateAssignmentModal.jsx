import React, { useState } from 'react';
import axios from 'axios';
import '../CSS/CreateAssignmentModal.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const CreateAssignmentModal = ({ isOpen, onClose, classId, user, onAssignmentCreated }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [points, setPoints] = useState(100);
    const [allowLateSubmission, setAllowLateSubmission] = useState(false);
    const [showScoreToStudents, setShowScoreToStudents] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!title.trim()) {
            setError('Title is required');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await axios.post(`${API_BASE_URL}/api/classwork/${classId}`, {
                title,
                description,
                dueDate: dueDate || null,
                points,
                allowLateSubmission,
                showScoreToStudents
            }, {
                headers: { 'x-auth-token': user.token }
            });

            onAssignmentCreated(res.data);
            handleClose();
        } catch (err) {
            console.error('Error creating assignment:', err);
            setError(err.response?.data?.msg || 'Failed to create assignment');
            setLoading(false);
        }
    };

    const handleClose = () => {
        setTitle('');
        setDescription('');
        setDueDate('');
        setPoints(100);
        setAllowLateSubmission(false);
        setShowScoreToStudents(true);
        setError(null);
        setLoading(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content create-assignment-modal">
                <h2>Create Assignment</h2>
                {error && <div className="error-message">{error}</div>}
                
                <form onSubmit={handleSubmit} className="assignment-form">
                    <div className="form-group">
                        <label>Title (required)</label>
                        <input 
                            type="text" 
                            name="title"
                            value={title} 
                            onChange={(e) => setTitle(e.target.value)} 
                            placeholder="Assignment title"
                            required 
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>Instructions (optional)</label>
                        <textarea 
                            name="description"
                            value={description} 
                            onChange={(e) => setDescription(e.target.value)} 
                            placeholder="Instructions"
                            rows="4"
                        />
                    </div>
                    
                    <div className="form-row">
                        <div className="form-group half">
                            <label>Due</label>
                            <input 
                                type="datetime-local" 
                                name="dueDate"
                                value={dueDate} 
                                onChange={(e) => setDueDate(e.target.value)} 
                            />
                        </div>
                        <div className="form-group half">
                            <label>Points</label>
                            <input 
                                type="number" 
                                name="points"
                                value={points} 
                                onChange={(e) => setPoints(Number(e.target.value))} 
                                min="0"
                            />
                        </div>
                    </div>

                    <div className="form-group checkbox-group">
                        <label className="checkbox-label">
                            <input 
                                type="checkbox" 
                                checked={allowLateSubmission} 
                                onChange={(e) => setAllowLateSubmission(e.target.checked)} 
                            />
                            Allow late submissions
                        </label>
                    </div>

                    <div className="form-group checkbox-group">
                        <label className="checkbox-label">
                            <input 
                                type="checkbox" 
                                checked={showScoreToStudents} 
                                onChange={(e) => setShowScoreToStudents(e.target.checked)} 
                            />
                            Show score to students after grading
                        </label>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="cancel-btn" onClick={handleClose} disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="primary-btn" disabled={loading}>
                            {loading ? 'Assigning...' : 'Assign'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateAssignmentModal;
