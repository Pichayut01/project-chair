import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import CreateAssignmentModal from './CreateAssignmentModal';
import '../CSS/ClassworkSection.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

// SVG Icons
const PlusIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
);
const SearchIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
);
const AssignmentIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
        <rect x="9" y="3" width="6" height="4" rx="2"/>
        <line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>
    </svg>
);
const ClockIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
);
const ChevronIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6"/>
    </svg>
);
const CalendarIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
);
const MoreVerticalIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>
    </svg>
);
const EditIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
);
const TrashIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
    </svg>
);
const ClearIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
);
const SvgBookOpen = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
);
const SvgAlertTriangle = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
);
const SvgCheckCircle = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
);
const SvgTrendUp = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
    </svg>
);

const ClassworkSection = ({ classId, user, isCreator }) => {
    const { t } = useTranslation('translation', { keyPrefix: 'classworkSection' });
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingAssignment, setEditingAssignment] = useState(null);
    const [menuOpenId, setMenuOpenId] = useState(null);

    const FILTER_TABS = useMemo(() => [
        { key: 'all', label: t('filters.all') },
        { key: 'upcoming', label: t('filters.upcoming') },
        { key: 'past', label: t('filters.past') },
        { key: 'no-date', label: t('filters.noDate') },
    ], [t]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    
    const navigate = useNavigate();

    const fetchAssignments = useCallback(async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE_URL}/api/classwork/${classId}`, {
                headers: { 'x-auth-token': user.token }
            });
            setAssignments(res.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching assignments:', err);
            setError(t('errorLoad'));
            setLoading(false);
        }
    }, [classId, user]);

    useEffect(() => {
        fetchAssignments();
    }, [fetchAssignments]);

    // Click outside to close menus
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuOpenId && !e.target.closest('.cw-card-actions')) {
                setMenuOpenId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [menuOpenId]);

    const handleAssignmentCreated = (newAssignment) => {
        setAssignments(prev => [newAssignment, ...prev]);
    };

    const handleAssignmentClick = (assignment) => {
        navigate(`/classroom/${classId}/classwork/${assignment._id}`);
    };

    const handleEditClick = (e, assignment) => {
        e.stopPropagation();
        setEditingAssignment(assignment);
        setMenuOpenId(null);
        setIsCreateModalOpen(true);
    };

    const handleDeleteClick = async (e, assignmentId) => {
        e.stopPropagation();
        setMenuOpenId(null);
        if (!window.confirm(t('card.confirmDelete'))) return;
        
        try {
            await axios.delete(`${API_BASE_URL}/api/classwork/${classId}/${assignmentId}`, {
                headers: { 'x-auth-token': user.token }
            });
            setAssignments(prev => prev.filter(a => a._id !== assignmentId));
        } catch (err) {
            console.error('Error deleting assignment:', err);
            alert(t('card.errorDelete'));
        }
    };

    const handleAssignmentUpdate = (updated) => {
        if (editingAssignment) {
            setAssignments(prev => prev.map(a => a._id === updated._id ? updated : a));
        } else {
            setAssignments(prev => [updated, ...prev]);
        }
        setEditingAssignment(null);
    };

    const handleModalClose = () => {
        setIsCreateModalOpen(false);
        setEditingAssignment(null);
    };

    // ─── Quick Stats ───
    const quickStats = useMemo(() => {
        const now = new Date();
        const total = assignments.length;
        const upcoming = assignments.filter(a => a.dueDate && new Date(a.dueDate) > now).length;
        const pastDue = assignments.filter(a => a.dueDate && new Date(a.dueDate) <= now).length;
        const avgPoints = total > 0 ? Math.round(assignments.reduce((sum, a) => sum + (a.points || 0), 0) / total) : 0;
        return { total, upcoming, pastDue, avgPoints };
    }, [assignments]);

    // Filter and search logic
    const filteredAssignments = useMemo(() => {
        let filtered = assignments;

        if (activeFilter === 'upcoming') {
            filtered = filtered.filter(a => a.dueDate && new Date(a.dueDate) > new Date());
        } else if (activeFilter === 'past') {
            filtered = filtered.filter(a => a.dueDate && new Date(a.dueDate) <= new Date());
        } else if (activeFilter === 'no-date') {
            filtered = filtered.filter(a => !a.dueDate);
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(a =>
                a.title?.toLowerCase().includes(q) ||
                a.description?.toLowerCase().includes(q)
            );
        }

        return filtered;
    }, [assignments, activeFilter, searchQuery]);

    if (loading) {
        return (
            <div className="cw-loader">
                <div className="cw-loader-spinner"></div>
                <span>{t('loading')}</span>
            </div>
        );
    }

    if (error) return <div className="cw-error">{error}</div>;

    return (
        <div className="cw-section">
            {/* ═══ Header ═══ */}
            <div className="cw-header">
                <div className="cw-header-left">
                    <div className="cw-header-icon"><SvgBookOpen /></div>
                    <div>
                        <h2>{t('title')}</h2>
                        <p className="cw-header-subtitle">{t('subtitle')}</p>
                    </div>
                </div>
                {isCreator && (
                    <button className="cw-create-btn" onClick={() => setIsCreateModalOpen(true)}>
                        <PlusIcon /> {t('createBtnReal')}
                    </button>
                )}
            </div>

            {/* ═══ Quick Stats Tiles ═══ */}
            {assignments.length > 0 && (
                <div className="cw-stats-grid">
                    <div className="cw-stat-tile cw-stat-total" style={{ '--delay': '0' }}>
                        <div className="cw-stat-icon"><SvgBookOpen /></div>
                        <div className="cw-stat-info">
                            <span className="cw-stat-num">{quickStats.total}</span>
                            <span className="cw-stat-label">{t('stats.total')}</span>
                        </div>
                    </div>
                    <div className="cw-stat-tile cw-stat-upcoming" style={{ '--delay': '1' }}>
                        <div className="cw-stat-icon"><SvgTrendUp /></div>
                        <div className="cw-stat-info">
                            <span className="cw-stat-num">{quickStats.upcoming}</span>
                            <span className="cw-stat-label">{t('stats.upcoming')}</span>
                        </div>
                    </div>
                    <div className="cw-stat-tile cw-stat-pastdue" style={{ '--delay': '2' }}>
                        <div className="cw-stat-icon"><SvgAlertTriangle /></div>
                        <div className="cw-stat-info">
                            <span className="cw-stat-num">{quickStats.pastDue}</span>
                            <span className="cw-stat-label">{t('stats.pastDue')}</span>
                        </div>
                    </div>
                    <div className="cw-stat-tile cw-stat-avg" style={{ '--delay': '3' }}>
                        <div className="cw-stat-icon"><SvgCheckCircle /></div>
                        <div className="cw-stat-info">
                            <span className="cw-stat-num">{quickStats.avgPoints}</span>
                            <span className="cw-stat-label">{t('stats.avgPoints')}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ Search & Filter Toolbar ═══ */}
            {assignments.length > 0 && (
                <div className="cw-toolbar">
                    <div className="cw-search-wrap">
                        <SearchIcon />
                        <input
                            className="cw-search-input"
                            type="text"
                            placeholder={t('searchHint')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button className="cw-search-clear" onClick={() => setSearchQuery('')}>
                                <ClearIcon />
                            </button>
                        )}
                    </div>
                    <div className="cw-filters">
                        {FILTER_TABS.map(tab => (
                            <button
                                key={tab.key}
                                className={`cw-filter-tab ${activeFilter === tab.key ? 'cw-filter-tab--active' : ''}`}
                                onClick={() => setActiveFilter(tab.key)}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* ═══ Assignment Grid ═══ */}
            <div className="cw-grid">
                {filteredAssignments.length === 0 ? (
                    <div className="cw-empty">
                        <div className="cw-empty-icon">
                            <AssignmentIcon />
                        </div>
                        <h3>{assignments.length === 0 ? t('empty.noAssignments') : t('empty.noMatching')}</h3>
                        <p>
                            {assignments.length === 0
                                ? (isCreator 
                                    ? t('empty.creatorHint')
                                    : t('empty.studentHint'))
                                : t('empty.adjustFilter')
                            }
                        </p>
                    </div>
                ) : (
                    filteredAssignments.map((assignment, index) => {
                        const isStudent = !isCreator;
                        let statusText = '';
                        let statusClass = '';

                        if (isStudent && assignment.submission) {
                            if (assignment.submission.status === 'graded') {
                                statusText = t('status.graded', { passed: assignment.submission.pointsAwarded, total: assignment.points });
                                statusClass = 'cw-status--graded';
                            } else if (assignment.submission.status === 'late') {
                                statusText = t('status.late');
                                statusClass = 'cw-status--late';
                            } else {
                                statusText = t('status.turnedIn');
                                statusClass = 'cw-status--submitted';
                            }
                        } else if (isStudent) {
                            const isLate = assignment.dueDate && new Date() > new Date(assignment.dueDate);
                            statusText = isLate ? t('status.missing') : t('status.assigned');
                            statusClass = isLate ? 'cw-status--missing' : 'cw-status--assigned';
                        }

                        const isOverdue = assignment.dueDate && new Date() > new Date(assignment.dueDate);
                        const dueDateStr = assignment.dueDate 
                            ? new Date(assignment.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                            : null;

                        const postedDateStr = assignment.createdAt
                            ? new Date(assignment.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                            : null;

                        // Submission progress for teacher
                        const submissionCount = assignment.submissionCount || 0;
                        const totalStudents = assignment.totalStudents || 0;
                        const progressPct = totalStudents > 0 ? Math.round((submissionCount / totalStudents) * 100) : 0;

                        return (
                            <div 
                                key={assignment._id} 
                                className={`cw-card ${menuOpenId === assignment._id ? 'cw-card--menu-open' : ''}`}
                                onClick={() => handleAssignmentClick(assignment)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => e.key === 'Enter' && handleAssignmentClick(assignment)}
                                style={{ animationDelay: `${index * 0.05}s` }}
                            >
                                <div className="cw-card-top">
                                    <div className="cw-card-icon-wrap">
                                        <AssignmentIcon />
                                    </div>
                                    {isCreator && (
                                        <div className="cw-card-actions" onClick={e => e.stopPropagation()}>
                                            <button 
                                                className={`cw-menu-btn ${menuOpenId === assignment._id ? 'cw-menu-btn--active' : ''}`}
                                                onClick={() => setMenuOpenId(menuOpenId === assignment._id ? null : assignment._id)}
                                            >
                                                <MoreVerticalIcon />
                                            </button>
                                            
                                            {menuOpenId === assignment._id && (
                                                <div className="cw-card-menu">
                                                    <button className="cw-menu-item" onClick={(e) => handleEditClick(e, assignment)}>
                                                        <EditIcon /> {t('card.edit')}
                                                    </button>
                                                    <button className="cw-menu-item cw-menu-item--danger" onClick={(e) => handleDeleteClick(e, assignment._id)}>
                                                        <TrashIcon /> {t('card.delete')}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="cw-card-body">
                                    <h4 className="cw-card-title">{assignment.title}</h4>
                                    {assignment.description && (
                                        <p className="cw-card-desc">{assignment.description.substring(0, 80)}{assignment.description.length > 80 ? '...' : ''}</p>
                                    )}
                                </div>

                                <div className="cw-card-footer">
                                    <div className="cw-card-meta">
                                        <span className="cw-points-badge">{assignment.points} {t('card.pts')}</span>
                                        {dueDateStr && (
                                            <span className={`cw-due-date ${isOverdue ? 'cw-due-date--overdue' : ''}`}>
                                                <ClockIcon />
                                                {dueDateStr}
                                            </span>
                                        )}
                                        {!dueDateStr && postedDateStr && (
                                            <span className="cw-posted-date">
                                                <CalendarIcon />
                                                {postedDateStr}
                                            </span>
                                        )}
                                    </div>
                                    <div className="cw-card-bottom-row">
                                        {isStudent && (
                                            <div className={`cw-status ${statusClass}`}>
                                                {statusText}
                                            </div>
                                        )}
                                        {isCreator && totalStudents > 0 && (
                                            <div className="cw-progress-wrap">
                                                <div className="cw-progress-bar">
                                                    <div className="cw-progress-fill" style={{ width: `${progressPct}%` }}></div>
                                                </div>
                                                <span className="cw-progress-text">{submissionCount}/{totalStudents}</span>
                                            </div>
                                        )}
                                        <div className="cw-card-chevron">
                                            <ChevronIcon />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <CreateAssignmentModal 
                isOpen={isCreateModalOpen}
                onClose={handleModalClose}
                classId={classId}
                user={user}
                onAssignmentCreated={handleAssignmentUpdate}
                assignment={editingAssignment}
            />
        </div>
    );
};

export default ClassworkSection;
