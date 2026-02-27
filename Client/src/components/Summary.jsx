// src/components/Summary.jsx

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import '../CSS/Summary.css';
import { getProfileImageSrc, isGoogleUser, handleImageError } from '../utils/profileImageHelper';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const Summary = ({ classId, user }) => {
    const [summaryData, setSummaryData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedStudentId, setSelectedStudentId] = useState('overview'); // 'overview' or student ID
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isDropdownOpen && !event.target.closest('.fs-custom-select-container')) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isDropdownOpen]);

    const fetchSummaryData = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/classrooms/${classId}`, {
                headers: { 'x-auth-token': user.token }
            });

            // Process data for comprehensive summary
            const classroom = response.data;
            const processedData = processClassroomData(classroom);
            setSummaryData(processedData);
            setLoading(false);
        } catch (err) {
            setError('Failed to load summary data');
            setLoading(false);
            console.error('Error fetching summary data:', err);
        }
    };

    const processClassroomData = (classroom) => {
        const students = classroom.participants || [];
        const studentScores = classroom.studentScores || {};
        const events = classroom.events || [];

        // Enhanced student data processing
        const studentData = students.map(student => {
            const scores = studentScores[student._id] || studentScores[student.id] || {};
            const scoreValues = Object.values(scores).filter(score => score !== null && score !== undefined && typeof score === 'number');

            // Calculate comprehensive metrics
            const totalScore = scoreValues.reduce((sum, score) => sum + score, 0);
            const avgScore = scoreValues.length > 0 ? totalScore / scoreValues.length : 0;
            const highestScore = scoreValues.length > 0 ? Math.max(...scoreValues) : 0;
            const lowestScore = scoreValues.length > 0 ? Math.min(...scoreValues) : 0;

            // Performance consistency (standard deviation of individual scores)
            const scoreVariance = scoreValues.length > 1 ?
                scoreValues.reduce((sum, score) => sum + Math.pow(score - avgScore, 2), 0) / (scoreValues.length - 1) : 0;
            const consistency = scoreValues.length > 1 ? Math.sqrt(scoreVariance) : 0;

            // Improved attendance calculation (based on actual events)
            const attendedEvents = events.filter(event =>
                event.attendees && event.attendees.includes(student._id || student.id)
            ).length;
            const totalEvents = events.length;
            const attendanceRate = totalEvents > 0 ? attendedEvents / totalEvents : 0;

            // Comprehensive score calculation (Adjusted formula)
            // Using totalScore directly is better for ranking than average score if events vary. 
            // Here, we'll continue using combinedScore logic for grading
            const performanceScore = avgScore * 0.5; // 50% average rating
            const attendanceScore = attendanceRate * 30; // 30% attendance
            const consistencyScore = consistency > 0 ? Math.max(0, 10 - consistency) * 2 : 20; // 20% consistency
            const combinedScore = (totalScore > 0 ? totalScore : 0); // Using raw total score heavily heavily requested usually

            return {
                id: student._id || student.id,
                name: student.displayName || 'Unknown',
                photoURL: student.photoURL,
                user: student,
                avgScore: avgScore,
                totalScore: totalScore,
                highestScore: highestScore,
                lowestScore: lowestScore,
                consistency: consistency,
                attendanceRate: attendanceRate,
                attendedEvents: attendedEvents,
                totalEvents: totalEvents,
                combinedScore: totalScore, // Treat total score as combined for standard bell curve
                group: student.group || 'A',
                grade: calculateGrade(totalScore), // Assuming a scale? Need to be careful. Will standardize below
                performanceLevel: getPerformanceLevel(totalScore)
            };
        });

        // Better grading using relative grading (Bell curve based)
        const scores = studentData.map(s => s.combinedScore);
        const mean = scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
        const stdDev = scores.length > 1 ? Math.sqrt(scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length) : 0;

        // Re-process properties that depend on class distribution
        studentData.forEach(student => {
            const zScore = stdDev > 0 ? (student.combinedScore - mean) / stdDev : 0;
            student.zScore = zScore;
            
            // Standardize grade based on typical bell curve 
            if (zScore >= 1.5) student.grade = 'A+';
            else if (zScore >= 1) student.grade = 'A';
            else if (zScore >= 0.5) student.grade = 'B+';
            else if (zScore >= 0) student.grade = 'B';
            else if (zScore >= -0.5) student.grade = 'C+';
            else if (zScore >= -1) student.grade = 'C';
            else if (zScore >= -1.5) student.grade = 'D';
            else student.grade = 'F';

            // Percentile estimation (approximation)
            const percentile = calculatePercentile(student.combinedScore, scores);
            student.percentile = percentile;
        });

        // Sort descending
        studentData.sort((a, b) => b.combinedScore - a.combinedScore);

        return {
            totalStudents: students.length,
            totalEvents: events.length,
            studentData: studentData,
            statistics: {
                mean: mean,
                stdDev: stdDev,
                median: calculateMedian(scores),
                min: scores.length > 0 ? Math.min(...scores) : 0,
                max: scores.length > 0 ? Math.max(...scores) : 0,
                topQuartile: calculateQuartile(scores, 0.75),
                bottomQuartile: calculateQuartile(scores, 0.25)
            },
            classMetrics: {
                avgAttendance: studentData.length > 0 ? studentData.reduce((sum, s) => sum + s.attendanceRate, 0) / studentData.length : 0,
            }
        };
    };

    const calculatePercentile = (score, allScores) => {
        if (allScores.length === 0) return 0;
        const below = allScores.filter(s => s < score).length;
        const equal = allScores.filter(s => s === score).length;
        return ((below + (0.5 * equal)) / allScores.length) * 100;
    };

    const calculateGrade = (score) => {
        if (score >= 85) return 'A';
        if (score >= 75) return 'B';
        if (score >= 65) return 'C';
        if (score >= 55) return 'D';
        return 'F';
    };

    const getPerformanceLevel = (score) => {
        if (score >= 85) return 'Excellent';
        if (score >= 70) return 'Good';
        if (score >= 55) return 'Average';
        if (score >= 40) return 'Below Average';
        return 'Needs Improvement';
    };

    const calculateMedian = (scores) => {
        if (scores.length === 0) return 0;
        const sorted = [...scores].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    };

    const calculateQuartile = (scores, quartile) => {
        if (scores.length === 0) return 0;
        const sorted = [...scores].sort((a, b) => a - b);
        const pos = (sorted.length - 1) * quartile;
        const base = Math.floor(pos);
        const rest = pos - base;
        if (sorted[base + 1] !== undefined) {
            return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
        } else {
            return sorted[base];
        }
    };

    useEffect(() => {
        if (user && user.token && classId) {
            fetchSummaryData();
        }
    }, [classId, user]);


    // Bell Curve Data Generator
    const chartData = useMemo(() => {
        if (!summaryData || summaryData.studentData.length === 0) return null;

        const mean = summaryData.statistics.mean;
        const stdDev = summaryData.statistics.stdDev > 0 ? summaryData.statistics.stdDev : 1; // Prevent division by zero
        
        let minScore = Math.floor(mean - 3 * stdDev);
        let maxScore = Math.ceil(mean + 3 * stdDev);
        if (minScore < 0) minScore = 0;

        // Ensure we cover the max actual score
        const actualMax = summaryData.statistics.max;
        if (actualMax > maxScore) maxScore = Math.ceil(actualMax + stdDev);

        const labels = [];
        const dataPDF = [];
        const step = Math.max(0.1, (maxScore - minScore) / 50);

        for (let x = minScore; x <= maxScore; x += step) {
            labels.push(x.toFixed(1));
            // Normal distribution formula
            const exponent = Math.exp(-Math.pow(x - mean, 2) / (2 * Math.pow(stdDev, 2)));
            const pdf = (1 / (stdDev * Math.sqrt(2 * Math.PI))) * exponent;
            dataPDF.push(pdf);
        }

        // Selected Student Highlight
        const datasets = [
            {
                label: 'Class Distribution',
                data: dataPDF,
                borderColor: '#2980b9',
                backgroundColor: 'rgba(41, 128, 185, 0.2)',
                borderWidth: 2,
                fill: true,
                pointRadius: 0,
                tension: 0.4,
            }
        ];

        if (selectedStudentId !== 'overview') {
            const student = summaryData.studentData.find(s => s.id === selectedStudentId);
            if (student) {
                // Find nearest label index to student score
                let closestIndex = 0;
                let minDiff = Infinity;
                labels.forEach((label, idx) => {
                    const diff = Math.abs(parseFloat(label) - student.combinedScore);
                    if (diff < minDiff) {
                        minDiff = diff;
                        closestIndex = idx;
                    }
                });

                const studentDataPoints = Array(labels.length).fill(null);
                studentDataPoints[closestIndex] = dataPDF[closestIndex]; // Put point on curve

                datasets.push({
                    label: `${student.name} (${student.combinedScore.toFixed(1)} pts)`,
                    data: studentDataPoints,
                    borderColor: '#e74c3c',
                    backgroundColor: '#e74c3c',
                    pointBackgroundColor: '#e74c3c',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    showLine: false, // Only show the point
                });
            }
        }

        return {
            labels,
            datasets
        };

    }, [summaryData, selectedStudentId]);

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    font: {
                        family: "'Inter', sans-serif",
                        size: 13
                    }
                }
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        if (context.dataset.label.includes('Distribution')) {
                            return 'Probability Density';
                        }
                        return context.dataset.label;
                    }
                }
            }
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Total Score',
                    font: {
                        size: 14,
                        family: "'Inter', sans-serif",
                        weight: '600'
                    }
                },
                grid: {
                    display: false
                }
            },
            y: {
                display: false, // Hide Y axis as probability density isn't very intuitive for users
                beginAtZero: true
            }
        }
    };


    if (loading) {
        return (
            <div className="formal-summary-container">
                <div className="loading-spinner"></div>
                <div className="loading-text">Loading comprehensive analysis...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="formal-summary-container">
                <div className="error-box">{error}</div>
            </div>
        );
    }

    const selectedStudent = selectedStudentId !== 'overview' 
        ? summaryData.studentData.find(s => s.id === selectedStudentId) 
        : null;

    const studentRank = selectedStudent 
        ? summaryData.studentData.findIndex(s => s.id === selectedStudent.id) + 1 
        : null;

    return (
        <div className="formal-summary-container">
            <div className="fs-header">
                <div className="fs-header-text">
                    <h2>Formal Performance Report</h2>
                    <p>Comprehensive statistical analysis of student performance</p>
                </div>
                
                <div className="fs-selector-wrapper">
                    <label className="fs-label">SELECT STUDENT:</label>
                    <div className="fs-custom-select-container">
                        <div 
                            className={`fs-custom-select-display ${isDropdownOpen ? 'active' : ''}`}
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        >
                            {selectedStudentId === 'overview' ? (
                                <div className="fs-custom-display-content">
                                    <span>--- Class Overview ---</span>
                                </div>
                            ) : (
                                (() => {
                                    const selected = summaryData?.studentData.find(s => s.id === selectedStudentId);
                                    if (!selected) return <span>--- Class Overview ---</span>;
                                    return (
                                        <div className="fs-custom-display-content">
                                            <img 
                                                src={getProfileImageSrc(selected.photoURL, isGoogleUser(selected.user))} 
                                                alt={selected.name}
                                                onError={handleImageError}
                                                className="fs-dropdown-avatar"
                                            />
                                            <span>{selected.name}</span>
                                        </div>
                                    );
                                })()
                            )}
                        </div>
                        {isDropdownOpen && (
                            <div className="fs-custom-select-dropdown">
                                <div 
                                    className={`fs-custom-option ${selectedStudentId === 'overview' ? 'selected' : ''}`}
                                    onClick={() => { setSelectedStudentId('overview'); setIsDropdownOpen(false); }}
                                >
                                    <div className="fs-custom-option-content overview">
                                        <span>--- Class Overview ---</span>
                                    </div>
                                </div>
                                {summaryData && summaryData.studentData.map(student => (
                                    <div 
                                        key={student.id} 
                                        className={`fs-custom-option ${selectedStudentId === student.id ? 'selected' : ''}`}
                                        onClick={() => { setSelectedStudentId(student.id); setIsDropdownOpen(false); }}
                                    >
                                        <div className="fs-custom-option-content">
                                            <img 
                                                src={getProfileImageSrc(student.photoURL, isGoogleUser(student.user))} 
                                                alt={student.name}
                                                onError={handleImageError}
                                                className="fs-dropdown-avatar"
                                            />
                                            <span>{student.name}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {summaryData && (
                <div className="fs-content">

                    {/* Left Column: Stats & Profile */}
                    <div className="fs-left-column">
                        
                        {/* Selected Student View */}
                        {selectedStudent ? (
                            <div className="fs-card profile-card">
                                <div className="student-profile-header">
                                    <img 
                                        src={getProfileImageSrc(selectedStudent.photoURL, isGoogleUser(selectedStudent.user))} 
                                        alt={selectedStudent.name}
                                        onError={handleImageError}
                                        className="student-avatar"
                                    />
                                    <div className="student-identifiers">
                                        <h3>{selectedStudent.name}</h3>
                                        <span className="student-group-badge">Group {selectedStudent.group}</span>
                                    </div>
                                </div>
                                
                                <div className="student-metrics-grid">
                                    <div className="s-metric">
                                        <label>Rank</label>
                                        <div className="val highlight">#{studentRank} <span className="sub">/ {summaryData.totalStudents}</span></div>
                                    </div>
                                    <div className="s-metric">
                                        <label>Total Score</label>
                                        <div className="val">{selectedStudent.combinedScore.toFixed(1)}</div>
                                    </div>
                                    <div className="s-metric">
                                        <label>Percentile</label>
                                        <div className="val">{selectedStudent.percentile.toFixed(1)}%</div>
                                    </div>
                                    <div className="s-metric">
                                        <label>Relative Grade</label>
                                        <div className={`val grade-text grade-${selectedStudent.grade.substring(0, 1).toLowerCase()}`}>{selectedStudent.grade}</div>
                                    </div>
                                    <div className="s-metric">
                                        <label>Z-Score</label>
                                        <div className="val">{selectedStudent.zScore > 0 ? '+' : ''}{selectedStudent.zScore.toFixed(2)}</div>
                                    </div>
                                    <div className="s-metric">
                                        <label>Attendance</label>
                                        <div className="val">{(selectedStudent.attendanceRate * 100).toFixed(0)}%</div>
                                    </div>
                                </div>

                                <div className="student-analysis-text">
                                    <h4>Performance Analysis</h4>
                                    <p>
                                        {selectedStudent.name} is performing in the <strong>Top {100 - Math.round(selectedStudent.percentile)}%</strong> of the class. 
                                        With a total score of <strong>{selectedStudent.combinedScore.toFixed(1)}</strong>, they are 
                                        {Math.abs(selectedStudent.zScore).toFixed(2)} standard deviations {selectedStudent.zScore >= 0 ? 'above' : 'below'} the class average.
                                        Their attendance rate is <strong>{(selectedStudent.attendanceRate * 100).toFixed(0)}%</strong>.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            /* Class Overview Profile Placeholder */
                            <div className="fs-card overview-card">
                                <h3>Class Statistics Overview</h3>
                                <div className="overview-stats-grid">
                                    <div className="s-metric">
                                        <label>Total Students</label>
                                        <div className="val">{summaryData.totalStudents}</div>
                                    </div>
                                    <div className="s-metric">
                                        <label>Class Average (μ)</label>
                                        <div className="val highlight">{summaryData.statistics.mean.toFixed(2)}</div>
                                    </div>
                                    <div className="s-metric">
                                        <label>Median Score</label>
                                        <div className="val">{summaryData.statistics.median.toFixed(2)}</div>
                                    </div>
                                    <div className="s-metric">
                                        <label>Standard Dev (σ)</label>
                                        <div className="val">{summaryData.statistics.stdDev.toFixed(2)}</div>
                                    </div>
                                    <div className="s-metric">
                                        <label>Highest Score</label>
                                        <div className="val">{summaryData.statistics.max.toFixed(2)}</div>
                                    </div>
                                    <div className="s-metric">
                                        <label>Avg Attendance</label>
                                        <div className="val">{(summaryData.classMetrics.avgAttendance * 100).toFixed(1)}%</div>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Right Column: Bell Curve Chart */}
                    <div className="fs-right-column">
                        <div className="fs-card chart-card">
                            <h3>Normal Distribution (Bell Curve)</h3>
                            <div className="chart-wrapper">
                                {chartData ? (
                                    <Line data={chartData} options={chartOptions} />
                                ) : (
                                    <div className="no-data">Insufficient data to generate curve</div>
                                )}
                            </div>
                            <div className="chart-explanation">
                                <p>
                                    This chart represents the probability distribution of scores across the class. 
                                    The curve peaks at the class average ({summaryData.statistics.mean.toFixed(1)}). 
                                    {selectedStudent && <span className="student-highlight-text"> The red dot indicates {selectedStudent.name}'s position relative to the rest of the class.</span>}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Detailed Table underneath */}
            {summaryData && selectedStudentId === 'overview' && (
                <div className="fs-card table-card">
                    <h3>Full Class Rankings</h3>
                    <div className="fs-table-wrapper">
                        <table className="fs-table">
                            <thead>
                                <tr>
                                    <th>Rank</th>
                                    <th>Student Name</th>
                                    <th>Group</th>
                                    <th>Total Score</th>
                                    <th>Z-Score</th>
                                    <th>Percentile</th>
                                    <th>Est. Grade</th>
                                </tr>
                            </thead>
                            <tbody>
                                {summaryData.studentData.map((student, idx) => (
                                    <tr key={student.id}>
                                        <td><strong>#{idx + 1}</strong></td>
                                        <td>
                                            <div className="td-profile">
                                                <img 
                                                    src={getProfileImageSrc(student.photoURL, isGoogleUser(student.user))} 
                                                    alt={student.name}
                                                    onError={handleImageError}
                                                />
                                                {student.name}
                                            </div>
                                        </td>
                                        <td>{student.group}</td>
                                        <td><strong>{student.combinedScore.toFixed(1)}</strong></td>
                                        <td>{student.zScore > 0 ? '+' : ''}{student.zScore.toFixed(2)}</td>
                                        <td>{student.percentile.toFixed(1)}%</td>
                                        <td><span className={`fs-grade fs-grade-${student.grade.substring(0, 1).toLowerCase()}`}>{student.grade}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Summary;
