import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import '../CSS/ClassroomEvent.css';
import WordCloudViz from './events/WordCloudViz';
import { FaPlus, FaTrash, FaImage, FaTimes, FaHandPaper, FaExternalLinkAlt, FaDice, FaQuestionCircle, FaBullhorn, FaCloud, FaPoll, FaClipboardList, FaTrophy, FaUser, FaUndo, FaMagic, FaUsers, FaChevronRight, FaFlagCheckered, FaStar } from 'react-icons/fa';
import { getProfileImageSrc, isGoogleUser } from '../utils/profileImageHelper';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const ClassroomEvent = ({ isCreator, events = [], onAddEvent, onTriggerEvent, onDeleteEvent, onSubmitAnswer, onEndEvent, candidates = [], currentUser }) => {
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

    // ✨ Event-level Scoring Config (applies to all event types)
    const [eventScoreEnabled, setEventScoreEnabled] = useState(false);
    const [eventScorePoints, setEventScorePoints] = useState(5);

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
        setEventScoreEnabled(false); // ✨ Reset Event Scoring
        setEventScorePoints(5);
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

            handleSelectEvent({ type: 'random', count: count, scoring: eventScoreEnabled ? { enabled: true, points: eventScorePoints } : undefined });
            setIsConfigModalOpen(false);
        } else if (selectedConfigType === 'question') {
            if (!questionTextInput.trim()) {
                setConfigError('Please enter a question.');
                return;
            }

            handleSelectEvent({ type: 'question', questionText: questionTextInput, imageUrl: selectedImage, scoring: eventScoreEnabled ? { enabled: true, points: eventScorePoints } : undefined });
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
            // ✨ Prevent duplicate option text
            const uniqueOptions = new Set(validOptions.map(o => o.trim().toLowerCase()));
            if (uniqueOptions.size !== validOptions.length) {
                setConfigError('Each option must have unique text. Please remove duplicates.');
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
                imageUrl: selectedImage,
                // For polls, scoring is driven by per-option scores only
                scoring: isScored ? { enabled: true, points: 0 } : undefined,
                options: validOptionsWithScores.map(o => o.text),
                scoreConfig: isScored ? {
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
                scoring: eventScoreEnabled ? { enabled: true, points: eventScorePoints } : undefined,
                type: 'wordcloud',
                config: { topic: cloudTopic, scoring: eventScoreEnabled ? { enabled: true, points: eventScorePoints } : undefined }
            });
            setIsConfigModalOpen(false);
        } else if (selectedConfigType === 'buzz') {
            handleSelectEvent({ type: 'buzz', scoring: eventScoreEnabled ? { enabled: true, points: eventScorePoints } : undefined });
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

    const getEventIcon = (type) => {
        const style = { color: '#0aa158', fontSize: '1.2em', verticalAlign: 'middle', marginRight: '8px' };
        switch (type) {
            case 'random': return <FaDice style={style} />;
            case 'question': return <FaQuestionCircle style={style} />;
            case 'buzz': return <FaBullhorn style={style} />;
            case 'wordcloud': return <FaCloud style={style} />;
            case 'poll': return <FaPoll style={style} />;
            default: return <FaClipboardList style={style} />;
        }
    };

    return (
        <div className="classroom-event-container">
            {events.length === 0 ? (
                <div className="empty-event-state">
                    <div className="event-placeholder">
                        <h3>No events yet</h3>
                        <p>Create an event to engage with your students!</p>
                        <div className="event-illustration">
                             <FaClipboardList style={{ fontSize: '4rem', color: '#cbd5e1' }} />
                        </div>
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
                                        {!['random', 'wordcloud', 'question', 'poll', 'buzz'].includes(event.type) && (
                                            <div className="event-card-header">
                                                <h3>{getEventIcon(event.type)} {event.title}</h3>
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
                                        )}
                                        <div className="event-card-body">
                                            <EventCardContent
                                                event={event}
                                                isCreator={isCreator}
                                                onTrigger={onTriggerEvent}
                                                onSubmitAnswer={onSubmitAnswer}
                                                onEndEvent={onEndEvent}
                                                currentUser={currentUser}
                                                candidates={candidates}
                                                onDeleteEvent={onDeleteEvent}
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
            {isAddEventModalOpen && ReactDOM.createPortal(
                <div className="modal-overlay-new" onClick={() => setIsAddEventModalOpen(false)}>
                    <div className="modal-card-new" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-new" style={{ background: 'linear-gradient(to right, #10b981, #059669)' }}>
                            <h3><FaMagic style={{ marginRight: '8px' }} /> Create New Event</h3>
                            <p>Choose an activity for your classroom</p>
                            <button className="modal-close-x" onClick={() => setIsAddEventModalOpen(false)}><FaTimes /></button>
                        </div>
                        <div className="modal-body-new">
                            <div className="event-type-grid">
                                <div className="event-type-card" onClick={() => openConfigModal('random')} style={{ '--card-accent': '#10b981' }}>
                                    <div className="etc-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}><FaDice /></div>
                                    <div className="etc-info">
                                        <span className="etc-name">Random Student</span>
                                        <span className="etc-desc">Randomly select students</span>
                                    </div>
                                    <FaChevronRight className="etc-arrow" />
                                </div>
                                <div className="event-type-card" onClick={() => openConfigModal('question')} style={{ '--card-accent': '#3b82f6' }}>
                                    <div className="etc-icon" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}><FaQuestionCircle /></div>
                                    <div className="etc-info">
                                        <span className="etc-name">Ask Question</span>
                                        <span className="etc-desc">Get open-ended answers</span>
                                    </div>
                                    <FaChevronRight className="etc-arrow" />
                                </div>
                                <div className="event-type-card" onClick={() => openConfigModal('poll')} style={{ '--card-accent': '#f59e0b' }}>
                                    <div className="etc-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}><FaPoll /></div>
                                    <div className="etc-info">
                                        <span className="etc-name">Multiple Choice</span>
                                        <span className="etc-desc">Create a poll with options</span>
                                    </div>
                                    <FaChevronRight className="etc-arrow" />
                                </div>
                                <div className="event-type-card" onClick={() => openConfigModal('wordcloud')} style={{ '--card-accent': '#10b981' }}>
                                    <div className="etc-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}><FaCloud /></div>
                                    <div className="etc-info">
                                        <span className="etc-name">Word Cloud</span>
                                        <span className="etc-desc">Collect words visually</span>
                                    </div>
                                    <FaChevronRight className="etc-arrow" />
                                </div>
                                <div className="event-type-card" onClick={() => openConfigModal('buzz')} style={{ '--card-accent': '#ef4444' }}>
                                    <div className="etc-icon" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}><FaBullhorn /></div>
                                    <div className="etc-info">
                                        <span className="etc-name">Buzz Button</span>
                                        <span className="etc-desc">First to buzz wins!</span>
                                    </div>
                                    <FaChevronRight className="etc-arrow" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Configuration Modal */}
            {isConfigModalOpen && ReactDOM.createPortal(
                <div className="modal-overlay-new" onClick={() => setIsConfigModalOpen(false)}>
                    <div className="modal-card-new config-modal-new" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-new" style={{
                            background: selectedConfigType === 'random' ? 'linear-gradient(to right, #10b981, #059669)'
                                : selectedConfigType === 'question' ? 'linear-gradient(to right, #3b82f6, #2563eb)'
                                : selectedConfigType === 'poll' ? 'linear-gradient(to right, #f59e0b, #d97706)'
                                : selectedConfigType === 'buzz' ? 'linear-gradient(to right, #ef4444, #dc2626)'
                                : 'linear-gradient(to right, #10b981, #059669)'
                        }}>
                            <h3>
                                {selectedConfigType === 'random' && <><FaDice style={{ marginRight: '10px' }} /> Random Students</>}
                                {selectedConfigType === 'question' && <><FaQuestionCircle style={{ marginRight: '10px' }} /> Ask Question</>}
                                {selectedConfigType === 'poll' && <><FaPoll style={{ marginRight: '10px' }} /> Multiple Choice</>}
                                {selectedConfigType === 'wordcloud' && <><FaCloud style={{ marginRight: '10px' }} /> Word Cloud</>}
                                {selectedConfigType === 'buzz' && <><FaBullhorn style={{ marginRight: '10px' }} /> Buzz Button</>}
                            </h3>
                            <p>Configure your event settings</p>
                            <button className="modal-close-x" onClick={() => setIsConfigModalOpen(false)}><FaTimes /></button>
                        </div>

                        <div className="modal-body-new">
                            {selectedConfigType === 'random' && (
                                <div className="cfg-group">
                                    <label className="cfg-label">Number of students to select</label>
                                    <div className="cfg-number-wrapper">
                                        <button className="cfg-num-btn" onClick={() => setStudentCountInput(prev => Math.max(1, prev - 1))}>−</button>
                                        <input
                                            type="number"
                                            className="cfg-num-input"
                                            value={studentCountInput}
                                            onChange={(e) => setStudentCountInput(parseInt(e.target.value) || '')}
                                            min="1"
                                            max={candidates.length}
                                        />
                                        <button className="cfg-num-btn" onClick={() => setStudentCountInput(prev => Math.min(candidates.length, prev + 1))}>+</button>
                                    </div>
                                    <p className="cfg-helper">Max available: {candidates.length}</p>
                                </div>
                            )}

                            {selectedConfigType === 'question' && (
                                <>
                                    <div className="cfg-group">
                                        <label className="cfg-label">Your Question</label>
                                        <textarea
                                            className="cfg-textarea"
                                            value={questionTextInput}
                                            onChange={(e) => setQuestionTextInput(e.target.value)}
                                            placeholder="Type your question here..."
                                            rows="3"
                                        />
                                    </div>
                                    <div className="cfg-group">
                                        <label className="cfg-label">Attachment (Optional)</label>
                                        <div className="cfg-upload-area">
                                            <input type="file" accept="image/*" onChange={handleImageUpload} id="question-image-upload" style={{ display: 'none' }} />
                                            <label htmlFor="question-image-upload" className="cfg-upload-btn">
                                                {isUploading ? 'Uploading...' : <><FaImage style={{ marginRight: '6px' }} /> Add Image</>}
                                            </label>
                                            {selectedImage && (
                                                <div className="cfg-image-preview">
                                                    <img src={`${API_BASE_URL}${selectedImage}`} alt="Preview" />
                                                    <button className="cfg-remove-img" onClick={() => setSelectedImage(null)}><FaTimes /></button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}

                            {selectedConfigType === 'wordcloud' && (
                                <div className="cfg-group">
                                    <label className="cfg-label">Topic / Question</label>
                                    <input
                                        type="text"
                                        className="cfg-input"
                                        value={cloudTopic}
                                        onChange={(e) => setCloudTopic(e.target.value)}
                                        placeholder="e.g. Describe your feeling in one word..."
                                    />
                                </div>
                            )}

                            {selectedConfigType === 'poll' && (
                                <>
                                    <div className="cfg-group">
                                        <label className="cfg-label">Question</label>
                                        <textarea
                                            className="cfg-textarea"
                                            value={questionTextInput}
                                            onChange={(e) => setQuestionTextInput(e.target.value)}
                                            placeholder="e.g., Which topic should we review?"
                                            rows="2"
                                        />
                                    </div>
                                    <div className="cfg-group">
                                        <label className="cfg-label">Attachment (Optional)</label>
                                        <div className="cfg-upload-area">
                                            <input type="file" accept="image/*" onChange={handleImageUpload} id="poll-image-upload" style={{ display: 'none' }} />
                                            <label htmlFor="poll-image-upload" className="cfg-upload-btn">
                                                {isUploading ? 'Uploading...' : <><FaImage style={{ marginRight: '6px' }} /> Add Image</>}
                                            </label>
                                            {selectedImage && (
                                                <div className="cfg-image-preview">
                                                    <img src={`${API_BASE_URL}${selectedImage}`} alt="Preview" />
                                                    <button className="cfg-remove-img" onClick={() => setSelectedImage(null)}><FaTimes /></button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="cfg-group">
                                        <label className="cfg-label">Options</label>
                                        <div className="cfg-options-list">
                                            {pollOptions.map((opt, idx) => (
                                                <div key={idx} className="cfg-option-row">
                                                    <span className="cfg-opt-num">{idx + 1}</span>
                                                    <input
                                                        type="text"
                                                        className="cfg-opt-input"
                                                        value={opt}
                                                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                                                        placeholder={`Option ${idx + 1}`}
                                                    />
                                                    {isScored && (
                                                        <div className="cfg-score-mini">
                                                            <input
                                                                type="number"
                                                                className="cfg-score-pts"
                                                                value={optionScores[idx]?.points || 0}
                                                                onChange={(e) => handleScoreChange(idx, 'points', e.target.value)}
                                                                placeholder="Pts"
                                                                min="0"
                                                            />
                                                            <select
                                                                className={`cfg-score-action ${optionScores[idx]?.action === 'subtract' ? 'action-sub' : 'action-add'}`}
                                                                value={optionScores[idx]?.action || 'add'}
                                                                onChange={(e) => handleScoreChange(idx, 'action', e.target.value)}
                                                            >
                                                                <option value="add">+</option>
                                                                <option value="subtract">−</option>
                                                            </select>
                                                        </div>
                                                    )}
                                                    {pollOptions.length > 2 && (
                                                        <button className="cfg-opt-remove" onClick={() => handleRemoveOption(idx)}>✕</button>
                                                    )}
                                                </div>
                                            ))}
                                            <button className="cfg-add-opt" onClick={handleAddOption}>+ Add Option</button>
                                        </div>
                                    </div>
                                    <div className="cfg-group">
                                        <label className="cfg-toggle">
                                            <input type="checkbox" checked={isScored} onChange={(e) => setIsScored(e.target.checked)} />
                                            <span>Enable Scoring (Per Option)</span>
                                        </label>
                                    </div>
                                </>
                            )}

                            {/* ✨ Event Scoring Section (hide for polls — polls use per-option scoring) */}
                            {selectedConfigType !== 'poll' && (
                            <div className="cfg-group cfg-scoring-section">
                                <label className="cfg-toggle">
                                    <input type="checkbox" checked={eventScoreEnabled} onChange={(e) => setEventScoreEnabled(e.target.checked)} />
                                    <span><FaStar style={{ color: '#f59e0b', marginRight: '4px' }} /> Enable Event Scoring</span>
                                </label>
                                {eventScoreEnabled && (
                                    <div className="cfg-score-config" style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: '#fffbeb', borderRadius: '10px', border: '1px solid #fde68a' }}>
                                        <span style={{ fontWeight: 600, color: '#92400e', fontSize: '0.9rem' }}>Points per participant:</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <button className="cfg-num-btn" onClick={() => setEventScorePoints(prev => Math.max(1, prev - 1))}>−</button>
                                            <input
                                                type="number"
                                                className="cfg-num-input"
                                                value={eventScorePoints}
                                                onChange={(e) => setEventScorePoints(Math.max(1, parseInt(e.target.value) || 1))}
                                                min="1"
                                                style={{ width: '60px' }}
                                            />
                                            <button className="cfg-num-btn" onClick={() => setEventScorePoints(prev => prev + 1)}>+</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            )}

                            {configError && <p className="cfg-error">{configError}</p>}
                        </div>

                        <div className="modal-footer-new">
                            <button className="cfg-cancel-btn" onClick={() => setIsConfigModalOpen(false)}>Back</button>
                            <button className="cfg-create-btn" onClick={handleConfigSubmit}>
                                <FaPlus style={{ marginRight: '6px' }} /> Create Event
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

/* Helper Component for Event Card Content */
const EventCardContent = ({ event, isCreator, onTrigger, onSubmitAnswer, onEndEvent, candidates = [], currentUser, onDeleteEvent }) => {
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
            if (event.type === 'random') {
                // Don't animate if event is already ended
                if (event.status === 'ended') {
                    setIsAnimating(false);
                    setShowResults(true);
                    return;
                }
                // Only animate if the update is recent (e.g., within last 10 seconds)
                const isRecent = (Date.now() - new Date(event.updatedAt).getTime()) < 10000;
                if (isRecent) {
                    startAnimation();
                } else {
                    setIsAnimating(false);
                    setShowResults(true);
                }
            } else {
                setIsAnimating(false);
                setShowResults(true);
            }
            
            // For Buzz: If we have a winner, stop countdown if any
            if (event.type === 'buzz') {
                setCountdown(null);
            }
        }
    }, [event.results, event.updatedAt, event.type, event.status]);

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

        // Calculate remaining animation time based on when the event was updated globally
        const animationDuration = event.animationDuration || 3500;
        const timeElapsed = Date.now() - new Date(event.updatedAt).getTime();
        const timeRemaining = Math.max(0, animationDuration - timeElapsed);

        if (timeRemaining <= 0) {
             clearInterval(interval);
             setIsAnimating(false);
             setShowResults(true);
        } else {
             setTimeout(() => {
                 clearInterval(interval);
                 setIsAnimating(false);
                 setShowResults(true);
             }, timeRemaining);
        }
    };

    return (
        <div className="event-card-content">
            {event.type === 'random' && (
                <div className="random-event-content-new">
                    {/* Header */}
                    <div className="random-header-new">
                        <div className="random-header-bg-icon">
                            <FaTrophy size={120} />
                        </div>
                        {isCreator && onDeleteEvent && (
                            <button
                                className="delete-event-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteEvent(event);
                                }}
                                title="Delete Event"
                                style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 20, color: 'white', background: 'rgba(0,0,0,0.1)' }}
                            >
                                <FaTrash />
                            </button>
                        )}
                        <h2 className="random-header-title">
                            <FaMagic style={{ color: '#d1fae5' }} /> Random Student <FaMagic style={{ color: '#d1fae5' }} />
                        </h2>
                        <p className="random-header-subtitle">Random student x{event.config?.count || 1}</p>
                    </div>

                    <div className="random-body-new">
                        {/* Display Area for Spinning/Winner */}
                        <div className={`random-display-area ${isAnimating ? 'spinning' : ''} ${(showResults && event.results?.length > 0) ? 'winner' : ''} ${(!isAnimating && !showResults) ? 'idle' : ''}`}>
                            
                            {!isAnimating && !showResults && (
                                <h3 className="random-idle-text">Click to start!</h3>
                            )}

                            {isAnimating && !showResults && (
                                (event.config?.count || 1) === 1 ? (
                                    /* Single random — big avatar + name */
                                    <div className="random-animating-container">
                                        {displayNames.map((candidate, i) => (
                                            <div key={i} className="random-animating-item">
                                                {candidate.photoSrc ? (
                                                    <img src={candidate.photoSrc} alt="avatar" className="random-avatar animating" />
                                                ) : (
                                                    <div className="random-avatar-placeholder animating">
                                                        <FaUser />
                                                    </div>
                                                )}
                                                <h3 className="random-name animating">{candidate.name}</h3>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    /* Multi random — circular avatar cluster, no names */
                                    <div className="random-multi-spin-cluster">
                                        {displayNames.map((candidate, i) => (
                                            <div key={i} className="spin-bubble">
                                                {candidate.photoSrc ? (
                                                    <img src={candidate.photoSrc} alt="avatar" className="spin-bubble-img" />
                                                ) : (
                                                    <div className="spin-bubble-placeholder">
                                                        <FaUser />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )
                            )}

                            {showResults && event.results && event.results.length > 0 && (
                                <div className="random-winners-container">
                                    <span className="winner-label" style={{color: '#16a34a'}}><FaTrophy size={14} /> {event.results.length > 1 ? 'Winners' : 'Winner'}</span>
                                    <div className="random-winners-cluster">
                                        {event.results.map((r, i) => (
                                            <div key={i} className="random-winner-bubble" title={r.userName || 'Unknown'}>
                                                {r.photoSrc ? (
                                                    <img src={r.photoSrc} alt={r.userName} className="winner-bubble-img" />
                                                ) : (
                                                    <div className="winner-bubble-placeholder">
                                                        <FaUser />
                                                    </div>
                                                )}
                                                <span className="winner-bubble-tooltip">{r.userName || 'Unknown'}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Participant Count Display */}
                        <div className="random-participant-count">
                            <div className="rpc-left">
                                <FaUsers />
                                <span>Total Participants</span>
                            </div>
                            <span className="rpc-right">{candidates.length} students</span>
                        </div>

                        {/* Creator Action Button */}
                        {isCreator && (
                            <button
                                onClick={() => { if(!isAnimating && event.status !== 'ended') onTrigger(event); }}
                                disabled={isAnimating || candidates.length === 0 || event.status === 'ended'}
                                className={`random-action-btn ${isAnimating ? 'spinning' : ''}`}
                            >
                                {isAnimating ? (
                                    <>
                                        <FaDice className="spin-icon" /> Rolling...
                                    </>
                                ) : (
                                    <>
                                        <FaDice /> {event.status === 'ended' ? '✅ Ended' : event.results ? 'Roll Again!' : 'Roll Now!'}
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* ✨ Question Event Content */}
            {event.type === 'question' && (
                <div className="ev-card-new question-card-new">
                    {/* Header */}
                    <div className="ev-header-new" style={{ background: 'linear-gradient(to right, #3b82f6, #2563eb)' }}>
                        <div className="ev-header-bg-icon">
                            <FaQuestionCircle size={120} />
                        </div>
                        {isCreator && onDeleteEvent && (
                            <button
                                className="delete-event-btn"
                                onClick={(e) => { e.stopPropagation(); onDeleteEvent(event); }}
                                title="Delete Event"
                                style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 20, color: 'white', background: 'rgba(0,0,0,0.1)' }}
                            >
                                <FaTrash />
                            </button>
                        )}
                        <h2 className="ev-header-title">
                            <FaQuestionCircle style={{ color: '#bfdbfe' }} /> Question
                        </h2>
                        <p className="ev-header-subtitle">Open-ended question</p>
                    </div>

                    <div className="ev-body-new">
                        {/* Featured Question Text */}
                        <div className="ev-featured-question">
                            <span className="ev-fq-icon">Q</span>
                            <p className="ev-fq-text">{event.config?.questionText || 'Open Question'}</p>
                        </div>
                        {/* Image if present */}
                        {event.config?.imageUrl && (
                            <div className="ev-image-container">
                                <img 
                                    src={`${API_BASE_URL}${event.config.imageUrl}`} 
                                    alt="Question" 
                                    className="ev-image" 
                                />
                            </div>
                        )}

                        {/* Creator View: Answers */}
                        {isCreator ? (
                            <div className="ev-answers-section">
                                <div className="ev-answers-header">
                                    <span>Answers</span>
                                    <span className="ev-answers-count">{event.results ? event.results.length : 0}</span>
                                </div>
                                <div className="ev-answers-list">
                                    {event.results && event.results.map((ans, idx) => {
                                        const imgSrc = getProfileImageSrc(ans.photoURL, isGoogleUser(ans));
                                        return (
                                            <div key={idx} className="ev-answer-card">
                                                <div className="ev-answer-header">
                                                    <img 
                                                        src={imgSrc} 
                                                        alt={ans.userName} 
                                                        className="ev-answer-avatar"
                                                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(ans.userName || 'U') + '&background=random'; }}
                                                    />
                                                    <div className="ev-answer-user-info">
                                                        <span className="ev-answer-username">{ans.userName || 'Anonymous'}</span>
                                                        <span className="ev-answer-time">Just now</span>
                                                    </div>
                                                </div>
                                                <div className="ev-answer-body">{ans.text}</div>
                                            </div>
                                        );
                                    })}
                                    {(!event.results || event.results.length === 0) && (
                                        <div className="ev-empty-state">
                                            <FaQuestionCircle style={{ fontSize: '2rem', opacity: 0.2, marginBottom: '8px' }} />
                                            <p>Waiting for students to answer...</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            /* Student View */
                            <div className="ev-input-section">
                                {!isSubmitted ? (
                                    <>
                                        <textarea
                                            className="ev-textarea"
                                            placeholder="Type your answer..."
                                            value={answerInput}
                                            onChange={(e) => setAnswerInput(e.target.value)}
                                            rows="3"
                                        />
                                        <button
                                            className="ev-submit-btn"
                                            style={{ background: 'linear-gradient(to right, #3b82f6, #2563eb)' }}
                                            onClick={handleAnswerSubmit}
                                            disabled={!answerInput.trim()}
                                        >
                                            Submit Answer
                                        </button>
                                    </>
                                ) : (
                                    <div className="ev-submitted-msg" style={{ background: '#eff6ff', borderColor: '#bfdbfe' }}>
                                        <span style={{ color: '#1d4ed8' }}>Answer Submitted! ✅</span>
                                        <p style={{ color: '#1e40af' }}>Waiting for other students...</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ✨ Poll Event Content */}
            {event.type === 'poll' && (
                <div className="ev-card-new poll-card-new">
                    {/* Header */}
                    <div className="ev-header-new" style={{ background: 'linear-gradient(to right, #f59e0b, #d97706)' }}>
                        <div className="ev-header-bg-icon">
                            <FaPoll size={120} />
                        </div>
                        {isCreator && onDeleteEvent && (
                            <button
                                className="delete-event-btn"
                                onClick={(e) => { e.stopPropagation(); onDeleteEvent(event); }}
                                title="Delete Event"
                                style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 20, color: 'white', background: 'rgba(0,0,0,0.1)' }}
                            >
                                <FaTrash />
                            </button>
                        )}
                        <h2 className="ev-header-title">
                            <FaPoll style={{ color: '#fef3c7' }} /> Poll
                        </h2>
                        <p className="ev-header-subtitle">Vote for your choice</p>
                    </div>

                    <div className="ev-body-new">
                        {/* Featured Question Text */}
                        <div className="ev-featured-question">
                            <span className="ev-fq-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>Q</span>
                            <p className="ev-fq-text">{event.config?.questionText || 'Vote now!'}</p>
                        </div>
                        {/* Image if present */}
                        {event.config?.imageUrl && (
                            <div className="ev-image-container">
                                <img 
                                    src={`${API_BASE_URL}${event.config.imageUrl}`} 
                                    alt="Poll" 
                                    className="ev-image" 
                                />
                            </div>
                        )}

                        {isCreator ? (
                            /* Creator View: Results */
                            <div className="ev-poll-results">
                                {event.config?.options?.map((opt, idx) => {
                                    const count = event.results?.filter(r => r.text === opt).length || 0;
                                    const total = event.results?.length || 0;
                                    const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';

                                    return (
                                        <div key={idx} className="ev-poll-result-item">
                                            <div className="ev-poll-result-label">
                                                <span>{opt}</span>
                                                <span className="ev-poll-result-count">{count} ({percentage}%)</span>
                                            </div>
                                            <div className="ev-poll-bar-bg">
                                                <div
                                                    className="ev-poll-bar-fill"
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div className="ev-poll-total">
                                    Total: {event.results?.length || 0} votes {event.results?.length > 0 && <span className="ev-poll-live-badge">● LIVE</span>}
                                </div>
                            </div>
                        ) : (
                            /* Student View: Voting */
                            <div className="ev-poll-voting">
                                {!isSubmitted ? (
                                    <div className="ev-poll-options">
                                        {event.config?.options?.map((opt, idx) => (
                                            <button
                                                key={idx}
                                                className="ev-poll-vote-btn"
                                                onClick={() => {
                                                    if (onSubmitAnswer) {
                                                        onSubmitAnswer(event, opt);
                                                        setIsSubmitted(true);
                                                    }
                                                }}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="ev-submitted-msg" style={{ background: '#fffbeb', borderColor: '#fde68a' }}>
                                        <span style={{ color: '#b45309' }}>Vote Submitted! 📊</span>
                                        <p style={{ color: '#92400e' }}>Waiting for results...</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ✨ Buzz Button Content */}
            {event.type === 'buzz' && (
                <div className="ev-card-new buzz-card-new">
                    {/* Header */}
                    <div className="ev-header-new" style={{ background: 'linear-gradient(to right, #ef4444, #dc2626)' }}>
                        <div className="ev-header-bg-icon">
                            <FaBullhorn size={120} />
                        </div>
                        {isCreator && onDeleteEvent && (
                            <button
                                className="delete-event-btn"
                                onClick={(e) => { e.stopPropagation(); onDeleteEvent(event); }}
                                title="Delete Event"
                                style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 20, color: 'white', background: 'rgba(0,0,0,0.1)' }}
                            >
                                <FaTrash />
                            </button>
                        )}
                        <h2 className="ev-header-title">
                            <FaBullhorn style={{ color: '#fecaca' }} /> Buzz Button
                        </h2>
                        <p className="ev-header-subtitle">First to buzz wins!</p>
                    </div>

                    <div className="ev-body-new">
                        {/* Status */}
                        <div className={`ev-buzz-status ${event.status === 'active' && countdown === 0 ? 'go' : ''} ${event.status === 'active' && countdown > 0 ? 'ready' : ''}`}>
                            {event.status === 'active' 
                                ? (countdown > 0 ? `Ready... ${countdown}` : '🖐️ GO!') 
                                : '🔴 Waiting...'}
                        </div>

                        {isCreator ? (
                            <div className="ev-buzz-controls">
                                <div className="ev-buzz-actions">
                                    <button 
                                        className="ev-buzz-start-btn"
                                        onClick={() => onTrigger(event, { status: 'active', startTime: Date.now(), results: [] })}
                                        disabled={event.status === 'active'}
                                    >
                                        Start Countdown
                                    </button>
                                    <button 
                                        className="ev-buzz-reset-btn"
                                        onClick={() => onTrigger(event, { status: 'idle', results: [] })}
                                    >
                                        <FaUndo style={{ marginRight: '6px' }} /> Reset
                                    </button>
                                </div>
                                
                                {/* Winner Display */}
                                {event.results && event.results.length > 0 && (
                                    <div className="ev-buzz-winner">
                                        <h4><FaTrophy style={{ color: '#f59e0b', marginRight: '6px' }} /> Winner!</h4>
                                        <div className="ev-buzz-winner-card">
                                            <img 
                                                src={getProfileImageSrc(event.results[0].photoURL, isGoogleUser(event.results[0]))} 
                                                alt="winner" 
                                                className="ev-buzz-winner-avatar"
                                            />
                                            <div className="ev-buzz-winner-info">
                                                <span className="ev-buzz-winner-name">{event.results[0].userName}</span>
                                                <span className="ev-buzz-winner-time">
                                                    {((event.results[0].timestamp - (event.startTime || event.results[0].timestamp)) / 1000).toFixed(2)}s
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="ev-buzz-student">
                                <button
                                    className={`ev-buzz-hand-btn ${event.status === 'active' && countdown === 0 && !isSubmitted ? 'active' : ''}`}
                                    onClick={() => {
                                        if (event.status === 'active' && countdown === 0 && !isSubmitted) {
                                            onSubmitAnswer(event, 'BUZZ!');
                                            setIsSubmitted(true);
                                        }
                                    }}
                                    disabled={event.status !== 'active' || countdown > 0 || isSubmitted}
                                >
                                    <FaHandPaper size={48} />
                                </button>
                                {isSubmitted && (
                                    <div className="ev-submitted-msg" style={{ background: '#fef2f2', borderColor: '#fecaca', marginTop: '16px' }}>
                                        <span style={{ color: '#dc2626' }}>Buzz Sent! 🚀</span>
                                        <p style={{ color: '#991b1b' }}>Waiting for results...</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}



            {/* ✨ Word Cloud Content */}
            {event.type === 'wordcloud' && (
                <div className="wc-card-new">
                    {/* Header */}
                    <div className="wc-header-new">
                        <div className="wc-header-bg-icon">
                            <FaCloud size={120} />
                        </div>
                        {isCreator && onDeleteEvent && (
                            <button
                                className="delete-event-btn"
                                onClick={(e) => { e.stopPropagation(); onDeleteEvent(event); }}
                                title="Delete Event"
                                style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 20, color: 'white', background: 'rgba(0,0,0,0.1)' }}
                            >
                                <FaTrash />
                            </button>
                        )}
                        <h2 className="wc-header-title">
                            <FaMagic style={{ color: '#fef08a' }} /> Word Cloud <FaMagic style={{ color: '#fef08a' }} />
                        </h2>
                        <p className="wc-header-subtitle">{event.config?.topic || 'Share your words!'}</p>
                        {isCreator && (
                            <button
                                className="wc-present-btn"
                                title="Open Presentation Mode"
                                onClick={() => window.open(`/presentation/${window.location.pathname.split('/')[2]}/${event.id}`, '_blank')}
                            >
                                <FaExternalLinkAlt style={{ marginRight: '6px' }} /> Present
                            </button>
                        )}
                    </div>

                    <div className="wc-body-new">
                        {/* Word Cloud Preview */}
                        <div className="wc-preview-area">
                            {(!event.results || event.results.length === 0) ? (
                                <div className="wc-empty-state">
                                    <FaCloud style={{ fontSize: '3rem', opacity: 0.2, marginBottom: '12px' }} />
                                    <p>No words yet. Start typing!</p>
                                </div>
                            ) : (
                                <WordCloudViz results={event.results || []} config={event.config} />
                            )}
                        </div>

                        {/* Input Area (students only, or creator can also submit) */}
                        {!isCreator && (
                            <div className="wc-input-section">
                                {!isSubmitted ? (
                                    <div className="wc-input-row">
                                        <input
                                            type="text"
                                            className="wc-text-input"
                                            placeholder="Type your word here..."
                                            value={answerInput}
                                            onChange={(e) => setAnswerInput(e.target.value)}
                                            maxLength={25}
                                            onKeyPress={(e) => { if (e.key === 'Enter') handleAnswerSubmit(); }}
                                        />
                                        <button
                                            className="wc-send-btn"
                                            onClick={handleAnswerSubmit}
                                            disabled={!answerInput.trim()}
                                        >
                                            Send
                                        </button>
                                    </div>
                                ) : (
                                    <div className="wc-submitted-msg">
                                        <span>Sent! ☁️</span>
                                        <p>Look at the board!</p>
                                    </div>
                                )}
                                <div className="wc-char-count">
                                    {answerInput.length}/25 characters
                                </div>
                            </div>
                        )}

                        {/* Word Count */}
                        <div className="random-participant-count">
                            <div className="rpc-left">
                                <FaCloud />
                                <span>Total Words</span>
                            </div>
                            <span className="rpc-right">{event.results?.length || 0} submitted</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Fallback for basic events */}
            {event.type === 'default' && <p>{event.description}</p>}

            {/* ✨ Student Ended Banner — compact inline bar */}
            {!isCreator && event.status === 'ended' && (
                <div className="ev-ended-banner">
                    <FaFlagCheckered /> <span>Event Ended</span>
                    {event.config?.scoring?.enabled && <span className="ev-ended-pts"><FaStar /> Scored</span>}
                </div>
            )}

            {/* ✨ End & Score Footer — Creator view */}
            {isCreator && event.config?.scoring?.enabled && event.status !== 'ended' && (
                <div className="ev-end-score-footer">
                    <div className="ev-scoring-info">
                        <div className="ev-scoring-badge">
                            <FaStar style={{ color: '#f59e0b', marginRight: '4px' }} />
                            <span>Scoring Enabled</span>
                        </div>
                        <span className="ev-scoring-points">
                            {event.type === 'poll' && event.config?.scoreConfig ? 'Per-option scoring' : `+${event.config.scoring.points} pts/participant`}
                        </span>
                    </div>
                    <button
                        className="ev-end-score-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onEndEvent) onEndEvent(event);
                        }}
                    >
                        <FaFlagCheckered style={{ marginRight: '6px' }} />
                        End & Score
                    </button>
                </div>
            )}
            {/* Creator Scored Badge */}
            {isCreator && event.status === 'ended' && event.config?.scoring?.enabled && (
                <div className="ev-scored-badge">
                    <FaTrophy style={{ color: '#f59e0b', marginRight: '6px' }} /> 
                    {event.type === 'poll' && event.config?.scoreConfig ? 'Scored — Per-option' : `Scored — +${event.config.scoring.points} pts`}
                </div>
            )}
            {/* Creator End button for non-scoring events */}
            {isCreator && event.status !== 'ended' && !event.config?.scoring?.enabled && ['poll', 'wordcloud', 'question'].includes(event.type) && (
                <div className="ev-end-score-footer" style={{ justifyContent: 'center' }}>
                    <button
                        className="ev-end-score-btn" style={{ background: 'linear-gradient(135deg, #6b7280, #4b5563)' }}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onEndEvent) {
                                // For non-scoring events, just end them
                                onEndEvent({ ...event, config: { ...event.config, scoring: { enabled: false } } });
                            }
                        }}
                    >
                        <FaFlagCheckered style={{ marginRight: '6px' }} />
                        End Event
                    </button>
                </div>
            )}
            {/* Non-scoring ended badge */}
            {event.status === 'ended' && !event.config?.scoring?.enabled && (
                <div className="ev-scored-badge" style={{ background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)', color: '#475569', borderColor: '#cbd5e1' }}>
                    <FaFlagCheckered style={{ color: '#6b7280', marginRight: '6px' }} /> Event Ended
                </div>
            )}
        </div>
    );
};

export default ClassroomEvent;
