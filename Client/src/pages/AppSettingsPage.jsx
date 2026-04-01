// src/pages/AppSettingsPage.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import '../CSS/AppSettings.css';
import '../CSS/Main.css';
import { FiSettings, FiBell, FiGlobe } from 'react-icons/fi';

import { useTranslation } from 'react-i18next'; // ✨ Add useTranslation hook

import { buildPublicAssetUrl } from '../config/api';

const AppSettingsPage = ({ user: propUser, onSignOut, isSidebarOpen, toggleSidebar }) => {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation(); // ✨ Apply hook
    const [user, setUser] = useState(propUser);
    const [activeSection, setActiveSection] = useState('general');
    const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
        return localStorage.getItem('notificationsEnabled') !== 'false';
    });

    const handleNotificationToggle = (e) => {
        const enabled = e.target.checked;
        setNotificationsEnabled(enabled);
        localStorage.setItem('notificationsEnabled', enabled);
    };

    useEffect(() => {
        if (propUser) {
            setUser(propUser);
        } else {
            const token = localStorage.getItem('authToken');
            if (!token) {
                navigate('/login');
                return;
            }

            const userData = localStorage.getItem('userProfile');
            if (userData) {
                const parsedUser = JSON.parse(userData);
                const storedPhotoURL = localStorage.getItem('userPhotoURL');
                if (storedPhotoURL) {
                    parsedUser.photoURL = storedPhotoURL;
                }
                setUser({ ...parsedUser, token });
            }
        }
    }, [navigate, propUser]);

    const handleSignOut = async () => {
        if (onSignOut) {
            onSignOut();
        } else {
            localStorage.removeItem('authToken');
            localStorage.removeItem('userProfile');
            localStorage.removeItem('userPhotoURL');
            navigate('/login');
        }
    };

    const handleBackClick = () => {
        navigate('/');
    };

    const renderContent = () => {
        switch (activeSection) {
            case 'general':
                return (
                    <div className="settings-content">
                        <div className="settings-header">
                            <h2>{t('settings.general.title')}</h2>
                            <p className="settings-subtitle">จัดการการตั้งค่าทั่วไปของแอปพลิเคชัน</p>
                        </div>
                        <div className="settings-card">
                            <div className="settings-card-inner">
                            <div className="setting-item">
                                <div className="setting-label">
                                    <div className="setting-icon">
                                        <FiGlobe size={20} />
                                    </div>
                                    <div className="setting-label-text">
                                        <label>{t('settings.general.language')}</label>
                                        <span>เลือกภาษาที่ต้องการใช้งาน</span>
                                    </div>
                                </div>
                                <select 
                                    className="setting-select"
                                    value={i18n.language}
                                    onChange={(e) => {
                                        const newLang = e.target.value;
                                        i18n.changeLanguage(newLang);
                                        localStorage.setItem('appLanguage', newLang);
                                    }}
                                >
                                    <option value="en">{t('settings.english')}</option>
                                    <option value="th">{t('settings.thai')}</option>
                                </select>
                            </div>
                            <div className="setting-item">
                                <div className="setting-label">
                                    <div className="setting-icon">
                                        <FiBell size={20} />
                                    </div>
                                    <div className="setting-label-text">
                                        <label>การแจ้งเตือน</label>
                                        <span>รับการแจ้งเตือนจากระบบ</span>
                                    </div>
                                </div>
                                <label className="toggle-switch">
                                    <input 
                                        type="checkbox" 
                                        className="setting-checkbox" 
                                        checked={notificationsEnabled}
                                        onChange={handleNotificationToggle}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
                            </div>
                        </div>
                    </div>
                );
            case 'about':
                return (
                    <div className="settings-content">
                        <div className="settings-header">
                            <h2>{t('settings.help.title')}</h2>
                            <p className="settings-subtitle">{t('settings.help.subtitle') || 'ข้อมูลเกี่ยวกับแอปพลิเคชัน'}</p>
                        </div>
                        <div className="settings-card about-card">
                            <div className="about-logo">
                                <div className="logo-circle" style={{ background: '#ffffff', padding: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                    <img referrerPolicy="no-referrer" src={buildPublicAssetUrl('/favicon.ico')} alt="EChair Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                </div>
                                <h3>EChair</h3>
                            </div>
                            <div className="about-info">
                                <div className="about-item">
                                    <span className="about-label">{t('settings.help.version') || 'เวอร์ชัน (Version)'}</span>
                                    <span className="about-value">1.0.0</span>
                                </div>
                                <div className="about-item">
                                    <span className="about-label">{t('settings.help.developer') || 'ผู้พัฒนา (Developers)'}</span>
                                    <span className="about-value">Tanicha & Pichayut</span>
                                </div>
                                <div className="about-item" style={{ alignItems: 'flex-start' }}>
                                    <span className="about-label">{t('settings.help.institution') || 'สถาบัน (Institution)'}</span>
                                    <span className="about-value" style={{ textAlign: 'right', lineHeight: '1.4' }}>
                                        KMUTNB<br/>
                                        <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: 'normal' }}>ภาควิชา CED TCT</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            default:
                return <div>{t('settings.selectCategory')}</div>;
        }
    };

    if (!user) {
        return <div>{t('common.loading')}</div>;
    }

    return (
        <>
            <Navbar
                isSidebarOpen={isSidebarOpen}
                toggleSidebar={toggleSidebar}
                user={user}
                handleSignOut={handleSignOut}
                classrooms={[]}
                isAppSettingPage={true}
                appActiveSection={activeSection}
                onAppSectionChange={setActiveSection}
                onBackClick={handleBackClick}
            />
            <main className={`main__content ${isSidebarOpen ? 'shift' : ''}`}>
                <div className="app-settings-container">
                    {renderContent()}
                </div>
            </main>
        </>
    );
};

export default AppSettingsPage;

