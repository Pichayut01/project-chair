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
        scoreValue: 5
    });

    const emojiOptions = [
        '😊', '😃', '🎉', '👍', '⭐', '🏆', '💯', '🔥',
        '💡', '📚', '🚀', '🎨', '⚽', '🎵', '🧩', '💻',
        '😔', '😞', '👎', '❌', '⚠️', '💔', '😴', '🤔',
        '🚧', '⏳', '📝', '🔊', '🧹', '🥪', '🥤', '🎒'
    ];

    useEffect(() => {
        if (preset) {
            setFormData({
                name: preset.name || '',
                emoji: preset.emoji || '😊',
                type: preset.type || 'positive',
                notifyStudent: preset.notifyStudent !== undefined ? preset.notifyStudent : true,
                scoreType: preset.scoreType || 'add',
                scoreValue: preset.scoreValue || 5
            });
        } else {
            setFormData({
                name: '',
                emoji: '😊',
                type: 'positive',
                notifyStudent: true,
                scoreType: 'add',
                scoreValue: 5
            });
        }
    }, [preset, isOpen]);

    const handleInputChange = (field, value) => {
        setFormData(prev => {
            const updated = { ...prev, [field]: value };

            // Auto-sync type and scoreType
            if (field === 'type') {
                updated.scoreType = value === 'negative' ? 'subtract' : 'add';
            }

            return updated;
        });
    };

    const handleScoreChange = (e) => {
        let val = parseInt(e.target.value, 10);
        if (isNaN(val)) val = 0;
        if (val < 0) val = 0;
        if (val > 100) val = 100;
        handleInputChange('scoreValue', val);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            return;
        }
        onSave(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="rate-preset-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="header-text">
                        <h2>{preset ? 'Edit Preset' : 'New Preset'}</h2>
                        <p>Customize student feedback options</p>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <FiX size={24} />
                    </button>
                </div>

                <div className="modal-body">
                    <div className="modal-content-grid">
                        {/* Left Column: Input & Emoji */}
                        <div className="modal-column left">
                            <div className="form-group">
                                <label>Preset Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    placeholder="e.g. Great Job, Late"
                                    className="input-primary"
                                    autoFocus
                                />
                            </div>

                            <div className="form-group">
                                <label>Icon</label>
                                <div className="emoji-picker-container">
                                    <div className="emoji-grid">
                                        {emojiOptions.map((emoji) => (
                                            <button
                                                key={emoji}
                                                type="button"
                                                className={`emoji-btn ${formData.emoji === emoji ? 'selected' : ''}`}
                                                onClick={() => handleInputChange('emoji', emoji)}
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Settings & Prevention */}
                        <div className="modal-column right">
                            <label>Feedback Type</label>
                            <div className="type-toggle-group">
                                <button
                                    type="button"
                                    className={`type-card positive ${formData.type === 'positive' ? 'active' : ''}`}
                                    onClick={() => handleInputChange('type', 'positive')}
                                >
                                    <div className="type-icon">👍</div>
                                    <div className="type-info">
                                        <span className="type-title">Positive</span>
                                        <span className="type-desc">Rewards good behavior</span>
                                    </div>
                                </button>
                                <button
                                    type="button"
                                    className={`type-card negative ${formData.type === 'negative' ? 'active' : ''}`}
                                    onClick={() => handleInputChange('type', 'negative')}
                                >
                                    <div className="type-icon">👎</div>
                                    <div className="type-info">
                                        <span className="type-title">Needs Improv.</span>
                                        <span className="type-desc">Disciplines behavior</span>
                                    </div>
                                </button>
                            </div>

                            <div className="form-group score-wrapper">
                                <label>Score Impact</label>
                                <div className="score-control">
                                    <button
                                        type="button"
                                        className="score-adj-btn"
                                        onClick={() => handleInputChange('scoreValue', Math.max(1, formData.scoreValue - 1))}
                                    >−</button>

                                    <div className={`preset-score-display ${formData.type}`}>
                                        <span className="score-sign">{formData.type === 'positive' ? '+' : '-'}</span>
                                        <input
                                            type="number"
                                            value={formData.scoreValue}
                                            onChange={(e) => {
                                                const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                                                handleInputChange('scoreValue', val);
                                            }}
                                            onBlur={() => {
                                                // Ensure at least 1 on blur
                                                if (formData.scoreValue === '' || formData.scoreValue < 1) handleInputChange('scoreValue', 1);
                                            }}
                                            className="score-input-seamless"
                                        />
                                    </div>

                                    <button
                                        type="button"
                                        className="score-adj-btn"
                                        onClick={() => handleInputChange('scoreValue', Math.min(100, (formData.scoreValue || 0) + 1))}
                                    >+</button>
                                </div>
                            </div>

                            <div className="form-group toggle-wrapper">
                                <label className="toggle-label">
                                    <div className="toggle-text">
                                        <span>Notify Student</span>
                                        <small>Show popup on student screen</small>
                                    </div>
                                    <div className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={formData.notifyStudent}
                                            onChange={(e) => handleInputChange('notifyStudent', e.target.checked)}
                                        />
                                        <span className="slider round"></span>
                                    </div>
                                </label>
                            </div>

                            {/* Live Preview */}
                            <div className="preview-box">
                                <span className="preview-label">Preview</span>
                                <div className={`preview-btn ${formData.type}`}>
                                    <span className="preview-emoji">{formData.emoji}</span>
                                    <div className="preview-info">
                                        <span className="preview-name">{formData.name || 'Title'}</span>
                                        <span className="preview-score">
                                            {formData.type === 'positive' ? '+' : '-'}{formData.scoreValue}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button type="button" className="btn-cancel" onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="btn-save"
                        onClick={handleSubmit}
                        disabled={!formData.name.trim()}
                    >
                        {preset ? 'Save Changes' : 'Create Preset'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RatePresetModal;
