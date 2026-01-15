// src/component/TestErrorComponent.jsx
// Component สำหรับทดสอบ ErrorBoundary - ใช้เฉพาะในการพัฒนา

import React, { useState } from 'react';

const TestErrorComponent = () => {
    const [shouldThrow, setShouldThrow] = useState(false);

    if (shouldThrow) {
        throw new Error('This is a test error for ErrorBoundary');
    }

    return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h3>Error Boundary Test</h3>
            <p>Click the button below to test the error boundary:</p>
            <button 
                onClick={() => setShouldThrow(true)}
                style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '1rem'
                }}
            >
                Throw Test Error
            </button>
        </div>
    );
};

export default TestErrorComponent;
