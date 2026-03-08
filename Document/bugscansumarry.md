# EChair System Bug & Vulnerability Scan Summary

จากการตรวจสอบ Codebase และ System Architecture ทั้งหมด โดยเฉพาะในส่วนของ Backend Routes, Controllers และ Socket.IO Handlers พบจุดที่อาจเป็นช่องโหว่ด้านความปลอดภัย (Vulnerability) หรือข้อผิดพลาดเชิงตรรกะ (Logic Bugs) ดังนี้ครับ

---

## 🔴 High / Critical Severity (ต้องแก้ไขด่วน)

### 1. IDOR (Insecure Direct Object Reference) ใน `updateSeating` จบคลาสได้ทุกห้อง

**ไฟล์:** `Server/controllers/classController.js` (บรรทัดที่ ~148: `exports.updateSeating`)
**ปัญหา:** Endpoint `PUT /api/classrooms/:classId/seating` มีเพียงแค่ `authMiddleware` เพื่อเช็คว่าล็อคอินแล้วเท่านั้น แต่ **ไม่มีการตรวจสอบ `isCreator`**
**ผลกระทบ:** นักเรียนคนใดก็ตาม (หรือใครที่มี Account สร้างใหม่) สามารถยิง API Request ตรงเข้ามาแก้ไข `seatingPositions`, `assignedUsers`, **`studentScores` (คะแนน)** และรายชื่อเก้าอี้ของห้องเรียนใดๆ ก็ได้ ทันที เพียงแค่รู้ `classId`
**วิธีแก้:** เพิ่มเงื่อนไขเหมือนฟังก์ชันอื่น: `if (!classroom.creator.map(id => id.toString()).includes(req.user.id.toString())) return res.status(403)...`

### 2. Unauthenticated Socket.IO Events (ไม่มีการยืนยันตัวตนคนส่ง Event)

**ไฟล์:** `Server/socket/socketHandler.js`
**ปัญหา:** Socket Event สำคัญๆ สำหรับการจัดการห้องเรียน (เช่น `update-score`, `chair-seating-update`, `add-classroom-event`, `delete-classroom-event`, `trigger-classroom-event`) **ไม่มีการเช็คสิทธิ์** ว่า Client ที่ส่งข้อมูลมาเป็นคุณครูเจ้าของห้องหรือไม่! Socket.IO ปัจจุบันรับข้อมูลจากฝั่ง Client และกระจายต่อทันที
**ผลกระทบ:** นักเรียนที่พอเขียนโค้ดเป็น สามารถเปิด Browser Console และยิงคำสั่ง `socket.emit('update-score', { studentId: '...', newScore: 999 })` เพื่อเพิ่มคะแนนตัวเองหรือลบ Event ทิ้งได้เลย
**วิธีแก้:**

- ใน Socket Backend ควรเก็บ Session (Role) ไว้
- หรือย้ายการบันทึกข้อมูลสำคัญไปทำผ่าน REST API แล้วใช้ Socket แค่พ่นข้อมูลอัพเดท (Broadcast)
- หรือให้ Client ส่ง Token แนบมากับทุกๆ socket action สำคัญ แล้ว verify สิทธิ์ก่อน `io.to().emit()`

### 3. ระบบแอดมินรั่วไหลผ่าน Socket

**ไฟล์:** `Server/socket/socketHandler.js` (`socket.on('join-admin-room')`)
**ปัญหา:** คุณทำคอมเมนต์เตือนไว้แล้วว่า `// For this quick implementation, we will trust the client sending the request acts as admin...`
**ผลกระทบ:** แฮกเกอร์เพียงแค่ส่ง `socket.emit('join-admin-room', {})` ก็จะเข้าไปอยู่ใน Room ของ Admin และสามารถดักจับ (Sniff) ดูพวก System Logs และ Activity ทั้งหมดที่วิ่งไปหา Admin ได้
**วิธีแก้:** คล้ายข้อ 2 ต้องตรวจสอบ Token ว่ามี `role === 'admin'` จริงๆ เท่านั้น ถึงจะให้ `socket.join('admins')` ได้

---

## 🟡 Medium Severity (ควรแก้ไข)

