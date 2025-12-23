// src/component/JoinClassModal.jsx

import React, { useState } from 'react';
import '../CSS/Modal.css';
import axios from 'axios';

const JoinClassModal = ({ onClose, onClassJoined, user }) => {
    const [classCode, setClassCode] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!user || !user.token) {
            setError("Please log in to join a class.");
            return;
        }

        try {
            const response = await axios.post('http://localhost:5000/api/classrooms/join', { classCode }, {
                headers: {
                    'x-auth-token': user.token,
                },
            });

            const joinedClass = response.data.class;

            onClassJoined(joinedClass.name);
            onClose();

        } catch (err) {
            console.error("Error joining class:", err);
            setError(err.response?.data?.msg || "Failed to join class. Please check the code.");
        }
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <button className="modal-close-button" onClick={onClose}>&times;</button>
                <h2>Join Class</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Class Code</label>
                        <input
                            type="text"
                            value={classCode}
                            onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                            required
                        />
                    </div>
                    {error && <p className="error-message">{error}</p>}
                    <button type="submit" className="modal-action-button">Join</button>
                </form>
            </div>
        </div>
    );
};

export default JoinClassModal;