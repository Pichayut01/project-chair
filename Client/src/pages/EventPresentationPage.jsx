import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client'; // ✨ Import io directly
import WordCloudViz from '../components/events/WordCloudViz';
import '../CSS/ClassroomEvent.css'; // Reuse styles

const EventPresentationPage = () => {
    const { classId, eventId } = useParams();
    // Remove useSocket hook usage
    const [eventData, setEventData] = useState(null);
    const [loading, setLoading] = useState(true);

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    // Fetch initial data & Socket Connection
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
                
                console.log('Fetching class data for:', classId);
                const res = await axios.get(`${API_URL}/api/classrooms/${classId}`, config);
                console.log('Class data fetched:', res.data);
                if (res.data) {
                    const foundEvent = res.data.classroomEvents.find(e => String(e.id) === String(eventId));
                    if (foundEvent) {
                        setEventData(foundEvent);
                    } else {
                        console.error('Event not found in list');
                    }
                }

                // ✨ Initialize Socket Connection
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

                // Listen for updates
                socket.on('classroom-event-updated', (data) => {
                    console.log('Socket update received:', data);
                    if (String(data.eventId) === String(eventId) && data.updates) {
                        setEventData(prev => ({ ...prev, ...data.updates }));
                    }
                });

                socket.on('classroom-event-triggered', (data) => {
                    console.log('Socket trigger received:', data);
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

    if (loading) return <div className="presentation-loading">Loading...</div>;
    if (!eventData) return <div className="presentation-error">Event not found.</div>;

    return (
        <div className="presentation-page-container" style={{ 
            minHeight: '100vh', 
            background: 'linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem'
        }}>
            <h1 style={{ 
                fontSize: '3rem', 
                marginBottom: '2rem', 
                color: '#1e293b',
                textShadow: '2px 2px 0px white'
            }}>
                {eventData.config?.topic || eventData.title}
            </h1>

            {eventData.type === 'wordcloud' && (
                <div style={{ width: '100%', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <WordCloudViz results={eventData.results || []} config={eventData.config} />
                </div>
            )}
            
            {/* Can extend for Poll results later */}
        </div>
    );
};

export default EventPresentationPage;
