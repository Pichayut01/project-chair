/**
 * Chair validation and positioning utilities
 * ฟังก์ชันสำหรับตรวจสอบและจัดตำแหน่งเก้าอี้
 */

import { ContainerUtils } from './ContainerUtils';

export const ChairValidation = {
    /**
     * ตรวจสอบการชนกันของเก้าอี้
     * @param {Object} chairPosition - ตำแหน่งเก้าอี้ที่ต้องการตรวจสอบ
     * @param {Array} otherChairs - เก้าอี้อื่นๆ ที่มีอยู่
     * @param {number} minDistance - ระยะห่างขั้นต่ำ (default: 80)
     * @returns {boolean} true ถ้าไม่ชนกัน
     */
    isValidPosition(chairPosition, otherChairs, minDistance = 80) {
        const { x, y } = chairPosition;
        
        return otherChairs.every(otherChair => {
            const distance = Math.sqrt(
                Math.pow(x - otherChair.x, 2) + 
                Math.pow(y - otherChair.y, 2)
            );
            return distance >= minDistance;
        });
    },

    /**
     * หาตำแหน่งที่ใกล้ที่สุดที่ไม่ชนกัน
     * @param {Object} targetPosition - ตำแหน่งที่ต้องการ
     * @param {Array} existingChairs - เก้าอี้ที่มีอยู่
     * @param {Object} containerBounds - ขอบเขตกรอบ
     * @param {number} minDistance - ระยะห่างขั้นต่ำ
     * @returns {Object} ตำแหน่งที่ปรับแล้ว
     */
    findNearestValidPosition(targetPosition, existingChairs, containerBounds, minDistance = 80) {
        const { x: targetX, y: targetY } = targetPosition;
        const { width, height } = containerBounds;
        
        // ตรวจสอบตำแหน่งเดิมก่อน
        if (this.isValidPosition(targetPosition, existingChairs, minDistance) &&
            ContainerUtils.isChairWithinBounds(targetPosition, containerBounds)) {
            return targetPosition;
        }

        // ค้นหาตำแหน่งใหม่ในรัศมีที่เพิ่มขึ้น
        for (let radius = minDistance; radius <= Math.max(width, height); radius += 20) {
            for (let angle = 0; angle < 360; angle += 30) {
                const radian = (angle * Math.PI) / 180;
                const newX = targetX + radius * Math.cos(radian);
                const newY = targetY + radius * Math.sin(radian);
                
                const newPosition = { x: newX, y: newY };
                
                if (ContainerUtils.isChairWithinBounds(newPosition, containerBounds) &&
                    this.isValidPosition(newPosition, existingChairs, minDistance)) {
                    return newPosition;
                }
            }
        }

        // ถ้าหาไม่เจอ ให้ใช้ตำแหน่งที่ปรับให้อยู่ในขอบเขต
        return ContainerUtils.constrainChairToBounds(targetPosition, containerBounds);
    },

    /**
     * ปรับตำแหน่งเก้าอี้ทั้งหมดให้ไม่ชนกัน
     * @param {Object} chairPositions - ตำแหน่งเก้าอี้ทั้งหมด
     * @param {Object} containerBounds - ขอบเขตกรอบ
     * @returns {Object} ตำแหน่งที่ปรับแล้ว
     */
    resolveCollisions(chairPositions, containerBounds) {
        const chairIds = Object.keys(chairPositions);
        const resolvedPositions = { ...chairPositions };
        
        for (let i = 0; i < chairIds.length; i++) {
            const chairId = chairIds[i];
            const currentPosition = resolvedPositions[chairId];
            
            // รายการเก้าอี้อื่นๆ (ไม่รวมเก้าอี้ปัจจุบัน)
            const otherChairs = chairIds
                .filter(id => id !== chairId)
                .map(id => resolvedPositions[id]);
            
            // หาตำแหน่งที่ไม่ชนกัน
            const validPosition = this.findNearestValidPosition(
                currentPosition, 
                otherChairs, 
                containerBounds
            );
            
            resolvedPositions[chairId] = validPosition;
        }
        
        return resolvedPositions;
    },

    /**
     * ตรวจสอบว่าเก้าอี้ทั้งหมดอยู่ในขอบเขตหรือไม่
     * @param {Object} chairPositions - ตำแหน่งเก้าอี้ทั้งหมด
     * @param {Object} containerBounds - ขอบเขตกรอบ
     * @returns {Array} รายการเก้าอี้ที่อยู่นอกขอบเขต
     */
    findChairsOutOfBounds(chairPositions, containerBounds) {
        const outOfBounds = [];
        
        Object.entries(chairPositions).forEach(([chairId, position]) => {
            if (!ContainerUtils.isChairWithinBounds(position, containerBounds)) {
                outOfBounds.push({
                    id: chairId,
                    position: position,
                    suggestedPosition: ContainerUtils.constrainChairToBounds(position, containerBounds)
                });
            }
        });
        
        return outOfBounds;
    },

    /**
     * คำนวณระยะห่างระหว่างเก้าอี้สองตัว
     * @param {Object} chair1 - เก้าอี้ตัวที่ 1
     * @param {Object} chair2 - เก้าอี้ตัวที่ 2
     * @returns {number} ระยะห่าง
     */
    calculateDistance(chair1, chair2) {
        return Math.sqrt(
            Math.pow(chair1.x - chair2.x, 2) + 
            Math.pow(chair1.y - chair2.y, 2)
        );
    },

    /**
     * หาเก้าอี้ที่ใกล้ที่สุด
     * @param {Object} targetChair - เก้าอี้เป้าหมาย
     * @param {Array} otherChairs - เก้าอี้อื่นๆ
     * @returns {Object} เก้าอี้ที่ใกล้ที่สุดและระยะห่าง
     */
    findNearestChair(targetChair, otherChairs) {
        if (otherChairs.length === 0) return null;
        
        let nearestChair = otherChairs[0];
        let minDistance = this.calculateDistance(targetChair, nearestChair);
        
        otherChairs.forEach(chair => {
            const distance = this.calculateDistance(targetChair, chair);
            if (distance < minDistance) {
                minDistance = distance;
                nearestChair = chair;
            }
        });
        
        return { chair: nearestChair, distance: minDistance };
    }
};

export default ChairValidation;
