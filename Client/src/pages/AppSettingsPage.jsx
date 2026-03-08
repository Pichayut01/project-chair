// src/pages/AppSettingsPage.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import '../CSS/AppSettings.css';
import '../CSS/Main.css';
import { FiSettings, FiDatabase, FiShield, FiBell, FiUsers, FiGlobe, FiHelpCircle } from 'react-icons/fi';

import { useTranslation } from 'react-i18next'; // ✨ Add useTranslation hook

const AppSettingsPage = ({ user: propUser, onSignOut, isSidebarOpen, toggleSidebar }) => {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation(); // ✨ Apply hook
    const [user, setUser] = useState(propUser);
    const [activeSection, setActiveSection] = useState('general');

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
                        <h2>{t('settings.general.title')}</h2>
                        <div className="settings-section">
                            <h3>{t('settings.general.appPreferences')}</h3>
                            <div className="setting-item">
                                <label>{t('settings.general.language')}</label>
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
                                <label>{t('settings.general.theme')}</label>
                                <select className="setting-select">
                                    <option value="light">{t('settings.general.themeLight')}</option>
                                    <option value="dark">{t('settings.general.themeDark')}</option>
                                    <option value="auto">{t('settings.general.themeAuto')}</option>
                                </select>
                            </div>
                            <div className="setting-item">
                                <label>
                                    <input type="checkbox" className="setting-checkbox" />
                                    {t('settings.general.enableSound')}
                                </label>
                            </div>
                        </div>
                    </div>
                );
            case 'data':
                return (
                    <div className="settings-content">
                        <h2>{t('settings.data.title')}</h2>
                        <div className="settings-section">
                            <h3>{t('settings.data.storageBackup')}</h3>
                            <div className="setting-item">
                                <label>{t('settings.data.autoSave')}</label>
                                <select className="setting-select">
                                    <option value="30">{t('settings.data.sec30')}</option>
                                    <option value="60">{t('settings.data.min1')}</option>
                                    <option value="300">{t('settings.data.min5')}</option>
                                </select>
                            </div>
                            <div className="setting-item">
                                <button className="setting-button">{t('settings.data.exportData')}</button>
                                <button className="setting-button secondary">{t('settings.data.importData')}</button>
                            </div>
                        </div>
                    </div>
                );
            case 'security':
                return (
                    <div className="settings-content">
                        <h2>{t('settings.security.title')}</h2>
                        <div className="settings-section">
                            <h3>{t('settings.security.accessControl')}</h3>
                            <div className="setting-item">
                                <label>
                                    <input type="checkbox" className="setting-checkbox" />
                                    {t('settings.security.requireAuth')}
                                </label>
                            </div>
                            <div className="setting-item">
                                <label>{t('settings.security.sessionTimeout')}</label>
                                <select className="setting-select">
                                    <option value="30">{t('settings.security.min30')}</option>
                                    <option value="60">{t('settings.security.hr1')}</option>
                                    <option value="480">{t('settings.security.hr8')}</option>
                                    <option value="never">{t('settings.security.never')}</option>
                                </select>
                            </div>
                        </div>
                    </div>
                );
            case 'notifications':
                return (
                    <div className="settings-content">
                        <h2>{t('settings.notifications.title')}</h2>
                        <div className="settings-section">
                            <h3>{t('settings.notifications.sysNotif')}</h3>
                            <div className="setting-item">
                                <label>
                                    <input type="checkbox" className="setting-checkbox" defaultChecked />
                                    {t('settings.notifications.desktopNotif')}
                                </label>
                            </div>
                            <div className="setting-item">
                                <label>
                                    <input type="checkbox" className="setting-checkbox" defaultChecked />
                                    {t('settings.notifications.emailNotif')}
                                </label>
                            </div>
                            <div className="setting-item">
                                <label>
                                    <input type="checkbox" className="setting-checkbox" />
                                    {t('settings.notifications.soundNotif')}
                                </label>
                            </div>
                        </div>
                    </div>
                );
            case 'users':
                return (
                    <div className="settings-content">
                        <h2>{t('settings.users.title')}</h2>
                        <div className="settings-section">
                            <h3>{t('settings.users.defaultSettings')}</h3>
                            <div className="setting-item">
                                <label>{t('settings.users.defaultRole')}</label>
                                <select className="setting-select">
                                    <option value="participant">{t('login.roleParticipant')}</option>
                                    <option value="moderator">{t('login.roleCreator')}</option>
                                </select>
                            </div>
                            <div className="setting-item">
                                <label>
                                    <input type="checkbox" className="setting-checkbox" />
                                    {t('settings.users.allowGuest')}
                                </label>
                            </div>
                        </div>
                    </div>
                );
            case 'integration':
                return (
                    <div className="settings-content">
                        <h2>{t('settings.integration.title')}</h2>
                        <div className="settings-section">
                            <h3>{t('settings.integration.extServices')}</h3>
                            <div className="setting-item">
                                <label>
                                    <input type="checkbox" className="setting-checkbox" />
                                    {t('settings.integration.enableGoogle')}
                                </label>
                            </div>
                            <div className="setting-item">
                                <label>{t('settings.integration.apiRateLimit')}</label>
                                <select className="setting-select">
                                    <option value="100">{t('settings.integration.req100')}</option>
                                    <option value="500">{t('settings.integration.req500')}</option>
                                    <option value="1000">{t('settings.integration.req1000')}</option>
                                </select>
                            </div>
                        </div>
                    </div>
                );
            case 'help':
                return (
                    <div className="settings-content">
                        <h2>{t('settings.help.title')}</h2>
                        <div className="settings-section">
                            <h3>{t('settings.help.documentation')}</h3>
                            <div className="setting-item">
                                <button className="setting-button">{t('settings.help.userGuide')}</button>
                            </div>
                            <div className="setting-item">
                                <button className="setting-button">{t('settings.help.contactSupport')}</button>
                            </div>
                            <div className="setting-item">
                                <button className="setting-button">{t('settings.help.reportBug')}</button>
                            </div>
                        </div>
                        <div className="settings-section">
                            <h3>{t('settings.help.about') || 'About'}</h3>
                            <p>{t('settings.help.version') || 'EChair App Version 1.0.0'}</p>
                            <p>{t('settings.help.copyright') || '© 2024 EChair Team'}</p>
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
                <div className="google-account-container">
                    {renderContent()}
                </div>
            </main>
        </>
    );
};

export default AppSettingsPage;
