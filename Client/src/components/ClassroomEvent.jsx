import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import '../CSS/ClassroomEvent.css';
import WordCloudViz from './events/WordCloudViz';
import { FaPlus, FaTrash, FaImage, FaTimes, FaHandPaper, FaExternalLinkAlt, FaDice, FaQuestionCircle, FaBullhorn, FaCloud, FaPoll, FaClipboardList, FaTrophy, FaUser, FaUndo, FaMagic, FaUsers, FaChevronRight, FaFlagCheckered, FaStar, FaCrown } from 'react-icons/fa';
import { getProfileImageSrc, isGoogleUser } from '../utils/profileImageHelper';
import { useTranslation } from 'react-i18next';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const ClassroomEvent = ({ isCreator, events = [], onAddEvent, onTriggerEvent, onDeleteEvent, onSubmitAnswer, onEndEvent, onPublishDraftEvent, candidates = [], currentUser, zoomScale = 1 }) => {
    const { t } = useTranslation();
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
            setConfigError(t('classroomEvent.errorUploadImage') || 'Failed to upload image.');
        } finally {
            setIsUploading(false);
            // Reset file input value?
            e.target.value = null;
        }
    };

    // ✨ Column count (screen-based only — zoom wrapper handles visual scaling)
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

    // ✨ Prepare data for grid
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

    const handleConfigSubmit = (isDraft = false) => {
        if (selectedConfigType === 'random') {
            const count = parseInt(studentCountInput);
            const max = candidates.length > 0 ? candidates.length : 1;

            if (isNaN(count) || count < 1) {
                setConfigError(t('classroomEvent.errorInvalidNumber') || 'Please enter a valid number (minimum 1).');
                return;
            }
            if (count > max) {
                setConfigError(t('classroomEvent.errorMaxStudents', { max }) || `Cannot select more than ${max} student(s).`);
                return;
            }

            handleSelectEvent({ type: 'random', count: count, status: isDraft ? 'draft' : 'idle', scoring: eventScoreEnabled ? { enabled: true, points: eventScorePoints } : undefined });
            setIsConfigModalOpen(false);
        } else if (selectedConfigType === 'question') {
            if (!questionTextInput.trim()) {
                setConfigError(t('classroomEvent.errorEmptyQuestion') || 'Please enter a question.');
                return;
            }

            handleSelectEvent({ type: 'question', questionText: questionTextInput, imageUrl: selectedImage, status: isDraft ? 'draft' : 'idle', scoring: eventScoreEnabled ? { enabled: true, points: eventScorePoints } : undefined });
            setIsConfigModalOpen(false);
        } else if (selectedConfigType === 'poll') {
            const validOptions = pollOptions.filter(opt => opt.trim() !== '');
            if (!questionTextInput.trim()) {
                setConfigError(t('classroomEvent.errorEmptyQuestion') || 'Please enter a question.');
                return;
            }
            if (validOptions.length < 2) {
                setConfigError(t('classroomEvent.errorMinOptions') || 'Please provide at least 2 options.');
                return;
            }
            // ✨ Prevent duplicate option text
            const uniqueOptions = new Set(validOptions.map(o => o.trim().toLowerCase()));
            if (uniqueOptions.size !== validOptions.length) {
                setConfigError(t('classroomEvent.errorDuplicateOptions') || 'Each option must have unique text. Please remove duplicates.');
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
                setConfigError(t('classroomEvent.errorMinOptions') || 'Please provide at least 2 options.');
                return;
            }

            handleSelectEvent({
                type: 'poll',
                questionText: questionTextInput,
                status: isDraft ? 'draft' : 'idle',
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
                setConfigError(t('classroomEvent.errorEmptyQuestion') || 'Please enter a topic.');
                return;
            }
            handleSelectEvent({
                scoring: eventScoreEnabled ? { enabled: true, points: eventScorePoints } : undefined,
                type: 'wordcloud',
                status: isDraft ? 'draft' : 'idle',
                config: { topic: cloudTopic, scoring: eventScoreEnabled ? { enabled: true, points: eventScorePoints } : undefined }
            });
            setIsConfigModalOpen(false);
        } else if (selectedConfigType === 'buzz') {
            handleSelectEvent({ type: 'buzz', status: isDraft ? 'draft' : 'idle', scoring: eventScoreEnabled ? { enabled: true, points: eventScorePoints } : undefined });
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
            case 'grouping': return <FaUsers style={style} />;
            default: return <FaClipboardList style={style} />;
        }
    };

    return (
        <div className="classroom-event-container">
            {events.length === 0 ? (
                <div className="empty-event-state">
                    <div className="event-placeholder">
                        <h3>{t('classroomEvent.noEventsTitle') || 'No events yet'}</h3>
                        <p>{t('classroomEvent.noEventsDesc') || 'Create an event to engage with your students!'}</p>
                        <div className="event-illustration">
                             <FaClipboardList style={{ fontSize: '4rem', color: '#cbd5e1' }} />
                        </div>
                    </div>
                    {isCreator && (
                        <div className="add-event-card" onClick={handleAddEventClick} style={{ marginTop: '20px', width: '200px', height: 'auto', minHeight: '150px' }}>
                            <div className="add-event-card-icon">
                                <FaPlus />
                            </div>
                            <span>{t('classroomEvent.addEvent') || 'Add Event'}</span>
                        </div>
                    )}
                </div>
            ) : (
                <div className="event-masonry-grid" style={{ 
                    columnWidth: `${Math.round(350 * zoomScale)}px`,
                    columnGap: '16px',
                    width: '100%',
                }}>
                    {allItems.map((item) => {
                        if (item.type === 'add-card') {
                            return (
                                <div key="add-event" style={{ 
                                    display: 'inline-block',
                                    width: '100%',
                                    breakInside: 'avoid',
                                    WebkitColumnBreakInside: 'avoid',
                                    marginBottom: '24px',
                                    overflow: 'hidden',
                                }}>
                                    <div className="add-event-card" onClick={handleAddEventClick} style={{ 
                                        width: '100%',
                                        zoom: zoomScale,
                                    }}>
                                        <div className="add-event-card-icon">
                                            <FaPlus />
                                        </div>
                                        <span>{t('classroomEvent.addEvent') || 'Add Event'}</span>
                                    </div>
                                </div>
                            );
                        }
                        const event = item;

                        // ✨ Hide draft events from non-creators
                        if (event.status === 'draft' && !isCreator) {
                            return null;
                        }

                        const isDraft = event.status === 'draft';

                        return (
                            <div key={event.id} style={{ 
                                display: 'inline-block',
                                width: '100%',
                                breakInside: 'avoid',
                                WebkitColumnBreakInside: 'avoid',
                                marginBottom: '24px',
                                overflow: 'hidden',
                                position: 'relative'
                            }}>
                                <div className={`event-card ${isDraft ? 'draft-card-wrapper' : ''}`} style={{ 
                                    width: '100%',
                                    zoom: zoomScale,
                                    marginBottom: 0,
                                }}>
                                    {!['random', 'wordcloud', 'question', 'poll', 'buzz', 'grouping'].includes(event.type) && (
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
                                    
                                    {/* ✨ Draft Overlay for Creator */}
                                    {isDraft && isCreator && (
                                        <div className="draft-overlay">
                                            <div className="draft-badge">{t('classroomEvent.draftBadge') || 'Draft'}</div>
                                            <button className="draft-post-btn" onClick={() => onPublishDraftEvent && onPublishDraftEvent(event)}>
                                                {t('classroomEvent.postEvent') || 'Post Event'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Event Type Selection Modal */}
            {isAddEventModalOpen && ReactDOM.createPortal(
                <div className="modal-overlay-new" onClick={() => setIsAddEventModalOpen(false)}>
                    <div className="modal-card-new" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-new" style={{ background: 'linear-gradient(to right, #10b981, #059669)' }}>
                            <h3><FaMagic style={{ marginRight: '8px' }} /> {t('classroomEvent.createNewEvent') || 'Create New Event'}</h3>
                            <p>{t('classroomEvent.chooseActivityDesc') || 'Choose an activity for your classroom'}</p>
                            <button className="modal-close-x" onClick={() => setIsAddEventModalOpen(false)}><FaTimes /></button>
                        </div>
                        <div className="modal-body-new">
                            <div className="event-type-grid">
                                <div className="event-type-card" onClick={() => openConfigModal('random')} style={{ '--card-accent': '#10b981' }}>
                                    <div className="etc-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}><FaDice /></div>
                                    <div className="etc-info">
                                        <span className="etc-name">{t('classroomEvent.typeRandomTitle') || 'Random Student'}</span>
                                        <span className="etc-desc">{t('classroomEvent.typeRandomDesc') || 'Randomly select students'}</span>
                                    </div>
                                    <FaChevronRight className="etc-arrow" />
                                </div>
                                <div className="event-type-card" onClick={() => openConfigModal('question')} style={{ '--card-accent': '#3b82f6' }}>
                                    <div className="etc-icon" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}><FaQuestionCircle /></div>
                                    <div className="etc-info">
                                        <span className="etc-name">{t('classroomEvent.typeQuestionTitle') || 'Ask Question'}</span>
                                        <span className="etc-desc">{t('classroomEvent.typeQuestionDesc') || 'Get open-ended answers'}</span>
                                    </div>
                                    <FaChevronRight className="etc-arrow" />
                                </div>
                                <div className="event-type-card" onClick={() => openConfigModal('poll')} style={{ '--card-accent': '#f59e0b' }}>
                                    <div className="etc-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}><FaPoll /></div>
                                    <div className="etc-info">
                                        <span className="etc-name">{t('classroomEvent.typePollTitle') || 'Multiple Choice'}</span>
                                        <span className="etc-desc">{t('classroomEvent.typePollDesc') || 'Create a poll with options'}</span>
                                    </div>
                                    <FaChevronRight className="etc-arrow" />
                                </div>
                                <div className="event-type-card" onClick={() => openConfigModal('wordcloud')} style={{ '--card-accent': '#10b981' }}>
                                    <div className="etc-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}><FaCloud /></div>
                                    <div className="etc-info">
                                        <span className="etc-name">{t('classroomEvent.typeWordCloudTitle') || 'Word Cloud'}</span>
                                        <span className="etc-desc">{t('classroomEvent.typeWordCloudDesc') || 'Collect words visually'}</span>
                                    </div>
                                    <FaChevronRight className="etc-arrow" />
                                </div>
                                <div className="event-type-card" onClick={() => openConfigModal('buzz')} style={{ '--card-accent': '#ef4444' }}>
                                    <div className="etc-icon" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}><FaBullhorn /></div>
                                    <div className="etc-info">
                                        <span className="etc-name">{t('classroomEvent.typeBuzzTitle') || 'Buzz Button'}</span>
                                        <span className="etc-desc">{t('classroomEvent.typeBuzzDesc') || 'First to buzz wins!'}</span>
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
                                {selectedConfigType === 'random' && <><FaDice style={{ marginRight: '10px' }} /> {t('classroomEvent.configRandomTitle') || 'Random Students'}</>}
                                {selectedConfigType === 'question' && <><FaQuestionCircle style={{ marginRight: '10px' }} /> {t('classroomEvent.configQuestionTitle') || 'Ask Question'}</>}
                                {selectedConfigType === 'poll' && <><FaPoll style={{ marginRight: '10px' }} /> {t('classroomEvent.configPollTitle') || 'Multiple Choice'}</>}
                                {selectedConfigType === 'wordcloud' && <><FaCloud style={{ marginRight: '10px' }} /> {t('classroomEvent.configWordCloudTitle') || 'Word Cloud'}</>}
                                {selectedConfigType === 'buzz' && <><FaBullhorn style={{ marginRight: '10px' }} /> {t('classroomEvent.configBuzzTitle') || 'Buzz Button'}</>}
                            </h3>
                            <p>{t('classroomEvent.configDesc') || 'Configure your event settings'}</p>
                            <button className="modal-close-x" onClick={() => setIsConfigModalOpen(false)}><FaTimes /></button>
                        </div>

                        <div className="modal-body-new">
                            {selectedConfigType === 'random' && (
                                <div className="cfg-group">
                                    <label className="cfg-label">{t('classroomEvent.configNumStudents') || 'Number of students to select'}</label>
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
                                    <p className="cfg-helper">{t('classroomEvent.configMaxAvailable', { max: candidates.length }) || `Max available: ${candidates.length}`}</p>
                                </div>
                            )}

                            {selectedConfigType === 'question' && (
                                <>
                                    <div className="cfg-group">
                                        <label className="cfg-label">{t('classroomEvent.configYourQuestion') || 'Your Question'}</label>
                                        <textarea
                                            className="cfg-textarea"
                                            value={questionTextInput}
                                            onChange={(e) => setQuestionTextInput(e.target.value)}
                                            placeholder={t('classroomEvent.configQuestionPlaceholder') || 'Type your question here...'}
                                            rows="3"
                                        />
                                    </div>
                                    <div className="cfg-group">
                                        <label className="cfg-label">{t('classroomEvent.configAttachment') || 'Attachment (Optional)'}</label>
                                        <div className="cfg-upload-area">
                                            <input type="file" accept="image/*" onChange={handleImageUpload} id="question-image-upload" style={{ display: 'none' }} />
                                            <label htmlFor="question-image-upload" className="cfg-upload-btn">
                                                {isUploading ? (t('classroomEvent.uploading') || 'Uploading...') : <><FaImage style={{ marginRight: '6px' }} /> {t('classroomEvent.addImage') || 'Add Image'}</>}
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
                                    <label className="cfg-label">{t('classroomEvent.configTopic') || 'Topic / Question'}</label>
                                    <input
                                        type="text"
                                        className="cfg-input"
                                        value={cloudTopic}
                                        onChange={(e) => setCloudTopic(e.target.value)}
                                        placeholder={t('classroomEvent.configTopicPlaceholder') || 'e.g. Describe your feeling in one word...'}
                                    />
                                </div>
                            )}

                            {selectedConfigType === 'poll' && (
                                <>
                                    <div className="cfg-group">
                                        <label className="cfg-label">{t('classroomEvent.configQuestion') || 'Question'}</label>
                                        <textarea
                                            className="cfg-textarea"
                                            value={questionTextInput}
                                            onChange={(e) => setQuestionTextInput(e.target.value)}
                                            placeholder={t('classroomEvent.configPollPlaceholder') || 'e.g., Which topic should we review?'}
                                            rows="2"
                                        />
                                    </div>
                                    <div className="cfg-group">
                                        <label className="cfg-label">{t('classroomEvent.configAttachment') || 'Attachment (Optional)'}</label>
                                        <div className="cfg-upload-area">
                                            <input type="file" accept="image/*" onChange={handleImageUpload} id="poll-image-upload" style={{ display: 'none' }} />
                                            <label htmlFor="poll-image-upload" className="cfg-upload-btn">
                                                {isUploading ? (t('classroomEvent.uploading') || 'Uploading...') : <><FaImage style={{ marginRight: '6px' }} /> {t('classroomEvent.addImage') || 'Add Image'}</>}
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
                                        <label className="cfg-label">{t('classroomEvent.configOptions') || 'Options'}</label>
                                        <div className="cfg-options-list">
                                            {pollOptions.map((opt, idx) => (
                                                <div key={idx} className="cfg-option-row">
                                                    <span className="cfg-opt-num">{idx + 1}</span>
                                                    <input
                                                        type="text"
                                                        className="cfg-opt-input"
                                                        value={opt}
                                                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                                                        placeholder={t('classroomEvent.configOptionPlaceholder', { num: idx + 1 }) || `Option ${idx + 1}`}
                                                    />
                                                    {isScored && (
                                                        <div className="cfg-score-mini">
                                                            <input
                                                                type="number"
                                                                className="cfg-score-pts"
                                                                value={optionScores[idx]?.points || 0}
                                                                onChange={(e) => handleScoreChange(idx, 'points', e.target.value)}
                                                                placeholder={t('classroomEvent.configPts') || 'Pts'}
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
                                            <button className="cfg-add-opt" onClick={handleAddOption}>{t('classroomEvent.addOption') || '+ Add Option'}</button>
                                        </div>
                                    </div>
                                    <div className="cfg-group">
                                        <label className="cfg-toggle">
                                            <input type="checkbox" checked={isScored} onChange={(e) => setIsScored(e.target.checked)} />
                                            <span>{t('classroomEvent.enableScoringPerOption') || 'Enable Scoring (Per Option)'}</span>
                                        </label>
                                    </div>
                                </>
                            )}

                            {/* ✨ Event Scoring Section (hide for polls — polls use per-option scoring) */}
                            {selectedConfigType !== 'poll' && (
                            <div className="cfg-group cfg-scoring-section">
                                <label className="cfg-toggle">
                                    <input type="checkbox" checked={eventScoreEnabled} onChange={(e) => setEventScoreEnabled(e.target.checked)} />
                                    <span><FaStar style={{ color: '#f59e0b', marginRight: '4px' }} /> {t('classroomEvent.enableEventScoring') || 'Enable Event Scoring'}</span>
                                </label>
                                {eventScoreEnabled && (
                                    <div className="cfg-score-config" style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: '#fffbeb', borderRadius: '10px', border: '1px solid #fde68a' }}>
                                        <span style={{ fontWeight: 600, color: '#92400e', fontSize: '0.9rem' }}>{t('classroomEvent.pointsPerParticipant') || 'Points per participant:'}</span>
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
                            <button className="cfg-cancel-btn" onClick={() => setIsConfigModalOpen(false)}>{t('classroomEvent.btnBack') || 'Back'}</button>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button className="cfg-draft-btn" onClick={() => handleConfigSubmit(true)} style={{
                                    backgroundColor: '#e2e8f0', color: '#475569', padding: '10px 16px', borderRadius: '8px',
                                    border: '1px solid #cbd5e1', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', transition: 'all 0.2s'
                                }} onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#cbd5e1'; e.currentTarget.style.color = '#334155'; }} onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#e2e8f0'; e.currentTarget.style.color = '#475569'; }}>
                                    {t('classroomEvent.btnSaveDraft') || 'Save as Draft'}
                                </button>
                                <button className="cfg-create-btn" onClick={() => handleConfigSubmit(false)}>
                                    <FaPlus style={{ marginRight: '6px' }} /> {t('classroomEvent.btnCreateEvent') || 'Create Event'}
                                </button>
                            </div>
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
    const { t } = useTranslation();
    const [displayNames, setDisplayNames] = useState([]);
    const [isAnimating, setIsAnimating] = useState(false);
    const [animationPhase, setAnimationPhase] = useState('idle'); // idle | spinning | slowing | reveal
    const [showResults, setShowResults] = useState(false);
    const [answerInput, setAnswerInput] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);

    // Check if user has already answered on mount/update
    useEffect(() => {
        if (currentUser && event.results) {
            const hasAnswered = event.results.some(r => r.userId === currentUser.id);
            setIsSubmitted(hasAnswered);
        } else {
            setIsSubmitted(false);
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
                    setAnimationPhase('idle');
                    setShowResults(true);
                    return;
                }
                // Only animate if the update is recent (e.g., within last 10 seconds)
                const isRecent = (Date.now() - new Date(event.updatedAt).getTime()) < 10000;
                if (isRecent) {
                    startAnimation();
                } else {
                    setIsAnimating(false);
                    setAnimationPhase('idle');
                    setShowResults(true);
                }
            } else {
                setIsAnimating(false);
                setShowResults(true);
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
            } else if (event.status === 'active') { // Let countdown be 0 even if results exist so late joiners can buzz
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
        setAnimationPhase('spinning');
        const count = event.config?.count || 1;

        // Calculate remaining animation time based on when the event was updated globally
        const animationDuration = event.animationDuration || 3500;
        const timeElapsed = Date.now() - new Date(event.updatedAt).getTime();
        const timeRemaining = Math.max(0, animationDuration - timeElapsed);

        if (timeRemaining <= 0) {
            setIsAnimating(false);
            setAnimationPhase('idle');
            setShowResults(true);
            return;
        }

        // Slot-machine style decelerating animation
        const startTime = Date.now();
        let currentInterval = null;

        const pickRandom = () => {
            const randomPicks = [];
            for (let i = 0; i < count; i++) {
                const randomCandidate = candidates[Math.floor(Math.random() * candidates.length)] || { name: '...' };
                randomPicks.push(randomCandidate);
            }
            setDisplayNames(randomPicks);
        };

        const scheduleNext = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / timeRemaining, 1);

            if (progress >= 1) {
                // Animation done — show reveal
                setAnimationPhase('reveal');
                setTimeout(() => {
                    setIsAnimating(false);
                    setAnimationPhase('idle');
                    setShowResults(true);
                }, 600); // Brief reveal phase
                return;
            }

            // Switch to slowing phase at 60%
            if (progress > 0.6) {
                setAnimationPhase('slowing');
            }

            pickRandom();

            // Decelerate: start at 60ms, end at ~300ms
            const delay = 60 + (progress * progress * 240);
            currentInterval = setTimeout(scheduleNext, delay);
        };

        pickRandom(); // Initial pick
        currentInterval = setTimeout(scheduleNext, 60);
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
                            <FaMagic style={{ color: '#d1fae5' }} /> {t('classroomEvent.typeRandomTitle') || 'Random Student'} <FaMagic style={{ color: '#d1fae5' }} />
                        </h2>
                        <p className="random-header-subtitle">{t('classroomEvent.randomStudentSubtitle', { count: event.config?.count || 1 }) || `Random student x${event.config?.count || 1}`}</p>
                    </div>

                    <div className="random-body-new">
                        {/* Display Area for Spinning/Winner */}
                        <div className={`random-display-area ${isAnimating ? 'spinning' : ''} ${(showResults && event.results?.length > 0) ? 'winner' : ''} ${(!isAnimating && !showResults) ? 'idle' : ''} ${animationPhase}`}>
                            
                            {!isAnimating && !showResults && (
                                <h3 className="random-idle-text">{t('classroomEvent.clickToStart') || 'Click to start!'}</h3>
                            )}

                            {isAnimating && !showResults && (
                                (event.config?.count || 1) === 1 ? (
                                    /* Single random — big avatar only, no name */
                                    <div className={`random-animating-container ${animationPhase}`}>
                                        {displayNames.map((candidate, i) => (
                                            <div key={i} className={`random-animating-item slot-swap ${animationPhase}`}>
                                                {candidate.photoSrc ? (
                                                    <img src={candidate.photoSrc} alt="avatar" className={`random-avatar animating ${animationPhase}`} />
                                                ) : (
                                                    <div className={`random-avatar-placeholder animating ${animationPhase}`}>
                                                        <FaUser />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    /* Multi random — circular avatar cluster, no names */
                                    <div className={`random-multi-spin-cluster ${animationPhase}`}>
                                        {displayNames.map((candidate, i) => (
                                            <div key={i} className={`spin-bubble ${animationPhase}`}>
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
                                    <span className="winner-label" style={{color: '#16a34a'}}><FaTrophy size={14} /> {event.results.length > 1 ? (t('classroomEvent.winnersLabel') || 'Winners') : (t('classroomEvent.winnerLabel') || 'Winner')}</span>
                                    <div className="random-winners-cluster">
                                        {event.results.map((r, i) => (
                                            <div key={i} className="random-winner-bubble" title={r.userName || t('classroomEvent.unknown') || 'Unknown'}>
                                                {r.photoSrc ? (
                                                    <img src={r.photoSrc} alt={r.userName} className="winner-bubble-img" />
                                                ) : (
                                                    <div className="winner-bubble-placeholder">
                                                        <FaUser />
                                                    </div>
                                                )}
                                                <span className="winner-bubble-tooltip">{r.userName || t('classroomEvent.unknown') || 'Unknown'}</span>
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
                                <span>{t('classroomEvent.totalParticipants') || 'Total Participants'}</span>
                            </div>
                            <span className="rpc-right">{t('classroomEvent.studentsCountLabel', { count: candidates.length }) || `${candidates.length} students`}</span>
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
                                        <FaDice className="spin-icon" /> {t('classroomEvent.rolling') || 'Rolling...'}
                                    </>
                                ) : (
                                    <>
                                        <FaDice /> {event.status === 'ended' ? (t('classroomEvent.ended') || '✅ Ended') : event.results ? (t('classroomEvent.rollAgain') || 'Roll Again!') : (t('classroomEvent.rollNow') || 'Roll Now!')}
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
                            <FaQuestionCircle style={{ color: '#bfdbfe' }} /> {t('classroomEvent.openQuestion') || 'Open Question'}
                        </h2>
                        <p className="ev-header-subtitle">{t('classroomEvent.typeQuestionSubtitle') || 'Open-ended question'}</p>
                    </div>

                    <div className="ev-body-new">
                        {/* Featured Question Text */}
                        <div className="ev-featured-question">
                            <span className="ev-fq-icon">Q</span>
                            <p className="ev-fq-text">{event.config?.questionText || t('classroomEvent.openQuestion') || 'Open Question'}</p>
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
                                    <span>{t('classroomEvent.answers') || 'Answers'}</span>
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
                                                        <span className="ev-answer-username">{ans.userName || t('classroomEvent.anonymous') || 'Anonymous'}</span>
                                                        <span className="ev-answer-time">{t('classroomEvent.justNow') || 'Just now'}</span>
                                                    </div>
                                                </div>
                                                <div className="ev-answer-body">{ans.text}</div>
                                            </div>
                                        );
                                    })}
                                    {(!event.results || event.results.length === 0) && (
                                        <div className="ev-empty-state">
                                            <FaQuestionCircle style={{ fontSize: '2rem', opacity: 0.2, marginBottom: '8px' }} />
                                            <p>{t('classroomEvent.waitingForAnswers') || 'Waiting for students to answer...'}</p>
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
                                            placeholder={t('classroomEvent.typeYourAnswer') || 'Type your answer...'}
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
                                            {t('classroomEvent.submitAnswer') || 'Submit Answer'}
                                        </button>
                                    </>
                                ) : (
                                    <div className="ev-submitted-msg" style={{ background: '#eff6ff', borderColor: '#bfdbfe' }}>
                                        <span style={{ color: '#1d4ed8' }}>{t('classroomEvent.answerSubmitted') || 'Answer Submitted! ✅'}</span>
                                        <p style={{ color: '#1e40af' }}>{t('classroomEvent.waitingForOthers') || 'Waiting for other students...'}</p>
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
                            <FaPoll style={{ color: '#fef3c7' }} /> {t('classroomEvent.typePollTitle') || 'Poll'}
                        </h2>
                        <p className="ev-header-subtitle">{t('classroomEvent.typePollSubtitle') || 'Vote for your choice'}</p>
                    </div>

                    <div className="ev-body-new">
                        {/* Featured Question Text */}
                        <div className="ev-featured-question">
                            <span className="ev-fq-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>Q</span>
                            <p className="ev-fq-text">{event.config?.questionText || t('classroomEvent.voteNow') || 'Vote now!'}</p>
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
                                    {t('classroomEvent.totalVotes', { count: event.results?.length || 0 }) || `Total: ${event.results?.length || 0} votes`} {event.results?.length > 0 && <span className="ev-poll-live-badge">{t('classroomEvent.liveBadge') || '● LIVE'}</span>}
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
                                        <span style={{ color: '#b45309' }}>{t('classroomEvent.voteSubmitted') || 'Vote Submitted! 📊'}</span>
                                        <p style={{ color: '#92400e' }}>{t('classroomEvent.waitingForResults') || 'Waiting for results...'}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ✨ Grouping Event Content */}
            {event.type === 'grouping' && (
                <div className="ev-card-new grouping-card-new">
                    {/* Header */}
                    <div className="ev-header-new" style={{ background: 'linear-gradient(to right, #10b981, #059669)' }}>
                        <div className="ev-header-bg-icon">
                            <FaUsers size={120} />
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
                            <FaUsers style={{ color: '#d1fae5' }} /> {t('classroomEvent.typeGroupingTitle') || 'Student Groups'}
                        </h2>
                        <p className="ev-header-subtitle">{t('classroomEvent.typeGroupingSubtitle') || 'Choose your group'}</p>
                    </div>

                    <div className="ev-body-new">
                        {isCreator ? (
                            /* Creator View: Group Results with avatars + progress */
                            <div className="grouping-results">
                                {event.config?.groups?.map((group, idx) => {
                                    const members = event.results?.filter(r => r.text === (group.id || group.name)) || [];
                                    const maxMembers = group.maxMembers || 99;
                                    const percentage = Math.min(100, Math.round((members.length / maxMembers) * 100));
                                    const isFull = members.length >= maxMembers;
                                    return (
                                        <div key={idx} className="grouping-result-item">
                                            <div className="grouping-result-header">
                                                <div className="grouping-color-dot" style={{ backgroundColor: group.color }} />
                                                <span className="grouping-result-name">{group.name}</span>
                                                <span className="grouping-result-count">
                                                    {members.length}/{maxMembers}
                                                    {isFull && <span className="grouping-full-badge">{t('classroomEvent.fullBadge') || 'FULL'}</span>}
                                                </span>
                                            </div>
                                            {/* Avatar stack */}
                                            {members.length > 0 && (
                                                <div className="grouping-avatar-stack">
                                                    {members.slice(0, 8).map((m, mIdx) => (
                                                        <img
                                                            key={mIdx}
                                                            src={getProfileImageSrc(m.photoURL)}
                                                            alt={m.userName}
                                                            className="grouping-avatar"
                                                            title={m.userName}
                                                            onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(m.userName || '?')}&background=random&size=32`; }}
                                                        />
                                                    ))}
                                                    {members.length > 8 && (
                                                        <span className="grouping-avatar-more">+{members.length - 8}</span>
                                                    )}
                                                </div>
                                            )}
                                            {/* Progress bar */}
                                            <div className="grouping-progress-bar">
                                                <div
                                                    className="grouping-progress-fill"
                                                    style={{
                                                        width: `${percentage}%`,
                                                        backgroundColor: isFull ? '#ef4444' : group.color,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                                <div className="ev-poll-total">
                                    Total: {event.results?.length || 0} joined {event.results?.length > 0 && <span className="ev-poll-live-badge">● LIVE</span>}
                                </div>
                            </div>
                        ) : (
                            /* Student View: Join Group with avatars + progress */
                            <div className="grouping-voting">
                                {!isSubmitted ? (
                                    <div className="grouping-options">
                                        {event.config?.groups?.map((group, idx) => {
                                            const members = event.results?.filter(r => r.text === (group.id || group.name)) || [];
                                            const maxMembers = group.maxMembers || 99;
                                            const percentage = Math.min(100, Math.round((members.length / maxMembers) * 100));
                                            const isFull = members.length >= maxMembers;
                                            return (
                                                <button
                                                    key={idx}
                                                    className={`grouping-vote-btn ${isFull ? 'grouping-btn-full' : ''}`}
                                                    style={{
                                                        borderLeft: `4px solid ${group.color}`,
                                                        '--group-color': group.color,
                                                    }}
                                                    disabled={isFull}
                                                    onClick={() => {
                                                        if (onSubmitAnswer && !isFull) {
                                                            onSubmitAnswer(event, group.id || group.name);
                                                            setIsSubmitted(true);
                                                        }
                                                    }}
                                                >
                                                    <div className="grouping-btn-top">
                                                        <div className="grouping-btn-color" style={{ backgroundColor: group.color }} />
                                                        <span className="grouping-btn-name">{group.name}</span>
                                                        <span className="grouping-btn-count">{members.length}/{maxMembers}</span>
                                                    </div>
                                                    {members.length > 0 && (
                                                        <div className="grouping-avatar-stack" style={{ marginTop: '6px' }}>
                                                            {members.slice(0, 5).map((m, mIdx) => (
                                                                <img
                                                                    key={mIdx}
                                                                    src={getProfileImageSrc(m.photoURL)}
                                                                    alt={m.userName}
                                                                    className="grouping-avatar grouping-avatar-sm"
                                                                    onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(m.userName || '?')}&background=random&size=28`; }}
                                                                />
                                                            ))}
                                                            {members.length > 5 && (
                                                                <span className="grouping-avatar-more">+{members.length - 5}</span>
                                                            )}
                                                        </div>
                                                    )}
                                                    <div className="grouping-progress-bar" style={{ marginTop: '8px' }}>
                                                        <div
                                                            className="grouping-progress-fill"
                                                            style={{
                                                                width: `${percentage}%`,
                                                                backgroundColor: isFull ? '#ef4444' : group.color,
                                                            }}
                                                        />
                                                    </div>
                                                    {isFull && <span className="grouping-full-text">Group Full</span>}
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="ev-submitted-msg" style={{ background: '#ecfdf5', borderColor: '#a7f3d0' }}>
                                        <span style={{ color: '#065f46' }}>{t('classroomEvent.groupJoined') || 'Group Joined! ✅'}</span>
                                        <p style={{ color: '#047857' }}>{t('classroomEvent.waitingForTeacher') || "You're in the group. Wait for the teacher to proceed."}</p>
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
                            <FaBullhorn style={{ color: '#fecaca' }} /> {t('classroomEvent.typeBuzzTitle') || 'Buzz Button'}
                        </h2>
                        <p className="ev-header-subtitle">{t('classroomEvent.typeBuzzSubtitle') || 'First to buzz wins!'}</p>
                    </div>

                    <div className="ev-body-new">
                        {/* Status */}
                        <div className={`ev-buzz-status ${event.status === 'active' && countdown === 0 ? 'go' : ''} ${event.status === 'active' && countdown > 0 ? 'ready' : ''}`}>
                            {event.status === 'active' 
                                ? (countdown > 0 ? (t('classroomEvent.readyCount', { count: countdown }) || `Ready... ${countdown}`) : (t('classroomEvent.goBuzz') || '🖐️ GO!')) 
                                : (t('classroomEvent.waitingBuzz') || '🔴 Waiting...')}
                        </div>

                        {isCreator ? (
                            <div className="ev-buzz-controls">
                                <div className="ev-buzz-actions">
                                    <button 
                                        className="ev-buzz-start-btn"
                                        onClick={() => onTrigger(event, { status: 'active', startTime: Date.now(), results: [] })}
                                        disabled={event.status === 'active'}
                                    >
                                        {t('classroomEvent.startCountdown') || 'Start Countdown'}
                                    </button>
                                    <button 
                                        className="ev-buzz-reset-btn"
                                        onClick={() => onTrigger(event, { status: 'idle', results: [] })}
                                    >
                                        <FaUndo style={{ marginRight: '6px' }} /> {t('classroomEvent.reset') || 'Reset'}
                                    </button>
                                </div>
                                
                                {/* Winners Display */}
                                {event.results && event.results.length > 0 && (
                                    <div className="ev-buzz-winners-list">
                                        <h4 style={{ color: '#475569', fontSize: '1rem', fontWeight: 'bold', marginBottom: '12px', textAlign: 'left', display: 'flex', alignItems: 'center' }}>
                                            <FaTrophy style={{ color: '#f59e0b', marginRight: '8px', fontSize: '1.2rem' }} /> 
                                            {t('classroomEvent.buzzResults') || 'Buzz Results'}
                                        </h4>
                                        <div className="ev-buzz-results-container" style={{ maxHeight: '220px', overflowY: 'auto', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {event.results.map((result, idx) => {
                                                const rank = idx + 1;
                                                let badgeStyle = {};
                                                let cardStyle = {
                                                    display: 'flex', alignItems: 'center', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', transition: 'all 0.2s', gap: '12px'
                                                };
                                                let rankIcon = null;

                                                if (rank === 1) {
                                                    badgeStyle = { background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: 'white', boxShadow: '0 2px 4px rgba(245, 158, 11, 0.2)' };
                                                    cardStyle = { ...cardStyle, background: 'linear-gradient(to right, #fffbeb, #ffffff)', border: '2px solid #fde68a', boxShadow: '0 4px 6px -1px rgba(245, 158, 11, 0.1)' };
                                                    rankIcon = <FaCrown style={{ marginRight: '4px' }} />;
                                                } else if (rank === 2) {
                                                    badgeStyle = { background: 'linear-gradient(135deg, #cbd5e1, #94a3b8)', color: 'white', boxShadow: '0 2px 4px rgba(148, 163, 184, 0.2)' };
                                                    cardStyle = { ...cardStyle, background: 'linear-gradient(to right, #f8fafc, #ffffff)', border: '1px solid #cbd5e1' };
                                                } else if (rank === 3) {
                                                    badgeStyle = { background: 'linear-gradient(135deg, #d97706, #b45309)', color: 'white', boxShadow: '0 2px 4px rgba(180, 83, 9, 0.2)' };
                                                    cardStyle = { ...cardStyle, background: 'linear-gradient(to right, #fff7ed, #ffffff)', border: '1px solid #fed7aa' };
                                                } else {
                                                    badgeStyle = { background: '#e2e8f0', color: '#64748b' };
                                                }

                                                return (
                                                    <div key={idx} style={cardStyle}>
                                                        <div style={{ ...badgeStyle, padding: '4px 8px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 'bold', minWidth: '48px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                            {rankIcon}{rank === 1 ? '1st' : (rank === 2 ? '2nd' : (rank === 3 ? '3rd' : `${rank}th`))}
                                                        </div>
                                                        <img 
                                                            src={getProfileImageSrc(result.photoURL, isGoogleUser(result))} 
                                                            alt={result.userName} 
                                                            style={{ width: rank === 1 ? '40px' : '36px', height: rank === 1 ? '40px' : '36px', borderRadius: '50%', objectFit: 'cover', border: rank === 1 ? '2px solid #f59e0b' : (rank === 2 ? '2px solid #94a3b8' : (rank === 3 ? '2px solid #d97706' : '1px solid #e2e8f0')) }}
                                                        />
                                                        <span style={{ fontWeight: rank <= 3 ? '700' : '600', color: rank === 1 ? '#92400e' : '#334155', flex: 1, textAlign: 'left', fontSize: rank === 1 ? '1.05rem' : '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                            {result.userName}
                                                        </span>
                                                        <span style={{ fontSize: '0.9rem', color: rank === 1 ? '#10b981' : '#64748b', fontFamily: 'monospace', background: rank === 1 ? '#ecfdf5' : '#f1f5f9', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold' }}>
                                                            {((result.timestamp - (event.startTime || result.timestamp)) / 1000).toFixed(2)}s
                                                        </span>
                                                    </div>
                                                );
                                            })}
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
                            <FaMagic style={{ color: '#fef08a' }} /> {t('classroomEvent.typeWordCloudTitle') || 'Word Cloud'} <FaMagic style={{ color: '#fef08a' }} />
                        </h2>
                        <p className="wc-header-subtitle">{event.config?.topic || t('classroomEvent.shareYourWords') || 'Share your words!'}</p>
                        {isCreator && (
                            <button
                                className="wc-present-btn"
                                title={t('classroomEvent.openPresentation') || 'Open Presentation Mode'}
                                onClick={() => window.open(`/presentation/${window.location.pathname.split('/')[2]}/${event.id}`, '_blank')}
                            >
                                <FaExternalLinkAlt style={{ marginRight: '6px' }} /> {t('classroomEvent.present') || 'Present'}
                            </button>
                        )}
                    </div>

                    <div className="wc-body-new">
                        {/* Word Cloud Preview */}
                        <div className="wc-preview-area">
                            {(!event.results || event.results.length === 0) ? (
                                <div className="wc-empty-state">
                                    <FaCloud style={{ fontSize: '3rem', opacity: 0.2, marginBottom: '12px' }} />
                                    <p>{t('classroomEvent.noWordsYet') || 'No words yet. Start typing!'}</p>
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
                                            placeholder={t('classroomEvent.typeYourWord') || 'Type your word here...'}
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
                                            {t('classroomEvent.send') || 'Send'}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="wc-submitted-msg">
                                        <span>{t('classroomEvent.sentCloud') || 'Sent! ☁️'}</span>
                                        <p>{t('classroomEvent.lookAtBoard') || 'Look at the board!'}</p>
                                    </div>
                                )}
                                <div className="wc-char-count">
                                    {t('classroomEvent.charCountLimit', { count: answerInput.length }) || `${answerInput.length}/25 characters`}
                                </div>
                            </div>
                        )}

                        {/* Word Count */}
                        <div className="random-participant-count">
                            <div className="rpc-left">
                                <FaCloud />
                                <span>{t('classroomEvent.totalWords') || 'Total Words'}</span>
                            </div>
                            <span className="rpc-right">{t('classroomEvent.submittedCount', { count: event.results?.length || 0 }) || `${event.results?.length || 0} submitted`}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Fallback for basic events */}
            {event.type === 'default' && <p>{event.description}</p>}

            {/* ✨ Student Ended Banner — compact inline bar */}
            {!isCreator && event.status === 'ended' && (
                <div className="ev-ended-banner">
                    <FaFlagCheckered /> <span>{t('classroomEvent.eventEnded') || 'Event Ended'}</span>
                    {event.config?.scoring?.enabled && <span className="ev-ended-pts"><FaStar /> {t('classroomEvent.scored') || 'Scored'}</span>}
                </div>
            )}

            {/* ✨ End & Score Footer — Creator view */}
            {isCreator && event.config?.scoring?.enabled && event.status !== 'ended' && (
                <div className="ev-end-score-footer">
                    <div className="ev-scoring-info">
                        <div className="ev-scoring-badge">
                            <FaStar style={{ color: '#f59e0b', marginRight: '4px' }} />
                            <span>{t('classroomEvent.scoringEnabled') || 'Scoring Enabled'}</span>
                        </div>
                        <span className="ev-scoring-points">
                            {event.type === 'poll' && event.config?.scoreConfig ? (t('classroomEvent.perOptionScoring') || 'Per-option scoring') : (t('classroomEvent.ptsPerParticipant', { points: event.config.scoring.points }) || `+${event.config.scoring.points} pts/participant`)}
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
                        {t('classroomEvent.endAndScore') || 'End & Score'}
                    </button>
                </div>
            )}
            {/* Creator Scored Badge */}
            {isCreator && event.status === 'ended' && event.config?.scoring?.enabled && (
                <div className="ev-scored-badge">
                    <FaTrophy style={{ color: '#f59e0b', marginRight: '6px' }} /> 
                    {event.type === 'poll' && event.config?.scoreConfig ? (t('classroomEvent.scoredPerOptionBadge') || 'Scored — Per-option') : (t('classroomEvent.scoredPtsBadge', { points: event.config.scoring.points }) || `Scored — +${event.config.scoring.points} pts`)}
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
                        {t('classroomEvent.endEvent') || 'End Event'}
                    </button>
                </div>
            )}
            {/* Non-scoring ended badge */}
            {event.status === 'ended' && !event.config?.scoring?.enabled && (
                <div className="ev-scored-badge" style={{ background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)', color: '#475569', borderColor: '#cbd5e1' }}>
                    <FaFlagCheckered style={{ color: '#6b7280', marginRight: '6px' }} /> {t('classroomEvent.eventEnded') || 'Event Ended'}
                </div>
            )}
        </div>
    );
};

export default ClassroomEvent;
