// ... (Existing imports)
import React, { useMemo } from 'react';

const CHAIR_WIDTH = 80;
const CHAIR_HEIGHT = 100;
// const PADDING = 0; // Not needed for path style

const GroupOverlay = ({ groups, chairPositions, rotation = 0 }) => { // ✨ Accept rotation prop

    const groupShapes = useMemo(() => {
        if (!groups || !chairPositions) return [];

        return groups.map(group => {
            const { id, chairIds, label, color } = group;

            // Filter valid chairs and map to positions
            // IMPORTANT: Maintain order of chairIds for "path" effect
            const validPoints = chairIds
                .map(cid => chairPositions[cid])
                .filter(pos => pos !== undefined)
                .map(pos => ({
                    x: pos.x + CHAIR_WIDTH / 2,
                    y: pos.y + CHAIR_HEIGHT / 2
                }));

            if (validPoints.length === 0) return null;

            // Calculate Label Position (Average center)
            const centerX = validPoints.reduce((sum, p) => sum + p.x, 0) / validPoints.length;
            const centerY = validPoints.reduce((sum, p) => sum + p.y, 0) / validPoints.length;

            return {
                id,
                points: validPoints.map(p => `${p.x},${p.y}`).join(' '),
                labelX: centerX,
                labelY: centerY,
                label,
                color: color || '#4CAF50', // Default Green
            };
        }).filter(Boolean);
    }, [groups, chairPositions]);

    return (
        <svg
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 5
            }}
        >
            {groupShapes.map(shape => (
                <g key={shape.id}>
                    <polyline
                        points={shape.points}
                        fill="none" // No fill to prevent "closing" the shape incorrectly
                        stroke={shape.color}
                        strokeWidth={100} // Thick stroke covers the chairs
                        strokeLinejoin="round"
                        strokeLinecap="round" // Rounded ends
                        strokeOpacity={0.6}
                    />
                    {shape.label && (
                        <text
                            x={shape.labelX}
                            y={shape.labelY}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill="#fff" // White text for better contrast on dark green
                            fontSize="16"
                            fontWeight="bold"
                            transform={`rotate(${rotation}, ${shape.labelX}, ${shape.labelY})`} // ✨ Apply rotation
                            style={{
                                textShadow: '0px 0px 3px rgba(0,0,0,0.5)',
                                pointerEvents: 'none',
                                transition: 'transform 0.5s ease' // Smooth transition
                            }}
                        >
                            {shape.label}
                        </text>
                    )}
                </g>
            ))}
        </svg>
    );
};

export default GroupOverlay;
