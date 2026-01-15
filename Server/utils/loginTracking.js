const geoip = require('geoip-lite');
const UAParser = require('ua-parser-js');

// Helper to get client IP address
function getClientIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0].trim() ||
        req.headers['x-real-ip'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.ip ||
        'Unknown';
}

// Helper to get location from IP
function getLocationFromIP(ip) {
    try {
        // Remove IPv6 prefix if present
        const cleanIP = ip.replace(/^::ffff:/, '');

        // Don't lookup localhost or private IPs
        if (cleanIP === '127.0.0.1' || cleanIP === '::1' || cleanIP.startsWith('192.168.') || cleanIP.startsWith('10.')) {
            return {
                country: 'Local',
                region: 'Local',
                city: 'Local Development',
                timezone: 'Local',
            };
        }

        const geo = geoip.lookup(cleanIP);

        if (geo) {
            return {
                country: geo.country || 'Unknown',
                region: geo.region || 'Unknown',
                city: geo.city || 'Unknown',
                timezone: geo.timezone || 'Unknown',
                coordinates: geo.ll || null,
            };
        }

        return {
            country: 'Unknown',
            region: 'Unknown',
            city: 'Unknown',
            timezone: 'Unknown',
        };
    } catch (error) {
        console.error('Error getting location from IP:', error);
        return {
            country: 'Unknown',
            region: 'Unknown',
            city: 'Unknown',
            timezone: 'Unknown',
        };
    }
}

// Helper to parse user agent
function parseUserAgent(userAgentString) {
    try {
        const parser = new UAParser(userAgentString);
        const result = parser.getResult();

        return {
            browser: {
                name: result.browser.name || 'Unknown',
                version: result.browser.version || 'Unknown',
            },
            os: {
                name: result.os.name || 'Unknown',
                version: result.os.version || 'Unknown',
            },
            device: {
                type: result.device.type || 'desktop',
                vendor: result.device.vendor || 'Unknown',
                model: result.device.model || 'Unknown',
            },
            engine: result.engine.name || 'Unknown',
        };
    } catch (error) {
        console.error('Error parsing user agent:', error);
        return {
            browser: { name: 'Unknown', version: 'Unknown' },
            os: { name: 'Unknown', version: 'Unknown' },
            device: { type: 'desktop', vendor: 'Unknown', model: 'Unknown' },
            engine: 'Unknown',
        };
    }
}

// Get device icon based on device type
function getDeviceIcon(deviceType) {
    const icons = {
        mobile: '📱',
        tablet: '📱',
        desktop: '💻',
        smarttv: '📺',
        wearable: '⌚',
        console: '🎮',
    };
    return icons[deviceType] || '💻';
}

// Get browser icon
function getBrowserIcon(browserName) {
    const icons = {
        'Chrome': '🌐',
        'Firefox': '🦊',
        'Safari': '🧭',
        'Edge': '🌊',
        'Opera': '🎭',
        'IE': '🗑️',
    };
    return icons[browserName] || '🌐';
}

// Format login info for display
function formatLoginInfo(req) {
    const ip = getClientIP(req);
    const location = getLocationFromIP(ip);
    const userAgent = parseUserAgent(req.headers['user-agent'] || '');

    return {
        ip,
        location,
        userAgent,
        timestamp: new Date(),
        deviceIcon: getDeviceIcon(userAgent.device.type),
        browserIcon: getBrowserIcon(userAgent.browser.name),
    };
}

module.exports = {
    getClientIP,
    getLocationFromIP,
    parseUserAgent,
    getDeviceIcon,
    getBrowserIcon,
    formatLoginInfo,
};
