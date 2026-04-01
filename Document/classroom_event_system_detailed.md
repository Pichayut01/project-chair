# เอกสารอธิบายระบบ Classroom Event แบบละเอียด

เอกสารฉบับนี้อธิบายระบบ `Classroom Event` ของโปรเจกต์ตามซอร์สโค้ดปัจจุบันในวันที่ 29 มีนาคม 2026 โดยเน้นโครงสร้างข้อมูล การไหลของข้อมูลระหว่าง `Client` และ `Server` การทำงานผ่าน `Socket.IO` การคิดคะแนน การใช้ตัวจับเวลา การเก็บประวัติ และข้อสังเกตสำคัญสำหรับผู้พัฒนาที่จะเข้ามาดูแลระบบต่อ

## 1. ขอบเขตของระบบ

ระบบ Classroom Event คือระบบกิจกรรมสดภายในห้องเรียน ที่ให้ผู้สอนสร้างกิจกรรมแล้วให้นักเรียนโต้ตอบแบบเรียลไทม์จากหน้าเรียนหลัก โดยกิจกรรมที่ระบบรองรับในปัจจุบันมีดังนี้

- `random` เลือกนักเรียนแบบสุ่ม
- `question` คำถามปลายเปิด
- `poll` คำถามแบบตัวเลือก
- `wordcloud` เก็บคำเพื่อแสดงเป็น Word Cloud
- `buzz` เกมกดปุ่มตอบเร็ว
- `grouping` การให้นักเรียนเลือกเข้ากลุ่ม

ระบบนี้ไม่ได้แยกเป็น collection อิสระ แต่ฝังข้อมูล event ไว้ใน document ของห้องเรียน (`Class`) โดยตรง

## 2. ไฟล์สำคัญที่เกี่ยวข้อง

### ฝั่ง Client

- `Client/src/pages/ClassroomPage.jsx`
  หน้าห้องเรียนหลักที่โหลด event ทั้งหมด, ส่งคำสั่ง trigger, submit, publish draft, end event และคิดคะแนน

- `Client/src/components/ClassroomEvent.jsx`
  UI หลักสำหรับสร้าง event, แสดง card ของ event แต่ละประเภท, แสดงผลลัพธ์ และเปิด presentation mode ของ word cloud

- `Client/src/components/GroupingModal.jsx`
  UI สำหรับสร้าง grouping event และดู grouping session ที่กำลัง active

- `Client/src/components/ClassChat.jsx`
  ใช้แสดง grouping card ภายใน chat ผ่านข้อความ JSON พิเศษ

- `Client/src/hooks/useSocket.js`
  ตัวกลางเชื่อม Socket.IO สำหรับ emit และ listen event แบบ real-time

- `Client/src/pages/EventPresentationPage.jsx`
  หน้าแสดงผล Word Cloud แบบ presentation แยก route

- `Client/src/components/events/EventHistoryView.jsx`
  หน้าดูประวัติ event ทั้ง active และ archived

### ฝั่ง Server

- `Server/models/Class.js`
  schema ของห้องเรียน ซึ่งเก็บ `classroomEvents` และ `eventHistory`

- `Server/socket/socketHandler.js`
  จุดหลักของ logic แบบ real-time เช่น เพิ่ม event, trigger event, submit answer, delete/archive event, ย้ายสมาชิกระหว่างกลุ่ม

- `Server/controllers/classController.js`
  REST API สำหรับโหลดข้อมูลห้อง, อัปเดต `studentScores`, ดึง chat history และจัดการ teaching session

- `Server/routes/upload.js`
  route สำหรับอัปโหลดรูปประกอบคำถามหรือ poll

- `Server/utils/notificationHelper.js`
  ตัวช่วยสร้าง notification และ emit ไปยังห้องส่วนตัวของผู้ใช้

- `Server/server.js`
  จุด mount route `/api/upload`, `/api/classrooms` และ static `/uploads`

## 3. ภาพรวมสถาปัตยกรรม

ลำดับการทำงานระดับสูงของระบบมีดังนี้

1. หน้า `ClassroomPage` เรียก `GET /api/classrooms/:id` เพื่อโหลดข้อมูลห้องรวมถึง `classroomEvents`
2. หน้าเดียวกันเปิด socket ผ่าน `useSocket` และ `emit('join-classroom')`
3. เมื่อครูสร้าง event จาก `ClassroomEvent` หรือ `GroupingModal`
   - client สร้าง object ของ event
   - client `emit('add-classroom-event')`
   - server บันทึก event ลง `Class.classroomEvents`
   - server broadcast `classroom-event-added`
