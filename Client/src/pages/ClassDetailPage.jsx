// src/pages/ClassDetailPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import AssignRate from '../components/AssignRate';
import ClassroomSettings from '../components/ClassroomSettings';

import Loader from '../components/Loader';
import '../CSS/ClassDetailPage.css';
import '../CSS/Navbar.css';
import '../CSS/Main.css';
import EventHistoryView from '../components/events/EventHistoryView';
import GroupHistoryView from '../components/events/GroupHistoryView';
import AttendanceTracker from '../components/AttendanceTracker'; // ✨ Import Attendance Tracker
import Summary from '../components/Summary'; // ✨ Import Summary
import SessionHistory from '../components/SessionHistory'; // ✨ Import SessionHistory
import { useTranslation } from 'react-i18next';
import API_BASE_URL from '../config/api';


const ClassDetailPage = ({ user, isSidebarOpen, toggleSidebar, handleSignOut }) => {
    const { classId } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [classroom, setClassroom] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeSection, setActiveSection] = useState('summary');

    const fetchClassroomDetails = useCallback(async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/classrooms/${classId}`, {
                headers: { 'x-auth-token': user.token }
            });
            setClassroom(response.data);
            setLoading(false);
        } catch (err) {
            if (err.response?.status === 403 && err.response?.data?.requiresInvitation) {
                setError(t('classDetailPage.privateClassError') || 'This classroom is private and requires an invitation to access.');
            } else {
                setError(t('classDetailPage.loadError') || 'Failed to load classroom details.');
            }
            setLoading(false);
            console.error("Error fetching classroom details:", err);
        }
    }, [classId, user]);

    useEffect(() => {
        if (!user || !user.token || !classId) return;
        fetchClassroomDetails();
    }, [classId, user, fetchClassroomDetails]);

    // ✨ Block non-owners from accessing this page
    useEffect(() => {
        if (classroom && user) {
            const isOwner = classroom.creator && classroom.creator.some(
                c => c === user.id || c._id === user.id || c.toString() === user.id
            );
            if (!isOwner) {
                navigate(`/classroom/${classId}`);
            }
        }
    }, [classroom, user, classId, navigate]);

    const handleSectionChange = (section) => {
        setActiveSection(section);
    };

    const handleUpdateScores = async (studentId, category, newScoreValue) => {
        if (!classroom) return;

        const updatedStudentScores = { ...classroom.studentScores };
        if (!updatedStudentScores[studentId]) {
            updatedStudentScores[studentId] = {};
        }
        updatedStudentScores[studentId][category] = newScoreValue;

        try {
            await axios.put(`${API_BASE_URL}/api/classrooms/${classId}/seating`, {
                studentScores: updatedStudentScores
            }, {
                headers: { 'x-auth-token': user.token }
            });
            // Update local classroom state after successful save
            setClassroom(prevClassroom => ({
                ...prevClassroom,
                studentScores: updatedStudentScores
            }));
            console.log('Score updated successfully in backend.');
        } catch (error) {
            console.error('Error updating score in backend:', error);
            // Optionally, revert local state or show error message
        }
    };

    const renderContent = () => {
        switch (activeSection) {
            case 'summary':
                return <Summary classId={classId} user={user} classroom={classroom} onUpdateScores={handleUpdateScores} />;
            case '1':
                return <AssignRate classId={classId} user={user} />;
            case '2':
                return (
                    <div className="class-detail-content">
                        <h2>{t('classDetailPage.placeholderMenu2Title') || 'Menu Item 2'}</h2>
                        <p>{t('classDetailPage.placeholderMenu2Text') || 'This is the content for menu item 2. You can add any functionality here.'}</p>
                        <div className="content-placeholder">
                            <div className="placeholder-card">
                                <h3>{t('classDetailPage.placeholderFeature2Title') || 'Feature 2'}</h3>
                                <p>{t('classDetailPage.placeholderFeature2Desc') || 'Description of feature 2 functionality.'}</p>
                            </div>
                        </div>
                    </div>
                );
            case 'history': // ✨ Match with Navbar's new key
                return <EventHistoryView 
                    classroom={classroom} 
                    user={user} 
                    onUpdateScores={handleUpdateScores}
                    onRefresh={fetchClassroomDetails}
                />;
            case 'group-history':
                return <GroupHistoryView classroom={classroom} user={user} onRefresh={fetchClassroomDetails} />;
            case '5':
                return <AttendanceTracker classroom={classroom} user={user} />;
            case 'sessions':
                return <SessionHistory classId={classId} user={user} />;
            case '6':
                return (
                    <ClassroomSettings
                        classId={classId}
                        user={user}
                        classroom={classroom}
                        onRefresh={fetchClassroomDetails}
                    />
                );
            default:
                return (
                    <div className="class-detail-content">
                        <h2>{t('classDetailPage.placeholderMenu1Title') || 'Menu Item 1'}</h2>
                        <p>{t('classDetailPage.placeholderMenu1Text') || 'This is the content for menu item 1. You can add any functionality here.'}</p>
                    </div>
                );
        }
    };

    if (loading) {
        return <Loader />;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    if (!classroom) {
        return <div className="error">{t('classDetailPage.notFoundError') || 'Classroom not found.'}</div>;
    }

    return (
        <>
            <Navbar
                isSidebarOpen={isSidebarOpen}
                toggleSidebar={toggleSidebar}
                user={user}
                handleSignOut={handleSignOut}
                isClassDetailPage={true}
                classDetailActiveSection={activeSection}
                onClassDetailSectionChange={handleSectionChange}
                onClassroomBackClick={() => navigate(`/classroom/${classId}`)}
                classroom={classroom}
            />
            <main className={`main__content ${isSidebarOpen ? 'shift' : ''}`}>
                <div className="class-detail-container">
                    {renderContent()}
                </div>
            </main>
        </>
    );
};

export default ClassDetailPage;
