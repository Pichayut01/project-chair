// src/component/ChairDropdown.jsx

import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { FiStar, FiCheckSquare, FiUserMinus, FiUsers } from 'react-icons/fi';
import '../CSS/ChairDropdown.css';

const ChairDropdown = ({ isOpen, onClose, position, anchorEl, onRateStudent, onCheckAttendance, onFunction3, onFunction4, showGroupRating }) => {
    const dropdownRef = useRef(null);
    const [resolvedPosition, setResolvedPosition] = useState({ left: 0, top: 0 });

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

    useLayoutEffect(() => {
        if (!isOpen || !dropdownRef.current) return undefined;

        let animationFrameId = null;

        const updatePosition = () => {
            if (!dropdownRef.current) return;

            const dropdownRect = dropdownRef.current.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const edgePadding = 12;
            const offsetFromChair = 10;

            const activeAnchorRect = anchorEl && anchorEl.isConnected && typeof anchorEl.getBoundingClientRect === 'function'
                ? anchorEl.getBoundingClientRect()
                : null;

            const anchorCenterX = activeAnchorRect
                ? activeAnchorRect.left + (activeAnchorRect.width / 2)
                : position.x;

            const anchorBottomY = activeAnchorRect
                ? activeAnchorRect.bottom + offsetFromChair
                : position.y;

            let left = anchorCenterX - (dropdownRect.width / 2);
            let top = anchorBottomY;

            if (left + dropdownRect.width > viewportWidth - edgePadding) {
                left = viewportWidth - dropdownRect.width - edgePadding;
            }

            if (left < edgePadding) {
                left = edgePadding;
            }

            if (top + dropdownRect.height > viewportHeight - edgePadding) {
                const positionAboveChair = (activeAnchorRect ? activeAnchorRect.top : position.y) - dropdownRect.height - offsetFromChair;
                top = positionAboveChair >= edgePadding
                    ? positionAboveChair
                    : Math.max(edgePadding, viewportHeight - dropdownRect.height - edgePadding);
            }

            setResolvedPosition({ left, top });
        };

        const schedulePositionUpdate = () => {
            if (animationFrameId !== null) {
                cancelAnimationFrame(animationFrameId);
            }

            animationFrameId = window.requestAnimationFrame(updatePosition);
        };

        updatePosition();
        window.addEventListener('resize', schedulePositionUpdate);
        window.addEventListener('scroll', schedulePositionUpdate, true);

        return () => {
            if (animationFrameId !== null) {
                cancelAnimationFrame(animationFrameId);
            }
            window.removeEventListener('resize', schedulePositionUpdate);
            window.removeEventListener('scroll', schedulePositionUpdate, true);
        };
    }, [isOpen, position.x, position.y, anchorEl, showGroupRating]);

    if (!isOpen) return null;

    return (
        <div 
            ref={dropdownRef}
            className="chair-dropdown"
            style={{
                position: 'fixed',
                left: resolvedPosition.left,
                top: resolvedPosition.top,
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
                <FiUserMinus size={16} />
                <span>Remove Student</span>
            </div>
            {showGroupRating && (
            <div className="dropdown-item" onClick={onFunction4}>
                <FiUsers size={16} />
                <span>Rate Group</span>
            </div>
        )}
        </div>
    );
};

export default ChairDropdown;