4. เมื่อนักเรียนตอบ event
   - client `emit('submit-event-answer')`
   - server push answer ลง `classroomEvents.$.results`
   - server broadcast `classroom-event-updated`
   - ถ้าเป็น poll แบบกำหนดคะแนนต่อ option จะอัปเดตคะแนนทันทีที่ server
5. เมื่อครูจบ event หรือแก้ state
   - client `emit('trigger-classroom-event')`
   - server update field ภายใน event นั้น
   - server broadcast `classroom-event-triggered`
6. เมื่อลบ event
   - server ย้ายข้อมูลจาก `classroomEvents` ไป `eventHistory`
   - broadcast `classroom-event-deleted`

## 4. โครงสร้างข้อมูลในฐานข้อมูล

### 4.1 โครงสร้าง `classroomEvents`

ใน `Server/models/Class.js` ฟิลด์ `classroomEvents` ถูกเก็บเป็น array ของ object แบบฝังใน document ห้องเรียน โดยมีโครงสร้างหลักดังนี้

```js
{
  id: String,
  title: String,
  description: String,
  type: String,
  config: Mixed,
  results: Mixed,
  status: String,
  startTime: Number,
  createdAt: Number,
  updatedAt: Number
}
```

ความหมายของ field หลัก

- `id`
  รหัส event ที่ client สร้างเอง ส่วนใหญ่เป็นรูปแบบ `event-${Date.now()}`

- `title`
  ชื่อ event ที่ใช้แสดงบน card และ notification

- `description`
  คำอธิบายสั้น ๆ ของ event

- `type`
  ประเภทกิจกรรม เช่น `random`, `question`, `poll`, `wordcloud`, `buzz`, `grouping`

- `config`
  ค่ากำหนดเฉพาะของ event นั้น เช่นคำถาม, ตัวเลือก, timer, scoring, จำนวนคนที่สุ่ม, ข้อมูลกลุ่ม

- `results`
  คำตอบหรือผลลัพธ์ที่เกิดขึ้นจริงของ event

- `status`
  สถานะของ event ใน lifecycle ปัจจุบัน

- `startTime`
  ใช้หลัก ๆ กับ `buzz` เพื่อเริ่มนับถอยหลัง 3 วินาที

- `createdAt`, `updatedAt`
  timestamp ระดับ millisecond สำหรับ sort, animation และ sync state

### 4.2 โครงสร้าง `eventHistory`

เมื่อ event ถูกลบ ระบบจะไม่ทิ้งข้อมูลทันที แต่ย้ายไปเก็บที่ `eventHistory` ใน schema เดียวกัน โดยเพิ่ม `deletedAt` และเปลี่ยน `status` เป็น `deleted`

```js
{
  id: String,
  title: String,
  description: String,
  type: String,
  config: Mixed,
  results: Mixed,
  status: String,
  startTime: Number,
  createdAt: Number,
  updatedAt: Number,
  deletedAt: Number
}
```

### 4.3 สถานะของ event

สถานะที่ใช้งานจริงในระบบปัจจุบันมีดังนี้

- `draft`
  event ถูกสร้างไว้ก่อน แต่ยังไม่เผยแพร่ให้นักเรียนเห็น

- `idle`
  event ถูกเผยแพร่แล้ว อยู่ในสถานะพร้อมใช้งาน

- `active`
  ใช้กับ event ที่มีช่วงกำลังทำงานชัดเจน เช่น `buzz`

- `ended`
  event ปิดแล้ว นักเรียนไม่ควรส่งคำตอบเพิ่ม

- `deleted`
  ใช้เฉพาะตอนเก็บใน `eventHistory`

## 5. รูปแบบข้อมูล `config` ของแต่ละ event

### 5.1 `random`

ตัวอย่าง config

```js
{
  type: "random",
  count: 3,
  status: "idle",
  scoring: {
    enabled: true,
    points: 5
  }
}
```

ใช้กำหนดจำนวนคนที่จะสุ่ม (`count`) และ optional scoring แบบให้คะแนนผู้ที่ถูกสุ่ม

### 5.2 `question`

ตัวอย่าง config

```js
{
  type: "question",
  questionText: "อธิบายหลักการของ Binary Search",
  imageUrl: "/uploads/1773681408772-685051931.jpg",
  timer: {
    enabled: true,
    durationSeconds: 90,
    startedAt: 1770000000000,
    endsAt: 1770000090000
  },
  status: "idle",
  scoring: {
    enabled: true,
    points: 5
  }
}
```

