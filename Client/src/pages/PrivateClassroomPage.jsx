// src/pages/PrivateClassroomPage.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../component/Navbar';
import Loader from '../component/Loader';
import '../CSS/Navbar.css';
import '../CSS/Main.css';
import '../CSS/PrivateClassroomPage.css';
import { FiLock, FiMail, FiArrowLeft } from 'react-icons/fi';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const PrivateClassroomPage = ({ 
    user, 
    isSidebarOpen, 
    toggleSidebar, 
    handleSignOut
}) => {
    const { classroomId } = useParams();
    const navigate = useNavigate();
    const [classrooms, setClassrooms] = useState([]);
    const [classroomInfo, setClassroomInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchClassroomInfo();
        fetchUserClassrooms();
    }, [classroomId, user]);

    const fetchClassroomInfo = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/classrooms/${classroomId}/info`, {
                headers: {
                    'x-auth-token': user.token,
                },
            });
            setClassroomInfo(response.data);
        } catch (error) {
            console.error('Error fetching classroom info:', error);
            setError('Failed to load classroom information');
        } finally {
            setLoading(false);
        }
    };

    const fetchUserClassrooms = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/classrooms`, {
                headers: {
                    'x-auth-token': user.token,
                },
            });
            setClassrooms(response.data);
        } catch (error) {
            console.error('Error fetching classrooms:', error);
        }
    };

    const handleGoBack = () => {
        navigate('/');
    };

    const handleRequestAccess = async () => {
        try {
            await axios.post(`${API_BASE_URL}/api/classrooms/${classroomId}/request-access`, {}, {
                headers: {
                    'x-auth-token': user.token,
                },
            });
            alert('Access request sent successfully! You will be notified when the request is approved.');
        } catch (error) {
            console.error('Error requesting access:', error);
            alert('Failed to send access request. Please try again.');
        }
    };

    if (loading) {
        return <Loader />;
    }

    return (
        <>
            <Navbar
                isSidebarOpen={isSidebarOpen}
                toggleSidebar={toggleSidebar}
                user={user}
                handleSignOut={handleSignOut}
                classrooms={classrooms}
            />
            
            <main className={`main__content ${isSidebarOpen ? 'shift' : ''}`}>
                <div className="private-classroom-container">
                    <div className="private-classroom-content">
                        <div className="private-icon">
                            <FiLock size={64} />
                        </div>
                        
                        <h1 className="private-title">Private Classroom</h1>
                        
                        <p className="private-description">
                            This classroom is private and requires an invitation to access.
                        </p>
                        
                        {classroomInfo && (
                            <div className="classroom-info">
                                <h2 className="classroom-name">{classroomInfo.name}</h2>
                                <p className="classroom-id">Classroom ID: {classroomId}</p>
                                {classroomInfo.description && (
                                    <p className="classroom-description">{classroomInfo.description}</p>
                                )}
                            </div>
                        )}
                        
                        {error && (
                            <div className="error-message">
                                <p>{error}</p>
                            </div>
                        )}
                        
                        <div className="private-actions">
                            <button 
                                className="private-btn primary"
                                onClick={handleRequestAccess}
                            >
                                <FiMail />
                                Request Access
                            </button>
                            
                            <button 
                                className="private-btn secondary"
                                onClick={handleGoBack}
                            >
                                <FiArrowLeft />
                                Go Back
                            </button>
                        </div>
                        
                        <div className="private-help">
                            <p>
                                If you believe you should have access to this classroom, 
                                please contact the classroom creator or request an invitation.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
};

export default PrivateClassroomPage;