### 4. IDOR ใน Assignment Submission

**ไฟล์:** `Server/routes/classwork.js` (Route `POST /api/classwork/:classId/:assignmentId/submit`)
**ปัญหา:** ตรวจสอบแค่ว่า User ล็อคอินแล้ว แต่ไม่ได้ตรวจสอบว่า `req.user.id` เป็นหนึ่งใน `classroom.participants` หรือไม่
**ผลกระทบ:** ใครก็ได้ที่มี Account สามารถส่งงานเข้าไปใน Assignment ของห้องเรียนอื่นได้ เพียงแค่เดา URL/ID ถูก

### 5. ไม่มี Rate Limiting (จำกัดความถี่) ใน Auth & OTP

**ไฟล์:** `Server/controllers/authController.js` (`login` & `forgotPassword`)
**ปัญหา:** ฟังก์ชันส่ง อีพาสการยืนยัน OTP (เช่น ตอน Login หากเปิด 2FA) และ อีเมลเปลี่ยนรหัสผ่าน ทำงานทันทีเมื่อมี Request โดยไม่มีการหน่วงเวลาหรือจำกัดจำนวนครั้ง
**ผลกระทบ:** อาจถูกยิง Spam Request รัวๆ ทำให้โควต้าการส่งอีเมลของระบบ (เช่น NodeMailer / Sendgrid) เต็ม และเสียค่าใช้จ่าย หรือเมลอาจพัง

### 6. การสร้าง Class Code ขาดการตรวจความซ้ำซ้อน

**ไฟล์:** `Server/controllers/classController.js` (`createClassroom`)
**ปัญหา:** รหัสห้องถูกสร้างด้วย `Math.random().toString(36).substring(2, 8).toUpperCase()` (ได้ string ยาว 6 ตัว) แต่ไม่มี logic การ Query เช็คใน Database (`while (await Class.findOne({ classCode }))`)
**ผลกระทบ:** เมื่อมีจำนวนห้องมากขึ้น มีโอกาสที่โค้ดจะสุ่มได้เลขซ้ำกัน ทำให้การสร้างคลาสล้มเหลวด้วย Error MongoDB (Duplicate Key)

---

## 🟢 Low Severity / Best Practices (เผื่อเวลาปรับปรุง)

### 7. การตรวจสอบการสิ้นสุด Session การสอน (endSession)

**ไฟล์:** `Server/controllers/classController.js` (`endSession`)
**ปัญหา:** ไม่มีการตรวจสอบว่า `sessionId` ที่รับมานั้น เป็นของ `classroomId` ตรงกันจริงไหม (เช็คแค่ว่าคนที่ยิงเป็น Creator ของ Class ที่ส่งมาใน URL)
**ผลกระทบ:** ถ้าคุณครูเดา `sessionId` ของห้องอื่นถูก ก็อาจไปกดปิด Session ของคนอื่นได้ด้วย `classId` ของตัวเอง (แต่กรณีนี้เกิดยาก)

### 8. ขาดการกรองคำ (Sanitization) ໃນ Real-time Chat

**ไฟล์:** `Server/socket/socketHandler.js` (`saveAndBroadcastChat`)
**ปัญหา:** ข้อความแชทและ Emoji ดันเข้า DB ตรงๆ
**ผลกระทบ:** แม้ React จะช่วยป้องการ HTML Injection ฝั่งรันแล้ว (XSS) แต่อาจมีคนสแปมข้อความที่ยาวระดับหลักแสนตัวอักษรเพื่อทำให้ DB บวม หรือเกิด Denial of Service (DoS) แบบย่อมๆ ได้ ควรมีการสร้าง validation limit ความยาวข้อความก่อนบันทึกเสมอ

---

**สรุปสิ่งที่ควรทำอันดับแรก (Priority 1):**

- เข้าไปที่ `Server/controllers/classController.js` ค้นหา `exports.updateSeating` แล้วเติมเงื่อนไขเพื่อแบนคนที่ไม่ใช่เจ้าของห้องเรียน ทันที.
- พิจารณาวางโครงสร้างการเช็ค Auth บน `socket.on(...)` สำหรับ Event ที่เกี่ยวกับคะแนน.
