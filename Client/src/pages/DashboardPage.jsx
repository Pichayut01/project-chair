import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/Navbar';
import Main from '../components/Main';
import ClassActionModal from '../components/ClassActionModal';
import Loader from '../components/Loader';
import '../CSS/Navbar.css';
import '../CSS/Main.css';
import API_BASE_URL from '../config/api';

const DashboardPage = ({ user, updateUserProfile, onSignOut, isSidebarOpen, toggleSidebar, addNotification, onAddNotification }) => {
    const { t } = useTranslation();
    const [classrooms, setClassrooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalInitialMode, setModalInitialMode] = useState(null);

    const fetchClassrooms = async (token) => {
        const response = await axios.get(`${API_BASE_URL}/api/classrooms`, {
            headers: {
                'x-auth-token': token,
            },
        });

        return response.data;
    };

    const fetchUserProfile = async (token) => {
        const response = await axios.get(`${API_BASE_URL}/api/auth/me`, {
            headers: {
                'x-auth-token': token,
            },
        });

        return response.data;
    };

    const updateAllData = useCallback(async () => {
        if (!user?.token) {
            return;
        }

        setError('');
        setLoading(true);

        try {
            const [classroomsData, profileData] = await Promise.all([
                fetchClassrooms(user.token),
                fetchUserProfile(user.token)
            ]);

            setClassrooms(classroomsData);

            if (profileData) {
                updateUserProfile(profileData);
            }
        } catch (err) {
            console.error('Error fetching classrooms:', err);

            if (err?.response?.status === 401) {
                await onSignOut();
                return;
            }

            setError(t('dashboard.failedLoad') || 'Failed to load classrooms. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [onSignOut, t, updateUserProfile, user?.token]);

    useEffect(() => {
        if (!user?.token) {
            return;
        }

        updateAllData();
        // We only want to refetch when the authenticated user changes.
        // updateAllData also depends on parent callbacks that may get recreated.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.token]);

    const handlePinClass = async (classId) => {
        try {
            await axios.post(`${API_BASE_URL}/api/classrooms/${classId}/toggle-pin`, null, {
                headers: {
                    'x-auth-token': user.token,
                },
            });

            updateAllData();
        } catch (pinError) {
            console.error('Error pinning/unpinning class:', pinError);
        }
    };

    const handleLeaveClassroom = async (classId) => {
        if (!window.confirm(t('dashboard.leaveConfirm') || 'Are you sure you want to leave this classroom?')) {
            return;
        }

        try {
            await axios.post(
                `${API_BASE_URL}/api/classrooms/${classId}/leave`,
                {},
                { headers: { 'x-auth-token': user.token } }
            );

            await updateAllData();
        } catch (leaveError) {
            alert(t('dashboard.leaveFail') || 'Failed to leave classroom');
        }
    };

    const handleClassActionClick = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setModalInitialMode(null);
    };

    const onClassCreated = async (className) => {
        await updateAllData();
        handleCloseModal();

        if (addNotification) {
            addNotification(`Successfully created classroom: "${className}"`);
        }
    };

    const onClassJoined = async (className) => {
        await updateAllData();
        handleCloseModal();

        if (addNotification) {
            addNotification(`Successfully joined classroom: "${className}"`);
        }
    };

    if (loading) {
        return <Loader />;
    }

    return (
        <>
            <Navbar
                isSidebarOpen={isSidebarOpen}
                toggleSidebar={toggleSidebar}
                user={user}
                onClassActionClick={handleClassActionClick}
                classrooms={classrooms}
                handleSignOut={onSignOut}
                onAddNotification={onAddNotification}
            />

            {error && (
                <div style={{ maxWidth: 960, margin: '16px auto', padding: '12px 16px', background: '#FEF2F2', color: '#991B1B', border: '1px solid #FCA5A5', borderRadius: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{error}</span>
                        <button onClick={updateAllData} style={{ background: '#991B1B', color: 'white', border: 'none', padding: '6px 10px', borderRadius: 4, cursor: 'pointer' }}>
                            {t('common.retry') || 'Retry'}
                        </button>
                    </div>
                </div>
            )}

            <Main
                isSidebarOpen={isSidebarOpen}
                classrooms={classrooms}
                user={user}
                onPinClass={handlePinClass}
                handleLeaveClassroom={handleLeaveClassroom}
                onClassActionClick={(action) => {
                    setModalInitialMode(action);
                    setIsModalOpen(true);
                }}
            />

            {isModalOpen && (
                <ClassActionModal
                    onClose={handleCloseModal}
                    onClassCreated={onClassCreated}
                    onClassJoined={onClassJoined}
                    user={user}
                    initialMode={modalInitialMode}
                    addNotification={addNotification}
                />
            )}
        </>
    );
};

export default DashboardPage;