### 5.3 `poll`

ตัวอย่าง config

```js
{
  type: "poll",
  questionText: "หัวข้อไหนควรทบทวนเพิ่ม",
  imageUrl: "/uploads/1773656930112-359738111.png",
  timer: {
    enabled: true,
    durationSeconds: 60,
    startedAt: 1770000000000,
    endsAt: 1770000060000
  },
  options: ["Sorting", "Graph", "Dynamic Programming"],
  scoring: {
    enabled: true,
    points: 0
  },
  scoreConfig: {
    optionScores: {
      "Sorting": { "points": 2, "action": "add" },
      "Graph": { "points": 1, "action": "add" },
      "Dynamic Programming": { "points": 1, "action": "subtract" }
    }
  },
  status: "idle"
}
```

หมายเหตุสำคัญ

- `poll` มี scoring สองชั้นใน implementation ปัจจุบัน
- ชั้นแรกคือ `scoreConfig.optionScores` ซึ่ง server ใช้คิดคะแนนทันทีเมื่อ submit คำตอบ
- ชั้นที่สองคือ flow `End & Score` ในหน้า `ClassroomPage` ซึ่งยังสามารถวนมาคิดคะแนนซ้ำจากผลลัพธ์ได้

### 5.4 `wordcloud`

ตัวอย่าง config หลังถูก flatten แล้วเก็บลง event จริง

```js
{
  type: "wordcloud",
  status: "idle",
  topic: "Describe this lesson in one word",
  scoring: {
    enabled: true,
    points: 3
  }
}
```

### 5.5 `buzz`

ตัวอย่าง config

```js
{
  type: "buzz",
  status: "idle",
  scoring: {
    enabled: true,
    points: 10
  }
}
```

การเริ่มจริงจะใช้ `startTime` และ `status: active` เพิ่มเข้ามาภายหลังผ่าน socket trigger

### 5.6 `grouping`

ตัวอย่าง config

```js
{
  type: "grouping",
  groups: [
    { "id": "uuid-1", "name": "Group 1", "color": "#10b981", "maxMembers": 5 },
    { "id": "uuid-2", "name": "Group 2", "color": "#3b82f6", "maxMembers": 5 },
    { "id": "uuid-3", "name": "Group 3", "color": "#f59e0b", "maxMembers": 5 }
  ]
}
```

`grouping` ถูกสร้างจาก `GroupingModal.jsx` ไม่ได้สร้างจาก modal ใน `ClassroomEvent.jsx`

## 6. รูปแบบข้อมูล `results` ของแต่ละ event

ระบบไม่ได้บังคับ schema เดียวกันทุกประเภท เพราะ `results` ใช้ `Mixed`

### 6.1 คำตอบมาตรฐานจากนักเรียน

`question`, `poll`, `wordcloud`, `grouping`, `buzz` ล้วนเริ่มต้นจาก answer object ที่ client ส่งผ่าน `emitSubmitEventAnswer`

```js
{
  userId: "student-id",
  userName: "Student Name",
  photoURL: "https://...",
  text: "คำตอบหรือ option ที่เลือก",
  timestamp: 1770000000000
}
```

### 6.2 `random`

ผลลัพธ์ของ random ไม่ได้มาจากการ submit ของนักเรียน แต่เกิดจากครู trigger แล้ว client สร้างผลลัพธ์เองจาก `assignedUsers`

```js
[
  {
    userId: "student-id",
    userName: "Student Name",
    photoSrc: "resolved-image-url"
  }
]
```

### 6.3 `grouping`

ตอนนักเรียนเลือกกลุ่ม `text` จะเก็บ `group.id` หรือ `group.name`

ภายหลังถ้ามีการย้ายกลุ่มด้วย socket `move-student-group` server จะเพิ่ม field `option` เข้าไปด้วย

```js
{
  userId: "student-id",
  userName: "Student Name",
  photoURL: "https://...",
  text: "group-id",
  option: "Group 2",
  timestamp: 1770000000000
}
```

## 7. Lifecycle ของ event

### 7.1 โหลดข้อมูลเริ่มต้น

เมื่อเข้า `ClassroomPage`

- client เรียก `GET /api/classrooms/:id`
- อ่าน `response.data.classroomEvents`
- set ลง state `classroomEvents`
- เปิด socket room ของห้องเรียนเดียวกัน

### 7.2 สร้าง event

การสร้าง event ฝั่ง client ทำงานดังนี้

