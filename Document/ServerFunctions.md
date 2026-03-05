# เอกสารอธิบายการทำงานของฟังก์ชันฝั่ง Server (Server API & Functions)

ฟังก์ชันฝั่ง Server ถูกแบ่งออกเป็น Controller ต่างๆ ตามประเภทของคุณลักษณะ (Feature) ของระบบ

## 1. AuthController (การจัดการสิทธิ์และผู้ใช้)

- `googleLoginVerify`: ตรวจสอบความถูกต้องของการเข้าสู่ระบบด้วย Google
- `register`: ลงทะเบียนผู้ใช้ใหม่
- `login`: เข้าสู่ระบบด้วยอีเมลและรหัสผ่าน
- `logout`: ออกจากระบบ
- `forgotPassword` / `resetPassword`: จัดการการลืมรหัสผ่านและเปลี่ยนรหัสผ่านใหม่
- `toggle2FA` / `verify2FA`: จัดการการพิสูจน์ตัวตนแบบสองขั้นตอน (2FA)
- `getLoginHistory`: ดึงประวัติการเข้าสู่ระบบ
- `getActiveSessions`: ตรวจสอบเซสชันที่ยังออนไลน์อยู่
- `getMe`: ดึงข้อมูลผู้ใช้ปัจจุบันที่ล็อกอินอยู่
- `updateProfile` / `updatePhoto`: อัปเดตข้อมูลส่วนตัวและรูปโปรไฟล์

## 2. ClassController (การจัดการห้องเรียน)

- `getClassrooms`: ดึงรายการห้องเรียนทั้งหมดของผู้ใช้
- `createClassroom`: สร้างห้องเรียนใหม่
- `joinClassroom`: เข้าร่วมห้องเรียนด้วยรหัส (Invite Code)
- `getClassroom`: ดึงข้อมูลรายละเอียดของห้องเรียนหนึ่งๆ
- `updateSeating`: อัปเดตผังที่นั่งในห้องเรียน
- `leaveClassroom`: ออกจากห้องเรียน
- `kickUser`: ครูผู้สอนนำนักเรียนออกจากห้อง
- `promoteUser` / `demoteUser`: เปลี่ยนบทบาทของผู้ใช้ในห้องเรียน (เช่น ตั้งเป็นผู้ช่วยสอน)
- `getChatHistory`: ดึงประวัติการสนทนาในห้องเรียน
- `updateAttendance`: บันทึกและดึงข้อมูลการเข้าเรียน (Attendance)

## 3. AdminController (การควบคุมของผู้ดูแลระบบ)

- `getDashboardStats`: ดึงสถิติต่างๆ ของระบบ (จำนวนผู้ใช้, ห้องเรียน)
- `getAllUsers`: ดึงรายชื่อผู้ใช้ทั้งหมดในระบบ (พร้อมระบบแบ่งหน้า)
- `updateUser` / `deleteUser`: แก้ไขหรือลบผู้ใช้ในฐานะ Admin
- `getAllClassrooms`: ดูรายการห้องเรียนทั้งหมดที่มีในระบบ
- `getSystemLogs`: ดึง Log ของระบบเพื่อตรวจสอบความผิดปกติ
- `getSystemSettings` / `updateSystemSettings`: จัดการการตั้งค่าส่วนกลางของระบบ

## 4. PresetController (การจัดการเทมเพลตและคะแนน)

- `getAllPresets`: ดึงรายการคะแนนสะสมหรือเทมเพลตที่ตั้งค่าไว้
- `createPreset`: สร้างเทมเพลตคะแนนใหม่
- `deletePreset`: ลบเทมเพลตคะแนน

## 5. Socket Handler (การสื่อสาร Real-time)

- จัดการการเชื่อมต่อ (Connect/Disconnect)
- ส่งสัญญาณการอัปเดตสถานะที่นั่ง (Seat Update)
- ส่งสัญญาณการยกมือ (Raise Hand)
- จัดการการส่ง Emoji ในห้องเรียน
- ประสานงานการจัดกลุ่มนักเรียน (Grouping)
- จัดการระบบแชทในห้องเรียน (Class Chat)
