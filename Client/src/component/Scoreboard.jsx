// src/component/Scoreboard.jsx

import React, { useState, useEffect } from 'react';
import Loader from './Loader';
import '../CSS/Scoreboard.css';
import { getProfileImageSrc, isGoogleUser } from '../utils/profileImageHelper';

const Scoreboard = ({ classroom, user, onUpdateScores }) => {
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

    return (
        <div className="scoreboard-container">
            <h1>Scoreboard</h1>
            <div className="table-responsive">
                <table className="scoreboard-table">
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Student Name</th>
                            {scoreCategories.map(category => (
                                <th key={category}>{category}</th>
                            ))}
                            <th>Total Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        {scores.sort((a, b) => b.totalScore - a.totalScore).map((score, index) => (
                            <tr key={score.student._id}>
                                <td>{index + 1}</td>
                                <td className="student-name-cell">
                                    <img 
                                        src={getProfileImageSrc(score.student.photoURL, isGoogleUser(score.student))}
                                        alt={score.student.displayName}
                                        className="student-profile-pic"
                                    />
                                    {score.student.displayName}
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
                                            score.categorizedScores[category] || 0
                                        )}
                                    </td>
                                ))}
                                <td>{score.totalScore}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {stats && (scores.length > 0) && (
                <div className="scoreboard-summary">
                    <h2>Summary of Scores</h2>
                    <div className="summary-grid">
                        <div className="summary-card">
                            <h3>Total Students Rated</h3>
                            <p>{stats.totalStudents}</p>
                        </div>
                        <div className="summary-card">
                            <h3>Overall Average Score</h3>
                            <p>{stats.overallAverage}</p>
                        </div>
                        <div className="summary-card">
                            <h3>Highest Total Score</h3>
                            <p>{stats.highestScore}</p>
                        </div>
                        <div className="summary-card">
                            <h3>Lowest Total Score</h3>
                            <p>{stats.lowestScore}</p>
                        </div>
                    </div>
                    
                    <h3>Average Score per Category:</h3>
                    <div className="bar-chart-container">
                        {Object.entries(stats.categoryAverages).map(([category, average]) => (
                            <div className="bar-chart-item" key={category}>
                                <div className="bar-label">{category}</div>
                                <div className="bar-wrapper">
                                    <div 
                                        className="bar-fill"
                                        style={{ width: `${(average / maxAverage) * 100}%` }}
                                    ></div>
                                    <div className="bar-value">{average.toFixed(2)}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Scoreboard;
