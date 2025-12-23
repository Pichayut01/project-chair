// src/component/Chair.jsx

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import chroma from 'chroma-js';
import '../CSS/Chair.css';
import NoUserInChair from '../image/ืNoUserInChair.png';
import nullUserPhoto from '../image/nulluser.png';

const Chair = ({ id, initialPosition, onChairMove, containerRef, isDraggable, userPhotoURL, userName, onChairClick, userScore, minScore, maxScore, hasAnyScores, isCreator, rotation = 0, isSelectedForGroup = false, selectionIndex }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState(initialPosition);
    const offset = useRef({ x: 0, y: 0 });
    const chairRef = useRef(null);

    useEffect(() => {
        setPosition(initialPosition);
    }, [initialPosition]);

    // Add useEffect to track userScore changes for debugging
    useEffect(() => {
        console.log(`Chair ${id}: userScore=${userScore}, minScore=${minScore}, maxScore=${maxScore}, hasAnyScores=${hasAnyScores}`);
        console.log(`Chair ${id}: HP percentage: ${getHPPercentage()}%, color: ${getHeatmapColor()}`);
        console.log(`Chair ${id}: userName: ${userName}`);
    }, [userScore, minScore, maxScore, hasAnyScores, id, userName]);

    // Force re-render when userScore changes
    const [renderKey, setRenderKey] = useState(0);
    useEffect(() => {
        setRenderKey(prev => prev + 1);
    }, [userScore]);

    const handleMouseDown = useCallback((e) => {
        if (!isDraggable || !chairRef.current) return;
        setIsDragging(true);
        const chairRect = chairRef.current.getBoundingClientRect();
        offset.current = {
            x: e.clientX - chairRect.left,
            y: e.clientY - chairRect.top
        };
    }, [isDraggable]);

    const handleMouseMove = useCallback((e) => {
        if (!isDragging || !containerRef.current || !chairRef.current) return;

        const containerRect = containerRef.current.getBoundingClientRect();
        const chairRect = chairRef.current.getBoundingClientRect();

        let newX = e.clientX - containerRect.left - offset.current.x;
        let newY = e.clientY - containerRect.top - offset.current.y;

        newX = Math.max(0, Math.min(newX, containerRect.width - chairRect.width));
        newY = Math.max(0, Math.min(newY, containerRect.height - chairRect.height));

        setPosition({ x: newX, y: newY });
    }, [isDragging, containerRef]);

    const handleMouseUp = useCallback(() => {
        if (isDragging) {
            setIsDragging(false);
            onChairMove(id, position.x, position.y);
        }
    }, [isDragging, onChairMove, id, position]);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, handleMouseMove, handleMouseUp]);

    const handleClick = useCallback((e) => {
        if (onChairClick && !isDraggable) {
            onChairClick(id, e);
        }
    }, [id, isDraggable, onChairClick]);

    // Create heatmap color scale using chroma-js
    const getHeatmapColor = () => {
        // If no one has any scores, everyone is gray
        if (!hasAnyScores) {
            return '#9ca3af'; // Gray color
        }

        // If user has no score data, return red
        if (!userScore && userScore !== 0) return '#dc2626';

        // If user score is 0, return red
        if (userScore === 0) return '#dc2626';

        // If maxScore is 0, return gray
        if (maxScore === 0) return '#9ca3af';

        // Calculate percentage relative to maxScore (0-100%)
        const percentage = Math.min((userScore / maxScore), 1);

        // Create a heatmap color scale from red (low) to green (high) based on percentage
        const colorScale = chroma.scale(['#dc2626', '#ef4444', '#f59e0b', '#10b981', '#22c55e']).mode('lch');
        return colorScale(percentage).hex();
    };

    const getHPPercentage = () => {
        // If no one has any scores, show minimal progress
        if (!hasAnyScores) {
            return 5;
        }

        // If user has no score data, show minimal progress
        if (!userScore && userScore !== 0) return 5;

        // If user score is 0, show minimal progress
        if (userScore === 0) return 5;

        // If maxScore is 0, show minimal progress
        if (maxScore === 0) return 5;

        // Calculate percentage relative to the highest scorer (maxScore = 100%)
        const percentage = (userScore / maxScore) * 100;
        return Math.max(5, Math.min(percentage, 100)); // Minimum 5% for visibility
    };

    return (
        <div
            ref={chairRef}
            className="chair-item"
            style={{
                left: position.x + 'px',
                top: position.y + 'px',
                zIndex: isDragging ? 1000 : 1,
                transform: `rotate(${rotation}deg)`, // Apply counter-rotation
                boxShadow: isSelectedForGroup ? '0 0 0 3px #4CAF50, 0 4px 6px rgba(0,0,0,0.1)' : undefined, // ✨ Highlight selection
                border: isSelectedForGroup ? '2px solid #fff' : undefined // Optional extra contrast
            }}
            onMouseDown={handleMouseDown}
            onClick={handleClick}
        >
            {/* Selection Number Badge */}
            {selectionIndex > 0 && (
                <div style={{
                    position: 'absolute',
                    top: '-10px',
                    left: '-10px',
                    width: '24px',
                    height: '24px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    zIndex: 20,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}>
                    {selectionIndex}
                </div>
            )}

            {/* HP Bar around chair - Always visible to everyone */}
            {userName && (
                <div
                    className="hp-bar-container"
                    style={{
                        display: 'block',
                        visibility: 'visible'
                    }}
                >
                    <CircularProgressbar
                        value={getHPPercentage()}
                        strokeWidth={6}
                        styles={buildStyles({
                            pathColor: getHeatmapColor(),
                            trailColor: '#e5e7eb',
                            strokeLinecap: 'round',
                            pathTransitionDuration: 0.5,
                            rotation: 0.625,
                        })}
                    />
                    {/* Always show score for everyone */}
                    <div
                        className="score-display"
                        style={{
                            display: 'flex',
                            visibility: 'visible'
                        }}
                    >
                        {userScore || 0}
                    </div>
                </div>
            )}

            <div className="chair-icon" style={{ backgroundImage: `url(${userName ? (userPhotoURL || nullUserPhoto) : NoUserInChair})` }}>
                {/* Shows nulluser.png if user deleted their profile, NoUserInChair.png if chair is empty */}
            </div>
            <div className="user-name-under">
                {userName || ''}
            </div>
        </div>
    );
};

export default Chair;