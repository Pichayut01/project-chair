// Profile Image Helper Utility
import nullUserPhoto from '../image/nulluser.png';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

/**
 * Get the correct profile image source with proper fallbacks
 * @param {string} photoURL - The user's photo URL
 * @param {boolean} isGoogleUser - Whether the user logged in with Google
 * @returns {string} - The correct image source URL
 */
export const getProfileImageSrc = (photoURL, isGoogleUser = false) => {
    // If no photoURL or invalid values, return null user image
    if (!photoURL || photoURL === 'null' || photoURL === null || photoURL === '' || photoURL === 'undefined') {
        return nullUserPhoto;
    }

    // If it's a Google user and photoURL starts with http, use it directly
    if (isGoogleUser && photoURL.startsWith('http')) {
        return photoURL;
    }

    // If photoURL starts with http (external URL), use it directly
    if (photoURL.startsWith('http')) {
        return photoURL;
    }

    // If it's a relative path (uploaded image), prepend API base URL
    if (photoURL.startsWith('/')) {
        return `${API_BASE_URL}${photoURL}`;
    }

    // If it's a relative path without leading slash, normalize
    return `${API_BASE_URL}/${photoURL.replace(/^\/+/, '')}`;
};

/**
 * Get the current user's profile image with localStorage fallback
 * @param {string} photoURL - The user's photo URL
 * @param {boolean} isGoogleUser - Whether the user logged in with Google
 * @returns {string} - The correct image source URL
 */
export const getCurrentUserProfileImageSrc = (photoURL, isGoogleUser = false) => {
    // Try localStorage fallback for current user
    let src = photoURL;
    if (!src || src === 'null' || src === 'undefined' || src === null || src === undefined || src === '') {
        try {
            const cached = typeof window !== 'undefined' ? window.localStorage.getItem('userPhotoURL') : null;
            if (cached && cached !== 'null' && cached !== 'undefined' && cached !== '') {
                src = cached;
            }
        } catch (_) { /* ignore */ }
    }

    // If still no valid source, return placeholder
    if (!src || src === 'null' || src === 'undefined' || src === null || src === undefined || src === '') {
        return nullUserPhoto;
    }

    // Use the regular getProfileImageSrc for processing the URL
    return getProfileImageSrc(src, isGoogleUser);
};

/**
 * Check if user is a Google user based on uid or photoURL
 * @param {object} user - User object
 * @returns {boolean} - Whether user is from Google
 */
export const isGoogleUser = (user) => {
    if (!user) return false;
    
    // Check if user has Firebase uid (Google login)
    if (user.uid && user.uid !== null && user.uid !== 'null') {
        return true;
    }
    
    // Check if photoURL is from Google
    if (user.photoURL && user.photoURL.includes('googleusercontent.com')) {
        return true;
    }
    
    return false;
};

/**
 * Handle image loading errors with fallback
 * @param {Event} e - Error event
 */
export const handleImageError = (e) => {
    e.target.src = nullUserPhoto;
    e.target.onerror = null; // Prevent infinite loop
};

export default {
    getProfileImageSrc,
    getCurrentUserProfileImageSrc,
    isGoogleUser,
    handleImageError
};
