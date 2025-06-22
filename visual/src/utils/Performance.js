export class PerformanceMonitor {
    constructor() {
        this.fps = 60;
        this.frameCount = 0;
        this.lastFrameTime = 0;
        this.currentDetailLevel = 1; // 1 = high, 0.5 = medium, 0.25 = low
        this.minDetailLevel = 0.25;
        this.maxDetailLevel = 1;
        this.fpsThreshold = 45;
        this.fpsRecoveryThreshold = 55;
        this.performanceCheckInterval = 1000;
        this.lastPerformanceCheck = 0;
    }

    checkPerformance(timestamp) {
        this.frameCount++;

        if (timestamp - this.lastPerformanceCheck >= this.performanceCheckInterval) {
            this.fps = (this.frameCount * 1000) / (timestamp - this.lastPerformanceCheck);
            
            // Adjust detail level based on performance
            if (this.fps < this.fpsThreshold && this.currentDetailLevel > this.minDetailLevel) {
                this.currentDetailLevel = Math.max(this.currentDetailLevel - 0.25, this.minDetailLevel);
            } else if (this.fps > this.fpsRecoveryThreshold && this.currentDetailLevel < this.maxDetailLevel) {
                this.currentDetailLevel = Math.min(this.currentDetailLevel + 0.25, this.maxDetailLevel);
            }

            this.frameCount = 0;
            this.lastPerformanceCheck = timestamp;
        }

        return {
            fps: this.fps,
            detailLevel: this.currentDetailLevel
        };
    }
}