1. ครูเลือกประเภท event
2. กรอก config ใน modal
3. `ClassroomPage.handleAddEvent` สร้าง object ใหม่ เช่น

```js
{
  id: "event-1770000000000",
  title: "Question",
  description: "New classroom event started",
  type: "question",
  status: "idle",
  createdAt: 1770000000000,
  createdBy: "teacher-id",
  config: { ... }
}
```

4. client เรียก `emitAddClassroomEvent`
5. server รับ `add-classroom-event`
6. server `$push` ข้อมูลลง `Class.classroomEvents`
7. server broadcast `classroom-event-added`

หมายเหตุ

- sender จะเพิ่ม event เข้า local state แบบ optimistic ทันที
- ฝั่ง listener มีการกันซ้ำด้วย `event.id`

### 7.3 สร้างเป็น draft

บาง event สามารถกด `Save as Draft` ได้ ทำให้ status เริ่มเป็น `draft`

พฤติกรรมสำคัญ

- event draft ถูกเก็บในฐานข้อมูลจริงแล้ว
- นักเรียนจะไม่เห็น event ที่ status เป็น `draft`
- ครูจะเห็น card พร้อม overlay และปุ่ม `Post Event`

### 7.4 publish draft

เมื่อครูกด `Post Event`

- `ClassroomPage.handlePublishDraftEvent` จะเตรียม config ใหม่
- ถ้า event เป็น `question` หรือ `poll` และเปิด timer ไว้
  - จะ set `timer.startedAt`
  - จะ set `timer.endsAt`
- client emit `trigger-classroom-event` พร้อม

```js
{
  status: "idle",
  config: publishedConfig,
  updatedAt: now,
  _isPublishingDraft: true
}
```

server จะ

- update event ตาม `eventId`
- ถ้าเจอ `_isPublishingDraft`
  - สร้าง notification ประเภท `event` ให้ participant ทุกคน
  - ลบ `_isPublishingDraft` ออกจากฐานข้อมูลอีกครั้ง
- broadcast `classroom-event-triggered`

### 7.5 trigger event

พฤติกรรม trigger แตกต่างตามประเภท

- `random`
  ครูเป็นคน trigger เพื่อสุ่มจากรายชื่อ `assignedUsers`

- `buzz`
  ครูกดเริ่ม countdown โดยส่ง `status: active`, `startTime: Date.now()`, `results: []`

- `buzz reset`
  ครู reset กลับเป็น `status: idle`, `results: []`

- event อื่น ๆ
  ใช้ trigger หลัก ๆ เพื่อ update state เช่น publish draft, end event หรือ sync ผลลัพธ์

### 7.6 นักเรียน submit คำตอบ

เมื่อผู้เรียนส่งคำตอบ

1. client ส่ง `submit-event-answer`
2. server บังคับใช้ `serverTimestamp = Date.now()`
3. server หา event จาก `classroomEvents.id`
4. server ปฏิเสธคำตอบถ้า
   - `status === 'ended'`
   - timer หมดเวลา
5. server `$push` answer ลง `classroomEvents.$.results`
6. server อ่านข้อมูล event ล่าสุดแล้ว emit `classroom-event-updated`

### 7.7 จบ event

การจบ event ใช้ `emitTriggerClassroomEvent(event.id, { status: 'ended' })`

ผลคือ

- server update status
- client ทุกคนได้รับ `classroom-event-triggered`
- student UI จะ lock input และแสดง state ว่า event จบแล้ว

### 7.8 ลบและ archive

เมื่อครูลบ event

1. client ส่ง `delete-classroom-event`
2. server อ่าน event เดิมจาก `classroomEvents`
3. server สร้าง `archivedEvent`
   - copy event เดิม
   - set `status: 'deleted'`
   - set `deletedAt: Date.now()`
4. server
   - `$push` เข้า `eventHistory`
   - `$pull` ออกจาก `classroomEvents`
5. server broadcast `classroom-event-deleted`

## 8. รายละเอียดการทำงานของแต่ละ event

### 8.1 Random Student

วัตถุประสงค์

- ให้ครูสุ่มเลือกนักเรียนจากคนที่นั่งอยู่ในห้อง (`assignedUsers`)

การทำงาน

- จำนวนคนที่สุ่มกำหนดจาก `count`
- เมื่อ trigger ระบบจะสุ่ม client-side
- client ส่ง `results`, `animationDuration`, `updatedAt` ไปที่ server
- ฝั่ง UI มี animation แบบ slot machine ก่อนเฉลยผล
- ถ้ามี scoring และครูกดจบ event ระบบจะให้คะแนนผู้ที่ถูกสุ่ม

