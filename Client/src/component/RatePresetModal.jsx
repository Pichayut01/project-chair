// src/component/RatePresetModal.jsx

import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import '../CSS/RatePresetModal.css';

const RatePresetModal = ({ isOpen, onClose, onSave, preset }) => {
    const [formData, setFormData] = useState({
        name: '',
        emoji: '😊',
        type: 'positive',
        notifyStudent: true,
        scoreType: 'add',
        scoreValue: 1
    });

    const emojiOptions = [
        '😊', '😃', '🎉', '👍', '⭐', '🏆', '💯', '🔥',
        '😔', '😞', '👎', '❌', '⚠️', '💔', '😴', '🤔'
    ];

    useEffect(() => {
        if (preset) {
            setFormData({
                name: preset.name || '',
                emoji: preset.emoji || '😊',
                type: preset.type || 'positive',
                notifyStudent: preset.notifyStudent !== undefined ? preset.notifyStudent : true,
                scoreType: preset.scoreType || 'add',
                scoreValue: preset.scoreValue || 1
            });
        } else {
            setFormData({
                name: '',
                emoji: '😊',
                type: 'positive',
                notifyStudent: true,
                scoreType: 'add',
                scoreValue: 1
            });
        }
    }, [preset, isOpen]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        const newValue = type === 'checkbox' ? checked : value;
        
        setFormData(prev => {
            const updated = {
                ...prev,
                [name]: newValue
            };
            
            // Auto-sync type and scoreType
            if (name === 'type') {
                updated.scoreType = value === 'negative' ? 'subtract' : 'add';
            } else if (name === 'scoreType') {
                updated.type = value === 'subtract' ? 'negative' : 'positive';
            }
            
            return updated;
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            alert('Please enter a name for the rating preset');
            return;
        }
        if (formData.scoreValue < 1 || formData.scoreValue > 100) {
            alert('Score value must be between 1 and 100');
            return;
        }
        onSave(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="rate-preset-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{preset ? 'Edit Rate Preset' : 'Create New Rate Preset'}</h2>
                    <button className="close-btn" onClick={onClose}>
                        <FiX size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    {/* 1. ชื่อคะแนน */}
                    <div className="form-group">
                        <label htmlFor="name">Rating Name *</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder="e.g., Good Participation, Late Arrival"
                            required
                        />
                    </div>

                    {/* 2. เลือก Emoji */}
                    <div className="form-group">
                        <label>Select Emoji</label>
                        <div className="emoji-grid">
                            {emojiOptions.map((emoji) => (
                                <button
                                    key={emoji}
                                    type="button"
                                    className={`emoji-option ${formData.emoji === emoji ? 'selected' : ''}`}
                                    onClick={() => setFormData(prev => ({ ...prev, emoji }))}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 3. เลือกประเภท positive/negative */}
                    <div className="form-group">
                        <label>Rating Type</label>
                        <div className="radio-group">
                            <label className="radio-option">
                                <input
                                    type="radio"
                                    name="type"
                                    value="positive"
                                    checked={formData.type === 'positive'}
                                    onChange={handleInputChange}
                                />
                                <span className="radio-label positive">✓ Positive</span>
                            </label>
                            <label className="radio-option">
                                <input
                                    type="radio"
                                    name="type"
                                    value="negative"
                                    checked={formData.type === 'negative'}
                                    onChange={handleInputChange}
                                />
                                <span className="radio-label negative">✗ Negative</span>
                            </label>
                        </div>
                    </div>

                    {/* 4. แจ้งเตือนผู้เรียนไหม */}
                    <div className="form-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                name="notifyStudent"
                                checked={formData.notifyStudent}
                                onChange={handleInputChange}
                            />
                            <span>Notify Student</span>
                            <small>Send notification to student when this rating is assigned</small>
                        </label>
                    </div>

                    {/* 5. คะแนนที่ได้ */}
                    <div className="form-group">
                        <label>Score Points</label>
                        <div className="score-group">
                            <div className="score-type">
                                <select
                                    name="scoreType"
                                    value={formData.scoreType}
                                    onChange={handleInputChange}
                                >
                                    <option value="add">Add Points (+)</option>
                                    <option value="subtract">Subtract Points (-)</option>
                                </select>
                            </div>
                            <div className="score-value">
                                <input
                                    type="number"
                                    name="scoreValue"
                                    value={formData.scoreValue}
                                    onChange={handleInputChange}
                                    min="1"
                                    max="100"
                                    required
                                />
                                <span>points</span>
                            </div>
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="cancel-btn" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="save-btn">
                            {preset ? 'Update Preset' : 'Create Preset'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RatePresetModal;
