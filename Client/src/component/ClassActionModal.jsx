// src/component/ClassActionModal.jsx

import React, { useState } from 'react';
import '../CSS/Modal.css';
import CreateClassModal from './CreateClassModal';
import JoinClassModal from './JoinClassModal';

const ClassActionModal = ({ onClose, onClassCreated, onClassJoined, user, initialMode = null }) => {
    const [mode, setMode] = useState(initialMode);

    const handleCreateClick = () => {
        setMode('create');
    };

    const handleJoinClick = () => {
        setMode('join');
    };

    if (mode === 'create') {
        return <CreateClassModal onClose={onClose} onClassCreated={onClassCreated} user={user} />;
    }

    if (mode === 'join') {
        return <JoinClassModal onClose={onClose} onClassJoined={onClassJoined} user={user} />;
    }

    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <button className="modal-close-button" onClick={onClose}>&times;</button>
                <div className="modal-options">
                    <button className="modal-option-button" onClick={handleCreateClick}>
                        <i className="fa-solid fa-plus icon"></i>
                        <span>Create class</span>
                    </button>
                    <button className="modal-option-button" onClick={handleJoinClick}>
                        <i className="fa-solid fa-user-plus icon"></i>
                        <span>Join class</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ClassActionModal;