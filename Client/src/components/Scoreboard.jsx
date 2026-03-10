// src/component/Scoreboard.jsx

import React, { useState, useEffect } from 'react';
import Loader from './Loader';
import '../CSS/Scoreboard.css';
import { getProfileImageSrc, isGoogleUser } from '../utils/profileImageHelper';
import { FaTrophy, FaMedal, FaCrown, FaUserGraduate, FaChartLine, FaStar, FaChartBar } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

const Scoreboard = ({ classroom, user, onUpdateScores }) => {
    const { t } = useTranslation();
    const [scores, setScores] = useState([]);
    const [scoreCategories, setScoreCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingCell, setEditingCell] = useState({ studentId: null, category: null });
    const [tempScore, setTempScore] = useState('');
    const [stats, setStats] = useState(null);

    useEffect(() => {
        if (classroom && classroom.participants) {
            const creatorIds = (classroom.creator || []).map(c => c._id);
            const studentScores = classroom.studentScores || {};

            // Filter out creators from participants
            const students = classroom.participants.filter(p => !creatorIds.includes(p._id));

            // Determine all unique score categories
            const allCategories = new Set();
            Object.values(studentScores).forEach(scoreRecord => {
                Object.keys(scoreRecord).forEach(category => allCategories.add(category));
            });
            const categories = Array.from(allCategories).sort(); // Sort categories alphabetically
            setScoreCategories(categories);

            const scoresData = students.map(student => {
                const studentScoreRecord = studentScores[student._id] || {};
                let totalScore = 0;
                const categorizedScores = {};

                categories.forEach(category => {
                    const score = studentScoreRecord[category] || 0;
                    categorizedScores[category] = score;
                    totalScore += score;
                });

                return {
                    student,
                    totalScore,
                    categorizedScores
                };
            });

            setScores(scoresData);
            setLoading(false);
        }
    }, [classroom]);

    useEffect(() => {
        if (scores.length > 0) {
            const totalStudents = scores.length;
            const overallTotalScores = scores.map(s => s.totalScore);
            const overallAverage = overallTotalScores.reduce((sum, score) => sum + score, 0) / totalStudents;
            const highestScore = Math.max(...overallTotalScores);
            const lowestScore = Math.min(...overallTotalScores);

            const categoryAverages = {};
            scoreCategories.forEach(category => {
                const categoryScores = scores.map(s => s.categorizedScores[category] || 0);
                const sum = categoryScores.reduce((s, score) => s + score, 0);
                categoryAverages[category] = sum / totalStudents;
            });

            setStats({
                totalStudents,
                overallAverage: overallAverage.toFixed(2),
                highestScore,
                lowestScore,
                categoryAverages
            });
        } else {
            setStats(null);
        }
    }, [scores, scoreCategories]);

    const handleCellClick = (studentId, category, currentScore) => {
        setEditingCell({ studentId, category });
        setTempScore(currentScore.toString());
    };

    const handleScoreChange = (e) => {
        setTempScore(e.target.value);
    };

    const handleSaveScore = async () => {
        const { studentId, category } = editingCell;
        if (!studentId || !category) return;

        const newScoreValue = parseFloat(tempScore);
        if (isNaN(newScoreValue)) {
            // Revert to original score if input is not a valid number
            setEditingCell({ studentId: null, category: null });
            setTempScore('');
            return;
        }

        // Update local state immediately for responsiveness
        setScores(prevScores => prevScores.map(s => {
            if (s.student._id === studentId) {
                const updatedCategorizedScores = { ...s.categorizedScores, [category]: newScoreValue };
                const updatedTotalScore = Object.values(updatedCategorizedScores).reduce((sum, score) => sum + score, 0);
                return { ...s, categorizedScores: updatedCategorizedScores, totalScore: updatedTotalScore };
            }
            return s;
        }));

        // Call parent function to update backend
        if (onUpdateScores) {
            onUpdateScores(studentId, category, newScoreValue);
        }

        setEditingCell({ studentId: null, category: null });
        setTempScore('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.target.blur(); // Trigger onBlur to save
        }
    };

    if (loading) {
        return <Loader />;
    }

    // Calculate max average score for chart scaling
    const maxAverage = stats && Object.values(stats.categoryAverages).length > 0
        ? Math.max(...Object.values(stats.categoryAverages)) : 1;

    // Calculate Top 3 Students
    const topStudents = [...scores].sort((a, b) => b.totalScore - a.totalScore).slice(0, 3);

    return (
        <div className="scoreboard-container">
            <div className="scoreboard-header">
                <h1><FaTrophy className="header-icon" /> {t('scoreboard.title') || 'Class Scoreboard'}</h1>
                <p>{t('scoreboard.subtitle') || 'Overview of student performance and engagement'}</p>
            </div>

            {stats && (scores.length > 0) && (
                <div className="scoreboard-dashboard">
                    {/* Left Column: Podium */}
                    <div className="dashboard-left">
                        {topStudents.length > 0 ? (
                            <div className="podium-section">
                                <h2 className="section-title">{t('scoreboard.topPerformers') || 'Top Performers'}</h2>
                                <div className="podium-container">
                                    {/* 2nd Place */}
                                    {topStudents[1] && (
                                        <div className="podium-item second">
                                            <div className="medal-icon silver"><FaMedal /></div>
                                            <img referrerPolicy="no-referrer"
                                                src={getProfileImageSrc(topStudents[1].student.photoURL, isGoogleUser(topStudents[1].student))}
                                                alt={topStudents[1].student.displayName}
                                                className="podium-avatar"
                                            />
                                            <div className="podium-rank">{t('scoreboard.rank2nd') || '2nd'}</div>
                                            <div className="podium-name">{topStudents[1].student.displayName}</div>
                                            <div className="podium-score">{topStudents[1].totalScore} {t('scoreboard.points') || 'pts'}</div>
                                        </div>
                                    )}

                                    {/* 1st Place */}
                                    {topStudents[0] && (
                                        <div className="podium-item first">
                                            <div className="crown-icon"><FaCrown /></div>
                                            <img referrerPolicy="no-referrer"
                                                src={getProfileImageSrc(topStudents[0].student.photoURL, isGoogleUser(topStudents[0].student))}
                                                alt={topStudents[0].student.displayName}
                                                className="podium-avatar"
                                            />
                                            <div className="podium-rank">{t('scoreboard.rank1st') || '1st'}</div>
                                            <div className="podium-name">{topStudents[0].student.displayName}</div>
                                            <div className="podium-score">{topStudents[0].totalScore} {t('scoreboard.points') || 'pts'}</div>
                                        </div>
                                    )}

                                    {/* 3rd Place */}
                                    {topStudents[2] && (
                                        <div className="podium-item third">
                                            <div className="medal-icon bronze"><FaMedal /></div>
                                            <img referrerPolicy="no-referrer"
                                                src={getProfileImageSrc(topStudents[2].student.photoURL, isGoogleUser(topStudents[2].student))}
                                                alt={topStudents[2].student.displayName}
                                                className="podium-avatar"
                                            />
                                            <div className="podium-rank">{t('scoreboard.rank3rd') || '3rd'}</div>
                                            <div className="podium-name">{topStudents[2].student.displayName}</div>
                                            <div className="podium-score">{topStudents[2].totalScore} {t('scoreboard.points') || 'pts'}</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="empty-state-podium">
                                <FaTrophy size={48} color="#ccc" />
                                <p>{t('scoreboard.noScores') || 'No scores yet. Start assigning points!'}</p>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Stats & Charts */}
                    <div className="dashboard-right">
                        {/* Stats Cards */}
                        <div className="stats-grid">
                            <div className="stat-card students">
                                <div className="stat-icon"><FaUserGraduate /></div>
                                <div className="stat-info">
                                    <h3>{t('scoreboard.activeStudents') || 'Active Students'}</h3>
                                    <p>{stats.totalStudents}</p>
                                </div>
                            </div>
                            <div className="stat-card average">
                                <div className="stat-icon"><FaChartLine /></div>
                                <div className="stat-info">
                                    <h3>{t('scoreboard.classAverage') || 'Class Average'}</h3>
                                    <p>{stats.overallAverage}</p>
                                </div>
                            </div>
                            <div className="stat-card highest">
                                <div className="stat-icon"><FaStar /></div>
                                <div className="stat-info">
                                    <h3>{t('scoreboard.highestScore') || 'Highest Score'}</h3>
                                    <p>{stats.highestScore}</p>
                                </div>
                            </div>
                            <div className="stat-card lowest">
                                <div className="stat-icon"><FaChartBar /></div>
                                <div className="stat-info">
                                    <h3>{t('scoreboard.lowestScore') || 'Lowest Score'}</h3>
                                    <p>{stats.lowestScore}</p>
                                </div>
                            </div>
                        </div>

                        {/* Category Chart */}
                        <div className="chart-section">
                            <h2 className="section-title">{t('scoreboard.categoryBreakdown') || 'Category Breakdown'}</h2>
                            <div className="bar-chart-container">
                                {Object.entries(stats.categoryAverages).map(([category, average]) => {
                                    // Calculate percentage based on max average (absolute)
                                    const absAverage = Math.abs(average);
                                    const maxAbsAverage = Math.max(...Object.values(stats.categoryAverages).map(Math.abs), 1);
                                    const widthPercentage = (absAverage / maxAbsAverage) * 100;
                                    const isNegative = average < 0;

                                    return (
                                        <div className="bar-chart-item" key={category}>
                                            <div className="bar-info">
                                                <span className="bar-label">{category}</span>
                                                <span className={`bar-value ${isNegative ? 'negative' : 'positive'}`}>
                                                    {average.toFixed(1)}
                                                </span>
                                            </div>
                                            <div className="bar-track">
                                                <div
                                                    className={`bar-fill ${isNegative ? 'negative' : 'positive'}`}
                                                    style={{ width: `${widthPercentage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="table-section">
                <h2 className="section-title">{t('scoreboard.detailedScores') || 'Detailed Scores'}</h2>
                <div className="table-responsive">
                    <table className="scoreboard-table">
                        <thead>
                            <tr>
                                <th>{t('scoreboard.rankHeader') || 'Rank'}</th>
                                <th>{t('scoreboard.studentHeader') || 'Student'}</th>
                                {scoreCategories.map(category => (
                                    <th key={category}>{category}</th>
                                ))}
                                <th>{t('scoreboard.totalHeader') || 'Total'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {scores.sort((a, b) => b.totalScore - a.totalScore).map((score, index) => (
                                <tr key={score.student._id} className={index < 3 ? `top-rank rank-${index + 1}` : ''}>
                                    <td>
                                        <span className="rank-badge">{index + 1}</span>
                                    </td>
                                    <td className="student-name-cell">
                                        <img referrerPolicy="no-referrer"
                                            src={getProfileImageSrc(score.student.photoURL, isGoogleUser(score.student))}
                                            alt={score.student.displayName}
                                            className="student-profile-pic"
                                        />
                                        <div className="student-name-text">
                                            {score.student.displayName}
                                            {index === 0 && <FaCrown className="rank-icon gold" />}
                                        </div>
                                    </td>
                                    {scoreCategories.map(category => (
                                        <td
                                            key={category}
                                            onClick={() => handleCellClick(score.student._id, category, score.categorizedScores[category] || 0)}
                                            className="score-cell"
                                        >
                                            {editingCell.studentId === score.student._id && editingCell.category === category ? (
                                                <input
                                                    type="number"
                                                    value={tempScore}
                                                    onChange={handleScoreChange}
                                                    onBlur={handleSaveScore}
                                                    onKeyDown={handleKeyDown}
                                                    autoFocus
                                                    className="score-input"
                                                />
                                            ) : (
                                                <span className={`score-value ${(score.categorizedScores[category] || 0) > 0 ? 'positive' : 'neutral'}`}>
                                                    {score.categorizedScores[category] || 0}
                                                </span>
                                            )}
                                        </td>
                                    ))}
                                    <td className="total-score-cell">{score.totalScore}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Scoreboard;

