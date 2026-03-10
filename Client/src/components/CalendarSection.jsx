// src/components/CalendarSection.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../CSS/CalendarSection.css';

const API_BASE_URL = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/* ─── SVG Icons ─── */
const ChevronLeft = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
);
const ChevronRight = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
);
const ClockIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);
const StarIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
);
const CalendarBigIcon = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#0aa158" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        <circle cx="12" cy="15" r="2" fill="#0aa158" stroke="none"/>
    </svg>
);
const SuccessBigIcon = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
);

const CheckCircleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
);

const CalendarSection = ({ classId, user, isCreator, classroom }) => {
    const navigate = useNavigate();
    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(null);

    const fetchAssignments = useCallback(async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE_URL}/api/classwork/${classId}`, {
                headers: { 'x-auth-token': user.token }
            });
            setAssignments(res.data);
        } catch (err) {
            console.error('Error fetching assignments for calendar:', err);
        } finally {
            setLoading(false);
        }
    }, [classId, user.token]);

    useEffect(() => { fetchAssignments(); }, [fetchAssignments]);

    /* ─── Helpers ─── */
    const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();

    const isSameDay = (d1, d2) =>
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();

    const isToday = (day) => isSameDay(new Date(currentYear, currentMonth, day), today);

    // Build map: day -> assignments
    const assignmentsByDay = {};
    assignments.forEach(a => {
        if (!a.dueDate) return;
        const d = new Date(a.dueDate);
        if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
            const key = d.getDate();
            if (!assignmentsByDay[key]) assignmentsByDay[key] = [];
            assignmentsByDay[key].push(a);
        }
    });

    const selectedAssignments = selectedDate ? (assignmentsByDay[selectedDate] || []) : [];

    // Upcoming assignments (from today onwards, sorted by due date)
    const upcomingAssignments = assignments
        .filter(a => a.dueDate && new Date(a.dueDate) >= new Date(today.getFullYear(), today.getMonth(), today.getDate()))
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    // For students: Overdue assignments
    const overdueAssignments = assignments
        .filter(a => a.dueDate && new Date(a.dueDate) < new Date(today.getFullYear(), today.getMonth(), today.getDate()))
        .sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate));

    // For teachers: All assignments ordered by approaching or recent deadlines to show grading status
    const gradingAssignments = assignments
        .filter(a => a.submissionStats) // ensure it has stats
        .sort((a, b) => new Date(b.dueDate || b.createdAt) - new Date(a.dueDate || a.createdAt));

    /* ─── Navigation ─── */
    const prevMonth = () => {
        setSelectedDate(null);
        if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
        else setCurrentMonth(m => m - 1);
    };
    const nextMonth = () => {
        setSelectedDate(null);
        if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
        else setCurrentMonth(m => m + 1);
    };
    const goToToday = () => {
        setSelectedDate(null);
        setCurrentMonth(today.getMonth());
        setCurrentYear(today.getFullYear());
    };

    /* ─── Build Calendar Grid ─── */
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const prevMonthDays = getDaysInMonth(currentMonth === 0 ? 11 : currentMonth - 1, currentMonth === 0 ? currentYear - 1 : currentYear);

    const calendarCells = [];
    // Leading days from previous month
    for (let i = firstDay - 1; i >= 0; i--) {
        calendarCells.push({ day: prevMonthDays - i, isOtherMonth: true });
    }
    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
        calendarCells.push({ day: d, isOtherMonth: false });
    }
    // Trailing days to fill 6 rows
    const remaining = 42 - calendarCells.length;
    for (let i = 1; i <= remaining; i++) {
        calendarCells.push({ day: i, isOtherMonth: true });
    }

    const formatTime = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const getDaysRemaining = (dateStr) => {
        const due = new Date(dateStr);
        const now = new Date();
        const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
        if (diff === 0) return 'Due today';
        if (diff === 1) return 'Due tomorrow';
        if (diff < 0) return `${Math.abs(diff)}d overdue`;
        return `${diff}d left`;
    };

    if (loading) {
        return (
            <div className="cal-container">
                <div className="cal-loading">
                    <div className="cal-loading-spinner" />
                    <span>Loading calendar...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="cal-container">
            {/* ═══ Calendar Card ═══ */}
            <div className="cal-card cal-calendar-card">
                {/* Header */}
                <div className="cal-header">
                    <div className="cal-header-left">
                        <h2 className="cal-month-title">{MONTHS[currentMonth]}</h2>
                        <span className="cal-year">{currentYear}</span>
                    </div>
                    <div className="cal-header-right">
                        <button className="cal-today-btn" onClick={goToToday}>Today</button>
                        <button className="cal-nav-btn" onClick={prevMonth}><ChevronLeft /></button>
                        <button className="cal-nav-btn" onClick={nextMonth}><ChevronRight /></button>
                    </div>
                </div>

                {/* Day Headers */}
                <div className="cal-grid cal-day-headers">
                    {DAYS.map(d => <div key={d} className="cal-day-header">{d}</div>)}
                </div>

                {/* Calendar Grid */}
                <div className="cal-grid cal-dates">
                    {calendarCells.map((cell, i) => {
                        const hasAssignments = !cell.isOtherMonth && assignmentsByDay[cell.day];
                        const isSelected = !cell.isOtherMonth && selectedDate === cell.day;
                        const isTodayCell = !cell.isOtherMonth && isToday(cell.day);
                        const count = hasAssignments ? assignmentsByDay[cell.day].length : 0;

                        return (
                            <div
                                key={i}
                                className={`cal-date-cell ${cell.isOtherMonth ? 'cal-other-month' : ''} ${isTodayCell ? 'cal-today' : ''} ${isSelected ? 'cal-selected' : ''} ${hasAssignments ? 'cal-has-event' : ''}`}
                                onClick={() => !cell.isOtherMonth && setSelectedDate(cell.day === selectedDate ? null : cell.day)}
                            >
                                <span className="cal-date-num">{cell.day}</span>
                                {hasAssignments && (
                                    <>
                                        <div className="cal-dots">
                                            {count <= 3 ? (
                                                Array.from({ length: count }).map((_, j) => <span key={j} className="cal-dot" />)
                                            ) : (
                                                <>
                                                    <span className="cal-dot" />
                                                    <span className="cal-dot" />
                                                    <span className="cal-dot-count">+{count - 2}</span>
                                                </>
                                            )}
                                        </div>
                                        <div className="cal-tooltip">
                                            <div className="cal-tooltip-header">
                                                <span>{count} assignment{count !== 1 ? 's' : ''}</span>
                                            </div>
                                            <ul className="cal-tooltip-list">
                                                {assignmentsByDay[cell.day].map(a => (
                                                    <li key={a._id}>
                                                        <span className="cal-tooltip-title">{a.title}</span>
                                                        {a.points != null && <span className="cal-tooltip-pts">{a.points} pts</span>}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Selected Date Assignments */}
                {selectedDate && (
                    <div className="cal-selected-detail">
                        <div className="cal-selected-header">
                            <span className="cal-selected-date">
                                {MONTHS[currentMonth]} {selectedDate}, {currentYear}
                            </span>
                            <span className="cal-selected-count">{selectedAssignments.length} assignment{selectedAssignments.length !== 1 ? 's' : ''}</span>
                        </div>
                        {selectedAssignments.length > 0 ? (
                            <div className="cal-selected-list">
                                {selectedAssignments.map(a => (
                                    <div
                                        key={a._id}
                                        className="cal-event-item cal-event-clickable"
                                        onClick={() => navigate(`/classroom/${classId}/classwork/${a._id}`)}
                                    >
                                        <div className="cal-event-accent" />
                                        <div className="cal-event-content">
                                            <span className="cal-event-title">{a.title}</span>
                                            <div className="cal-event-meta">
                                                <span className="cal-event-time"><ClockIcon /> {formatTime(a.dueDate)}</span>
                                                {a.points != null && <span className="cal-event-pts"><StarIcon /> {a.points} pts</span>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="cal-no-events">No assignments due on this date.</p>
                        )}
                    </div>
                )}
            </div>

            {/* ═══ Bottom Row: Upcoming + Past Due ═══ */}
            <div className="cal-bottom-row">
                {/* ── Upcoming Assignments Card ── */}
                <div className="cal-card cal-agenda-card">
                    <div className="cal-agenda-header">
                        <h3 className="cal-agenda-title">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                            </svg>
                            Upcoming
                        </h3>
                        <span className="cal-agenda-count">{upcomingAssignments.length}</span>
                    </div>
                    {upcomingAssignments.length > 0 ? (
                        <div className="cal-agenda-list">
                            {upcomingAssignments.map(a => {
                                const daysLeft = getDaysRemaining(a.dueDate);
                                const isUrgent = daysLeft.includes('today') || daysLeft.includes('tomorrow');
                                return (
                                    <div
                                        key={a._id}
                                        className={`cal-agenda-item ${isUrgent ? 'cal-urgent' : ''}`}
                                        onClick={() => navigate(`/classroom/${classId}/classwork/${a._id}`)}
                                    >
                                        <div className="cal-agenda-date-badge">
                                            <span className="cal-agenda-day">{new Date(a.dueDate).getDate()}</span>
                                            <span className="cal-agenda-mon">{MONTHS[new Date(a.dueDate).getMonth()].slice(0, 3)}</span>
                                        </div>
                                        <div className="cal-agenda-info">
                                            <span className="cal-agenda-name">{a.title}</span>
                                            <div className="cal-agenda-meta">
                                                <span className="cal-agenda-time"><ClockIcon /> {formatTime(a.dueDate)}</span>
                                                {a.points != null && <span className="cal-agenda-pts"><StarIcon /> {a.points}</span>}
                                            </div>
                                        </div>
                                        <span className={`cal-agenda-badge ${isUrgent ? 'cal-badge-urgent' : 'cal-badge-normal'}`}>{daysLeft}</span>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="cal-empty-agenda">
                            <CalendarBigIcon />
                            <p>No upcoming assignments</p>
                            <span>You're all caught up! 🎉</span>
                        </div>
                    )}
                </div>

                {/* ── Secondary Card (Overdue for Student, Grading Progress for Teacher) ── */}
                {isCreator ? (
                    <div className={`cal-card cal-grading-card ${gradingAssignments.length === 0 ? 'cal-overdue-empty' : ''}`}>
                        <div className="cal-agenda-header">
                            <h3 className="cal-agenda-title cal-grading-title" style={{ color: '#00796b' }}>
                                <CheckCircleIcon />
                                Grading Progress
                            </h3>
                            <span className="cal-agenda-count cal-grading-count" style={{ background: '#e0f2f1', color: '#00796b' }}>{gradingAssignments.length}</span>
                        </div>
                        {gradingAssignments.length > 0 ? (
                            <div className="cal-agenda-list">
                                {gradingAssignments.slice(0, 5).map(a => {
                                    const stats = a.submissionStats || { graded: 0, total: 0 };
                                    const isFullyGraded = stats.total > 0 && stats.graded === stats.total;
                                    return (
                                        <div
                                            key={a._id}
                                            className="cal-agenda-item cal-agenda-grading"
                                            onClick={() => navigate(`/classroom/${classId}/classwork/${a._id}`)}
                                        >
                                            <div className="cal-agenda-date-badge" style={{ background: isFullyGraded ? '#e8f5e9' : '#f3f4f6', color: isFullyGraded ? '#2e7d32' : '#374151' }}>
                                                <span className="cal-agenda-day">{a.dueDate ? new Date(a.dueDate).getDate() : '-'}</span>
                                                <span className="cal-agenda-mon">{a.dueDate ? MONTHS[new Date(a.dueDate).getMonth()].slice(0, 3) : 'No due'}</span>
                                            </div>
                                            <div className="cal-agenda-info">
                                                <span className="cal-agenda-name">{a.title}</span>
                                                <div className="cal-agenda-progress-bar-wrap" style={{ marginTop: '4px', background: '#e5e7eb', height: '4px', borderRadius: '2px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${stats.total > 0 ? (stats.graded / stats.total) * 100 : 0}%`, background: '#10b981', height: '100%' }}></div>
                                                </div>
                                                <span className="cal-agenda-sub" style={{ marginTop: '2px', fontSize: '0.75rem', color: '#6b7280' }}>
                                                    {stats.graded} / {stats.total} Graded
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="cal-empty-agenda">
                                <SuccessBigIcon />
                                <p>No assignments yet</p>
                                <span>Create one to start grading!</span>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className={`cal-card cal-overdue-card ${overdueAssignments.length === 0 ? 'cal-overdue-empty' : ''}`}>
                        <div className="cal-agenda-header">
                            <h3 className="cal-agenda-title cal-overdue-title">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                                </svg>
                                Past Due
                            </h3>
                            <span className="cal-agenda-count cal-overdue-count">{overdueAssignments.length}</span>
                        </div>
                        {overdueAssignments.length > 0 ? (
                            <div className="cal-agenda-list">
                                {overdueAssignments.slice(0, 5).map(a => (
                                    <div
                                        key={a._id}
                                        className="cal-agenda-item cal-agenda-overdue"
                                        onClick={() => navigate(`/classroom/${classId}/classwork/${a._id}`)}
                                    >
                                        <div className="cal-agenda-date-badge cal-badge-overdue">
                                            <span className="cal-agenda-day">{new Date(a.dueDate).getDate()}</span>
                                            <span className="cal-agenda-mon">{MONTHS[new Date(a.dueDate).getMonth()].slice(0, 3)}</span>
                                        </div>
                                        <div className="cal-agenda-info">
                                            <span className="cal-agenda-name">{a.title}</span>
                                            <span className="cal-agenda-sub">{formatDate(a.dueDate)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="cal-empty-agenda">
                                <SuccessBigIcon />
                                <p>No past due assignments</p>
                                <span>Great job! ✅</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CalendarSection;
