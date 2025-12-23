// src/component/ChairPresets.js
import { ContainerUtils } from '../utils/ContainerUtils';
import { ChairValidation } from '../utils/ChairValidation';

export const ChairPresets = {
    // Fixed constants for consistent layout
    CONSTANTS: {
        CHAIR_WIDTH: 80,
        CHAIR_HEIGHT: 100,
        GAP_X: 40,
        GAP_Y: 40,
        START_X: 50,
        START_Y: 50
    },

    // Calculate Row Layout (Standard Grid really)
    calculateRowLayout: (chairCount) => {
        const positions = {};
        const { CHAIR_WIDTH, CHAIR_HEIGHT, GAP_X, GAP_Y, START_X, START_Y } = ChairPresets.CONSTANTS;

        // Determine predictable grid dimensions 
        // Use a roughly 4:3 aspect ratio logic for number of columns
        const cols = Math.ceil(Math.sqrt(chairCount * 1.5));

        for (let i = 0; i < chairCount; i++) {
            const row = Math.floor(i / cols);
            const col = i % cols;

            const x = START_X + col * (CHAIR_WIDTH + GAP_X);
            const y = START_Y + row * (CHAIR_HEIGHT + GAP_Y);

            positions[`chair-${i + 1}`] = { x, y };
        }

        return positions;
    },

    // Calculate Grid Layout (Square-ish)
    calculateGridLayout: (chairCount) => {
        const positions = {};
        const { CHAIR_WIDTH, CHAIR_HEIGHT, GAP_X, GAP_Y, START_X, START_Y } = ChairPresets.CONSTANTS;

        const cols = Math.ceil(Math.sqrt(chairCount));

        for (let i = 0; i < chairCount; i++) {
            const row = Math.floor(i / cols);
            const col = i % cols;

            const x = START_X + col * (CHAIR_WIDTH + GAP_X);
            const y = START_Y + row * (CHAIR_HEIGHT + GAP_Y);

            positions[`chair-${i + 1}`] = { x, y };
        }

        return positions;
    },

    // Calculate Group Layout
    calculateGroupLayout: (chairCount) => {
        const positions = {};
        const { CHAIR_WIDTH, CHAIR_HEIGHT, START_X, START_Y } = ChairPresets.CONSTANTS;

        let chairsPerGroup = 4;
        if (chairCount > 20) chairsPerGroup = 6;
        if (chairCount <= 6) chairsPerGroup = 3;

        const groupSpacing = 280; // Distance between group centers
        const groupRadius = 70;   // Radius of chairs from group center

        const totalGroups = Math.ceil(chairCount / chairsPerGroup);
        const groupsPerLine = Math.ceil(Math.sqrt(totalGroups));

        let currentChair = 0;

        for (let g = 0; g < totalGroups; g++) {
            if (currentChair >= chairCount) break;

            const groupRow = Math.floor(g / groupsPerLine);
            const groupCol = g % groupsPerLine;

            const centerX = START_X + groupRadius + (groupCol * groupSpacing);
            const centerY = START_Y + groupRadius + (groupRow * groupSpacing);

            const chairsInThisGroup = Math.min(chairsPerGroup, chairCount - currentChair);

            // Layout chairs within group
            for (let c = 0; c < chairsInThisGroup; c++) {
                let x, y;

                if (chairsInThisGroup === 1) {
                    x = centerX;
                    y = centerY;
                } else if (chairsInThisGroup === 2) {
                    // Side by side
                    x = centerX + (c === 0 ? -40 : 40);
                    y = centerY;
                } else if (chairsInThisGroup === 4) {
                    // Square box
                    const dx = (c % 2 === 0) ? -40 : 40;
                    const dy = (c < 2) ? -40 : 40;
                    x = centerX + dx;
                    y = centerY + dy;
                } else {
                    // Circular
                    const angle = (2 * Math.PI * c) / chairsInThisGroup - Math.PI / 2;
                    x = centerX + Math.cos(angle) * groupRadius;
                    y = centerY + Math.sin(angle) * groupRadius;
                }

                positions[`chair-${currentChair + 1}`] = { x, y };
                currentChair++;
            }
        }

        return positions;
    },

    // Calculate Scattered Layout
    calculateScatteredLayout: (chairCount) => {
        // Fallback to simple grid but with "randomized" offsets to simulated scattering
        // True random is annoying for UX, pseudo-random grid is better
        const positions = {};
        const { CHAIR_WIDTH, CHAIR_HEIGHT, START_X, START_Y } = ChairPresets.CONSTANTS;
        const cols = Math.ceil(Math.sqrt(chairCount));
        const cellW = CHAIR_WIDTH + 80;
        const cellH = CHAIR_HEIGHT + 80;

        for (let i = 0; i < chairCount; i++) {
            const row = Math.floor(i / cols);
            const col = i % cols;

            // Add deterministic "randomness"
            const entropyX = ((i * 123) % 50) - 25;
            const entropyY = ((i * 321) % 50) - 25;

            const x = START_X + (col * cellW) + entropyX + 40;
            const y = START_Y + (row * cellH) + entropyY + 40;

            positions[`chair-${i + 1}`] = { x, y };
        }
        return positions;
    },

    // Main API
    generatePreset: (type, chairCount, _unusedW, _unusedH) => { // Container sizes ignored
        let positions = {};

        switch (type) {
            case 'rows':
                positions = ChairPresets.calculateRowLayout(chairCount);
                break;
            case 'grid':
                positions = ChairPresets.calculateGridLayout(chairCount);
                break;
            case 'groups':
                positions = ChairPresets.calculateGroupLayout(chairCount);
                break;
            case 'scattered':
                positions = ChairPresets.calculateScatteredLayout(chairCount);
                break;
            default:
                positions = ChairPresets.calculateGridLayout(chairCount);
        }

        // Simple sanity check, though our logic shouldn't produce collisions normally
        // We skip complex collision resolution for now as our grid logic is safe
        return positions;
    },

    // Kept for compatibility but returns generic robust sizes
    getOptimalSize: (chairCount) => {
        // This is less critical now that ClassroomPage calculates size based on content
        // But we provide a reasonable estimate
        return { width: 1200, height: 800 };
    },

    calculateOptimalContainerSize: () => ({ width: 1200, height: 800 })
};

export default ChairPresets;