หมายเหตุ

- ถ้าไม่มีนักเรียนนั่งอยู่ ระบบจะแจ้งเตือนและไม่ trigger
- หลังสุ่มเสร็จ client จะส่ง system chat ว่าใครถูกเลือก

### 8.2 Question

วัตถุประสงค์

- เปิดคำถามปลายเปิดให้นักเรียนพิมพ์ตอบแบบสั้นหรือยาว

ความสามารถ

- แนบรูปได้ผ่าน `/api/upload`
- เปิด timer ได้
- เปิด scoring ระดับ event ได้
- ครูดูคำตอบทั้งหมดและกดเปิด popup อ่านรายบุคคลได้

การคิดคะแนน

- server ไม่คิดคะแนนทันทีเมื่อ submit
- คะแนนจะถูกคิดเมื่อครูกด `End & Score`

### 8.3 Poll

วัตถุประสงค์

- ถามคำถามแบบมีตัวเลือกหลายข้อ

ความสามารถ

- แนบรูปได้
- เปิด timer ได้
- กำหนดคะแนนแยกต่อ option ได้

การคิดคะแนน

- เมื่อเปิด `Enable Scoring (Per Option)` server จะคิดคะแนนทันทีตอนนักเรียน submit
- server จะอัปเดต `studentScores.<studentId>` ด้วย `$inc`
- server จะ emit `score-updated`
- นอกจากนี้ฝั่งครูยังมีปุ่ม `End & Score` อยู่ใน UI

ข้อสังเกต

- implementation ปัจจุบันอาจทำให้ poll ที่เปิดคะแนนต่อ option ถูกคิดคะแนนซ้ำได้ หากครูกด `End & Score` หลังจาก server ให้คะแนนไปแล้วตอน submit

### 8.4 Word Cloud

วัตถุประสงค์

- รับคำตอบสั้น ๆ แล้วแสดงรวมเป็น word cloud

ความสามารถ

- นักเรียนพิมพ์คำตอบได้ครั้งเดียวผ่าน input จำกัด 25 ตัวอักษร
- ครูเปิด `Present` เพื่อเปิด route `/presentation/:classId/:eventId`
- หน้า presentation ฟัง socket เพื่ออัปเดตผลแบบสด

การคิดคะแนน

- ถ้าเปิด scoring จะคิดตอนครูกด `End & Score`

### 8.5 Buzz Button

วัตถุประสงค์

- ใช้ตอบเร็วหรือแข่งกดปุ่ม

การทำงาน

- ครูต้องกด `Start Countdown`
- event จะเข้า `status: active`
- ใช้ `startTime` เพื่อให้ทุกคนเห็นนับถอยหลัง 3 วินาที
- เมื่อ countdown เป็น 0 นักเรียนถึงกดได้
- ทุกคำตอบถูกเก็บใน `results`
- ครูเห็นลำดับการกดพร้อมเวลาต่างจาก `startTime`

การคิดคะแนน

- ถ้าเปิด scoring ตอน `End & Score`
- ระบบให้คะแนนเฉพาะคนแรกใน `results[0]`

### 8.6 Grouping

วัตถุประสงค์

- ให้นักเรียนเลือกเข้ากลุ่มด้วยตนเอง

การสร้าง

- สร้างจาก `GroupingModal`
- แต่ละกลุ่มมี `id`, `name`, `color`, `maxMembers`

การทำงาน

- นักเรียนเลือกเข้ากลุ่มผ่าน card ของ event หรือผ่าน grouping card ใน chat
- จำนวนสมาชิกแสดงแบบเรียลไทม์
- ถ้ากลุ่มเต็มปุ่มจะ disabled
- ครูเห็นจำนวนคนในแต่ละกลุ่มแบบสด

จุดพิเศษ

- หลังสร้าง grouping event client จะส่งข้อความ chat พิเศษเป็น JSON

```json
{
  "type": "grouping",
  "eventId": "event-1770000000000",
  "groups": [ ... ]
}
```

- `ClassChat.jsx` จะ parse JSON นี้แล้ว render เป็น grouping card แทนข้อความธรรมดา
- มี socket สำหรับย้ายสมาชิกกลุ่มหรือเอาออกจากกลุ่มได้ทั้ง event ที่ active และ archived

การจบ event

- ปุ่ม `Cancel Grouping` ใน modal เรียก `handleEndAndScoreEvent`
- เนื่องจาก grouping ปกติไม่มี scoring ระบบจะจบ event ด้วย `status: ended`

