// src/component/StudentRatingModal.jsx

import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import '../CSS/StudentRatingModal.css';

const StudentRatingModal = ({ isOpen, onClose, onRate, studentName, ratePresets }) => {
    const [selectedPreset, setSelectedPreset] = useState(null);

    useEffect(() => {
        if (!isOpen) {
            setSelectedPreset(null);
        }
    }, [isOpen]);

    const handleRate = () => {
        if (selectedPreset) {
            onRate(selectedPreset);
            onClose();
        }
    };

    // Handle direct preset click (apply immediately)
    const handleDirectRate = (preset) => {
        onRate(preset);
        onClose();
    };

    if (!isOpen) return null;

    // Separate positive and negative presets
    const positivePresets = ratePresets.filter(preset =>
        preset.type === 'positive' || preset.scoreType === 'add'
    );
    const negativePresets = ratePresets.filter(preset =>
        preset.type === 'negative' || preset.scoreType === 'subtract'
    );

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="student-rating-modal" onClick={(e) => e.stopPropagation()}>
                <div className="rating-modal-header">
                    <div className="rating-header-text">
                        <h2>Rate <span>{studentName}</span></h2>
                        <p>Select a rating to apply instantly</p>
                    </div>
                    <button className="rating-close-btn" onClick={onClose}>
                        <FiX size={24} />
                    </button>
                </div>

                <div className="rating-modal-content">
                    {ratePresets.length === 0 ? (
                        <div className="no-presets-state">
                            <span className="no-presets-emoji">📝</span>
                            <p>No rating presets found</p>
                            <small>Create presets in the "Assign Rate" menu</small>
                        </div>
                    ) : (
                        <div className="rating-presets-grid-wrapper">
                            {positivePresets.length > 0 && (
                                <div className="rating-section positive">
                                    <div className="section-label">
                                        <span className="dot positive"></span> Positive
                                    </div>
                                    <div className="rating-grid">
                                        {positivePresets.map((preset) => (
                                            <button
                                                key={preset._id}
                                                className="rating-btn positive"
                                                onClick={() => handleDirectRate(preset)}
                                            >
                                                <span className="rating-emoji">{preset.emoji}</span>
                                                <div className="rating-info">
                                                    <span className="rating-name">{preset.name}</span>
                                                    <span className="rating-score">+{preset.scoreValue}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {negativePresets.length > 0 && (
                                <div className="rating-section negative">
                                    <div className="section-label">
                                        <span className="dot negative"></span> Needs Improvement
                                    </div>
                                    <div className="rating-grid">
                                        {negativePresets.map((preset) => (
                                            <button
                                                key={preset._id}
                                                className="rating-btn negative"
                                                onClick={() => handleDirectRate(preset)}
                                            >
                                                <span className="rating-emoji">{preset.emoji}</span>
                                                <div className="rating-info">
                                                    <span className="rating-name">{preset.name}</span>
                                                    <span className="rating-score subtract">-{preset.scoreValue}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentRatingModal;
