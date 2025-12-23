// src/pages/ClassroomErrorPage.jsx

import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiAlertTriangle, FiArrowLeft, FiRefreshCw } from 'react-icons/fi';
import Navbar from '../component/Navbar';
import '../CSS/ClassroomErrorPage.css';

const ClassroomErrorPage = ({ 
    user, 
    isSidebarOpen, 
    toggleSidebar, 
    handleSignOut,
    errorMessage = "Failed to load classroom details."
}) => {
    const navigate = useNavigate();
    const { classroomId } = useParams();

    const handleGoBack = () => {
        navigate('/');
    };

    const handleRetry = () => {
        // Reload the current page
        window.location.reload();
    };

    const handleTryAgain = () => {
        // Navigate back to the classroom page to retry
        if (classroomId) {
            navigate(`/classroom/${classroomId}`);
        } else {
            window.location.reload();
        }
    };

    return (
        <>
            <Navbar
                isSidebarOpen={isSidebarOpen}
                toggleSidebar={toggleSidebar}
                user={user}
                handleSignOut={handleSignOut}
                isLoginPage={true}
            />
            
            <div className="classroom-error-container">
                <div className="classroom-error-content">
                    <div className="error-icon">
                        <FiAlertTriangle size={64} />
                    </div>
                    
                    <h1 className="error-title">Classroom Not Available</h1>
                    
                    <p className="error-description">
                        {errorMessage}
                    </p>

                    <div className="error-details">
                        <p><strong>Possible reasons:</strong></p>
                        <ul>
                            <li>The classroom may have been deleted</li>
                            <li>You may not have permission to access this classroom</li>
                            <li>There might be a temporary network issue</li>
                            <li>The classroom ID may be invalid</li>
                        </ul>
                    </div>

                    <div className="error-actions">
                        <button 
                            className="error-btn error-btn-primary" 
                            onClick={handleGoBack}
                        >
                            <FiArrowLeft size={18} />
                            <span>Go to Dashboard</span>
                        </button>
                        
                        <button 
                            className="error-btn error-btn-secondary" 
                            onClick={handleTryAgain}
                        >
                            <FiRefreshCw size={18} />
                            <span>Try Again</span>
                        </button>
                    </div>

                    <div className="error-help">
                        <p>
                            If you continue to experience issues, please contact your teacher 
                            or try refreshing the page.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ClassroomErrorPage;