## 9. การทำงานของ Timer

timer ถูกใช้กับ `question` และ `poll` เท่านั้น

โครงสร้าง timer

```js
{
  enabled: true,
  durationSeconds: 90,
  startedAt: 1770000000000,
  endsAt: 1770000090000
}
```

กติกา

- ถ้าสร้าง event แบบ publish ทันที timer จะเริ่มตอนสร้าง
- ถ้าสร้างแบบ draft timer จะยังไม่เริ่ม จนกด `Post Event`
- student UI ใช้ `EventTimerBanner` เพื่อแสดงเวลาคงเหลือ
- server เป็นคนปฏิเสธ late answer โดยตรวจ `endsAt`

ผลหลังหมดเวลา

- นักเรียนจะส่งคำตอบใหม่ไม่ได้
- event ไม่ได้ถูกเปลี่ยนเป็น `ended` อัตโนมัติทันที
- ครูยังเห็นผลลัพธ์เดิมและสามารถกดจบ event ภายหลังได้

## 10. การคิดคะแนน

ระบบคิดคะแนนของ event มี 2 แนวทางหลัก

### 10.1 คิดคะแนนทันทีที่ submit

ใช้กับ `poll` ที่มี `scoreConfig.optionScores`

flow

1. นักเรียนเลือก option
2. server อ่าน `optionScores[answer.text]`
3. server คำนวณค่าคะแนนตาม `action`
   - `add` = บวก
   - `subtract` = ลบ
4. server `$inc` ค่าใน `studentScores.<studentId>`
5. emit `score-updated`
6. ส่ง notification ประเภท `score`

### 10.2 คิดคะแนนตอนครูกด End & Score

ใช้กับ `random`, `question`, `wordcloud`, `buzz` และ `poll` ใน flow ปัจจุบันของหน้า `ClassroomPage`

การทำงาน

- client ประมวลผล `scoredEntries`
- client update `studentScores` ทั้งก้อนผ่าน `PUT /api/classrooms/:classId/seating`
- client emit socket score update เพื่อ sync คนอื่น
- client เปลี่ยน event เป็น `ended`

หลักเกณฑ์การให้คะแนน

- `random`
  ให้คะแนนกับทุกคนที่ถูกสุ่ม

- `question`
  ให้คะแนนกับผู้ตอบแต่ละคนแบบไม่ซ้ำ user

- `wordcloud`
  ให้คะแนนกับผู้ส่งคำแต่ละคนแบบไม่ซ้ำ user

- `buzz`
  ให้คะแนนเฉพาะคนแรก

- `poll`
  ถ้ามี `scoreConfig.optionScores` จะอิงคะแนนตาม option
  ถ้าไม่มีจะใช้ `basePoints`

### 10.3 จุดที่คะแนนถูกเก็บจริง

คะแนนของนักเรียนถูกเก็บใน `Class.studentScores`

โครงสร้างโดยทั่วไปเป็น

```js
{
  "student-id-1": {
    "Question (Event)": 5,
    "Poll (Event)": 2
  }
}
```

หมายเหตุ

- `updateSeating` รองรับการอัปเดต `studentScores` ทั้งก้อน
- `EventHistoryView` นำข้อมูลนี้ไปวิเคราะห์และปรับคะแนนภายหลังได้

## 11. Socket Events ที่เกี่ยวข้อง

### 11.1 Client -> Server

| Event | ผู้ส่ง | จุดประสงค์ |
| --- | --- | --- |
| `join-classroom` | ทุกคน | เข้าห้อง socket ของ class |
| `add-classroom-event` | ครู | เพิ่ม event ใหม่ |
| `trigger-classroom-event` | ครู | update สถานะ/ผลลัพธ์/เวลา ของ event |
| `delete-classroom-event` | ครู | ลบและ archive event |
| `submit-event-answer` | นักเรียนหรือผู้ใช้ที่ตอบได้ | ส่งคำตอบเข้ากิจกรรม |
| `remove-student-from-group` | ผู้จัดการกลุ่ม | เอาสมาชิกออกจากกลุ่ม |
| `move-student-group` | ผู้จัดการกลุ่ม | ย้ายสมาชิกไปกลุ่มอื่น |

### 11.2 Server -> Client

