const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// ระบุตำแหน่งของโฟลเดอร์ build ที่ React สร้างขึ้นมา
// โค้ดนี้จะทำให้ Express สามารถเข้าถึงไฟล์ static (HTML, CSS, JS) ที่อยู่ในโฟลเดอร์ build ได้
app.use(express.static(path.join(__dirname, 'build')));

// สำหรับการเรียกใช้ path อื่นๆ ทั้งหมด ให้ส่ง index.html กลับไป
// เพื่อให้ React Router (ถ้าคุณใช้) ทำงานได้อย่างถูกต้อง
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// เริ่มต้น server ที่ port ที่กำหนด
app.listen(port, () => {
  console.log(`Server กำลังทำงานอยู่ที่ http://localhost:${port}`);
});
