# Login History System - Usage Guide

## 📊 ข้อมูลที่บันทึก

เมื่อ User login (ทั้ง Email/Password และ Google Login) ระบบจะบันทึกข้อมูลดังนี้:

### 1. Location Information
- **Country**: ประเทศ (เช่น Thailand, United States)
- **Region**: ภูมิภาค/จังหวัด
- **City**: เมือง
- **Timezone**: เขตเวลา
- **Coordinates**: พิกัด [latitude, longitude]

### 2. Device Information
- **Type**: ประเภทอุปกรณ์ (mobile, desktop, tablet, smarttv, wearable, console)
- **Vendor**: ยี่ห้อ (Apple, Samsung, etc.)
- **Model**: รุ่น
- **Icon**: Emoji icon (📱💻📱📺⌚🎮)

### 3. Browser Information
- **Name**: ชื่อ Browser (Chrome, Firefox, Safari, Edge, Opera, IE)
- **Version**: เวอร์ชัน Browser
- **Icon**: Emoji icon (🌐🦊🧭🌊🎭🗑️)

### 4. Operating System
- **Name**: ชื่อ OS (Windows, macOS, Android, iOS, Linux)
- **Version**: เวอร์ชัน OS

### 5. Other Info
- **IP Address**: IP ที่ใช้ login
- **User Agent**: User agent string แบบเต็ม
- **Timestamp**: วันเวลาที่ login
- **Success**: สถานะความสำเร็จ

## 🔒 Rate Limiting

### Login/Register Endpoints
- **Limit**: 5 attempts per 15 minutes
- **Applies to**: 
  - `/api/auth/login`
  - `/api/auth/register`
  - `/api/auth/google-login-verify`
  - `/api/auth/forgot-password`

### Login History Endpoint
- **Limit**: 10 requests per minute
- **Applies to**: `/api/auth/login-history`

### Active Sessions Endpoint
- **Limit**: 10 requests per minute
- **Applies to**: `/api/auth/active-sessions`

## 📡 API Response Format

### GET /api/auth/login-history

```json
{
  "history": [
    {
      "_id": "...",
      "userId": "...",
      "action": "login",
      "ipAddress": "192.168.1.1",
      "location": {
        "country": "Thailand",
        "region": "Bangkok",
        "city": "Bangkok",
        "timezone": "Asia/Bangkok",
        "coordinates": [13.75, 100.5167]
      },
      "device": {
        "type": "desktop",
        "vendor": "Unknown",
        "model": "Unknown",
        "icon": "💻"
      },
      "browser": {
        "name": "Chrome",
        "version": "120.0.0.0",
        "icon": "🌐"
      },
      "os": {
        "name": "Windows",
        "version": "10"
      },
      "userAgent": "Mozilla/5.0...",
      "success": true,
      "timestamp": "2026-01-15T08:30:00.000Z"
    }
  ],
  "pagination": {
    "current": 1,
    "total": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## 💡 Frontend Display Suggestions

### Basic Display
```typescript
{loginInfo.device.icon} {loginInfo.browser.name} on {loginInfo.os.name}
{loginInfo.location.city}, {loginInfo.location.country}
{formatDate(loginInfo.timestamp)}
```

Example output:
```
💻 Chrome on Windows
Bangkok, Thailand
15 Jan 2026, 3:30 PM
```

### Detailed Display
```typescript
Login from {location.city}, {location.country}
Device: {device.icon} {device.type} {device.vendor && `(${device.vendor})`}
Browser: {browser.icon} {browser.name} {browser.version}
OS: {os.name} {os.version}
IP: {ipAddress}
Time: {timestamp}
```

## 🔧 Testing

### Test with different devices:
1. Desktop Chrome
2. Mobile Safari (iPhone)
3. Mobile Chrome (Android)
4. Tablet
5. Different locations (VPN)

### Expected Results:
- Different device types should show different icons
- Different browsers should be detected correctly
- Location should be determined from IP (localhost will show "Local Development")
- All information should be stored in database

## 📝 Notes

- **Localhost/Private IPs**: Will show "Local Development" for location
- **VPN/Proxy**: Location may show VPN server location
- **Privacy**: User agent parsing is done server-side, user privacy is maintained
- **Performance**: GeoIP lookup is very fast (<1ms typically)
