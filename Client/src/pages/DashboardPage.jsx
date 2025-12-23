// src/pages/DashboardPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Navbar from '../component/Navbar';
import Main from '../component/Main';
import ClassActionModal from '../component/ClassActionModal';
import Loader from '../component/Loader';
import '../CSS/Navbar.css';
import '../CSS/Main.css';

const API_BASE_URL = 'http://localhost:5000';

const DashboardPage = ({ user, updateUserProfile, onSignOut, isSidebarOpen, toggleSidebar, addNotification, onAddNotification }) => {
    const [classrooms, setClassrooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalInitialMode, setModalInitialMode] = useState(null);
    const [showMenu, setShowMenu] = useState(false);

    const fetchClassrooms = async (token) => {
        const response = await axios.get(`${API_BASE_URL}/api/classrooms`, {
            headers: {
                'x-auth-token': token,
            },
        });
        return response.data;
    };

    // Fetch user profile to ensure pinned/created/enrolled arrays are available for categorization
    const fetchUserProfile = async (token) => {
        const response = await axios.get(`${API_BASE_URL}/api/auth/me`, {
            headers: {
                'x-auth-token': token,
            },
        });
        return response.data;
    };

    const updateAllData = useCallback(async () => {
        if (!user || !user.token) return;
        setError(null);
        setLoading(true);
        try {
            console.debug('[Dashboard] fetching classrooms with token length:', (user.token || '').length);
            const [classroomsData, profileData] = await Promise.all([
                fetchClassrooms(user.token),
                fetchUserProfile(user.token)
            ]);
            console.debug('[Dashboard] classrooms fetched:', Array.isArray(classroomsData) ? classroomsData.length : 'N/A');
            setClassrooms(classroomsData);
            // Update user profile once to ensure categorization arrays exist
            if (profileData) {
                updateUserProfile(profileData);
            }
        } catch (err) {
            console.error('Error fetching classrooms:', err);
            if (err?.response?.status === 401) {
                // token ไม่ถูกต้อง/หมดอายุ -> ออกจากระบบให้อัตโนมัติ
                await onSignOut();
                return;
            }
            setError('Failed to load classrooms. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [user?.token, onSignOut]);

    useEffect(() => {
        // Trigger fetch only when token becomes available/changes
        updateAllData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.token]);

    const handlePinClass = async (classId) => {
        try {
            // โค้ดที่แก้ไข: ใช้ endpoint ที่ถูกต้องและไม่ต้องส่ง isPinned
            await axios.post(`${API_BASE_URL}/api/classrooms/${classId}/toggle-pin`, null, {
                headers: {
                    'x-auth-token': user.token,
                },
            });
            // อัปเดตข้อมูลใหม่หลังจากเปลี่ยนสถานะ pin
            updateAllData();
        } catch (error) {
            console.error("Error pinning/unpinning class:", error);
        }
    };

    const handleLeaveClassroom = async (classId) => {
        if (!window.confirm('คุณต้องการออกจากห้องนี้ใช่หรือไม่?')) return;
        try {
            await axios.post(
                `${API_BASE_URL}/api/classrooms/${classId}/leave`,
                {},
                { headers: { 'x-auth-token': user.token } }
            );
            // รีเฟรชรายการห้องหลังออกจากห้องสำเร็จ
            await updateAllData();
        } catch (e) {
            alert('ออกจากห้องไม่สำเร็จ');
        }
    };

    const handleClassActionClick = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setModalInitialMode(null);
    };

    const onClassCreated = async (className) => { // ✨ รับชื่อห้องเรียน
        await updateAllData();
        handleCloseModal();
        if (addNotification) {
            addNotification(`Successfully created classroom: "${className}"`);
        }
    };

    const onClassJoined = async (className) => { // ✨ รับชื่อห้องเรียน
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
                // ส่ง onSignOut ที่ได้รับจาก App.jsx ไปให้ Navbar
                handleSignOut={onSignOut}
                onAddNotification={onAddNotification} // ✨ ส่ง callback ไปให้ Navbar
            />
            {error && (
                <div style={{ maxWidth: 960, margin: '16px auto', padding: '12px 16px', background: '#FEF2F2', color: '#991B1B', border: '1px solid #FCA5A5', borderRadius: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{error}</span>
                        <button onClick={updateAllData} style={{ background: '#991B1B', color: 'white', border: 'none', padding: '6px 10px', borderRadius: 4, cursor: 'pointer' }}>Retry</button>
                    </div>
                </div>
            )}
            <Main
                isSidebarOpen={isSidebarOpen}
                classrooms={classrooms}
                user={user}
                updateUserProfile={updateUserProfile}
                onPinClass={handlePinClass}
                setShowMenu={setShowMenu}
                showMenu={showMenu}
                handleLeaveClassroom={handleLeaveClassroom} // ส่งผ่านฟังก์ชันนี้ไปยัง Main
                onClassActionClick={(action) => {
                    setModalInitialMode(action);
                    setIsModalOpen(true);
                }}
            />
            
            
            {!error && classrooms && classrooms.length === 0 && (
                <div style={{ maxWidth: 960, margin: '16px auto', padding: '24px', textAlign: 'center', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8 }}>
                    <h3 style={{ margin: '0 0 8px' }}>No classrooms yet</h3>
                    <p style={{ margin: '0 0 16px', color: '#475569' }}>Create a new classroom or join with a class code.</p>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                        <button onClick={() => setIsModalOpen(true)} style={{ background: '#16A34A', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 6, cursor: 'pointer' }}>Create / Join</button>
                        <button onClick={updateAllData} style={{ background: '#334155', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 6, cursor: 'pointer' }}>Retry</button>
                    </div>
                </div>
            )}
            {isModalOpen && (
                <ClassActionModal
                    onClose={handleCloseModal}
                    onClassCreated={onClassCreated}
                    onClassJoined={onClassJoined}
                    user={user}
                    initialMode={modalInitialMode}
                    addNotification={addNotification} // ✨ ส่งฟังก์ชันไปให้ Modal
                />
            )}
        </>
    );
};
export default DashboardPage;