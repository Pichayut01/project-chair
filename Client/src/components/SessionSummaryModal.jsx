// src/components/SessionSummaryModal.jsx

import React from 'react';
import '../CSS/SessionSummaryModal.css';
import { getProfileImageSrc, isGoogleUser, handleImageError } from '../utils/profileImageHelper';
import { useTranslation } from 'react-i18next';

const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
};

const getRankDisplay = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return index + 1;
};

const SessionSummaryModal = ({ sessionData, onClose }) => {
    const { t } = useTranslation();
    if (!sessionData) return null;

    const { durationSeconds, scoreChanges, summary } = sessionData;
    const topStudents = summary?.topStudents || [];

    // Build category breakdown per student
    const categoryMap = {};
    (scoreChanges || []).forEach(change => {
        if (!categoryMap[change.studentId]) categoryMap[change.studentId] = {};
        if (!categoryMap[change.studentId][change.category]) {
            categoryMap[change.studentId][change.category] = 0;
        }
        categoryMap[change.studentId][change.category] += change.pointsChange;
    });

    return (
        <div className="session-summary-overlay" onClick={onClose}>
            <div className="session-summary-modal" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="session-summary-header">
                    <h2>{t('sessionSummaryModal.title') || '🏁 Class Session Ended'}</h2>
                    <p className="session-subtitle">{t('sessionSummaryModal.subtitle') || "Here's what happened during this session"}</p>
                    <div className="session-stats-row">
                        <div className="session-stat-item">
                            <span className="session-stat-value">{formatDuration(durationSeconds || 0)}</span>
                            <span className="session-stat-label">{t('sessionSummaryModal.duration') || 'Duration'}</span>
                        </div>
                        <div className="session-stat-item">
                            <span className="session-stat-value">{summary?.studentsScored || 0}</span>
                            <span className="session-stat-label">{t('sessionSummaryModal.students') || 'Students'}</span>
                        </div>
                        <div className="session-stat-item">
                            <span className="session-stat-value">{summary?.totalScoreChanges || 0}</span>
                            <span className="session-stat-label">{t('sessionSummaryModal.scoreChanges') || 'Score Changes'}</span>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="session-summary-body">
                    {topStudents.length > 0 ? (
                        <>
                            <h3>{t('sessionSummaryModal.leaderboardTitle') || '🏆 Session Leaderboard'}</h3>
                            <div className="session-leaderboard">
                                {topStudents.map((student, index) => {
                                    const rankDisplay = getRankDisplay(index);
                                    const isNumericRank = typeof rankDisplay === 'number';
                                    const categories = categoryMap[student.studentId] || {};
                                    const categoryText = Object.entries(categories)
                                        .map(([cat, pts]) => `${cat}: ${pts > 0 ? '+' : ''}${pts}`)
                                        .join(', ');

                                    return (
                                        <div
                                            key={student.studentId}
                                            className={`session-rank-card ${index < 3 ? `rank-${index + 1}` : ''}`}
                                        >
                                            <div className={`session-rank-position ${isNumericRank ? 'numeric' : ''}`}>
                                                {rankDisplay}
                                            </div>
                                            <img referrerPolicy="no-referrer"
                                                src={getProfileImageSrc(student.photoURL, false)}
                                                alt={student.studentName}
                                                className="session-rank-avatar"
                                                onError={handleImageError}
                                            />
                                            <div className="session-rank-info">
                                                <div className="session-rank-name">{student.studentName}</div>
                                                {categoryText && (
                                                    <div className="session-rank-categories">{categoryText}</div>
                                                )}
                                            </div>
                                            <div className={`session-rank-points ${student.totalPoints < 0 ? 'negative' : ''}`}>
                                                {student.totalPoints > 0 ? '+' : ''}{student.totalPoints}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    ) : (
                        <div className="session-no-scores">
                            <div className="no-score-icon">📋</div>
                            <p>{t('sessionSummaryModal.noScores') || 'No scores were given during this session.'}</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="session-summary-footer">
                    <button className="session-close-btn" onClick={onClose}>
                        {t('sessionSummaryModal.closeBtn') || 'Close'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SessionSummaryModal;