| Event | ผู้รับ | ความหมาย |
| --- | --- | --- |
| `classroom-event-added` | ทุกคนในห้อง | มี event ใหม่ถูกสร้าง |
| `classroom-event-triggered` | ทุกคนในห้อง | event ถูก update เช่น publish, trigger, end |
| `classroom-event-updated` | ทุกคนในห้อง | ผลลัพธ์ของ event เปลี่ยน เช่นมี answer ใหม่ |
| `classroom-event-deleted` | ทุกคนในห้อง | event ถูกลบ |
| `group-member-removed` | ทุกคนในห้อง | สมาชิกถูกลบออกจากกลุ่ม |
| `group-member-moved` | ทุกคนในห้อง | สมาชิกถูกย้ายกลุ่ม |
| `score-updated` | ทุกคนในห้อง | คะแนนนักเรียนเปลี่ยน |

## 12. REST API ที่เกี่ยวข้อง

### 12.1 โหลดข้อมูลห้องและ event

`GET /api/classrooms/:id`

ใช้โหลด

- ข้อมูลห้องเรียน
- `classroomEvents`
- `eventHistory`
- `studentScores`
- `chatMessages`
- ข้อมูลอื่นของห้อง

### 12.2 บันทึกคะแนนและข้อมูลที่นั่ง

`PUT /api/classrooms/:classId/seating`

ใช้บันทึก

- `seatingPositions`
- `assignedUsers`
- `studentScores`
- `chairGroups`

event scoring ฝั่ง client ใช้ route นี้ในการบันทึกคะแนนจริง

### 12.3 ดึง chat history

`GET /api/classrooms/:classId/chat`

ใช้ดึงข้อความ chat เดิม รวมถึงข้อความ JSON พิเศษของ grouping

### 12.4 อัปโหลดรูปประกอบ event

`POST /api/upload`

ลักษณะการทำงาน

- รองรับ field `file` หรือ `image`
- ไฟล์ถูกเก็บใน `Server/uploads`
- server ส่ง URL กลับเป็น `/uploads/<filename>`
- `Server/server.js` เปิด static route `/uploads`

หมายเหตุ

- route นี้ปัจจุบันไม่ได้บังคับ auth ในตัว route

## 13. Notification ที่เกี่ยวข้อง

ระบบ event ใช้ `notificationHelper.createAndSendNotification()` ใน 2 สถานการณ์หลัก

### 13.1 เมื่อ event ใหม่เริ่มใช้งาน

ใช้ type `event`

เกิดเมื่อ

- เพิ่ม event ที่ไม่ใช่ draft
- publish draft ที่เพิ่งถูกโพสต์

ข้อความโดยประมาณ

- `A new <event.title> has started in <classroom.name>`

### 13.2 เมื่อคะแนนเปลี่ยน

ใช้ type `score`

เกิดเมื่อ

- นักเรียนตอบ poll ที่มีคะแนนต่อ option แล้ว server คิดคะแนนให้ทันที
- หรือมี flow ให้คะแนนอื่นที่ emit notification ผ่านระบบคะแนน

`Notification` model เก็บข้อมูลดังนี้

```js
{
  userId: String,
  title: String,
  message: String,
  type: "event" | "score" | ...,
  isRead: Boolean,
  relatedId: String,
  createdAt: Date
}
```

## 14. Event History และหน้าแสดงผลย้อนหลัง

หน้า `ClassDetailPage` มี section `history` ที่ render `EventHistoryView`

หลักการทำงาน

- รวม `classroomEvents` และ `eventHistory` เข้าด้วยกัน
- ติด `_source` เป็น `active` หรือ `archived`
- filter ตาม type, status และ search text ได้
- วิเคราะห์สถิติจากคะแนน event ได้
- แก้คะแนนในตารางคะแนนได้ผ่าน `PUT /api/classrooms/:classId/seating`

สรุปคือ

- event ที่ยังไม่ลบยังดูได้จาก `classroomEvents`
- event ที่ลบแล้วจะไปอยู่ `eventHistory`
- UI ประวัติออกแบบให้ดูได้ทั้งสองแหล่งพร้อมกัน

## 15. Presentation Mode ของ Word Cloud

route ที่เกี่ยวข้องคือ

`/presentation/:classId/:eventId`

การทำงานของ `EventPresentationPage`

1. อ่าน `classId` และ `eventId` จาก route
2. ดึง token จาก `localStorage`
3. เรียก `GET /api/classrooms/:classId`
4. หา event ที่ตรงกับ `eventId`
5. เปิด socket แล้ว join ห้องเรียน
6. listen `classroom-event-updated` และ `classroom-event-triggered`
7. render `WordCloudViz` แบบ presentation

ข้อสังเกต

