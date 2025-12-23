/**
 * Utility functions for precise container size calculations
 * ฟังก์ชันสำหรับคำนวณขนาดกรอบที่แม่นยำ
 */

export const ContainerUtils = {
    // ค่าคงที่สำหรับการคำนวณ
    CHAIR_SIZE: 60,
    CHAIR_RADIUS: 30,
    NAME_HEIGHT: 20,
    DEFAULT_PADDING: 80,
    MIN_CONTAINER_WIDTH: 500,
    MIN_CONTAINER_HEIGHT: 350,
    MAX_VIEWPORT_WIDTH_RATIO: 0.95,
    MAX_VIEWPORT_HEIGHT_RATIO: 0.75,
    ABSOLUTE_MAX_WIDTH: 1400,
    ABSOLUTE_MAX_HEIGHT: 800,

    /**
     * คำนวณขอบเขตที่แม่นยำของเก้าอี้ทั้งหมด
     * @param {Array} chairList - รายการตำแหน่งเก้าอี้
     * @returns {Object} ขอบเขต {minX, maxX, minY, maxY}
     */
    calculateChairBounds(chairList) {
        if (!chairList || chairList.length === 0) {
            return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
        }

        return chairList.reduce((acc, pos) => {
            const left = pos.x - this.CHAIR_RADIUS;
            const right = pos.x + this.CHAIR_RADIUS;
            const top = pos.y - this.CHAIR_RADIUS;
            const bottom = pos.y + this.CHAIR_RADIUS + this.NAME_HEIGHT;
            
            return {
                minX: Math.min(acc.minX, left),
                maxX: Math.max(acc.maxX, right),
                minY: Math.min(acc.minY, top),
                maxY: Math.max(acc.maxY, bottom)
            };
        }, {
            minX: Infinity,
            maxX: -Infinity,
            minY: Infinity,
            maxY: -Infinity
        });
    },

    /**
     * คำนวณขนาดเนื้อหาจากขอบเขต
     * @param {Object} bounds - ขอบเขตจาก calculateChairBounds
     * @param {number} padding - ระยะห่างรอบๆ (default: DEFAULT_PADDING)
     * @returns {Object} {width, height}
     */
    calculateContentSize(bounds, padding = this.DEFAULT_PADDING) {
        const contentWidth = bounds.maxX - bounds.minX + (2 * padding);
        const contentHeight = bounds.maxY - bounds.minY + (2 * padding);
        
        return {
            width: Math.max(contentWidth, 0),
            height: Math.max(contentHeight, 0)
        };
    },

    /**
     * คำนวณขนาดสูงสุดที่อนุญาต
     * @returns {Object} {maxWidth, maxHeight}
     */
    calculateMaxAllowedSize() {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        return {
            maxWidth: Math.min(
                viewportWidth * this.MAX_VIEWPORT_WIDTH_RATIO, 
                this.ABSOLUTE_MAX_WIDTH
            ),
            maxHeight: Math.min(
                viewportHeight * this.MAX_VIEWPORT_HEIGHT_RATIO, 
                this.ABSOLUTE_MAX_HEIGHT
            )
        };
    },

    /**
     * คำนวณขนาดกรอบสุดท้าย
     * @param {Array} chairList - รายการตำแหน่งเก้าอี้
     * @param {Object} options - ตัวเลือกเพิ่มเติม
     * @returns {Object} {width: string, height: string}
     */
    calculateOptimalContainerSize(chairList, options = {}) {
        const {
            padding = this.DEFAULT_PADDING,
            minWidth = this.MIN_CONTAINER_WIDTH,
            minHeight = this.MIN_CONTAINER_HEIGHT,
            maxWidthRatio = this.MAX_VIEWPORT_WIDTH_RATIO,
            maxHeightRatio = this.MAX_VIEWPORT_HEIGHT_RATIO
        } = options;

        // กรณีไม่มีเก้าอี้
        if (!chairList || chairList.length === 0) {
            return { 
                width: minWidth + 'px', 
                height: minHeight + 'px' 
            };
        }

        // คำนวณขอบเขต
        const bounds = this.calculateChairBounds(chairList);
        
        // คำนวณขนาดเนื้อหา
        const contentSize = this.calculateContentSize(bounds, padding);
        
        // คำนวณขนาดสูงสุด
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const maxWidth = Math.min(viewportWidth * maxWidthRatio, this.ABSOLUTE_MAX_WIDTH);
        const maxHeight = Math.min(viewportHeight * maxHeightRatio, this.ABSOLUTE_MAX_HEIGHT);
        
        // ขนาดสุดท้าย
        const finalWidth = Math.max(minWidth, Math.min(contentSize.width, maxWidth));
        const finalHeight = Math.max(minHeight, Math.min(contentSize.height, maxHeight));
        
        return {
            width: Math.round(finalWidth) + 'px',
            height: Math.round(finalHeight) + 'px'
        };
    },

    /**
     * ตรวจสอบว่าเก้าอี้อยู่ในขอบเขตหรือไม่
     * @param {Object} chairPosition - ตำแหน่งเก้าอี้ {x, y}
     * @param {Object} containerBounds - ขอบเขตกรอบ {width, height}
     * @returns {boolean}
     */
    isChairWithinBounds(chairPosition, containerBounds) {
        const { x, y } = chairPosition;
        const { width, height } = containerBounds;
        
        return (
            x >= this.CHAIR_RADIUS &&
            x <= width - this.CHAIR_RADIUS &&
            y >= this.CHAIR_RADIUS &&
            y <= height - this.CHAIR_RADIUS - this.NAME_HEIGHT
        );
    },

    /**
     * ปรับตำแหน่งเก้าอี้ให้อยู่ในขอบเขต
     * @param {Object} chairPosition - ตำแหน่งเก้าอี้ {x, y}
     * @param {Object} containerBounds - ขอบเขตกรอบ {width, height}
     * @returns {Object} ตำแหน่งที่ปรับแล้ว {x, y}
     */
    constrainChairToBounds(chairPosition, containerBounds) {
        const { x, y } = chairPosition;
        const { width, height } = containerBounds;
        
        const constrainedX = Math.max(
            this.CHAIR_RADIUS,
            Math.min(x, width - this.CHAIR_RADIUS)
        );
        
        const constrainedY = Math.max(
            this.CHAIR_RADIUS,
            Math.min(y, height - this.CHAIR_RADIUS - this.NAME_HEIGHT)
        );
        
        return { x: constrainedX, y: constrainedY };
    }
};

export default ContainerUtils;
