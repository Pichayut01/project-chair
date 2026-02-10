import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../CSS/ClassroomEvent.css';
import WordCloudViz from './events/WordCloudViz';
import { FaPlus, FaTrash, FaImage, FaTimes, FaHandPaper, FaExternalLinkAlt } from 'react-icons/fa';
import { getProfileImageSrc, isGoogleUser } from '../utils/profileImageHelper';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const ClassroomEvent = ({ isCreator, events = [], onAddEvent, onTriggerEvent, onDeleteEvent, onSubmitAnswer, candidates = [], currentUser }) => {
    const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    const [selectedConfigType, setSelectedConfigType] = useState(null);
    const [studentCountInput, setStudentCountInput] = useState(1);
    const [configError, setConfigError] = useState('');
    const [questionTextInput, setQuestionTextInput] = useState('');
    const [pollOptions, setPollOptions] = useState(['', '']);
    // ✨ Scoring Config State
    const [isScored, setIsScored] = useState(false);
    // Remove global scorePoints/scoreAction
    // Add per-option score state: parallel array of objects { points: 10, action: 'add' }
    const [optionScores, setOptionScores] = useState([{ points: 10, action: 'add' }, { points: 10, action: 'add' }]);

    // ✨ Image Upload State
    const [selectedImage, setSelectedImage] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    // ✨ Word Cloud Config
    const [cloudTopic, setCloudTopic] = useState('');

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await axios.post(`${API_BASE_URL}/api/upload`, formData); // Let Axios set Content-Type
            setSelectedImage(res.data.url);
        } catch (err) {
            console.error('Upload failed:', err);
            setConfigError('Failed to upload image.');
        } finally {
            setIsUploading(false);
            // Reset file input value?
            e.target.value = null;
        }
    };

    // ✨ Masonry Logic: Determine columns
    const [numCols, setNumCols] = useState(3);
    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            if (width <= 768) setNumCols(1);
            else if (width <= 1200) setNumCols(2);
            else setNumCols(3);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // ✨ Prepare data for Maonsry
    const allItems = [];
    if (isCreator) {
        allItems.push({ type: 'add-card', id: 'add-event-btn' });
    }
    events.forEach(e => allItems.push({ type: 'event', ...e }));

    const distributedColumns = Array.from({ length: numCols }, () => []);
    allItems.forEach((item, index) => {
        distributedColumns[index % numCols].push(item);
    });

    const handleAddEventClick = () => {
        setIsAddEventModalOpen(true);
    };

    const handleSelectEvent = (config) => {
        setIsAddEventModalOpen(false);
        onAddEvent(config);
    };

    const openConfigModal = (type) => {
        setSelectedConfigType(type);
        setStudentCountInput(1);
        setQuestionTextInput('');
        setPollOptions(['', '']);
        // Reset Scoring State
        setIsScored(false);
        setOptionScores([{ points: 10, action: 'add' }, { points: 10, action: 'add' }]);
        setConfigError('');
        setSelectedImage(null); // ✨ Reset Image
        setCloudTopic(''); // ✨ Reset Word Cloud Topic
        setIsConfigModalOpen(true);
        setIsAddEventModalOpen(false);
    };

    const handleConfigSubmit = () => {
        if (selectedConfigType === 'random') {
            const count = parseInt(studentCountInput);
            const max = candidates.length > 0 ? candidates.length : 1;

            if (isNaN(count) || count < 1) {
                setConfigError('Please enter a valid number (minimum 1).');
                return;
            }
            if (count > max) {
                setConfigError(`Cannot select more than ${max} student(s).`);
                return;
            }

            handleSelectEvent({ type: 'random', count: count });
            setIsConfigModalOpen(false);
        } else if (selectedConfigType === 'question') {
            if (!questionTextInput.trim()) {
                setConfigError('Please enter a question.');
                return;
            }

            handleSelectEvent({ type: 'question', questionText: questionTextInput, imageUrl: selectedImage });
            setIsConfigModalOpen(false);
        } else if (selectedConfigType === 'poll') {
            const validOptions = pollOptions.filter(opt => opt.trim() !== '');
            if (!questionTextInput.trim()) {
                setConfigError('Please enter a question.');
                return;
            }
            if (validOptions.length < 2) {
                setConfigError('Please provide at least 2 options.');
                return;
            }

            // If scored, we don't strictly require "correct options" anymore since points define value,
            // BUT maybe user wants to mark "correct" for visual feedback? 
            // The user request emphasizes "points per option". Let's assume points > 0 implies value.
            // Or maybe just use points.
            
            // Construct options with points
            // We need to map valid options to their scores.
            // Since we filter out empty options, we need to be careful with indices.
            // Let's filter both arrays together.
            
            const validOptionsWithScores = pollOptions
                .map((text, idx) => ({ text, ...optionScores[idx] }))
                .filter(opt => opt.text.trim() !== '');

            if (validOptionsWithScores.length < 2) {
                setConfigError('Please provide at least 2 options.');
                return;
            }

            handleSelectEvent({
                type: 'poll',
                questionText: questionTextInput,
                imageUrl: selectedImage, // ✨ Add Image URL
                options: validOptionsWithScores.map(o => o.text), // For backward compat just sending text array as 'options'
                scoreConfig: isScored ? {
                    // Send map of text -> score details
                    // This assumes text is unique. If duplicates, only one score config will survive (but duplicates are bad anyway)
                    optionScores: validOptionsWithScores.reduce((acc, curr) => {
                        acc[curr.text] = { 
                            points: parseInt(curr.points) || 0, 
                            action: curr.action 
                        };
                        return acc;
                    }, {})
                } : null
            });
            setIsConfigModalOpen(false);
        } else if (selectedConfigType === 'wordcloud') {
            if (!cloudTopic.trim()) {
                setConfigError('Please enter a topic.');
                return;
            }
            handleSelectEvent({
                type: 'wordcloud',
                config: { topic: cloudTopic }
            });
            setIsConfigModalOpen(false);
        }
    };

    const handleAddOption = () => {
        setPollOptions([...pollOptions, '']);
        setOptionScores([...optionScores, { points: 10, action: 'add' }]);
    };

    const handleRemoveOption = (index) => {
        if (pollOptions.length > 2) {
            const newOptions = [...pollOptions];
            newOptions.splice(index, 1);
            setPollOptions(newOptions);
            
            const newScores = [...optionScores];
            newScores.splice(index, 1);
            setOptionScores(newScores);
        }
    };

    const handleOptionChange = (index, value) => {
        const newOptions = [...pollOptions];
        newOptions[index] = value;
        setPollOptions(newOptions);
    };

    const handleScoreChange = (index, field, value) => {
        const newScores = [...optionScores];
        newScores[index] = { ...newScores[index], [field]: value };
        setOptionScores(newScores);
    };

    return (
        <div className="classroom-event-container">
            {events.length === 0 ? (
                <div className="empty-event-state">
                    <div className="event-placeholder">
                        <h3>No events yet</h3>
                        <p>Create an event to engage with your students!</p>
                        <div className="event-illustration">🎈</div>
                    </div>
                    {isCreator && (
                        <div className="add-event-card" onClick={handleAddEventClick} style={{ marginTop: '20px', width: '200px', height: 'auto', minHeight: '150px' }}>
                            <div className="add-event-card-icon">
                                <FaPlus />
                            </div>
                            <span>Add Event</span>
                        </div>
                    )}
                </div>
            ) : (
                <div className="event-masonry-grid" style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', width: '100%' }}>
                    {distributedColumns.map((colItems, colIndex) => (
                        <div key={colIndex} className="masonry-column" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {colItems.map((item) => {
                                if (item.type === 'add-card') {
                                    return (
                                        <div key="add-event" className="add-event-card" onClick={handleAddEventClick} style={{ width: '100%' }}>
                                            <div className="add-event-card-icon">
                                                <FaPlus />
                                            </div>
                                            <span>Add Event</span>
                                        </div>
                                    );
                                }
                                const event = item;
                                return (
                                    <div key={event.id} className="event-card" style={{ width: '100%' }}>
                                        <div className="event-card-header">
                                            <h3>{event.title}</h3>
                                            {isCreator && onDeleteEvent && (
                                                <button
                                                    className="delete-event-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDeleteEvent(event);
                                                    }}
                                                    title="Delete Event"
                                                >
                                                    <FaTrash />
                                                </button>
                                            )}
                                        </div>
                                        <div className="event-card-body">
                                            <EventCardContent
                                                event={event}
                                                isCreator={isCreator}
                                                onTrigger={onTriggerEvent}
                                                onSubmitAnswer={onSubmitAnswer}
                                                currentUser={currentUser}
                                                candidates={candidates}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            )}

            {/* Event Type Selection Modal */}
            {isAddEventModalOpen && (
                <div className="event-modal-overlay" onClick={() => setIsAddEventModalOpen(false)}>
                    <div className="event-modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>Select an Event</h3>
                        <div className="event-options-grid">
                            <div
                                className="event-option-card"
                                onClick={() => openConfigModal('random')}
                            >
                                <div className="event-icon">🎲</div>
                                <span>Random Student</span>
                            </div>
                            <div
                                className="event-option-card"
                                onClick={() => handleSelectEvent({ type: 'buzz' })}
                            >
                                <div className="event-icon">🔴</div>
                                <span>Buzz Button</span>
                            </div>
                            <div
                                className="event-option-card"
                                onClick={() => openConfigModal('wordcloud')}
                            >
                                <div className="event-icon">☁️</div>
                                <span>Word Cloud</span>
                            </div>
                            <div
                                className="event-option-card"
                                onClick={() => openConfigModal('question')}
                            >
                                <div className="event-icon">❓</div>
                                <span>Ask Question</span>
                            </div>
                            <div
                                className="event-option-card"
                                onClick={() => openConfigModal('poll')}
                            >
                                <div className="event-icon">📊</div>
                                <span>Multiple Choice</span>
                            </div>
                        </div>
                        <button className="close-modal-btn" onClick={() => setIsAddEventModalOpen(false)}>
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Configuration Modal */}
            {isConfigModalOpen && (
                <div className="event-modal-overlay" onClick={() => setIsConfigModalOpen(false)}>
                    <div className="event-modal-content config-modal" onClick={(e) => e.stopPropagation()}>
                        <h3>
                            {selectedConfigType === 'random' && '🎲 Random Students'}
                            {selectedConfigType === 'question' && '❓ Ask Question'}
                            {selectedConfigType === 'poll' && '📊 Multiple Choice'}
                        </h3>

                        <div className="modal-body">
                            {selectedConfigType === 'random' && (
                                <div className="input-group">
                                    <label>Number of students to select:</label>
                                    <div className="number-input-wrapper">
                                        <button onClick={() => setStudentCountInput(prev => Math.max(1, prev - 1))}>-</button>
                                        <input
                                            type="number"
                                            value={studentCountInput}
                                            onChange={(e) => setStudentCountInput(parseInt(e.target.value) || '')}
                                            min="1"
                                            max={candidates.length}
                                        />
                                        <button onClick={() => setStudentCountInput(prev => Math.min(candidates.length, prev + 1))}>+</button>
                                    </div>
                                    <p className="input-helper">Max available: {candidates.length}</p>
                                </div>
                            )}

                            {selectedConfigType === 'question' && (
                                <>
                                    <div className="input-group">
                                        <label>Your Question:</label>
                                        <textarea
                                            className="modal-textarea"
                                            value={questionTextInput}
                                            onChange={(e) => setQuestionTextInput(e.target.value)}
                                            placeholder="Type your question here..."
                                            rows="3"
                                        />
                                    </div>
                                    {/* ✨ Image Upload UI (Question) */}
                                    <div className="input-group">
                                        <label>Attachment (Optional):</label>
                                        <div className="file-upload-wrapper">
                                            <input 
                                                type="file" 
                                                accept="image/*" 
                                                onChange={handleImageUpload}
                                                id="question-image-upload"
                                                className="file-input-hidden" 
                                                style={{ display: 'none' }}
                                            />
                                            <label htmlFor="question-image-upload" className="file-upload-btn">
                                                {isUploading ? 'Uploading...' : <><FaImage /> Add Image</>}
                                            </label>
                                            {selectedImage && (
                                                <div className="image-preview-container">
                                                    <img src={`${API_BASE_URL}${selectedImage}`} alt="Preview" className="image-preview-thumb" />
                                                    <button className="remove-image-btn" onClick={() => setSelectedImage(null)}><FaTimes /></button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}

                            {selectedConfigType === 'wordcloud' && (
                                <div className="config-section">
                                    <div className="input-group">
                                        <label>Topic / Question:</label>
                                        <input
                                            type="text"
                                            className="modal-input"
                                            value={cloudTopic}
                                            onChange={(e) => setCloudTopic(e.target.value)}
                                            placeholder="e.g. Describe your feeling in one word..."
                                        />
                                    </div>
                                </div>
                            )}

                            {selectedConfigType === 'poll' && (
                                <>
                                    <div className="input-group">
                                        <label>Question:</label>
                                        <textarea
                                            className="modal-textarea"
                                            value={questionTextInput}
                                            onChange={(e) => setQuestionTextInput(e.target.value)}
                                            placeholder="e.g., Which topic should we review?"
                                            rows="2"
                                        />
                                    </div>
                                    {/* ✨ Image Upload UI (Poll) */}
                                    <div className="input-group">
                                        <label>Attachment (Optional):</label>
                                        <div className="file-upload-wrapper">
                                            <input 
                                                type="file" 
                                                accept="image/*" 
                                                onChange={handleImageUpload}
                                                id="poll-image-upload"
                                                className="file-input-hidden"
                                                style={{ display: 'none' }}
                                            />
                                            <label htmlFor="poll-image-upload" className="file-upload-btn">
                                                {isUploading ? 'Uploading...' : <><FaImage /> Add Image</>}
                                            </label>
                                            {selectedImage && (
                                                <div className="image-preview-container">
                                                    <img src={`${API_BASE_URL}${selectedImage}`} alt="Preview" className="image-preview-thumb" />
                                                    <button className="remove-image-btn" onClick={() => setSelectedImage(null)}><FaTimes /></button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="input-group">
                                        <label>Options:</label>
                                        <div className="poll-options-config">
                                            {pollOptions.map((opt, idx) => (
                                                <div key={idx} className="poll-option-row-compact">
                                                    <span className="option-number">{idx + 1}.</span>
                                                    <input
                                                        type="text"
                                                        className="poll-option-input-compact"
                                                        value={opt}
                                                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                                                        placeholder={`Option ${idx + 1}`}
                                                    />
                                                    
                                                    {/* Compact Score Config */}
                                                    {isScored && (
                                                        <div className="poll-option-score-compact">
                                                            <input
                                                                type="number"
                                                                className="score-points-input-tiny"
                                                                value={optionScores[idx]?.points || 0}
                                                                onChange={(e) => handleScoreChange(idx, 'points', e.target.value)}
                                                                placeholder="Pts"
                                                                title="Points"
                                                                min="0"
                                                            />
                                                            <div className="score-action-wrapper">
                                                                <select
                                                                    className={`score-action-select-tiny ${optionScores[idx]?.action === 'subtract' ? 'action-sub' : 'action-add'}`}
                                                                    value={optionScores[idx]?.action || 'add'}
                                                                    onChange={(e) => handleScoreChange(idx, 'action', e.target.value)}
                                                                    title="Add or Reduce Score"
                                                                >
                                                                    <option value="add">+</option>
                                                                    <option value="subtract">-</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {pollOptions.length > 2 && (
                                                        <button
                                                            className="remove-option-btn-compact"
                                                            onClick={() => handleRemoveOption(idx)}
                                                            title="Remove option"
                                                        >
                                                            ✕
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                            <button className="add-option-btn" onClick={handleAddOption}>
                                                + Add Option
                                            </button>
                                        </div>
                                    </div>

                                    {/* Scoring Toggle Only */}
                                    <div className="scoring-config-section">
                                        <div className="input-group-row">
                                            <label className="toggle-label">
                                                <input
                                                    type="checkbox"
                                                    checked={isScored}
                                                    onChange={(e) => setIsScored(e.target.checked)}
                                                />
                                                Enable Scoring (Per Option)
                                            </label>
                                        </div>
                                    </div>
                                </>
                            )}

                            {configError && <p className="error-msg">{configError}</p>}
                        </div>

                        <div className="modal-actions">
                            <button className="cancel-btn" onClick={() => setIsConfigModalOpen(false)}>
                                Back
                            </button>
                            <button className="confirm-btn" onClick={handleConfigSubmit}>
                                Create Event
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

/* Helper Component for Event Card Content */
const EventCardContent = ({ event, isCreator, onTrigger, onSubmitAnswer, candidates = [], currentUser }) => {
    const [displayNames, setDisplayNames] = useState([]);
    const [isAnimating, setIsAnimating] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [answerInput, setAnswerInput] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);

    // Check if user has already answered on mount/update
    useEffect(() => {
        if (currentUser && event.results) {
            const hasAnswered = event.results.some(r => r.userId === currentUser.id);
            if (hasAnswered) {
                setIsSubmitted(true);
            }
        }
    }, [currentUser, event.results]);

    const handleAnswerSubmit = () => {
        console.log('Answer submit clicked. Input:', answerInput, 'Event:', event);
        if (onSubmitAnswer && answerInput.trim()) {
            console.log('Calling onSubmitAnswer prop...');
            onSubmitAnswer(event, answerInput);
            setIsSubmitted(true);
            setAnswerInput('');
        } else {
            console.warn('onSubmitAnswer not defined or input empty');
        }
    };

    // Effect to handle result arrival and animation
    useEffect(() => {
        if (event.results && event.results.length > 0) {
            // ... (existing poll/random animation logic) ...
            
            // For Buzz: If we have a winner, stop countdown if any
            if (event.type === 'buzz') {
                setCountdown(null);
            }
        }
    }, [event.results, event.updatedAt, event.type]);

    // ✨ Buzz Button Logic: Countdown & Reset
    const [countdown, setCountdown] = useState(null);

    useEffect(() => {
        if (event.type === 'buzz') {
            if (event.status === 'idle') {
                setIsSubmitted(false);
                setCountdown(null);
            } else if (event.status === 'active' && !event.results?.length) {
                if (event.startTime) {
                    const now = Date.now();
                    // 3 seconds delay from startTime
                    const endTime = event.startTime + 3000;
                    const remaining = Math.ceil((endTime - now) / 1000);

                    if (remaining > 0) {
                        setCountdown(remaining);
                        // Sync countdown
                        const interval = setInterval(() => {
                            const newNow = Date.now();
                            const newRemaining = Math.ceil((endTime - newNow) / 1000);
                            
                            if (newRemaining <= 0) {
                                clearInterval(interval);
                                setCountdown(0);
                            } else {
                                setCountdown(newRemaining);
                            }
                        }, 200); // Check more frequently for smoothness
                        return () => clearInterval(interval);
                    } else {
                        // Already started
                        setCountdown(0);
                    }
                } else {
                    // Fallback if no startTime (shouldn't happen with fix)
                    setCountdown(0);
                }
            }
        }
    }, [event.status, event.type, event.startTime, event.results]); // depend on startTime

    const startAnimation = () => {
        if (candidates.length === 0) {
            setShowResults(true);
            return;
        }

        setIsAnimating(true);
        setShowResults(false);
        const count = event.config?.count || 1;

        const interval = setInterval(() => {
            // Pick random candidates to show "shuffling"
            const randomPicks = [];
            for (let i = 0; i < count; i++) {
                const randomCandidate = candidates[Math.floor(Math.random() * candidates.length)] || { name: '...' };
                randomPicks.push(randomCandidate);
            }
            setDisplayNames(randomPicks);
        }, 100); // Change every 100ms

        // Stop after 3 seconds
        setTimeout(() => {
            clearInterval(interval);
            setIsAnimating(false);
            setShowResults(true);
        }, 3000);
    };

    return (
        <div className="event-card-content">
            {event.type === 'random' && (
                <div className="random-event-content">
                    <div className="random-info">
                        <span className="random-badge">Random x{event.config?.count || 1}</span>
                    </div>

                    {/* Animation Area */}
                    {isAnimating && (
                        <div className="random-animating">
                            {displayNames.map((candidate, i) => (
                                <div key={i} className="animating-card">
                                    {candidate.photoSrc ? (
                                        <img src={candidate.photoSrc} alt="avatar" className="animating-avatar" />
                                    ) : (
                                        <div className="animating-avatar" style={{ background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>👤</div>
                                    )}
                                    <span className="animating-name">{candidate.name}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Results Display */}
                    {showResults && event.results && event.results.length > 0 && (
                        <div className="random-results">
                            <h4 style={{ textAlign: 'center', width: '100%', marginBottom: '1rem', color: '#ea580c' }}>🎉 Winners!</h4>
                            <div className="winners-list" style={{ justifyContent: 'center' }}>
                                {event.results.map((r, i) => (
                                    <div key={i} className="winner-card">
                                        {r.photoSrc ? (
                                            <img src={r.photoSrc} alt="avatar" className="winner-avatar-large" />
                                        ) : (
                                            <div className="winner-avatar-large" style={{ background: '#ffedd5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>🏆</div>
                                        )}
                                        <div className="winner-info">
                                            <div className="winner-name">{r.userName || 'Unknown'}</div>
                                            {/* Optional: Add email or other info if available */}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Waiting Status */}
                    {!isAnimating && !showResults && (
                        <div className="random-status">Waiting to start...</div>
                    )}

                    {/* Creator Controls */}
                    {isCreator && !isAnimating && (
                        <button className="start-random-btn" onClick={() => onTrigger(event)}>
                            {event.results ? 'Reroll 🔄' : 'Start Random 🎲'}
                        </button>
                    )}
                </div>
            )}

            {/* ✨ Question Event Content */}
            {event.type === 'question' && (
                <div className="question-event-content">
                    {/* ✨ Display Image if present */}
                    {event.config?.imageUrl && (
                        <div className="event-illustration-container">
                            <img 
                                src={`${API_BASE_URL}${event.config.imageUrl}`} 
                                alt="Question Illustration" 
                                className="event-illustration-image" 
                            />
                        </div>
                    )}
                    <p className="question-text">{event.config?.questionText}</p>

                    {/* Creator View: List Answers */}
                    {isCreator ? (
                        <div className="answers-section">
                            <h4>Answers ({event.results ? event.results.length : 0})</h4>
                            <div className="answers-list">
                                {event.results && event.results.map((ans, idx) => {
                                    // Construct a user-like object for the helper if needed, or just pass ans if it has expected fields
                                    // The helper expects an object like { photoURL: string, googleId: string? }
                                    // We'll pass `ans` directly if it has `photoURL`.
                                    // If `ans` is just { userId, userName, text, photoURL, ... }
                                    const imgSrc = getProfileImageSrc(ans.photoURL, isGoogleUser(ans));

                                    return (
                                        <div key={idx} className="answer-card">
                                            <div className="answer-header">
                                                <img 
                                                    src={imgSrc} 
                                                    alt={ans.userName} 
                                                    className="answer-avatar"
                                                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(ans.userName || 'U') + '&background=random'; }}
                                                />
                                                <div className="answer-user-info">
                                                    <span className="answer-username">{ans.userName || 'Anonymous'}</span>
                                                    <span className="answer-timestamp">Just now</span>
                                                </div>
                                            </div>
                                            <div className="answer-body">
                                                {ans.text}
                                            </div>
                                        </div>
                                    );
                                })}
                                {(!event.results || event.results.length === 0) && (
                                    <div className="no-answers-placeholder">
                                        <div className="loader-dots"></div>
                                        <p>Waiting for students to answer...</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        /* Student View: Input Form */
                        <div className="answer-input-section">
                            {!isSubmitted ? (
                                <>
                                    <textarea
                                        className="answer-textarea"
                                        placeholder="Type your answer..."
                                        value={answerInput}
                                        onChange={(e) => setAnswerInput(e.target.value)}
                                        rows="2"
                                    />
                                    <button
                                        className="submit-answer-btn"
                                        onClick={handleAnswerSubmit}
                                        disabled={!answerInput.trim()}
                                    >
                                        Submit Answer
                                    </button>
                                </>
                            ) : (
                                <div className="answer-submitted-msg">
                                    <div>Answer Submitted!</div>
                                    <span>Waiting for other students...</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ✨ Poll Event Content */}
            {event.type === 'poll' && (
                <div className="poll-event-content">
                    {/* ✨ Display Image if present */}
                    {event.config?.imageUrl && (
                        <div className="event-illustration-container">
                            <img 
                                src={`${API_BASE_URL}${event.config.imageUrl}`} 
                                alt="Poll Illustration" 
                                className="event-illustration-image" 
                            />
                        </div>
                    )}
                    <p className="question-text">{event.config?.questionText}</p>

                    {isCreator ? (
                        /* Creator View: Results */
                        <div className="poll-results-container">
                            {event.config?.options?.map((opt, idx) => {
                                const count = event.results?.filter(r => r.text === opt).length || 0;
                                const total = event.results?.length || 0;
                                // ✨ Real percentage with 1 decimal place if needed, or stick to integer if preferred. 
                                // User asked for "real %", usually implies avoiding 0% when there is 1 vote if rounding down, or just precision.
                                // Let's use 1 decimal place for precision.
                                const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';

                                return (
                                    <div key={idx} className="poll-result-item">
                                        <div className="poll-result-label">
                                            <span>{opt}</span>
                                            <span className="poll-result-count">{count} ({percentage}%)</span>
                                        </div>
                                        <div className="poll-progress-bar-bg">
                                            <div
                                                className="poll-progress-bar-fill"
                                                style={{ width: `${percentage}%`, transition: 'width 0.5s ease-in-out' }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div className="poll-total-votes">Total: {event.results?.length || 0} votes {event.results?.length > 0 && '(Live)'}</div>
                        </div>
                    ) : (
                        /* Student View: Voting */
                        <div className="poll-voting-container">
                            {!isSubmitted ? (
                                <div className="poll-options-list">
                                    {event.config?.options?.map((opt, idx) => (
                                        <button
                                            key={idx}
                                            className="poll-vote-btn"
                                            onClick={() => {
                                                if (onSubmitAnswer) {
                                                    onSubmitAnswer(event, opt); // Pass option text directly? Yes, onSubmitAnswer handles formatting? 
                                                    // Ensure onSubmitAnswer expects string or object? 
                                                    // In logic above "onSubmitAnswer(event, answerInput)" -> string.
                                                    // Here "opt" -> string.
                                                    setIsSubmitted(true);
                                                }
                                            }}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="poll-submitted-msg">
                                    <div>Vote Submitted!</div>
                                    <span>Waiting for results...</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ✨ Buzz Button Content */}
            {event.type === 'buzz' && (
                <div className="buzz-event-content">
                    {/* Status Display */}
                    <div className={`buzz-status ${event.status === 'active' && countdown === 0 ? 'active' : ''}`}>
                        {event.status === 'active' 
                            ? (countdown > 0 ? `Ready... ${countdown}` : 'GO! 🖐️') 
                            : 'Waiting... 🔴'}
                    </div>

                    {isCreator ? (
                        <div className="buzz-controls">
                            <div className="buzz-actions">
                                <button 
                                    className="buzz-start-btn" 
                                    onClick={() => onTrigger(event, { status: 'active', startTime: Date.now(), results: [] })}
                                    disabled={event.status === 'active'}
                                >
                                    Start Countdown
                                </button>
                                <button 
                                    className="buzz-reset-btn" 
                                    onClick={() => onTrigger(event, { status: 'idle', results: [] })}
                                >
                                    Reset
                                </button>
                            </div>
                            
                            {/* Winner Display */}
                            {event.results && event.results.length > 0 && (
                                <div className="buzz-winner-section">
                                    <h4>🎉 Winner!</h4>
                                    <div className="buzz-winner-card">
                                        <img 
                                            src={getProfileImageSrc(event.results[0].photoURL, isGoogleUser(event.results[0]))} 
                                            alt="winner" 
                                            className="buzz-winner-avatar"
                                        />
                                        <div className="buzz-winner-name">{event.results[0].userName}</div>
                                        <div className="buzz-time">
                                            {((event.results[0].timestamp - (event.startTime || event.results[0].timestamp)) / 1000).toFixed(2)}s
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="buzz-student-view">
                            <div className="buzz-hand-container">
                                <button
                                    className={`buzz-hand-btn ${event.status === 'active' && countdown === 0 && !isSubmitted ? 'active' : ''}`}
                                    onClick={() => {
                                        if (event.status === 'active' && countdown === 0 && !isSubmitted) {
                                            onSubmitAnswer(event, 'BUZZ!');
                                            setIsSubmitted(true);
                                        }
                                    }}
                                    disabled={event.status !== 'active' || countdown > 0 || isSubmitted}
                                >
                                    <FaHandPaper />
                                </button>
                            </div>
                            {isSubmitted && <div className="buzz-feedback">Buzz Sent! 🚀</div>}
                        </div>
                    )}
                </div>
            )}



            {/* ✨ Word Cloud Content */}
            {event.type === 'wordcloud' && (
                <div className="wordcloud-event-content">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                        <h4 className="wordcloud-topic">{event.config?.topic}</h4>
                        {isCreator && (
                            <button 
                                className="icon-btn" 
                                title="Open Presentation Mode"
                                onClick={() => window.open(`/presentation/${window.location.pathname.split('/')[2]}/${event.id}`, '_blank')}
                                style={{ fontSize: '1.2rem', color: '#3b82f6' }}
                            >
                                <FaExternalLinkAlt />
                            </button>
                        )}
                    </div>
                    
                    {isCreator ? (
                        <WordCloudViz results={event.results || []} config={event.config} />
                    ) : (
                        <div className="wordcloud-student-view">
                            {!isSubmitted ? (
                                <div className="wordcloud-input-group">
                                    <input
                                        type="text"
                                        className="wordcloud-input"
                                        placeholder="Enter your word..."
                                        value={answerInput}
                                        onChange={(e) => setAnswerInput(e.target.value)}
                                        maxLength={30}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') handleAnswerSubmit();
                                        }}
                                    />
                                    <button 
                                        className="wordcloud-submit-btn"
                                        onClick={handleAnswerSubmit}
                                        disabled={!answerInput.trim()}
                                    >
                                        Send
                                    </button>
                                </div>
                            ) : (
                                <div className="wordcloud-submitted-msg">
                                    <div>Sent! ☁️</div>
                                    <p>Look at the board!</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Fallback for basic events */}
            {event.type === 'default' && <p>{event.description}</p>}
        </div>
    );
};

export default ClassroomEvent;
