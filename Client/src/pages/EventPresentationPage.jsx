import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import WordCloudViz from '../components/events/WordCloudViz';
import { FaCloud } from 'react-icons/fa';
import '../CSS/ClassroomEvent.css';

const EventPresentationPage = () => {
    const { classId, eventId } = useParams();
    const [eventData, setEventData] = useState(null);
    const [loading, setLoading] = useState(true);

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

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
                
                const res = await axios.get(`${API_URL}/api/classrooms/${classId}`, config);
                if (res.data) {
                    const foundEvent = res.data.classroomEvents.find(e => String(e.id) === String(eventId));
                    if (foundEvent) {
                        setEventData(foundEvent);
                    } else {
                        console.error('Event not found in list');
                    }
                }

                socket = io(API_URL, {
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
    }, [classId, eventId]);

    if (loading) return <div className="pres-loading">Loading Word Cloud...</div>;
    if (!eventData) return <div className="pres-error">Event not found.</div>;

    const wordCount = eventData.results?.length || 0;

    return (
        <div className="presentation-page-container">
            <div className="pres-card">
                {/* Header */}
                <div className="pres-header">
                    <div className="pres-header-bg">
                        <FaCloud />
                    </div>
                    <h1>
                        {eventData.config?.topic || eventData.title}
                    </h1>
                    <p>Word Cloud — Live Presentation</p>
                </div>

                {/* Body - Word Cloud area */}
                <div className="pres-body">
                    {eventData.type === 'wordcloud' && (
                        <WordCloudViz results={eventData.results || []} config={eventData.config} />
                    )}
                </div>

                {/* Footer */}
                <div className="pres-footer">
                    <div className="pres-word-count">
                        <FaCloud /> {wordCount} words submitted
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
