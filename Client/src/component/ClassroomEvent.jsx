import React, { useState, useEffect } from 'react';
import '../CSS/ClassroomEvent.css';
import { FaPlus, FaTrash } from 'react-icons/fa';

const ClassroomEvent = ({ isCreator, events = [], onAddEvent, onTriggerEvent, onDeleteEvent, onSubmitAnswer, candidates = [] }) => {
    const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    const [selectedConfigType, setSelectedConfigType] = useState(null);
    const [studentCountInput, setStudentCountInput] = useState(1);
    const [configError, setConfigError] = useState('');
    const [questionTextInput, setQuestionTextInput] = useState('');

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
        setConfigError('');
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

            handleSelectEvent({ type: 'question', questionText: questionTextInput });
            setIsConfigModalOpen(false);
        }
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
                <div className="event-list">
                    {events.map((event) => (
                        <div key={event.id} className="event-card">
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
                                    candidates={candidates}
                                />
                            </div>
                        </div>
                    ))}

                    {/* Add Event Card as last item in grid */}
                    {isCreator && (
                        <div className="add-event-card" onClick={handleAddEventClick}>
                            <div className="add-event-card-icon">
                                <FaPlus />
                            </div>
                            <span>Add Event</span>
                        </div>
                    )}
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
                                onClick={() => openConfigModal('question')}
                            >
                                <div className="event-icon">❓</div>
                                <span>Ask Question</span>
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
const EventCardContent = ({ event, isCreator, onTrigger, onSubmitAnswer, candidates = [] }) => {
    const [displayNames, setDisplayNames] = useState([]);
    const [isAnimating, setIsAnimating] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [answerInput, setAnswerInput] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);

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
            // New results arrived (or component mounted with results)

            // If already showing results, do nothing (unless it's a new roll - timestamp check? or just checking if we already displayed it)
            // For simplicity, if we are not showing results, start animation.
            // But if page reloads, we want to show results immediately.
            // We can check if event.updatedAt is very recent? 
            // Or just always animate for a short bit if we haven't 'seen' it? 
            // Let's rely on a local state ref to track if we've processed this specific result set? 
            // Nay, let's just animate if showResults is false.

            // However, on page load showResults is false, so it will always animate. That might be annoying on refresh but OK for "showing off".
            // Let's check if the event is "recent" (e.g., within 10 seconds). If old, just show results.
            const isRecent = (Date.now() - (event.updatedAt || 0)) < 10000;

            if (isRecent) {
                startAnimation();
            } else {
                setShowResults(true);
            }
        } else {
            setShowResults(false);
        }
    }, [event.results, event.updatedAt]); // Dependency on results array

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
                                <div key={i} className="animating-tag">
                                    {candidate.photoSrc && (
                                        <img src={candidate.photoSrc} alt="avatar" className="animating-avatar" />
                                    )}
                                    <span>{candidate.name}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Results Display */}
                    {showResults && event.results && event.results.length > 0 && (
                        <div className="random-results">
                            <h4>🎉 Winners:</h4>
                            <div className="winners-list">
                                {event.results.map((r, i) => (
                                    <div key={i} className="winner-tag">
                                        {r.photoSrc && (
                                            <img src={r.photoSrc} alt="avatar" className="winner-avatar" />
                                        )}
                                        <span>{r.userName || 'Unknown'}</span>
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
                    <p className="question-text">{event.config?.questionText}</p>

                    {/* Creator View: List Answers */}
                    {isCreator ? (
                        <div className="answers-section">
                            <h4>Answers ({event.results ? event.results.length : 0})</h4>
                            <div className="answers-list">
                                {event.results && event.results.map((ans, idx) => (
                                    <div key={idx} className="answer-item">
                                        <div className="answer-user">
                                            {ans.photoURL && <img src={ans.photoURL} alt="avi" />}
                                            <span>{ans.userName}:</span>
                                        </div>
                                        <div className="answer-text">{ans.text}</div>
                                    </div>
                                ))}
                                {(!event.results || event.results.length === 0) && (
                                    <p className="no-answers">Waiting for students to answer...</p>
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
                                    ✅ Answer Submitted!
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
