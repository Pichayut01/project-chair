# เอกสารอธิบายระบบการสร้างและเข้าร่วมห้องเรียน (Classroom System)
เอกสารฉบับนี้จัดทำขึ้นเพื่ออธิบายรายละเอียดทางเทคนิคและการทำงานของระบบห้องเรียนในโปรเจกต์ ซึ่งประกอบด้วยขั้นตอนการสร้างห้องเรียน รหัสเชิญ และกระบวนการเข้าร่วม เพื่อใช้เป็นเนื้อหาประกอบในงานวิจัย บทที่ 3

## 1. ระบบการสร้างห้องเรียน (Classroom Creation)

กระบวนการสร้างห้องเรียนถูกออกแบบมาเพื่อให้ผู้สอน (Teacher/Creator) สามารถกำหนดโครงสร้างพื้นฐานของห้องเรียนได้ทันที โดยครอบคลุมทั้งข้อมูลพื้นฐานและการจัดวางที่นั่ง (Seating Layout)

### เทคนิคการคำนวณและการจัดเก็บบัญชี
ข้อมูลห้องเรียนถูกจัดเก็บในฐานข้อมูล **MongoDB** ผ่าน Schema ของ `Class` โดยมีส่วนสำคัญคือ:
- **ข้อมูลพื้นฐาน**: ชื่อห้อง (Name), ชื่อวิชา (Subname), สีธีม (Color)
- **โครงสร้างห้อง**: จำนวนแถว (Rows) และคอลัมน์ (Cols) สำหรับระบบที่นั่งแบบตาราง
- **สิทธิการเข้าถึง**: ระบุผู้สร้าง (Creator) และเปิด/ปิดสถานะส่วนตัว (isPublic/allowSelfJoin)

### [Code Snippet] รูปแบบข้อมูลในฐานข้อมูล (Mongoose Schema)
```javascript
// Server/models/Class.js
const classSchema = new mongoose.Schema({
    name: { type: String, required: true },
    subname: { type: String, default: 'General' },
    classCode: { type: String, required: true, unique: true }, // รหัสห้องเรียน
    creator: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // ผู้สร้าง
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // ผู้เข้าร่วม
    rows: { type: Number, default: 0 },
    cols: { type: Number, default: 0 },
    seatingPositions: { type: mongoose.Schema.Types.Mixed, default: {} }, // ตำแหน่งพิกัดเก้าอี้
    allowSelfJoin: { type: Boolean, default: true }
});
```

---

## 2. การสร้างรหัสห้องเรียน (Class Code Generation)

เพื่อให้ง่ายต่อการเข้าร่วมและการจำ ระบบจะใช้อัลกอริทึมการสุ่มตัวอักษรและตัวเลข (Alphanumeric) ที่มีความยาว 6 ตัวอักษร

### อัลกอริทึมการคำนวณรหัส
ระบบใช้ฟังก์ชัน `Math.random()` ร่วมกับการแปลงเป็นฐาน 36 (Base 36) เพื่อสร้างข้อความสุ่ม จากนั้นทำการตัดเฉพาะส่วนที่ต้องการและแปลงเป็นตัวพิมพ์ใหญ่ทั้งหมด

### [Code Snippet] การสร้างรหัสห้องเรียน
```javascript
// Server/controllers/classController.js
// สร้างรหัสแบบสุ่ม 6 หลัก (เช่น A1B2C3)
const classCode = Math.random().toString(36).substring(2, 8).toUpperCase();
```

---

## 3. ระบบการเชิญและการเข้าร่วมห้องเรียน (Invite & Join System)

กระบวนการนี้แบ่งออกเป็น 2 รูปแบบหลัก เพื่อความยืดหยุ่นในการใช้งาน:

### 3.1 การเข้าด้วยรหัสห้องเรียน (Join via Class Code)
ผู้เรียนสามารถนำรหัส 6 หลักที่ได้รับจากผู้สอนมาป้อนในระบบ โดยระบบจะทำการตรวจสอบดังนี้:
1. **Validation**: ตรวจสอบว่ามีห้องเรียนที่ตรงกับรหัสนี้หรือไม่
2. **Membership Check**: ตรวจสอบว่าผู้ใช้นี้อยู่ในรายชื่อสมาชิกหรือยัง (เพื่อป้องกันการซ้ำซ้อน)
3. **Registry Update**: อัปเดตรายชื่อสมาชิกใน `participants` ของห้องเรียน และอัปเดต `enrolledClasses` ในข้อมูลของผู้ใช้

### 3.2 การเข้าแบบสาธารณะ (Public Access)
หากห้องเรียนถูกตั้งค่าเป็น **isPublic**, ผู้ใช้ที่มี URL ของห้องเรียนสามารถเข้าถึงได้ทันทีโดยไม่ต้องใส่รหัส ซึ่งระบบจะทำการเพิ่มรายชื่อผู้เข้าร่วมโดยอัตโนมัติ

### [Code Snippet] การทำงานของฟังก์ชัน Join
```javascript
// Server/controllers/classController.js
exports.joinClassroom = async (req, res) => {
    const { classCode } = req.body;
    const userId = req.user._id;

    try {
        const classToJoin = await Class.findOne({ classCode });

        if (!classToJoin) {
            return res.status(404).json({ msg: 'Invalid class code.' });
        }

        // เพิ่ม User ID ลงในรายชื่อผู้เข้าร่วม
        if (!classToJoin.participants.includes(userId)) {
            classToJoin.participants.push(userId);
            await classToJoin.save();
            
            // อัปเดตประวัติการเข้าเรียนของ User
            await User.findByIdAndUpdate(userId, { 
                $push: { enrolledClasses: classToJoin._id } 
            });
        }

        res.status(200).json({ msg: 'Joined successfully!', class: classToJoin });
    } catch (err) {
        res.status(500).send('Server error');
    }
};
```

---

## 4. ระบบแจ้งเตือนการเข้าร่วม (Real-time Notification)

เมื่อมีผู้เข้าร่วมห้องเรียนใหม่ ระบบจะส่งการแจ้งเตือนแบบ Real-time ไปยังเจ้าของห้องเรียน (Creator) โดยใช้ **Socket.io** เพื่อให้ผู้สอนรับรู้ถึงสมาชิกใหม่ทันที

### กลไกการแจ้งเตือน
1. รับข้อมูลการ Join จาก API
2. ค้นหา ID ของผู้สร้างห้องเรียน
3. ใช้ `notificationHelper` ในการสร้างข้อความและส่งผ่าน Web Socket (`req.io`) ไปยัง Target User

---

**หมายเหตุ**: ข้อมูลทั้งหมดนี้ถูกเขียนขึ้นตามโครงสร้างจริงของ Source Code ในปัจจุบัน เพื่อให้คุณสามารถนำไปอ้างอิงได้อย่างถูกต้องในงานวิจัย
