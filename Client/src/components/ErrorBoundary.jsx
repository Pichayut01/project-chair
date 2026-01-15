// src/component/ErrorBoundary.jsx

import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // Log error details
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        
        this.setState({
            error: error,
            errorInfo: errorInfo
        });

        // You can also log the error to an error reporting service here
        // logErrorToService(error, errorInfo);
    }

    handleRetry = () => {
        // Reset error state
        this.setState({ hasError: false, error: null, errorInfo: null });
        
        // Reload the page as a fallback
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            // Render custom error UI with the same layout structure
            return this.props.fallback ? 
                this.props.fallback(this.state.error, this.handleRetry) : 
                this.renderDefaultError();
        }

        return this.props.children;
    }

    renderDefaultError() {
        return (
            <div style={{ 
                padding: '2rem', 
                textAlign: 'center',
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column'
            }}>
                <h2>Something went wrong</h2>
                <p>An unexpected error occurred. Please try again.</p>
                <button 
                    onClick={this.handleRetry}
                    style={{
                        padding: '0.75rem 1.5rem',
                        backgroundColor: '#6b7280',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        marginTop: '1rem'
                    }}
                >
                    Try Again
                </button>
            </div>
        );
    }
}

export default ErrorBoundary;