- route นี้เปิดตรงได้ แต่การดึงข้อมูลจริงยังอาศัย token ใน localStorage
- ถ้าไม่มี token หรือหา event ไม่เจอ หน้า presentation จะแสดงว่า event ไม่พบ

## 16. พฤติกรรมเชิง UI ที่สำคัญ

### 16.1 การ sort card

`ClassroomEvent.jsx` เรียง event ตาม priority ของสถานะ

1. `draft`
2. `active`
3. `idle`
4. `ended`

แล้วค่อยเรียงตามเวลาใหม่ไปเก่า

### 16.2 การซ่อน draft จากนักเรียน

ถ้า `event.status === 'draft'` และ user ไม่ใช่ creator จะไม่ render card นั้นเลย

### 16.3 การกันตอบซ้ำที่ฝั่ง UI

ภายใน `EventCardContent`

- เช็ก `event.results.some(r => r.userId === currentUser.id)`
- ถ้าเคยตอบแล้วจะ set `isSubmitted = true`
- ปุ่มส่งคำตอบหรือเลือก option จะถูกปิด

อย่างไรก็ตาม logic นี้เป็นการกันที่ client เป็นหลัก

## 17. ข้อสังเกตสำคัญสำหรับผู้พัฒนา

หัวข้อนี้เป็นข้อสังเกตจาก implementation ปัจจุบัน ไม่ใช่ข้อกำหนดเชิงทฤษฎี

### 17.1 Event ถูกเก็บเป็น embedded document

ข้อดี

- โหลดห้องครั้งเดียวได้ event ทั้งหมด
- sync ง่ายสำหรับหน้าห้องเรียน

ข้อควรระวัง

- ถ้าจำนวน event และ results โตมาก document ของห้องจะมีขนาดใหญ่ขึ้น

### 17.2 การป้องกัน answer ซ้ำยังไม่ใช่ server-enforced เต็มรูปแบบ

server ตอน `submit-event-answer` เช็กเพียงว่า

- event มีอยู่จริง
- event ยังไม่ ended
- timer ยังไม่หมด

แต่ server ไม่ได้บังคับห้าม user เดิมตอบซ้ำโดยตรง

### 17.3 Poll แบบมีคะแนนต่อ option มีความเสี่ยงเรื่องคะแนนซ้ำ

เนื่องจาก

- server ให้คะแนนทันทีตอน submit
- client ยังมี flow `End & Score` ที่อาจวนมาคิดซ้ำได้

หากต้องการ harden ระบบในอนาคต ควรเลือกให้ชัดว่า poll scored จะคิดคะแนนแบบใดแบบหนึ่ง

### 17.4 Grouping เป็น event ที่ผูกกับ chat

นอกจากเป็น event card ในห้องแล้ว grouping ยังถูก broadcast เป็นข้อความ chat JSON ด้วย ดังนั้นการ refactor ระบบ grouping ต้องตรวจทั้ง

- `GroupingModal`
- `ClassroomPage.handleCreateGroups`
- `ClassChat`
- socket group move/remove

### 17.5 Word Cloud Presentation พึ่ง route และ token พร้อมกัน

แม้ route presentation จะเปิดตรงได้ แต่การโหลดข้อมูลจริงยังใช้ token ใน localStorage ดังนั้นถ้าจะทำจอ presentation สาธารณะจริงในอนาคต อาจต้องออกแบบ endpoint สำหรับ public presentation เพิ่ม

## 18. สรุปภาพรวม

ระบบ Classroom Event ในโปรเจกต์นี้เป็นระบบกิจกรรมสดที่ผูกแน่นกับ document ห้องเรียน, Socket.IO และ state ของหน้า `ClassroomPage` โดยมีจุดเด่นคือ

- สร้างกิจกรรมได้หลายรูปแบบ
- sync แบบ real-time ผ่าน socket
- รองรับ draft, publish, timer, scoring, archive
- มีการเปิด presentation mode สำหรับ word cloud
- มีหน้า history สำหรับดูย้อนหลังและวิเคราะห์คะแนน

ในเชิง implementation ปัจจุบัน ระบบนี้ทำงานได้ครบ flow หลักของการสร้างกิจกรรมในห้องเรียนแล้ว แต่ยังมีจุดที่ผู้พัฒนาควรระวังเมื่อต่อยอด เช่นการกันตอบซ้ำที่ server, ความซ้ำซ้อนของ scoring ใน poll, และการที่ event ถูกฝังอยู่ใน document ห้องเรียนโดยตรง
