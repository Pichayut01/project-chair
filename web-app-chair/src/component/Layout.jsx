// src/component/Layout.jsx

import React, { useState } from 'react';
import Navbar from './Navbar';
import '../CSS/Layout.css';

const Layout = ({ children, user, handleSignOut, classrooms = [], isLoginPage = false }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <div className="layout-container">
            <Navbar
                isSidebarOpen={isSidebarOpen}
                toggleSidebar={toggleSidebar}
                user={user}
                handleSignOut={handleSignOut}
                classrooms={classrooms}
                isClassroomPage={false}
                isAccountSettingPage={false}
                isEditClassroomPage={false}
                isLoginPage={isLoginPage}
            />
            <main className={`layout-main ${isSidebarOpen ? 'shift' : ''}`}>
                {React.cloneElement(children, { isSidebarOpen })}
            </main>
        </div>
    );
};

export default Layout;
