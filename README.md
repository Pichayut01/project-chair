# 🎓 Project Chair - Modern Classroom Management System

![Version](https://img.shields.io/badge/version-1.0.1-blue.svg)
![Status](https://img.shields.io/badge/status-active-success.svg)
![License](https://img.shields.io/badge/license-ISC-green.svg)

**Project Chair** is a comprehensive classroom management web application designed for computer education at KMUTNB. It facilitates real-time interaction between teachers and students, efficient classroom layout management, and dynamic score tracking.

## ✨ Key Features

### 🏢 Classroom Management
- **Dynamic Seating:** Create and manage classroom layouts with a drag-and-drop interface.
- **Customizable Layouts:** Support for rows, grids, and custom chair arrangements.
- **Real-time Updates:** Changes to the classroom structure are reflected instantly for all users.

### 💬 Real-time Communication
- **Persistent Chat:** Facebook-style chat that saves history and persists across sessions.
- **Automatic History Loading:** Chat history loads automatically when entering a classroom.
- **Instant Messaging:** Real-time messaging powered by Socket.io.

### 👥 User Interaction
- **Role-based Access:** Distinct features for Teachers (Creators) and Students (Participants).
- **Google Authentication:** Secure and easy login using KMUTNB Google accounts.
- **Student Scores:** Track and manage student participation scores.

## 🛠️ Tech Stack

- **Frontend:** React, Next.js, Styled Components
- **Backend:** Node.js, Express
- **Database:** MongoDB (Mongoose)
- **Real-time:** Socket.io
- **Authentication:** Firebase (Google Auth)

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (Local or Atlas)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Pichayut01/project-chair.git
   cd project-chair
   ```

2. **Install Dependencies**
   ```bash
   # Install Server dependencies
   cd Server
   npm install

   # Install Client dependencies
   cd ../Client
   npm install
   ```

3. **Configuration**
   - Create a `.env` file in the `Server` directory with your MongoDB URI and other config.

4. **Run the Application**
   ```bash
   # In the root directory
   start-servers.bat
   ```

## 📦 Version History

### [1.0.1] - 2025-12-24
- **New Feature:** Implemented persistent chat history.
- **Fix:** Resolved issue where chat messages disappeared upon navigation.
- **Optimization:** Improved data loading performance for classrooms.

### [1.0.0] - Initial Release
- Basic classroom management.
- Real-time seating chart.
- User authentication.

## 👥 Contributors

- **Project @ ComputerEducation KMUTNB**

---
© 2025 Project Chair. All Rights Reserved.
