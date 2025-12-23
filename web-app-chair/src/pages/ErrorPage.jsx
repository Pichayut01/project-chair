// src/pages/ErrorPage.jsx

import React from 'react';
import '../CSS/Navbar.css';
import '../CSS/Main.css';
import '../CSS/ErrorPage.css';
import { FiAlertTriangle, FiRefreshCw, FiHome, FiMenu } from 'react-icons/fi';

const ErrorPage = ({ 
    user, 
    isSidebarOpen, 
    toggleSidebar, 
    handleSignOut, 
    error, 
    onRetry, 
    onGoHome,
    classrooms = []
}) => {
    // Generate error code based on error type or timestamp
    const generateErrorCode = () => {
        if (error?.name) {
            return `ERR_${error.name.toUpperCase()}_${Date.now().toString().slice(-6)}`;
        }
        return `ERR_UNKNOWN_${Date.now().toString().slice(-6)}`;
    };

    const errorCode = generateErrorCode();

    const handleHomeClick = () => {
        if (onGoHome) {
            onGoHome();
        } else {
            window.location.href = '/';
        }
    };

    const handleRetryClick = () => {
        if (onRetry) {
            onRetry();
        } else {
            window.location.reload();
        }
    };

    return (
        <div className="error-page-fullscreen">
                <div className="error-page-container">
                    <div className="error-content">
                        <div className="error-icon">
                            <FiAlertTriangle size={64} />
                        </div>
                        
                        <h1 className="error-title">Something went wrong</h1>
                        
                        <p className="error-description">
                            We're sorry, but an unexpected error occurred. 
                            Our team has been notified and is working to fix this issue.
                        </p>
                        
                        <div className="error-code-container">
                            <span className="error-code-label">Error Code:</span>
                            <code className="error-code">{errorCode}</code>
                        </div>
                        
                        {process.env.NODE_ENV === 'development' && error && (
                            <details className="error-details">
                                <summary>Technical Details (Development Only)</summary>
                                <pre className="error-stack">
                                    {error.toString()}
                                    {error.stack && `\n\nStack Trace:\n${error.stack}`}
                                </pre>
                            </details>
                        )}
                        
                        <div className="error-actions">
                            <button 
                                className="error-btn primary"
                                onClick={handleRetryClick}
                            >
                                <FiRefreshCw />
                                Try Again
                            </button>
                            
                            <button 
                                className="error-btn secondary"
                                onClick={handleHomeClick}
                            >
                                <FiHome />
                                Go to Dashboard
                            </button>
                        </div>
                        
                        <div className="error-help">
                            <p>If this problem persists, please contact our support team with the error code above.</p>
                        </div>
                    </div>
                </div>
        </div>
    );
};

export default ErrorPage;
