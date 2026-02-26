// src/component/ChairDropdown.jsx

import React, { useState, useRef, useEffect } from 'react';
import { FiStar, FiCheckSquare, FiSettings, FiMessageSquare } from 'react-icons/fi';
import '../CSS/ChairDropdown.css';

const ChairDropdown = ({ isOpen, onClose, position, onRateStudent, onCheckAttendance, onFunction3, onFunction4 }) => {
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div 
            ref={dropdownRef}
            className="chair-dropdown"
            style={{
                position: 'fixed',
                left: position.x,
                top: position.y,
                zIndex: 10000
            }}
        >
            <div className="dropdown-item" onClick={onRateStudent}>
                <FiStar size={16} />
                <span>Rate Student</span>
            </div>
            <div className="dropdown-item" onClick={onCheckAttendance}>
                <FiCheckSquare size={16} />
                <span>Check Attendance</span>
            </div>
            <div className="dropdown-item" onClick={onFunction3}>
                <FiSettings size={16} />
                <span>Function 3</span>
            </div>
            <div className="dropdown-item" onClick={onFunction4}>
                <FiMessageSquare size={16} />
                <span>Function 4</span>
            </div>
        </div>
    );
};

export default ChairDropdown;
