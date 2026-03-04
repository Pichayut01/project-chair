import React, { useMemo } from 'react';
import { FaClipboardCheck, FaTrophy, FaStar, FaChartLine, FaChartBar, FaBullseye } from 'react-icons/fa';
import '../CSS/StudentStatusBanner.css';

const StudentStatusBanner = ({ classroom, user }) => {
    const performanceData = useMemo(() => {
        if (!classroom || !user) return null;

        const creatorIds = (classroom.creator || []).map(c => c._id || c.id || c.toString());
        const participants = (classroom.participants || []).filter(p => {
            const pId = p._id || p.id || p.toString();
            return !creatorIds.includes(pId);
        });

        const currentUserId = user.id || user._id;

        // ─── Attendance Calculation ───
        const attendance = classroom.attendance || {};
        const attendanceDays = classroom.attendanceDays || 20;
        const userRecord = attendance[currentUserId] || {};

        let present = 0, absent = 0, late = 0, leave = 0, totalTracked = 0;
        for (let i = 1; i <= attendanceDays; i++) {
            const state = userRecord[i] || 'none';
            if (state === 'present') present++;
            else if (state === 'absent') absent++;
            else if (state === 'late') late++;
            else if (state === 'leave') leave++;
            if (state !== 'none') totalTracked++;
        }
        const attendedDays = present + late;
        const attendancePercent = totalTracked > 0
            ? Math.round((attendedDays / totalTracked) * 100)
            : 0;

        // ─── Score & Rank Calculation ───
        const studentScores = classroom.studentScores || {};

        const allScores = participants.map(p => {
            const pId = p._id || p.id;
            const scoreRecord = studentScores[pId] || {};
            return {
                id: pId,
                total: Object.values(scoreRecord).reduce((sum, v) => sum + (typeof v === 'number' ? v : 0), 0)
            };
        }).sort((a, b) => b.total - a.total);

        const myScore = allScores.find(s => s.id === currentUserId);
        const myTotal = myScore ? myScore.total : 0;
        const myRank = myScore ? allScores.indexOf(myScore) + 1 : null;
        const totalStudents = allScores.length;

        // ─── Class Average ───
        const avgScore = totalStudents > 0
            ? allScores.reduce((sum, s) => sum + s.total, 0) / totalStudents
            : 0;
        const diffFromAvg = avgScore > 0
            ? Math.round(((myTotal - avgScore) / avgScore) * 100)
            : 0;

        // ─── Percentile ───
        const percentile = totalStudents > 0
            ? Math.round(((totalStudents - myRank) / totalStudents) * 100)
            : 0;

        return {
            attendancePercent,
            totalTracked,
            myRank,
            totalStudents,
            myTotal,
            avgScore: Math.round(avgScore * 10) / 10,
            diffFromAvg,
            percentile,
            hasScoreData: allScores.some(s => s.total > 0),
            hasAttendanceData: totalTracked > 0
        };
    }, [classroom, user]);

    if (!performanceData) return null;

    const {
        attendancePercent, myRank, totalStudents,
        myTotal, diffFromAvg, percentile,
        hasScoreData, hasAttendanceData
    } = performanceData;

    // Attendance color
    const getAttendanceColor = (pct) => {
        if (pct >= 80) return '#16a34a'; // green
        if (pct >= 60) return '#ca8a04'; // yellow
        return '#dc2626'; // red
    };

    // Performance label
    const getPerformanceLabel = () => {
        if (!hasScoreData) return null;
        if (diffFromAvg > 10) return { text: `Above Avg ${diffFromAvg}%`, color: '#16a34a', icon: <FaChartLine /> };
        if (diffFromAvg >= -10) return { text: 'Class Average', color: '#ca8a04', icon: <FaChartBar /> };
        return { text: `Below Avg ${Math.abs(diffFromAvg)}%`, color: '#dc2626', icon: <FaChartLine style={{ transform: 'scaleY(-1)' }} /> };
    };

    const perfLabel = getPerformanceLabel();

    return (
        <div className="student-status-banner">
            <div className="status-banner-inner">
                {/* Attendance */}
                {hasAttendanceData && (
                    <div className="status-item">
                        <span className="status-icon"><FaClipboardCheck color="#8b5cf6" /></span>
                        <span className="status-label">Attendance</span>
                        <span
                            className="status-value"
                            style={{ color: getAttendanceColor(attendancePercent) }}
                        >
                            {attendancePercent}%
                        </span>
                    </div>
                )}

                {/* Rank */}
                {hasScoreData && myRank && (
                    <div className="status-item">
                        <span className="status-icon"><FaTrophy color="#eab308" /></span>
                        <span className="status-label">Rank</span>
                        <span className="status-value">
                            {myRank}/{totalStudents}
                        </span>
                    </div>
                )}

                {/* Score */}
                {hasScoreData && (
                    <div className="status-item">
                        <span className="status-icon"><FaStar color="#f59e0b" /></span>
                        <span className="status-label">Total Score</span>
                        <span className="status-value">{myTotal}</span>
                    </div>
                )}

                {/* Performance vs Average */}
                {perfLabel && (
                    <div className="status-item status-performance">
                        <span className="status-icon" style={{ color: perfLabel.color }}>{perfLabel.icon}</span>
                        <span className="status-perf-text" style={{ color: perfLabel.color }}>
                            {perfLabel.text}
                        </span>
                    </div>
                )}

                {/* Top percentile */}
                {hasScoreData && percentile >= 0 && (
                    <div className="status-item">
                        <span className="status-icon"><FaBullseye color="#ec4899" /></span>
                        <span className="status-label">Top</span>
                        <span className="status-value">{Math.max(1, 100 - percentile)}%</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentStatusBanner;
