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
                <div className="modal-header">
                    <div className="header-content">
                        <h2>Rate {studentName}</h2>
                        <p className="header-subtitle">Click any rating to apply instantly</p>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <FiX size={20} />
                    </button>
                </div>

                <div className="modal-content">
                    {ratePresets.length === 0 ? (
                        <div className="no-presets">
                            <p>No rating presets available</p>
                        </div>
                    ) : (
                        <div className="presets-container">
                            {positivePresets.length > 0 && (
                                <div className="preset-group positive-group">
                                    <div className="group-header positive">
                                        <span className="group-icon">👍</span>
                                        <span className="group-title">Positive</span>
                                    </div>
                                    <div className="preset-buttons">
                                        {positivePresets.map((preset) => (
                                            <button
                                                key={preset._id}
                                                className="preset-btn positive"
                                                onClick={() => handleDirectRate(preset)}
                                                title={`${preset.name}: ${preset.scoreType === 'add' ? '+' : '-'}${preset.scoreValue} HP`}
                                            >
                                                <span className="btn-emoji">{preset.emoji || '⭐'}</span>
                                                <div className="btn-content">
                                                    <span className="btn-name">{preset.name}</span>
                                                    <span className="btn-score">
                                                        {preset.scoreType === 'add' ? '+' : '-'}{preset.scoreValue}
                                                    </span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {negativePresets.length > 0 && (
                                <div className="preset-group negative-group">
                                    <div className="group-header negative">
                                        <span className="group-icon">👎</span>
                                        <span className="group-title">Negative</span>
                                    </div>
                                    <div className="preset-buttons">
                                        {negativePresets.map((preset) => (
                                            <button
                                                key={preset._id}
                                                className="preset-btn negative"
                                                onClick={() => handleDirectRate(preset)}
                                                title={`${preset.name}: ${preset.scoreType === 'add' ? '+' : '-'}${preset.scoreValue} HP`}
                                            >
                                                <span className="btn-emoji">{preset.emoji || '⚠️'}</span>
                                                <div className="btn-content">
                                                    <span className="btn-name">{preset.name}</span>
                                                    <span className="btn-score">
                                                        {preset.scoreType === 'add' ? '+' : '-'}{preset.scoreValue}
                                                    </span>
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
