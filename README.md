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

```
projectchair3
├─ Client
│  ├─ .firebase
│  │  └─ hosting.YnVpbGQ.cache
│  ├─ .firebaserc
│  ├─ firebase.json
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ public
│  │  ├─ favicon.ico
│  │  ├─ index.html
│  │  ├─ logo192.png
│  │  ├─ logo512.png
│  │  ├─ manifest.json
│  │  └─ robots.txt
│  ├─ README.md
│  ├─ serverfont
│  │  └─ server.js
│  └─ src
│     ├─ App.jsx
│     ├─ component
│     │  ├─ ActionBar.jsx
│     │  ├─ AssignRate.jsx
│     │  ├─ Chair.jsx
│     │  ├─ ChairAssignModal.jsx
│     │  ├─ ChairDropdown.jsx
│     │  ├─ ChairPresets.js
│     │  ├─ ClassActionModal.jsx
│     │  ├─ CreateClassModal.jsx
│     │  ├─ ErrorBoundary.jsx
│     │  ├─ GroupOverlay.jsx
│     │  ├─ JoinClassModal.jsx
│     │  ├─ Layout.jsx
│     │  ├─ Loader.jsx
│     │  ├─ Main.jsx
│     │  ├─ Navbar.jsx
│     │  ├─ RatePresetModal.jsx
│     │  ├─ Scoreboard.jsx
│     │  ├─ StudentRatingModal.jsx
│     │  └─ TestErrorComponent.jsx
│     ├─ context
│     ├─ CSS
│     │  ├─ AccountSetting.css
│     │  ├─ ActionBar.css
│     │  ├─ AppSettings.css
│     │  ├─ AssignRate.css
│     │  ├─ Chair.css
│     │  ├─ ChairAssignModal.jsx
│     │  ├─ ChairDropdown.css
│     │  ├─ ClassDetailPage.css
│     │  ├─ ClassroomErrorPage.css
│     │  ├─ ClassroomPage-main-wrapper.css
│     │  ├─ ClassroomPage.css
│     │  ├─ EditClassroomPage.css
│     │  ├─ ErrorPage.css
│     │  ├─ GoogleAccount.css
│     │  ├─ html.css
│     │  ├─ Layout.css
│     │  ├─ Login.css
│     │  ├─ Main.css
│     │  ├─ Modal.css
│     │  ├─ Navbar.css
│     │  ├─ OtpVerification.css
│     │  ├─ PrivateClassroomPage.css
│     │  ├─ RatePresetModal.css
│     │  ├─ ResetPassword.css
│     │  ├─ Scoreboard.css
│     │  └─ StudentRatingModal.css
│     ├─ firebaseConfig.js
│     ├─ hooks
│     │  └─ useSocket.js
│     ├─ image
│     │  ├─ Google__G__logo.svg.webp
│     │  ├─ icon.ico
│     │  ├─ nulluser.png
│     │  ├─ user.webp
│     │  └─ ืNoUserInChair.png
│     ├─ index.js
│     ├─ pages
│     │  ├─ AccountSetting.jsx
│     │  ├─ AppSettingsPage.jsx
│     │  ├─ ClassDetailPage.jsx
│     │  ├─ ClassroomErrorPage.jsx
│     │  ├─ ClassroomPage.jsx
│     │  ├─ DashboardPage.jsx
│     │  ├─ EditClassroomPage.jsx
│     │  ├─ ErrorPage.jsx
│     │  ├─ LoginPage.jsx
│     │  ├─ OtpVerificationPage.jsx
│     │  ├─ PrivateClassroomPage.jsx
│     │  └─ ResetPasswordPage.jsx
│     ├─ reportWebVitals.js
│     └─ utils
│        ├─ ChairValidation.js
│        ├─ ContainerUtils.js
│        ├─ cropImage.js
│        └─ profileImageHelper.js
├─ push_error.txt
├─ README.md
├─ Server
│  ├─ chair-f440c-firebase-adminsdk-fbsvc-92d591e38e.json
│  ├─ config
│  │  ├─ db.js
│  │  ├─ email.js
│  │  └─ firebase.js
│  ├─ controllers
│  │  ├─ authController.js
│  │  ├─ classController.js
│  │  ├─ presetController.js
│  │  └─ userController.js
│  ├─ middleware
│  │  ├─ auth.js
│  │  ├─ authMiddleware.js
│  │  └─ uploadMiddleware.js
│  ├─ models
│  │  ├─ ActiveSession.js
│  │  ├─ Class.js
│  │  ├─ LoginHistory.js
│  │  ├─ RatingPreset.js
│  │  └─ User.js
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ routes
│  │  ├─ auth.js
│  │  ├─ classrooms.js
│  │  ├─ presets.js
│  │  └─ users.js
│  ├─ server.js
│  ├─ socket
│  │  └─ socketHandler.js
│  ├─ upload
│  │  └─ profile_photos
│  ├─ uploads
│  │  ├─ banners
│  │  │  ├─ banner-1757224053905-251274574.jpeg
│  │  │  ├─ banner-1757268718617-2076394.png
│  │  │  ├─ banner-1757269108054-293529693.png
│  │  │  ├─ banner-1757283729056-849227176.jpg
│  │  │  ├─ banner-1757297984138-801728502.webp
│  │  │  ├─ banner-1757301414971-379855472.png
│  │  │  ├─ banner-1757641175515-651212145.jpg
│  │  │  └─ banner-1758090718274-155039611.jpg
│  │  └─ profile_photos
│  │     ├─ 68858685aeeb93bf5bbf8717-1756216157216.png
│  │     ├─ 68858685aeeb93bf5bbf8717-1756216157730.png
│  │     ├─ 68858685aeeb93bf5bbf8717-1756216177508.png
│  │     ├─ 68858685aeeb93bf5bbf8717-1756216440108.png
│  │     ├─ 68858685aeeb93bf5bbf8717-1756216474102.png
│  │     ├─ 68858685aeeb93bf5bbf8717-1756216508575.png
│  │     ├─ 68858685aeeb93bf5bbf8717-1756216675649.png
│  │     ├─ 68858685aeeb93bf5bbf8717-1756224600969.png
│  │     ├─ 68858685aeeb93bf5bbf8717-1756226753540.png
│  │     ├─ 68858685aeeb93bf5bbf8717-1757037058747.jpg
│  │     ├─ 68858685aeeb93bf5bbf8717-1757297961116.png
│  │     ├─ 68858685aeeb93bf5bbf8717-1757301497912.jpg
│  │     ├─ 68858685aeeb93bf5bbf8717-1758297326982.png
│  │     ├─ 6885888eaeeb93bf5bbf8726-1757288481605.png
│  │     ├─ 6885888eaeeb93bf5bbf8726-1757301074205.png
│  │     ├─ 6885888eaeeb93bf5bbf8726-1757301110154.png
│  │     ├─ 6885888eaeeb93bf5bbf8726-1757301325740.png
│  │     ├─ 6885888eaeeb93bf5bbf8726-1758303880453.png
│  │     ├─ 68adb497b86fc0dcc664a82f-1757301596774.jpg
│  │     ├─ 68adc6072a8a0856c2c800c7-1757013067747.png
│  │     ├─ 68adc6072a8a0856c2c800c7-1757346346698.png
│  │     ├─ 68b9c91530ce234a42af608f-1757007522729.png
│  │     ├─ 68bd1d1cf1e26bbc75fd0c7c-1757547425979.jpg
│  │     ├─ 68bdcd6353711fa087c02d0c-1757633300874.jpg
│  │     └─ 68c1f887c8dd67caf2ea531e-1757543782325.png
│  └─ utils
└─ start-servers.bat

```