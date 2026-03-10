// Centralized API Configuration
// In production, we use a relative path (empty string) to route through Nginx.
// In development, it falls back to localhost:5000.

export const API_BASE_URL = process.env.NODE_ENV === 'production' 
    ? '' 
    : (process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL || 'http://localhost:5000');

export const API_AUTH_URL = `${API_BASE_URL}/api/auth`;

export default API_BASE_URL;
