import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getProfileImageSrc, isGoogleUser, handleImageError } from '../utils/profileImageHelper';
import Swal from 'sweetalert2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import '../CSS/AttendanceTracker.css';

ChartJS.register(ArcElement, Tooltip, Legend);

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL || 'http://localhost:5000';

const AttendanceTracker = ({ classroom, user }) => {
    const isCreator = classroom?.creator?.some(c => c === user.id || c._id === user.id || c.toString() === user.id);
    const [attendance, setAttendance] = useState(classroom?.attendance || {});
    const [attendanceDays, setAttendanceDays] = useState(classroom?.attendanceDays || 20);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('tracking'); // 'tracking' or 'summary'

    useEffect(() => {
        if (classroom) {
            setAttendance(classroom.attendance || {});
            setAttendanceDays(classroom.attendanceDays || 20);
        }
    }, [classroom]);

    const handleAddDay = () => {
        if (!isCreator) return;
        setAttendanceDays(prev => prev + 1);
        saveAttendanceToDb(attendance, attendanceDays + 1);
    };

    const handleRemoveDay = () => {
        if (!isCreator) return;
        if (attendanceDays > 1) {
            setAttendanceDays(prev => prev - 1);
            saveAttendanceToDb(attendance, attendanceDays - 1);
        }
    };

    const cycleAttendanceState = (studentId, dayIndex) => {
        if (!isCreator) return;

        const currentState = attendance[studentId]?.[dayIndex] || 'none';
        let nextState;
        
        switch (currentState) {
            case 'none': nextState = 'present'; break;
            case 'present': nextState = 'absent'; break;
            case 'absent': nextState = 'late'; break;
            case 'late': nextState = 'leave'; break;
            case 'leave': nextState = 'none'; break;
            default: nextState = 'none';
        }

        const newAttendance = {
            ...attendance,
            [studentId]: {
                ...(attendance[studentId] || {}),
                [dayIndex]: nextState
            }
        };

        setAttendance(newAttendance);
        saveAttendanceToDb(newAttendance, attendanceDays);
    };

    const markAllPresent = (dayIndex) => {
        if (!isCreator) return;

        const newAttendance = { ...attendance };
        participants.forEach(student => {
            if (!newAttendance[student._id]) {
                newAttendance[student._id] = {};
            }
            newAttendance[student._id][dayIndex] = 'present';
        });

        setAttendance(newAttendance);
        saveAttendanceToDb(newAttendance, attendanceDays);
    };

    const saveAttendanceToDb = async (newAttendance, newDays) => {
        if (!isCreator) return;
        setIsSaving(true);
        console.log(`[DEBUG] saving attendance to: ${API_BASE_URL}/api/classrooms/${classroom._id}/attendance`);
        try {
            const response = await axios.put(`${API_BASE_URL}/api/classrooms/${classroom._id}/attendance`, {
                attendance: newAttendance,
                attendanceDays: newDays
            }, {
                headers: { 'x-auth-token': user.token }
            });
            console.log('[DEBUG] save attendance response:', response.data);
        } catch (error) {
            console.error('Error saving attendance:', error);
            if (error.response) {
                console.error('[DEBUG] Save error response data:', error.response.data);
                console.error('[DEBUG] Save error status:', error.response.status);
            }
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to save attendance.',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            });
        } finally {
            setIsSaving(false);
        }
    };

    const renderCellContent = (state) => {
        switch (state) {
            case 'present': return <span className="att-present" title="Present">/</span>;
            case 'absent': return <span className="att-absent" title="Absent">X</span>;
            case 'late': return <span className="att-late" title="Late">L</span>;
            case 'leave': return <span className="att-leave" title="Leave">V</span>;
            default: return null;
        }
    };

    if (!classroom) return <div>Loading...</div>;

    const participants = classroom.participants || [];
    const daysArray = Array.from({ length: attendanceDays }, (_, i) => i + 1);

    // --- Summary Calculations ---
    const studentStats = participants.map(student => {
        const studentRecord = attendance[student._id] || {};
        const stats = { present: 0, absent: 0, late: 0, leave: 0, none: 0, totalTracked: 0 };
        
        for (let i = 1; i <= attendanceDays; i++) {
            const state = studentRecord[i] || 'none';
            stats[state]++;
            if (state !== 'none') stats.totalTracked++;
        }
        
        // Calculate percentage of positive attendance (Present + Late / Total Tracked)
        // Adjust formula as per specific school rules if Late counts differently
        const attendedDays = stats.present + stats.late;
        const percentage = stats.totalTracked > 0 
            ? Math.round((attendedDays / stats.totalTracked) * 100) 
            : 0;

        return { ...student, stats, percentage };
    });

    // Global Stats for Chart
    const globalStats = { present: 0, absent: 0, late: 0, leave: 0 };
    studentStats.forEach(s => {
        globalStats.present += s.stats.present;
        globalStats.absent += s.stats.absent;
        globalStats.late += s.stats.late;
        globalStats.leave += s.stats.leave;
    });

    const chartData = {
        labels: ['Present', 'Absent', 'Late', 'Leave'],
        datasets: [
            {
                data: [globalStats.present, globalStats.absent, globalStats.late, globalStats.leave],
                backgroundColor: [
                    '#16a34a', // green
                    '#dc2626', // red
                    '#ca8a04', // yellow
                    '#2563eb', // blue
                ],
                hoverBackgroundColor: [
                    '#15803d',
                    '#b91c1c',
                    '#a16207',
                    '#1d4ed8',
                ],
                borderWidth: 1,
            },
        ],
    };

    return (
        <div className="attendance-tracker-container">
            <div className="attendance-header">
                <h2>Attendance</h2>
                
                <div className="attendance-tabs">
                    <button 
                        className={`tab-btn ${activeTab === 'tracking' ? 'active' : ''}`}
                        onClick={() => setActiveTab('tracking')}
                    >
                        Tracking
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
                        onClick={() => setActiveTab('summary')}
                    >
                        Summary
                    </button>
                </div>

                {isCreator && activeTab === 'tracking' && (
                    <div className="attendance-controls">
                        <button className="btn outline" onClick={handleRemoveDay} disabled={attendanceDays <= 1 || isSaving}>
                            - Reduce Day
                        </button>
                        <span className="days-label">Days: {attendanceDays}</span>
                        <button className="btn outline" onClick={handleAddDay} disabled={isSaving}>
                            + Add Day
                        </button>
                        {isSaving && <span className="saving-indicator">Saving...</span>}
                    </div>
                )}
            </div>

            {activeTab === 'tracking' ? (
                <>
                    <div className="attendance-table-wrapper">
                        <table className="attendance-table">
                            <thead>
                                <tr>
                                    <th className="sticky-col name-col">Student</th>
                                    {daysArray.map(day => (
                                        <th 
                                            key={`header-day-${day}`} 
                                            className={`day-col ${isCreator ? 'clickable-header' : ''}`}
                                            onClick={() => isCreator && markAllPresent(day)}
                                            title={isCreator ? "Mark all as present" : ""}
                                        >
                                            D{day}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {participants.length === 0 ? (
                                    <tr>
                                        <td colSpan={attendanceDays + 1} className="no-data">No students in this classroom yet.</td>
                                    </tr>
                                ) : (
                                    participants.map(student => (
                                        <tr key={student._id}>
                                            <td className="sticky-col name-col">
                                                <div className="student-info">
                                                    <img 
                                                        src={getProfileImageSrc(student.photoURL, isGoogleUser(student))} 
                                                        alt={student.displayName}
                                                        onError={handleImageError}
                                                        className="student-avatar"
                                                    />
                                                    <span className="student-name">{student.displayName}</span>
                                                </div>
                                            </td>
                                            {daysArray.map(day => (
                                                <td 
                                                    key={`cell-${student._id}-${day}`}
                                                    className={`day-cell ${isCreator ? 'clickable' : ''} ${attendance[student._id]?.[day] || 'none'}`}
                                                    onClick={() => cycleAttendanceState(student._id, day)}
                                                >
                                                    {renderCellContent(attendance[student._id]?.[day])}
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    <div className="attendance-legend">
                        <div className="legend-item"><span className="legend-icon present">/</span> Present</div>
                        <div className="legend-item"><span className="legend-icon absent">X</span> Absent</div>
                        <div className="legend-item"><span className="legend-icon late">L</span> Late</div>
                        <div className="legend-item"><span className="legend-icon leave">V</span> Leave</div>
                        <div className="legend-item"><span className="legend-icon empty"></span> None</div>
                    </div>
                </>
            ) : (
                <div className="attendance-summary-view">
                    <div className="summary-layout">
                        <div className="summary-table-container">
                            <h3>Individual Summary</h3>
                            <div className="summary-table-wrapper">
                                <table className="summary-table">
                                    <thead>
                                        <tr>
                                            <th>Student</th>
                                            <th className="att-present">Present</th>
                                            <th className="att-absent">Absent</th>
                                            <th className="att-late">Late</th>
                                            <th className="att-leave">Leave</th>
                                            <th>%</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {studentStats.map(student => (
                                            <tr key={student._id}>
                                                <td className="student-info">
                                                    <img 
                                                        src={getProfileImageSrc(student.photoURL, isGoogleUser(student))} 
                                                        alt={student.displayName}
                                                        onError={handleImageError}
                                                        className="student-avatar"
                                                    />
                                                    <span className="student-name">{student.displayName}</span>
                                                </td>
                                                <td className="stat-num">{student.stats.present}</td>
                                                <td className="stat-num">{student.stats.absent}</td>
                                                <td className="stat-num">{student.stats.late}</td>
                                                <td className="stat-num">{student.stats.leave}</td>
                                                <td className="stat-num bold">
                                                    <span className={student.percentage >= 80 ? 'high-score' : student.percentage >= 50 ? 'mid-score' : 'low-score'}>
                                                        {student.percentage}%
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {studentStats.length === 0 && (
                                            <tr>
                                                <td colSpan="6" className="no-data">No students to summarize.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="summary-chart-container">
                            <h3>Class Statistics</h3>
                            {globalStats.present === 0 && globalStats.absent === 0 && globalStats.late === 0 && globalStats.leave === 0 ? (
                                <div className="no-chart-data">No attendance data recorded yet.</div>
                            ) : (
                                <div className="chart-wrapper">
                                    <Doughnut 
                                        data={chartData} 
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: {
                                                legend: {
                                                    position: 'bottom',
                                                }
                                            }
                                        }} 
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttendanceTracker;
