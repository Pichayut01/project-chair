// src/components/SessionHistory.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getProfileImageSrc, handleImageError } from '../utils/profileImageHelper';
import '../CSS/SessionHistory.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const formatDuration = (seconds) => {
    if (!seconds) return '0s';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
};

const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
};

const getRankDisplay = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
};

const SessionHistory = ({ classId, user }) => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        fetchSessions();
    }, [classId]);

    const fetchSessions = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE_URL}/api/classrooms/${classId}/sessions`, {
                headers: { 'x-auth-token': user.token }
            });
            setSessions(res.data.sessions || []);
            setTotal(res.data.total || 0);
        } catch (err) {
            console.error('Error fetching sessions:', err);
        } finally {
            setLoading(false);
        }
    };

    // Group sessions by date
    const groupedSessions = sessions.reduce((groups, session) => {
        const dateKey = formatDate(session.startedAt);
        if (!groups[dateKey]) groups[dateKey] = [];
        groups[dateKey].push(session);
        return groups;
    }, {});

    if (loading) {
        return (
            <div className="session-history-loading">
                <div className="session-loading-spinner" />
                <p>Loading session history...</p>
            </div>
        );
    }

    if (sessions.length === 0) {
        return (
            <div className="session-history-empty">
                <div className="empty-icon">📚</div>
                <h3>No Teaching Sessions Yet</h3>
                <p>Start a teaching session from your classroom to see summaries here.</p>
            </div>
        );
    }

    return (
        <div className="session-history-container">
            <div className="session-history-header">
                <h2>📖 Class Sessions</h2>
                <span className="session-count">{total} session{total !== 1 ? 's' : ''}</span>
            </div>

            {Object.entries(groupedSessions).map(([dateKey, dateSessions]) => (
                <div key={dateKey} className="session-date-group">
                    <div className="session-date-label">{dateKey}</div>
                    <div className="session-cards-list">
                        {dateSessions.map(session => {
                            const isExpanded = expandedId === session._id;
                            const topStudents = session.summary?.topStudents || [];
                            const startedByName = session.startedBy?.displayName || 'Teacher';

                            return (
                                <div
                                    key={session._id}
                                    className={`session-history-card ${isExpanded ? 'expanded' : ''}`}
                                >
                                    <div
                                        className="session-card-header"
                                        onClick={() => setExpandedId(isExpanded ? null : session._id)}
                                    >
                                        <div className="session-card-time">
                                            <span className="session-time-range">
                                                {formatTime(session.startedAt)}
                                                {session.endedAt && ` — ${formatTime(session.endedAt)}`}
                                            </span>
                                            <span className="session-duration-badge">
                                                ⏱ {formatDuration(session.durationSeconds)}
                                            </span>
                                        </div>
                                        <div className="session-card-stats">
                                            <span className="session-mini-stat">
                                                👤 {session.summary?.studentsScored || 0} students
                                            </span>
                                            <span className="session-mini-stat">
                                                ⭐ {session.summary?.totalScoreChanges || 0} changes
                                            </span>
                                            <span className="session-started-by">
                                                by {startedByName}
                                            </span>
                                        </div>
                                        <div className="session-expand-icon">
                                            {isExpanded ? '▲' : '▼'}
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div className="session-card-body">
                                            {topStudents.length > 0 ? (
                                                <div className="session-mini-leaderboard">
                                                    {topStudents.map((student, idx) => (
                                                        <div key={student.studentId} className={`session-mini-rank ${idx < 3 ? `mini-rank-${idx + 1}` : ''}`}>
                                                            <span className="mini-rank-pos">{getRankDisplay(idx)}</span>
                                                            <img
                                                                src={getProfileImageSrc(student.photoURL, false)}
                                                                alt={student.studentName}
                                                                className="mini-rank-avatar"
                                                                onError={handleImageError}
                                                            />
                                                            <span className="mini-rank-name">{student.studentName}</span>
                                                            <span className={`mini-rank-pts ${student.totalPoints < 0 ? 'negative' : ''}`}>
                                                                {student.totalPoints > 0 ? '+' : ''}{student.totalPoints} pts
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="session-no-data">No scores recorded in this session.</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default SessionHistory;
