import { AudioEngine } from './audio/AudioEngine.js';
import { OscillatorManager } from './audio/Oscillators.js';
import { CanvasManager } from './visualization/CanvasManager.js';
import { PerformanceMonitor } from './utils/Performance.js';
import { EventManager } from './utils/EventManager.js';

export class AudioVisualizer {
    constructor() {
        this.isPlaying = false;
        this.animationId = null;
        this.normalizedX = null;
        this.normalizedY = null;
        this.frameInterval = 1000 / 60;

        // Initialize components
        this.audio = new AudioEngine();
        this.canvas = new CanvasManager();
        this.performance = new PerformanceMonitor();
        this.events = new EventManager(this.canvas.canvas, this);
    }

    start() {
        if (this.isPlaying) return;
        
        this.audio.initialize();
        this.oscillators = new OscillatorManager(this.audio.audioContext);
        this.oscillators.setupOscillators();
        
        // Connect oscillators to audio chain
        this.oscillators.oscillator.connect(this.audio.panner);
        this.oscillators.oscillator2.connect(this.audio.panner);
        this.oscillators.lfo.connect(this.oscillators.lfoGain);
        this.oscillators.lfoGain.connect(this.oscillators.oscillator.frequency);
        this.oscillators.lfoGain.connect(this.oscillators.oscillator2.frequency);
        
        this.oscillators.start();
        this.isPlaying = true;
        this.animate(performance.now());
    }

    stop() {
        if (!this.isPlaying) return;
        
        this.oscillators.stop();
        this.isPlaying = false;
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    animate(timestamp) {
        if (!this.isPlaying) return;

        if (timestamp - this.lastFrameTime < this.frameInterval) {
            this.animationId = requestAnimationFrame((t) => this.animate(t));
            return;
        }

        const perfMetrics = this.performance.checkPerformance(timestamp);
        const dataArray = this.audio.getFrequencyData();

        // Clear and draw
        this.canvas.clear();
        if (dataArray) {
            this.canvas.drawVisualizationBars(
                dataArray, 
                this.audio.analyser.frequencyBinCount,
                perfMetrics.detailLevel
            );
        }
        
        this.drawPositionIndicator();
        this.drawInfoDisplay(perfMetrics);

        this.animationId = requestAnimationFrame((t) => this.animate(t));
    }

    drawPositionIndicator() {
        if (!this.audio.panner) return;

        const centerX = this.canvas.canvas.width / 2;
        const centerY = this.canvas.canvas.height / 2;
        
        // Draw position indicators
        const hue = 200;
        this.canvas.drawGlowLayers(centerX, centerY, hue, 70, 50);
        
        if (this.normalizedX !== null && this.normalizedY !== null) {
            const x = (this.normalizedX + 1) * this.canvas.canvas.width / 2;
            const y = (this.normalizedY + 1) * this.canvas.canvas.height / 2;
            
            this.canvas.drawConnectingLine(centerX, centerY, x, y, hue, 70, 50);
            this.canvas.drawHeightIndicator(x, centerY, y, hue, 70, 50);
            this.canvas.drawGlowLayers(x, y, hue, 70, 50);
        }
    }

    drawInfoDisplay(perfMetrics) {
        if (!this.audio.panner) return;

        const positionX = this.audio.panner.positionX.value;
        const positionY = this.audio.panner.positionY.value;
        const positionZ = this.audio.panner.positionZ.value;
        
        // Draw position values
        this.canvas.drawInfoSection('Position:', 20, 30, [
            `X: ${positionX.toFixed(1)}`,
            `Y: ${positionY.toFixed(1)}`,
            `Z: ${positionZ.toFixed(1)}`
        ]);
        
        // Draw modulation values
        const xPercent = Math.abs(this.normalizedX || 0) * 100;
        const yPercent = Math.abs(this.normalizedY || 0) * 100;
        this.canvas.drawInfoSection('Modulation:', 20, 100, [
            `X: ${Math.round(xPercent)}%`,
            `Y: ${Math.round(yPercent)}%`
        ]);
        
        // Draw performance info
        this.canvas.drawInfoSection('Performance:', 20, 170, [
            `FPS: ${Math.round(perfMetrics.fps)}`,
            `Detail: ${Math.round(perfMetrics.detailLevel * 100)}%`
        ]);
    }

    handlePositionUpdate(normalizedX, normalizedY) {
        this.normalizedX = normalizedX;
        this.normalizedY = normalizedY;
        
        if (this.oscillators) {
            this.oscillators.updateFrequencies(normalizedX, normalizedY);
        }
    }

    updateOscillatorType(type) {
        if (this.oscillators) {
            this.oscillators.updateOscillatorType(type);
        }
    }

    updateLFOType(type) {
        if (this.oscillators) {
            this.oscillators.updateLFOType(type);
        }
    }

    updateDistanceModel(model) {
        this.audio.updateDistanceModel(model);
    }

    updateListenerPosition() {
        this.audio.updateListenerPosition();
    }
}

// Initialize visualizer when the page loads
window.addEventListener('load', () => {
    new AudioVisualizer();
});
