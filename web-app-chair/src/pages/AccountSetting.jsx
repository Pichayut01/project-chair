// src/component/AccountSetting.jsx

import React, { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../utils/cropImage';
import '../CSS/GoogleAccount.css';
import nullUserPhoto from '../image/nulluser.png';
import Navbar from '../component/Navbar'
import '../CSS/Navbar.css';
import '../CSS/Main.css';
import { getProfileImageSrc, getCurrentUserProfileImageSrc, isGoogleUser, handleImageError } from '../utils/profileImageHelper';
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const AccountSetting = ({ user, updateUserProfile, onSignOut, isSidebarOpen, toggleSidebar }) => {
    const [activeSection, setActiveSection] = useState('account');
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(user.photoURL);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [showCropper, setShowCropper] = useState(false);
    
    // Editable profile states
    const [isEditing, setIsEditing] = useState({});
    const [profileData, setProfileData] = useState({
        displayName: user.displayName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        address: user.address || '',
        bio: user.bio || '',
        dateOfBirth: user.dateOfBirth || '',
        gender: user.gender || ''
    });

    // Cropper states
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [imageSrcToCrop, setImageSrcToCrop] = useState(null);

    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
            const fileReader = new FileReader();
            fileReader.onload = () => {
                setImageSrcToCrop(fileReader.result);
                setShowCropper(true);
            };
            fileReader.readAsDataURL(file);
        } else {
            setSelectedFile(null);
            setPreviewUrl(user.photoURL);
        }
    };

    const handleCropAndUpload = async () => {
        setLoading(true);
        setMessage('');
        setShowCropper(false);

        try {
            const croppedImageBlob = await getCroppedImg(imageSrcToCrop, croppedAreaPixels);
            const formData = new FormData();
            formData.append('profileImage', croppedImageBlob, selectedFile.name);

            const response = await fetch(`${API_BASE_URL}/api/auth/profile/update-photo`, {
                method: 'POST',
                headers: {
                    'x-auth-token': user.token,
                },
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                updateUserProfile(data.user);
                setPreviewUrl(data.user.photoURL);
                // Also update localStorage directly
                localStorage.setItem('userPhotoURL', data.user.photoURL);
                localStorage.setItem('userProfile', JSON.stringify({
                    ...JSON.parse(localStorage.getItem('userProfile')),
                    photoURL: data.user.photoURL
                }));
                setMessage('Profile picture updated successfully!');
            } else {
                const errorMessage = typeof data.msg === 'string' ? data.msg : 'Failed to update profile picture.';
                setMessage(errorMessage);
            }
        } catch (error) {
            console.error("Error cropping or uploading photo:", error);
            const errorMessage = typeof error === 'object' && error.message ? error.message : 'Server error. Please try again later.';
            setMessage(errorMessage);
        } finally {
            setLoading(false);
            setSelectedFile(null);
            setImageSrcToCrop(null);
        }
    };

    const handleDeletePhoto = async () => {
        setLoading(true);
        setMessage('');

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/profile/delete-photo`, {
                method: 'DELETE',
                headers: {
                    'x-auth-token': user.token,
                },
            });

            const data = await response.json();

            if (response.ok) {
                updateUserProfile(data.user);
                setPreviewUrl(null);
                // Also update localStorage directly
                localStorage.removeItem('userPhotoURL');
                localStorage.setItem('userProfile', JSON.stringify({
                    ...JSON.parse(localStorage.getItem('userProfile')),
                    photoURL: null
                }));
                setMessage('Profile picture removed successfully!');
            } else {
                const errorMessage = typeof data.msg === 'string' ? data.msg : 'Failed to remove profile picture.';
                setMessage(errorMessage);
            }
        } catch (error) {
            console.error("Error deleting profile photo:", error);
            const errorMessage = typeof error === 'object' && error.message ? error.message : 'Server error. Please try again later.';
            setMessage(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleSectionChange = (section) => {
        setActiveSection(section);
    };

    // Handle profile field editing
    const handleEditToggle = (field) => {
        setIsEditing(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    const handleInputChange = (field, value) => {
        setProfileData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSaveField = async (field) => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/profile/update`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': user.token,
                },
                body: JSON.stringify({
                    [field]: profileData[field]
                }),
            });

            const data = await response.json();

            if (response.ok) {
                updateUserProfile(data.user);
                setIsEditing(prev => ({ ...prev, [field]: false }));
                setMessage(`${field} updated successfully!`);
                setTimeout(() => setMessage(''), 3000);
            } else {
                setMessage(data.msg || 'Failed to update profile.');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            setMessage('Server error. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelEdit = (field) => {
        setProfileData(prev => ({
            ...prev,
            [field]: user[field] || ''
        }));
        setIsEditing(prev => ({ ...prev, [field]: false }));
    };

    const photoSrc = previewUrl && previewUrl !== 'null' && previewUrl !== null && previewUrl !== ''
        ? (previewUrl.startsWith('blob:') ? previewUrl : getProfileImageSrc(previewUrl, isGoogleUser(user)))
        : getCurrentUserProfileImageSrc(user.photoURL, isGoogleUser(user));

    const renderEditableField = (label, field, type = 'text', options = null) => (
        <div className="profile-field">
            <div className="field-header">
                <label className="field-label">{label}</label>
                <button 
                    className="edit-button"
                    onClick={() => handleEditToggle(field)}
                    disabled={loading}
                >
                    {isEditing[field] ? 'Cancel' : 'Edit'}
                </button>
            </div>
            <div className="field-content">
                {isEditing[field] ? (
                    <div className="edit-mode">
                        {type === 'select' ? (
                            <select
                                value={profileData[field]}
                                onChange={(e) => handleInputChange(field, e.target.value)}
                                className="field-input"
                            >
                                <option value="">Select {label}</option>
                                {options.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        ) : type === 'textarea' ? (
                            <textarea
                                value={profileData[field]}
                                onChange={(e) => handleInputChange(field, e.target.value)}
                                className="field-textarea"
                                rows={3}
                                placeholder={`Enter your ${label.toLowerCase()}`}
                            />
                        ) : (
                            <input
                                type={type}
                                value={profileData[field]}
                                onChange={(e) => handleInputChange(field, e.target.value)}
                                className="field-input"
                                placeholder={`Enter your ${label.toLowerCase()}`}
                            />
                        )}
                        <div className="field-actions">
                            <button 
                                className="save-button"
                                onClick={() => handleSaveField(field)}
                                disabled={loading}
                            >
                                Save
                            </button>
                            <button 
                                className="cancel-button"
                                onClick={() => handleCancelEdit(field)}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="display-mode">
                        <span className="field-value">
                            {profileData[field] || `No ${label.toLowerCase()} provided`}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );

    const renderAccountSection = () => (
        <div className="account-content">
            {/* Profile Header */}
            <div className="profile-header">
                <div className="profile-avatar-section">
                    <img
                        src={photoSrc}
                        alt="Profile"
                        className="profile-avatar"
                    />
                    <div className="avatar-actions">
                        <label className="upload-button">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="file-input"
                                disabled={loading}
                            />
                            <span>{loading ? 'Processing...' : 'Change photo'}</span>
                        </label>
                        {user.photoURL && (
                            <button
                                onClick={handleDeletePhoto}
                                className="remove-button"
                                disabled={loading}
                            >
                                Remove photo
                            </button>
                        )}
                    </div>
                </div>
                <div className="profile-info">
                    <h1 className="profile-name">{profileData.displayName || 'No name'}</h1>
                    <p className="profile-email">{profileData.email}</p>
                </div>
            </div>

            {message && <div className="success-message">{message}</div>}

            {/* Personal Information */}
            <div className="info-section">
                <h2 className="section-heading">Personal info</h2>
                <p className="section-description">Info about you and your preferences across Google services</p>
                
                <div className="fields-container">
                    {renderEditableField('Name', 'displayName')}
                    {renderEditableField('Phone number', 'phoneNumber', 'tel')}
                    {renderEditableField('Address', 'address')}
                    {renderEditableField('Bio', 'bio', 'textarea')}
                    {renderEditableField('Date of birth', 'dateOfBirth', 'date')}
                    {renderEditableField('Gender', 'gender', 'select', ['Male', 'Female', 'Other', 'Prefer not to say'])}
                </div>
            </div>

            {/* Account Actions */}
            <div className="account-actions">
                <button onClick={onSignOut} className="sign-out-btn">Sign out</button>
            </div>
        </div>
    );

    // Security section states
    const [securityData, setSecurityData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        twoFactorCode: ''
    });
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(user.twoFactorEnabled || false);
    const [loginHistory, setLoginHistory] = useState([]);
    const [activeSessions, setActiveSessions] = useState([]);
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [show2FAVerification, setShow2FAVerification] = useState(false);

    // Fetch security data
    const fetchLoginHistory = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/login-history`, {
                headers: { 'x-auth-token': user.token }
            });
            const data = await response.json();
            if (response.ok) {
                setLoginHistory(data.history);
            }
        } catch (error) {
            console.error('Error fetching login history:', error);
        }
    };

    const fetchActiveSessions = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/active-sessions`, {
                headers: { 'x-auth-token': user.token }
            });
            const data = await response.json();
            if (response.ok) {
                setActiveSessions(data.sessions);
            }
        } catch (error) {
            console.error('Error fetching active sessions:', error);
        }
    };

    // Change password
    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (securityData.newPassword !== securityData.confirmPassword) {
            setMessage('New passwords do not match');
            return;
        }
        
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': user.token
                },
                body: JSON.stringify({
                    currentPassword: securityData.currentPassword,
                    newPassword: securityData.newPassword
                })
            });

            const data = await response.json();
            if (response.ok) {
                setMessage('Password changed successfully!');
                setSecurityData({ currentPassword: '', newPassword: '', confirmPassword: '', twoFactorCode: '' });
                setShowChangePassword(false);
                setTimeout(() => setMessage(''), 3000);
            } else {
                setMessage(data.msg || 'Failed to change password');
            }
        } catch (error) {
            setMessage('Server error. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    // Toggle 2FA
    const handleToggle2FA = async (enable) => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/2fa/toggle`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': user.token
                },
                body: JSON.stringify({ enable })
            });

            const data = await response.json();
            if (response.ok) {
                if (enable) {
                    setShow2FAVerification(true);
                    setMessage('Check your email for verification code');
                } else {
                    setTwoFactorEnabled(false);
                    setMessage('Two-Factor Authentication disabled');
                }
                setTimeout(() => setMessage(''), 3000);
            } else {
                setMessage(data.msg || 'Failed to update 2FA settings');
            }
        } catch (error) {
            setMessage('Server error. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    // Verify 2FA code
    const handleVerify2FA = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/2fa/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': user.token
                },
                body: JSON.stringify({ code: securityData.twoFactorCode })
            });

            const data = await response.json();
            if (response.ok) {
                setTwoFactorEnabled(true);
                setShow2FAVerification(false);
                setSecurityData({ ...securityData, twoFactorCode: '' });
                setMessage('Two-Factor Authentication enabled successfully!');
                setTimeout(() => setMessage(''), 3000);
            } else {
                setMessage(data.msg || 'Invalid verification code');
            }
        } catch (error) {
            setMessage('Server error. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    // Terminate session
    const handleTerminateSession = async (sessionId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/sessions/${sessionId}`, {
                method: 'DELETE',
                headers: { 'x-auth-token': user.token }
            });

            if (response.ok) {
                setActiveSessions(activeSessions.filter(s => s._id !== sessionId));
                setMessage('Session terminated successfully');
                setTimeout(() => setMessage(''), 3000);
            }
        } catch (error) {
            setMessage('Error terminating session');
        }
    };

    const renderSecuritySection = () => (
        <div className="security-content">
            {message && <div className="success-message">{message}</div>}

            {/* Change Password */}
            <div className="security-card">
                <div className="security-header">
                    <h3>Password</h3>
                    <p>Change your password regularly to keep your account secure</p>
                </div>
                {!showChangePassword ? (
                    <button 
                        className="security-action-btn"
                        onClick={() => setShowChangePassword(true)}
                    >
                        Change Password
                    </button>
                ) : (
                    <form onSubmit={handleChangePassword} className="security-form">
                        <div className="form-row">
                            <input
                                type="password"
                                placeholder="Current Password"
                                value={securityData.currentPassword}
                                onChange={(e) => setSecurityData({...securityData, currentPassword: e.target.value})}
                                required
                            />
                        </div>
                        <div className="form-row">
                            <input
                                type="password"
                                placeholder="New Password"
                                value={securityData.newPassword}
                                onChange={(e) => setSecurityData({...securityData, newPassword: e.target.value})}
                                required
                            />
                        </div>
                        <div className="form-row">
                            <input
                                type="password"
                                placeholder="Confirm New Password"
                                value={securityData.confirmPassword}
                                onChange={(e) => setSecurityData({...securityData, confirmPassword: e.target.value})}
                                required
                            />
                        </div>
                        <div className="form-actions">
                            <button type="submit" className="save-btn" disabled={loading}>
                                {loading ? 'Changing...' : 'Change Password'}
                            </button>
                            <button 
                                type="button" 
                                className="cancel-btn"
                                onClick={() => {
                                    setShowChangePassword(false);
                                    setSecurityData({...securityData, currentPassword: '', newPassword: '', confirmPassword: ''});
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* Two-Factor Authentication */}
            <div className="security-card">
                <div className="security-header">
                    <h3>Two-Factor Authentication</h3>
                    <p>Add an extra layer of security to your account</p>
                </div>
                <div className="security-toggle">
                    <span className={`toggle-status ${twoFactorEnabled ? 'enabled' : 'disabled'}`}>
                        {twoFactorEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <button 
                        className={`toggle-btn ${twoFactorEnabled ? 'disable' : 'enable'}`}
                        onClick={() => handleToggle2FA(!twoFactorEnabled)}
                        disabled={loading}
                    >
                        {twoFactorEnabled ? 'Disable' : 'Enable'}
                    </button>
                </div>
                
                {show2FAVerification && (
                    <form onSubmit={handleVerify2FA} className="verification-form">
                        <p>Enter the 6-digit code sent to your email:</p>
                        <div className="form-row">
                            <input
                                type="text"
                                placeholder="000000"
                                value={securityData.twoFactorCode}
                                onChange={(e) => setSecurityData({...securityData, twoFactorCode: e.target.value})}
                                maxLength="6"
                                required
                            />
                        </div>
                        <div className="form-actions">
                            <button 
                                type="submit" 
                                className="save-btn" 
                                disabled={loading || securityData.twoFactorCode.length !== 6}
                            >
                                {loading ? 'Verifying...' : 'Verify'}
                            </button>
                            <button 
                                type="button" 
                                className="cancel-btn"
                                onClick={() => {
                                    setShow2FAVerification(false);
                                    setSecurityData({...securityData, twoFactorCode: ''});
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* Login History */}
            <div className="security-card">
                <div className="security-header">
                    <h3>Login History</h3>
                    <p>Recent activity on your account</p>
                    <button 
                        className="refresh-btn"
                        onClick={fetchLoginHistory}
                    >
                        Refresh
                    </button>
                </div>
                <div className="history-list">
                    {loginHistory.length > 0 ? (
                        loginHistory.map((entry, index) => (
                            <div key={index} className="history-item">
                                <div className="history-info">
                                    <span className="history-action">{entry.action}</span>
                                    <span className="history-time">
                                        {new Date(entry.timestamp).toLocaleString()}
                                    </span>
                                </div>
                                <div className="history-details">
                                    <span className="history-ip">{entry.ipAddress}</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="no-data">No login history available</p>
                    )}
                </div>
            </div>

            {/* Active Sessions */}
            <div className="security-card">
                <div className="security-header">
                    <h3>Active Sessions</h3>
                    <p>Devices currently signed in to your account</p>
                    <button 
                        className="refresh-btn"
                        onClick={fetchActiveSessions}
                    >
                        Refresh
                    </button>
                </div>
                <div className="sessions-list">
                    {activeSessions.length > 0 ? (
                        activeSessions.map((session) => (
                            <div key={session._id} className="session-item">
                                <div className="session-info">
                                    <span className="session-device">
                                        {session.userAgent ? session.userAgent.split(' ')[0] : 'Unknown Device'}
                                    </span>
                                    <span className="session-time">
                                        Last active: {new Date(session.lastActivity).toLocaleString()}
                                    </span>
                                </div>
                                <div className="session-details">
                                    <span className="session-ip">{session.ipAddress}</span>
                                    <button 
                                        className="terminate-btn"
                                        onClick={() => handleTerminateSession(session._id)}
                                    >
                                        Terminate
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="no-data">No active sessions found</p>
                    )}
                </div>
            </div>
        </div>
    );

    const renderPrivacySection = () => (
        <div className="setting-section">
            <h2 className="section-title">Privacy Settings</h2>
            <div className="placeholder-content">
                <p>Privacy settings will be implemented here.</p>
                <ul>
                    <li>Profile Visibility</li>
                    <li>Data Sharing Preferences</li>
                    <li>Activity Tracking</li>
                    <li>Account Deletion</li>
                </ul>
            </div>
        </div>
    );

    const renderNotificationsSection = () => (
        <div className="setting-section">
            <h2 className="section-title">Notification Settings</h2>
            <div className="placeholder-content">
                <p>Notification settings will be implemented here.</p>
                <ul>
                    <li>Email Notifications</li>
                    <li>Push Notifications</li>
                    <li>Classroom Updates</li>
                    <li>System Alerts</li>
                </ul>
            </div>
        </div>
    );

    // Fetch security data when security section is active
    useEffect(() => {
        if (activeSection === 'security') {
            fetchLoginHistory();
            fetchActiveSessions();
        }
    }, [activeSection]);

    return (
        <>
            <Navbar
                isSidebarOpen={isSidebarOpen}
                toggleSidebar={toggleSidebar}
                user={user}
                handleSignOut={onSignOut}
                isAccountSettingPage={true}
                accountActiveSection={activeSection}
                onAccountSectionChange={handleSectionChange}
            />
            <main className={`main__content ${isSidebarOpen ? 'shift' : ''}`}>
                <div className="google-account-container">
                    {activeSection === 'account' && renderAccountSection()}
                    {activeSection === 'security' && renderSecuritySection()}
                    {activeSection === 'privacy' && renderPrivacySection()}
                    {activeSection === 'notifications' && renderNotificationsSection()}

                    {showCropper && (
                        <div className="cropper-modal">
                            <div className="cropper-container">
                                <Cropper
                                    image={imageSrcToCrop}
                                    crop={crop}
                                    zoom={zoom}
                                    aspect={1}
                                    onCropChange={setCrop}
                                    onZoomChange={setZoom}
                                    onCropComplete={onCropComplete}
                                />
                            </div>
                            <div className="cropper-controls">
                                <input
                                    type="range"
                                    value={zoom}
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    aria-labelledby="Zoom"
                                    onChange={(e) => setZoom(e.target.value)}
                                    className="zoom-slider"
                                />
                                <button onClick={() => setShowCropper(false)} className="cancel-crop-button">
                                    Cancel
                                </button>
                                <button onClick={handleCropAndUpload} className="crop-upload-button">
                                    Crop & Upload
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </>
    );
};

export default AccountSetting;