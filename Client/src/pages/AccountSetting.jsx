// src/component/AccountSetting.jsx

import React, { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../utils/cropImage';
import '../CSS/GoogleAccount.css';

import Navbar from '../components/Navbar'
import '../CSS/Navbar.css';
import '../CSS/Main.css';
import { getProfileImageSrc, getCurrentUserProfileImageSrc, isGoogleUser } from '../utils/profileImageHelper';
import { useTranslation } from 'react-i18next'; // ✨ Add useTranslation hook

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const AccountSetting = ({ user, updateUserProfile, onSignOut, isSidebarOpen, toggleSidebar }) => {
    const { t } = useTranslation(); // ✨ Apply hook
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
                setMessage(t('accountSettingsPage.profile.photoUpdateSuccess') || 'Profile picture updated successfully!');
            } else {
                const errorMessage = typeof data.msg === 'string' ? data.msg : (t('accountSettingsPage.profile.photoUpdateError') || 'Failed to update profile picture.');
                setMessage(errorMessage);
            }
        } catch (error) {
            console.error("Error cropping or uploading photo:", error);
            const errorMessage = typeof error === 'object' && error.message ? error.message : (t('accountSettingsPage.profile.serverError') || 'Server error. Please try again later.');
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
                setMessage(t('accountSettingsPage.profile.photoRemoveSuccess') || 'Profile picture removed successfully!');
            } else {
                const errorMessage = typeof data.msg === 'string' ? data.msg : (t('accountSettingsPage.profile.photoRemoveError') || 'Failed to remove profile picture.');
                setMessage(errorMessage);
            }
        } catch (error) {
            console.error("Error deleting profile photo:", error);
            const errorMessage = typeof error === 'object' && error.message ? error.message : (t('accountSettingsPage.profile.serverError') || 'Server error. Please try again later.');
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
                setMessage(t('accountSettingsPage.profile.updateSuccess', { field }) || `${field} updated successfully!`);
                setTimeout(() => setMessage(''), 3000);
            } else {
                setMessage(data.msg || (t('accountSettingsPage.profile.updateError') || 'Failed to update profile.'));
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            setMessage(t('accountSettingsPage.profile.serverError') || 'Server error. Please try again later.');
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
                    {isEditing[field] ? (t('common.cancel') || 'Cancel') : (t('common.edit') || 'Edit')}
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
                                <option value="">{t('accountSettingsPage.profile.selectInfo', { label }) || `Select ${label}`}</option>
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
                                placeholder={t('accountSettingsPage.profile.enterInfo', { label: label.toLowerCase() }) || `Enter your ${label.toLowerCase()}`}
                            />
                        ) : (
                            <input
                                type={type}
                                value={profileData[field]}
                                onChange={(e) => handleInputChange(field, e.target.value)}
                                className="field-input"
                                placeholder={t('accountSettingsPage.profile.enterInfo', { label: label.toLowerCase() }) || `Enter your ${label.toLowerCase()}`}
                            />
                        )}
                        <div className="field-actions">
                            <button
                                className="save-button"
                                onClick={() => handleSaveField(field)}
                                disabled={loading}
                            >
                                {t('common.save') || 'Save'}
                            </button>
                            <button
                                className="cancel-button"
                                onClick={() => handleCancelEdit(field)}
                                disabled={loading}
                            >
                                {t('common.cancel') || 'Cancel'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="display-mode">
                        <span className="field-value">
                            {profileData[field] || (t('accountSettingsPage.profile.noInfo', { label: label.toLowerCase() }) || `No ${label.toLowerCase()} provided`)}
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
                            <span>{loading ? (t('accountSettingsPage.profile.processing') || 'Processing...') : (t('accountSettingsPage.profile.changePhoto') || 'Change photo')}</span>
                        </label>
                        {user.photoURL && (
                            <button
                                onClick={handleDeletePhoto}
                                className="remove-button"
                                disabled={loading}
                            >
                                {t('accountSettingsPage.profile.removePhoto') || 'Remove photo'}
                            </button>
                        )}
                    </div>
                </div>
                <div className="profile-info">
                    <h1 className="profile-name">{profileData.displayName || (t('accountSettingsPage.profile.noName') || 'No name')}</h1>
                    <p className="profile-email">{profileData.email}</p>
                </div>
            </div>

            {message && <div className="success-message">{message}</div>}

            {/* Personal Information */}
            <div className="info-section">
                <h2 className="section-heading">{t('accountSettingsPage.profile.heading') || 'Personal info'}</h2>
                <p className="section-description">{t('accountSettingsPage.profile.description') || 'Info about you and your preferences across Google services'}</p>

                <div className="fields-container">
                    {renderEditableField(t('accountSettingsPage.profile.nameLabel') || 'Name', 'displayName')}
                    {renderEditableField(t('accountSettingsPage.profile.phoneLabel') || 'Phone number', 'phoneNumber', 'tel')}
                    {renderEditableField(t('accountSettingsPage.profile.addressLabel') || 'Address', 'address')}
                    {renderEditableField(t('accountSettingsPage.profile.bioLabel') || 'Bio', 'bio', 'textarea')}
                    {renderEditableField(t('accountSettingsPage.profile.dobLabel') || 'Date of birth', 'dateOfBirth', 'date')}
                    {renderEditableField(t('accountSettingsPage.profile.genderLabel') || 'Gender', 'gender', 'select', [
                        t('accountSettingsPage.profile.genderOptions.male') || 'Male', 
                        t('accountSettingsPage.profile.genderOptions.female') || 'Female', 
                        t('accountSettingsPage.profile.genderOptions.other') || 'Other', 
                        t('accountSettingsPage.profile.genderOptions.preferNotToSay') || 'Prefer not to say'
                    ])}
                </div>
            </div>

            {/* Account Actions */}
            <div className="account-actions">
                <button onClick={onSignOut} className="sign-out-btn">{t('accountSettingsPage.profile.signOut') || 'Sign out'}</button>
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

    const [historyLoading, setHistoryLoading] = useState(false);

    // Fetch security data
    const fetchLoginHistory = useCallback(async () => {
        setHistoryLoading(true);
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
        } finally {
            setHistoryLoading(false);
        }
    }, [user.token]);

    const fetchActiveSessions = useCallback(async () => {
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
    }, [user.token]);

    // Change password
    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (securityData.newPassword !== securityData.confirmPassword) {
            setMessage(t('accountSettingsPage.security.passObj.notMatch') || 'New passwords do not match');
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
                setMessage(t('accountSettingsPage.security.passObj.success') || 'Password changed successfully!');
                setSecurityData({ currentPassword: '', newPassword: '', confirmPassword: '', twoFactorCode: '' });
                setShowChangePassword(false);
                setTimeout(() => setMessage(''), 3000);
            } else {
                setMessage(data.msg || (t('accountSettingsPage.security.passObj.error') || 'Failed to change password'));
            }
        } catch (error) {
            setMessage(t('accountSettingsPage.profile.serverError') || 'Server error. Please try again later.');
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
                    setMessage(t('accountSettingsPage.security.twoFactor.checkEmail') || 'Check your email for verification code');
                } else {
                    setTwoFactorEnabled(false);
                    setMessage(t('accountSettingsPage.security.twoFactor.disabledSuccess') || 'Two-Factor Authentication disabled');
                }
                setTimeout(() => setMessage(''), 3000);
            } else {
                setMessage(data.msg || (t('accountSettingsPage.security.twoFactor.updateError') || 'Failed to update 2FA settings'));
            }
        } catch (error) {
            setMessage(t('accountSettingsPage.profile.serverError') || 'Server error. Please try again later.');
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
                setMessage(t('accountSettingsPage.security.twoFactor.enabledSuccess') || 'Two-Factor Authentication enabled successfully!');
                setTimeout(() => setMessage(''), 3000);
            } else {
                setMessage(data.msg || (t('accountSettingsPage.security.twoFactor.invalidCode') || 'Invalid verification code'));
            }
        } catch (error) {
            setMessage(t('accountSettingsPage.profile.serverError') || 'Server error. Please try again later.');
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
                setMessage(t('accountSettingsPage.security.activeSessions.terminateSuccess') || 'Session terminated successfully');
                setTimeout(() => setMessage(''), 3000);
            }
        } catch (error) {
            setMessage(t('accountSettingsPage.security.activeSessions.terminateError') || 'Error terminating session');
        }
    };

    const renderSecuritySection = () => (
        <div className="security-content">
            {message && <div className="success-message">{message}</div>}

            {/* Change Password */}
            <div className="security-card">
                <div className="security-header">
                    <h3>{t('accountSettingsPage.security.passObj.title') || 'Password'}</h3>
                    <p>{t('accountSettingsPage.security.passObj.desc') || 'Change your password regularly to keep your account secure'}</p>
                </div>
                {!showChangePassword ? (
                    <button
                        className="security-action-btn"
                        onClick={() => setShowChangePassword(true)}
                    >
                        {t('accountSettingsPage.security.passObj.changeBtn') || 'Change Password'}
                    </button>
                ) : (
                    <form onSubmit={handleChangePassword} className="security-form">
                        <div className="form-row">
                            <input
                                type="password"
                                placeholder={t('accountSettingsPage.security.passObj.currentPass') || 'Current Password'}
                                value={securityData.currentPassword}
                                onChange={(e) => setSecurityData({ ...securityData, currentPassword: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-row">
                            <input
                                type="password"
                                placeholder={t('accountSettingsPage.security.passObj.newPass') || 'New Password'}
                                value={securityData.newPassword}
                                onChange={(e) => setSecurityData({ ...securityData, newPassword: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-row">
                            <input
                                type="password"
                                placeholder={t('accountSettingsPage.security.passObj.confirmNewPass') || 'Confirm New Password'}
                                value={securityData.confirmPassword}
                                onChange={(e) => setSecurityData({ ...securityData, confirmPassword: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-actions">
                            <button type="submit" className="save-btn" disabled={loading}>
                                {loading ? (t('accountSettingsPage.security.passObj.changing') || 'Changing...') : (t('accountSettingsPage.security.passObj.changeBtn') || 'Change Password')}
                            </button>
                            <button
                                type="button"
                                className="cancel-btn"
                                onClick={() => {
                                    setShowChangePassword(false);
                                    setSecurityData({ ...securityData, currentPassword: '', newPassword: '', confirmPassword: '' });
                                }}
                            >
                                {t('common.cancel') || 'Cancel'}
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* Two-Factor Authentication */}
            <div className="security-card">
                <div className="security-header">
                    <h3>{t('accountSettingsPage.security.twoFactor.title') || 'Two-Factor Authentication'}</h3>
                    <p>{t('accountSettingsPage.security.twoFactor.desc') || 'Add an extra layer of security to your account'}</p>
                </div>
                <div className="security-toggle">
                    <span className={`toggle-status ${twoFactorEnabled ? 'enabled' : 'disabled'}`}>
                        {twoFactorEnabled ? (t('accountSettingsPage.security.twoFactor.enabled') || 'Enabled') : (t('accountSettingsPage.security.twoFactor.disabled') || 'Disabled')}
                    </span>
                    <button
                        className={`toggle-btn ${twoFactorEnabled ? 'disable' : 'enable'}`}
                        onClick={() => handleToggle2FA(!twoFactorEnabled)}
                        disabled={loading}
                    >
                        {twoFactorEnabled ? (t('accountSettingsPage.security.twoFactor.disableBtn') || 'Disable') : (t('accountSettingsPage.security.twoFactor.enableBtn') || 'Enable')}
                    </button>
                </div>

                {show2FAVerification && (
                    <form onSubmit={handleVerify2FA} className="verification-form">
                        <p>{t('accountSettingsPage.security.twoFactor.enterCode') || 'Enter the 6-digit code sent to your email:'}</p>
                        <div className="form-row">
                            <input
                                type="text"
                                placeholder={t('accountSettingsPage.security.twoFactor.placeholderCode') || '000000'}
                                value={securityData.twoFactorCode}
                                onChange={(e) => setSecurityData({ ...securityData, twoFactorCode: e.target.value })}
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
                                {loading ? (t('accountSettingsPage.security.twoFactor.verifyingBtn') || 'Verifying...') : (t('accountSettingsPage.security.twoFactor.verifyBtn') || 'Verify')}
                            </button>
                            <button
                                type="button"
                                className="cancel-btn"
                                onClick={() => {
                                    setShow2FAVerification(false);
                                    setSecurityData({ ...securityData, twoFactorCode: '' });
                                }}
                            >
                                {t('common.cancel') || 'Cancel'}
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* Login History */}
            <div className="security-card">
                <div className="security-header">
                    <h3>{t('accountSettingsPage.security.loginHistory.title') || 'Login History'}</h3>
                    <p>{t('accountSettingsPage.security.loginHistory.desc') || 'Recent activity on your account'}</p>
                    <button
                        className="refresh-btn"
                        onClick={fetchLoginHistory}
                        disabled={historyLoading}
                    >
                        {historyLoading ? (t('accountSettingsPage.security.loginHistory.loading') || 'Loading history...') : (t('accountSettingsPage.security.loginHistory.refreshBtn') || 'Refresh')}
                    </button>
                </div>
                <div className="history-list">
                    {historyLoading ? (
                        <p className="loading-text">{t('accountSettingsPage.security.loginHistory.loading') || 'Loading history...'}</p>
                    ) : loginHistory.length > 0 ? (
                        loginHistory.map((entry, index) => (
                            <div key={index} className="history-item">
                                <div className="history-info">
                                    <span className="history-action">{entry.action}</span>
                                    <span className="history-time">
                                        {new Date(entry.timestamp).toLocaleString()}
                                    </span>
                                </div>
                                <div className="history-details">
                                    <div className="history-location-info">
                                        {entry.location?.city || entry.location?.country ? (
                                            <span className="history-location">
                                                📍 {entry.location?.city ? `${entry.location.city}, ` : ''}{entry.location?.country || 'Unknown'}
                                            </span>
                                        ) : (
                                            <span className="history-location">📍 {t('accountSettingsPage.security.loginHistory.locationUnavailable') || 'Location unavailable'}</span>
                                        )}
                                        <span className="history-ip">{entry.ipAddress || 'N/A'}</span>
                                    </div>
                                    {(entry.device || entry.browser) && (
                                        <div className="history-device-info">
                                            {entry.device?.icon && (
                                                <span className="device-icon" title={entry.device?.type || 'Device'}>
                                                    {entry.device.icon} {entry.device?.type || ''}
                                                </span>
                                            )}
                                            {entry.browser?.icon && (
                                                <span className="browser-icon" title={entry.browser?.name || 'Browser'}>
                                                    {entry.browser.icon} {entry.browser?.name || ''}
                                                </span>
                                            )}
                                            {entry.os?.name && (
                                                <span className="os-info" title="Operating System">
                                                    {entry.os.name}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="no-data">{t('accountSettingsPage.security.loginHistory.noData') || 'No login history available'}</p>
                    )}
                </div>
            </div>

            {/* Active Sessions */}
            <div className="security-card">
                <div className="security-header">
                    <h3>{t('accountSettingsPage.security.activeSessions.title') || 'Active Sessions'}</h3>
                    <p>{t('accountSettingsPage.security.activeSessions.desc') || 'Devices currently signed in to your account'}</p>
                    <button
                        className="refresh-btn"
                        onClick={fetchActiveSessions}
                    >
                        {t('accountSettingsPage.security.activeSessions.refreshBtn') || 'Refresh'}
                    </button>
                </div>
                <div className="sessions-list">
                    {activeSessions.length > 0 ? (
                        activeSessions.map((session) => (
                            <div key={session._id} className="session-item">
                                <div className="session-info">
                                    <span className="session-device">
                                        {session.userAgent ? session.userAgent.split(' ')[0] : (t('accountSettingsPage.security.activeSessions.unknownDevice') || 'Unknown Device')}
                                    </span>
                                    <span className="session-time">
                                        {t('accountSettingsPage.security.activeSessions.lastActive') || 'Last active:'} {new Date(session.lastActivity).toLocaleString()}
                                    </span>
                                </div>
                                <div className="session-details">
                                    <span className="session-ip">{session.ipAddress}</span>
                                    <button
                                        className="terminate-btn"
                                        onClick={() => handleTerminateSession(session._id)}
                                    >
                                        {t('accountSettingsPage.security.activeSessions.terminateBtn') || 'Terminate'}
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="no-data">{t('accountSettingsPage.security.activeSessions.noData') || 'No active sessions found'}</p>
                    )}
                </div>
            </div>
        </div>
    );

    const renderPrivacySection = () => (
        <div className="setting-section">
            <h2 className="section-title">{t('accountSettingsPage.privacy.title') || 'Privacy Settings'}</h2>
            <div className="placeholder-content">
                <p>{t('accountSettingsPage.privacy.placeholder') || 'Privacy settings will be implemented here.'}</p>
                <ul>
                    <li>{t('accountSettingsPage.privacy.visibility') || 'Profile Visibility'}</li>
                    <li>{t('accountSettingsPage.privacy.sharing') || 'Data Sharing Preferences'}</li>
                    <li>{t('accountSettingsPage.privacy.tracking') || 'Activity Tracking'}</li>
                    <li>{t('accountSettingsPage.privacy.deletion') || 'Account Deletion'}</li>
                </ul>
            </div>
        </div>
    );

    const renderNotificationsSection = () => (
        <div className="setting-section">
            <h2 className="section-title">{t('accountSettingsPage.notifications.title') || 'Notification Settings'}</h2>
            <div className="placeholder-content">
                <p>{t('accountSettingsPage.notifications.placeholder') || 'Notification settings will be implemented here.'}</p>
                <ul>
                    <li>{t('accountSettingsPage.notifications.email') || 'Email Notifications'}</li>
                    <li>{t('accountSettingsPage.notifications.push') || 'Push Notifications'}</li>
                    <li>{t('accountSettingsPage.notifications.classroom') || 'Classroom Updates'}</li>
                    <li>{t('accountSettingsPage.notifications.system') || 'System Alerts'}</li>
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
    }, [activeSection, fetchActiveSessions, fetchLoginHistory]);

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
                <div className="main-content-scrollable-area">
                    <div className="google-account-container">
                        {activeSection === 'account' && renderAccountSection()}
                        {activeSection === 'security' && renderSecuritySection()}
                        {activeSection === 'privacy' && renderPrivacySection()}
                        {activeSection === 'notifications' && renderNotificationsSection()}
                    </div>
                </div>
            </main>

            {showCropper && createPortal(
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
                            {t('common.cancel') || 'Cancel'}
                        </button>
                        <button onClick={handleCropAndUpload} className="crop-upload-button">
                            {t('accountSettingsPage.profile.cropBtn') || 'Crop & Upload'}
                        </button>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

export default AccountSetting;