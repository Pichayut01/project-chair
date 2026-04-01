const LOCAL_API_FALLBACK = 'http://localhost:5000';

const trimTrailingSlash = (value = '') => value.replace(/\/+$/, '');

const normalizeBasePath = (value = '') => {
    const trimmedValue = String(value || '').trim();
    if (!trimmedValue || trimmedValue === '/') {
        return '';
    }

    try {
        const pathname = new URL(trimmedValue, 'http://localhost').pathname;
        return trimTrailingSlash(pathname === '/' ? '' : pathname);
    } catch (error) {
        const withLeadingSlash = trimmedValue.startsWith('/')
            ? trimmedValue
            : `/${trimmedValue}`;
        return trimTrailingSlash(withLeadingSlash);
    }
};

const joinUrl = (base = '', pathname = '') => {
    const normalizedPath = pathname
        ? (pathname.startsWith('/') ? pathname : `/${pathname}`)
        : '';

    if (!base) {
        return normalizedPath || '';
    }

    return `${trimTrailingSlash(base)}${normalizedPath}`;
};

const developmentApiBaseUrl = trimTrailingSlash(
    process.env.REACT_APP_API_BASE_URL ||
    process.env.REACT_APP_API_URL ||
    LOCAL_API_FALLBACK
);

export const APP_BASE_PATH = normalizeBasePath(
    process.env.PUBLIC_URL ||
    process.env.REACT_APP_BASE_PATH
);

export const APP_BASENAME = APP_BASE_PATH || '/';

export const API_BASE_URL = process.env.NODE_ENV === 'production'
    ? trimTrailingSlash(
        process.env.REACT_APP_API_BASE_URL ||
        process.env.REACT_APP_API_URL ||
        APP_BASE_PATH
    )
    : developmentApiBaseUrl;

export const buildApiUrl = (pathname = '') => joinUrl(API_BASE_URL, pathname);
export const buildAppUrl = (pathname = '') => joinUrl(APP_BASE_PATH, pathname);
export const buildPublicAssetUrl = (pathname = '') => joinUrl(APP_BASE_PATH, pathname);
export const buildServerUrl = (pathname = '') => {
    if (!pathname) return '';
    if (/^https?:\/\//i.test(pathname)) return pathname;
    return buildApiUrl(pathname);
};

export const API_AUTH_URL = buildApiUrl('/api/auth');

export const getSocketClientConfig = () => ({
    url: process.env.NODE_ENV === 'production'
        ? (typeof window !== 'undefined' ? window.location.origin : '')
        : developmentApiBaseUrl,
    options: {
        path: buildAppUrl('/socket.io') || '/socket.io'
    }
});

export const createSocketClient = (io, options = {}) => {
    const { url, options: socketOptions } = getSocketClientConfig();
    return io(url, {
        ...socketOptions,
        ...options
    });
};

export default API_BASE_URL;
