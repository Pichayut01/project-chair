import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import CreateAssignmentModal from './CreateAssignmentModal';
import AssignmentDetailModal from './AssignmentDetailModal';
import { FaPlus, FaClipboardList } from 'react-icons/fa';
import '../CSS/ClassworkSection.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const ClassworkSection = ({ classId, user, isCreator }) => {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState(null);

    const fetchAssignments = useCallback(async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE_URL}/api/classwork/${classId}`, {
                headers: { 'x-auth-token': user.token }
            });
            setAssignments(res.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching assignments:', err);
            setError('Failed to load assignments.');
            setLoading(false);
        }
    }, [classId, user]);

    useEffect(() => {
        fetchAssignments();
    }, [fetchAssignments]);

    const handleAssignmentCreated = (newAssignment) => {
        setAssignments(prev => [newAssignment, ...prev]);
    };

    const handleAssignmentClick = (assignment) => {
        setSelectedAssignment(assignment);
    };

    const handleAssignmentUpdate = (updatedAssignment) => {
        setAssignments(prev => prev.map(a => a._id === updatedAssignment._id ? updatedAssignment : a));
    };

    if (loading) {
        return <div className="classwork-loader">Loading classwork...</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    return (
        <div className="classwork-section">
            <div className="classwork-header">
                <h2>Classwork</h2>
                {isCreator && (
                    <button className="create-btn" onClick={() => setIsCreateModalOpen(true)}>
                        <FaPlus /> Create
                    </button>
                )}
            </div>

            <div className="classwork-list">
                {assignments.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon"><FaClipboardList /></div>
                        <h3>This is where you'll assign work</h3>
                        <p>You can add assignments and other work for the class, then organize it into topics</p>
                    </div>
                ) : (
                    assignments.map((assignment) => {
                        const isStudent = !isCreator;
                        let statusText = '';
                        let statusClass = '';

                        if (isStudent && assignment.submission) {
                            if (assignment.submission.status === 'graded') {
                                statusText = `Graded: ${assignment.submission.pointsAwarded}/${assignment.points}`;
                                statusClass = 'status-graded';
                            } else if (assignment.submission.status === 'late') {
                                statusText = 'Done late';
                                statusClass = 'status-late';
                            } else {
                                statusText = 'Turned in';
                                statusClass = 'status-submitted';
                            }
                        } else if (isStudent) {
                            const isLate = assignment.dueDate && new Date() > new Date(assignment.dueDate);
                            statusText = isLate ? 'Missing' : 'Assigned';
                            statusClass = isLate ? 'status-missing' : 'status-assigned';
                        }

                        return (
                            <div 
                                key={assignment._id} 
                                className="assignment-card"
                                onClick={() => handleAssignmentClick(assignment)}
                            >
                                <div className="assignment-icon">
                                    <FaClipboardList />
                                </div>
                                <div className="assignment-info">
                                    <h4>{assignment.title}</h4>
                                    {assignment.dueDate && (
                                        <span className="due-date">
                                            Due {new Date(assignment.dueDate).toLocaleDateString()} {new Date(assignment.dueDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                    )}
                                </div>
                                {isStudent && (
                                    <div className={`assignment-status ${statusClass}`}>
                                        {statusText}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            <CreateAssignmentModal 
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                classId={classId}
                user={user}
                onAssignmentCreated={handleAssignmentCreated}
            />

            {selectedAssignment && (
                <AssignmentDetailModal
                    isOpen={!!selectedAssignment}
                    onClose={() => setSelectedAssignment(null)}
                    assignment={selectedAssignment}
                    classId={classId}
                    user={user}
                    isCreator={isCreator}
                    onUpdate={handleAssignmentUpdate}
                />
            )}
        </div>
    );
};

export default ClassworkSection;
