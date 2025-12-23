// src/pages/AppSettingsPage.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../component/Navbar';
import '../CSS/AppSettings.css';
import '../CSS/Main.css';
import { FiSettings, FiDatabase, FiShield, FiBell, FiUsers, FiGlobe, FiHelpCircle } from 'react-icons/fi';

const AppSettingsPage = ({ user: propUser, onSignOut, isSidebarOpen, toggleSidebar }) => {
    const navigate = useNavigate();
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
                        <h2>General Settings</h2>
                        <div className="settings-section">
                            <h3>Application Preferences</h3>
                            <div className="setting-item">
                                <label>Language</label>
                                <select className="setting-select">
                                    <option value="en">English</option>
                                    <option value="th">ไทย</option>
                                </select>
                            </div>
                            <div className="setting-item">
                                <label>Theme</label>
                                <select className="setting-select">
                                    <option value="light">Light</option>
                                    <option value="dark">Dark</option>
                                    <option value="auto">Auto</option>
                                </select>
                            </div>
                            <div className="setting-item">
                                <label>
                                    <input type="checkbox" className="setting-checkbox" />
                                    Enable sound effects
                                </label>
                            </div>
                        </div>
                    </div>
                );
            case 'data':
                return (
                    <div className="settings-content">
                        <h2>Data Management</h2>
                        <div className="settings-section">
                            <h3>Storage & Backup</h3>
                            <div className="setting-item">
                                <label>Auto-save interval</label>
                                <select className="setting-select">
                                    <option value="30">30 seconds</option>
                                    <option value="60">1 minute</option>
                                    <option value="300">5 minutes</option>
                                </select>
                            </div>
                            <div className="setting-item">
                                <button className="setting-button">Export Data</button>
                                <button className="setting-button secondary">Import Data</button>
                            </div>
                        </div>
                    </div>
                );
            case 'security':
                return (
                    <div className="settings-content">
                        <h2>Security Settings</h2>
                        <div className="settings-section">
                            <h3>Access Control</h3>
                            <div className="setting-item">
                                <label>
                                    <input type="checkbox" className="setting-checkbox" />
                                    Require authentication for sensitive actions
                                </label>
                            </div>
                            <div className="setting-item">
                                <label>Session timeout</label>
                                <select className="setting-select">
                                    <option value="30">30 minutes</option>
                                    <option value="60">1 hour</option>
                                    <option value="480">8 hours</option>
                                    <option value="never">Never</option>
                                </select>
                            </div>
                        </div>
                    </div>
                );
            case 'notifications':
                return (
                    <div className="settings-content">
                        <h2>Notification Settings</h2>
                        <div className="settings-section">
                            <h3>System Notifications</h3>
                            <div className="setting-item">
                                <label>
                                    <input type="checkbox" className="setting-checkbox" defaultChecked />
                                    Enable desktop notifications
                                </label>
                            </div>
                            <div className="setting-item">
                                <label>
                                    <input type="checkbox" className="setting-checkbox" defaultChecked />
                                    Email notifications
                                </label>
                            </div>
                            <div className="setting-item">
                                <label>
                                    <input type="checkbox" className="setting-checkbox" />
                                    Sound notifications
                                </label>
                            </div>
                        </div>
                    </div>
                );
            case 'users':
                return (
                    <div className="settings-content">
                        <h2>User Management</h2>
                        <div className="settings-section">
                            <h3>Default User Settings</h3>
                            <div className="setting-item">
                                <label>Default user role</label>
                                <select className="setting-select">
                                    <option value="participant">Participant</option>
                                    <option value="moderator">Moderator</option>
                                </select>
                            </div>
                            <div className="setting-item">
                                <label>
                                    <input type="checkbox" className="setting-checkbox" />
                                    Allow guest users
                                </label>
                            </div>
                        </div>
                    </div>
                );
            case 'integration':
                return (
                    <div className="settings-content">
                        <h2>Integration Settings</h2>
                        <div className="settings-section">
                            <h3>External Services</h3>
                            <div className="setting-item">
                                <label>
                                    <input type="checkbox" className="setting-checkbox" />
                                    Enable Google integration
                                </label>
                            </div>
                            <div className="setting-item">
                                <label>API Rate Limit</label>
                                <select className="setting-select">
                                    <option value="100">100 requests/hour</option>
                                    <option value="500">500 requests/hour</option>
                                    <option value="1000">1000 requests/hour</option>
                                </select>
                            </div>
                        </div>
                    </div>
                );
            case 'help':
                return (
                    <div className="settings-content">
                        <h2>Help & Support</h2>
                        <div className="settings-section">
                            <h3>Documentation</h3>
                            <div className="setting-item">
                                <button className="setting-button">View User Guide</button>
                            </div>
                            <div className="setting-item">
                                <button className="setting-button">Contact Support</button>
                            </div>
                            <div className="setting-item">
                                <button className="setting-button">Report Bug</button>
                            </div>
                        </div>
                        <div className="settings-section">
                            <h3>About</h3>
                            <p>EChair App Version 1.0.0</p>
                            <p>© 2024 EChair Team</p>
                        </div>
                    </div>
                );
            default:
                return <div>Select a setting category</div>;
        }
    };

    if (!user) {
        return <div>Loading...</div>;
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
