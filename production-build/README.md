# ============================================

# Echair Production Deployment Guide

# Docker Compose + Nginx Reverse Proxy

# ============================================

# 🚀 Echair — Production Deployment

ระบบ Echair ทั้งหมดพร้อม deploy ด้วยคำสั่งเดียว!

## 📋 Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (>= 20.x)
- [Docker Compose](https://docs.docker.com/compose/install/) (>= 2.x)

## 📁 โครงสร้าง Services

| Service      | Path URL  | Description          |
| ------------ | --------- | -------------------- |
| Landing Page | `/`       | หน้าแรกของเว็บไซต์   |
| Client App   | `/app/`   | แอปหลัก (React)      |
| Admin Panel  | `/admin/` | หน้า Admin           |
| API Server   | `/api/`   | Backend API          |
| MongoDB      | —         | ฐานข้อมูล (internal) |
| Nginx        | Port 80   | Reverse Proxy        |

## ⚡ Quick Start

### 1. Copy Environment File

```bash
cp .env.example .env
```

### 2. แก้ไขข้อมูลใน `.env`

เปิดไฟล์ `.env` แล้วกรอกข้อมูลจริง:

- `MONGO_INITDB_ROOT_PASSWORD` — รหัสผ่าน MongoDB
- `JWT_SECRET` — Secret key สำหรับ JWT token
- `EMAIL_USER` / `EMAIL_PASS` — Gmail + App Password สำหรับส่ง email
- `CLIENT_URL` — URL ของเว็บไซต์จริง (เช่น `http://yourdomain.com/app`)

### 3. Firebase Service Account

Copy ไฟล์ Firebase Service Account JSON ไปที่:

```bash
cp /path/to/your-firebase-key.json ./firebase-service-account.json
```

### 4. Deploy! 🚀

```bash
docker compose up -d --build
```

### 5. เปิดเบราว์เซอร์

- **Landing Page**: `http://localhost`
- **Client App**: `http://localhost/app`
- **Admin Panel**: `http://localhost/admin`
- **API Health**: `http://localhost/api/health`

## 🔧 Commands ที่ใช้บ่อย

```bash
# ดูสถานะ containers
docker compose ps

# ดู logs
docker compose logs -f

# ดู logs ของ service เฉพาะ
docker compose logs -f server

# หยุดทุก service
docker compose down

# Rebuild containers ทั้งหมด
docker compose up -d --build

# ลบข้อมูลทั้งหมด (รวม database)
docker compose down -v
```

## 🔒 หมายเหตุด้านความปลอดภัย

- เปลี่ยน `MONGO_INITDB_ROOT_PASSWORD` เป็นรหัสผ่านที่ปลอดภัย
- เปลี่ยน `JWT_SECRET` เป็น random string ที่ยาว
- ห้าม commit ไฟล์ `.env` และ `firebase-service-account.json` ขึ้น git
- ในโปรดักชันจริง ควรใช้ HTTPS (ตั้ง SSL บน nginx หรือใช้ Cloudflare)
