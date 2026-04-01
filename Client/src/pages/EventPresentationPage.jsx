import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import { useTranslation } from 'react-i18next';
import WordCloudViz from '../components/events/WordCloudViz';
import { FaCloud } from 'react-icons/fa';
import API_BASE_URL from '../config/api';
import '../CSS/ClassroomEvent.css';

const EventPresentationPage = () => {
    const { classId, eventId } = useParams();
    const { t } = useTranslation();
    const [eventData, setEventData] = useState(null);
    const [loading, setLoading] = useState(true);

    const tr = (key, defaultValue, options = {}) => t(key, { defaultValue, ...options });
    const SOCKET_URL = process.env.NODE_ENV === 'production'
        ? window.location.origin
        : (process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL || 'http://localhost:5000');

    useEffect(() => {
        let socket = null;

        const fetchDataAndConnect = async () => {
            try {
                const token = localStorage.getItem('authToken');
                const config = {
                    headers: {
                        'x-auth-token': token
                    }
                };
                
                const res = await axios.get(`${API_BASE_URL}/api/classrooms/${classId}`, config);
                if (res.data) {
                    const foundEvent = res.data.classroomEvents.find(e => String(e.id) === String(eventId));
                    if (foundEvent) {
                        setEventData(foundEvent);
                    } else {
                        console.error('Event not found in list');
                    }
                }

                socket = io(SOCKET_URL, {
                    auth: { token }
                });

                socket.on('connect', () => {
                    console.log('Presentation socket connected');
                    socket.emit('join-classroom', {
                        classId,
                        userId: 'presentation-view',
                        userName: 'Presentation View'
                    });
                });

                socket.on('classroom-event-updated', (data) => {
                    if (String(data.eventId) === String(eventId) && data.updates) {
                        setEventData(prev => ({ ...prev, ...data.updates }));
                    }
                });

                socket.on('classroom-event-triggered', (data) => {
                    if (String(data.eventId) === String(eventId) && data.updates) {
                        setEventData(prev => ({ ...prev, ...data.updates }));
                    }
                });

            } catch (err) {
                console.error("Error initializing presentation page:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDataAndConnect();

        return () => {
            if (socket) socket.disconnect();
        };
    }, [classId, eventId, SOCKET_URL]);

    if (loading) return <div className="pres-loading">{tr('classroomEvent.loadingWordCloud', 'Loading Word Cloud...')}</div>;
    if (!eventData) return <div className="pres-error">{tr('classroomEvent.presentationEventNotFound', 'Event not found.')}</div>;

    const wordCount = eventData.results?.length || 0;
    const uniqueWordCount = new Set(
        (eventData.results || [])
            .map(result => (result?.text || '').trim().toLowerCase())
            .filter(Boolean)
    ).size;

    return (
        <div className="presentation-page-container">
            <div className="pres-card">
                <div className="pres-header">
                    <div className="pres-header-bg">
                        <FaCloud />
                    </div>
                    <h1>
                        {eventData.config?.topic || eventData.title}
                    </h1>
                    <p>{tr('classroomEvent.wordCloudPresentationSubtitle', 'Word Cloud - Live Presentation')}</p>
                </div>

                <div className="pres-body">
                    {eventData.type === 'wordcloud' && (
                        <WordCloudViz results={eventData.results || []} variant="presentation" />
                    )}
                </div>

                <div className="pres-footer">
                    <div className="pres-metrics">
                        <div className="pres-word-count">
                            <FaCloud /> {tr('classroomEvent.wordCloudSubmittedWords', '{{count}} words submitted', { count: wordCount })}
                        </div>
                        <div className="pres-word-count subtle">
                            {tr('classroomEvent.wordCloudUniqueWordsCount', '{{count}} unique words', { count: uniqueWordCount })}
                        </div>
                    </div>
                    <div className="pres-live-badge">
                        <span className="pres-live-dot"></span>
                        LIVE
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventPresentationPage;
