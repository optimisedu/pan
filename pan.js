//TODO:
//CHOOSE A CLEAR WAY OF SHOWING NORMALIZED VALUES
//ADD A STATIC CLICK EVENT FOR PAN

class AudioVisualizer {
    constructor() {
        this.canvas = document.getElementById('visualizer');
        this.ctx = this.canvas.getContext('2d');
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.animationId = null;
        this.isPlaying = false;
        this.oscillator = null;
        this.gainNode = null;
        this.lpf = null;
        this.lfo = null;
        this.lfoGain = null;
        this.oscillator2 = null;
        this.normalizedX = null;
        this.normalizedY = null;
        this.panner = null;
        this.lastFrameTime = 0;
        this.frameCount = 0;
        this.fps = 60;
        this.targetFps = 60;
        this.performanceCheckInterval = 1000; // Check performance every second
        this.lastPerformanceCheck = 0;
        this.currentDetailLevel = 1; // 1 = high, 0.5 = medium, 0.25 = low
        this.minDetailLevel = 0.25;
        this.maxDetailLevel = 1;
        this.fpsThreshold = 45; // If FPS drops below this, reduce detail
        this.fpsRecoveryThreshold = 55; // If FPS recovers above this, increase detail

        // Set canvas size
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Bind event listeners
        document.getElementById('startButton').addEventListener('click', () => this.start());
        document.getElementById('stopButton').addEventListener('click', () => this.stop());
        document.getElementById('oscillatorType').addEventListener('change', (e) => this.updateOscillatorType(e.target.value));
        document.getElementById('lfoType').addEventListener('change', (e) => this.updateLFOType(e.target.value));
        document.getElementById('distanceModel').addEventListener('change', (e) => this.updateDistanceModel(e.target.value));
        document.getElementById('maxDistance').addEventListener('input', (e) => this.updateMaxDistance(e.target.value));
        document.getElementById('rolloffFactor').addEventListener('input', (e) => this.updateRolloffFactor(e.target.value));
        
        // Add mouse event listeners
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth * 0.8;
        this.canvas.height = window.innerHeight * 0.8;
    }

    handleMouseMove(e) {
        if (!this.isPlaying || !this.oscillator || !this.oscillator2) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        // Store normalized values for progress bars
        this.normalizedX = (x - centerX) / centerX;
        this.normalizedY = (y - centerY) / centerY;

        // Map normalized values to frequency ranges with exponential scaling
        // Oscillator frequency: 55Hz to 880Hz (sub-bass to mid-bass range)
        const baseFreq = 55;
        const freqRange = 825;
        const oscillatorFrequency = baseFreq + (Math.pow(Math.abs(this.normalizedX), 2) * freqRange);
        const oscillatorFrequency2 = oscillatorFrequency / 2;

        // Set LFO frequency based on Y position (0.5Hz to 8Hz)
        const lfoFrequency = 0.5 + (Math.abs(this.normalizedY) * 7.5);
        
        // Update oscillator frequencies with smooth transitions
        this.oscillator.frequency.setTargetAtTime(oscillatorFrequency, this.audioContext.currentTime, 0.1);
        this.oscillator2.frequency.setTargetAtTime(oscillatorFrequency2, this.audioContext.currentTime, 0.1);

        // Set LFO frequency once based on mouse position
        this.lfo.frequency.setValueAtTime(lfoFrequency, this.audioContext.currentTime);
        
        // Update filter cutoff frequency based on oscillator frequency with inverted exponential scaling
        const invertedY = 1 - Math.abs(this.normalizedY); // Invert Y position (1 to 0)
        const filterCutoffFreq = oscillatorFrequency * Math.pow(invertedY, 2); // Exponential scaling
        this.lpf.frequency.setTargetAtTime(filterCutoffFreq, this.audioContext.currentTime, 0.1);
        
        // Set filter Q based on Y position (5 to 15)
        const dynamicQ = 5 + (Math.abs(this.normalizedY) * 10);
        this.lpf.Q.setValueAtTime(dynamicQ, this.audioContext.currentTime);

        // Update LFO gain based on Y position for more dramatic modulation
        const lfoGainValue = 2000 + (Math.abs(this.normalizedY) * 3000); // Range from 2000 to 5000
        this.lfoGain.gain.setTargetAtTime(lfoGainValue, this.audioContext.currentTime, 0.1);
    }

    handleMouseDown(e) {
        if (!this.isPlaying || !this.panner) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Calculate pan value (-1 to 1) for X position with linear scaling
        const panValue = (x - centerX) / centerX;
        const zValue = (y - centerY) / centerY;
        
        // Set pan and Z position to reach canvas edges
        const maxDistance = Math.max(this.canvas.width, this.canvas.height) / 2;
        this.panner.positionX.setValueAtTime(panValue * maxDistance, this.audioContext.currentTime);
        // this.panner.positionY.setValueAtTime(Math.abs(zValue) * maxDistance * 0.25, this.audioContext.currentTime);
        this.panner.positionZ.setValueAtTime(-zValue * maxDistance, this.audioContext.currentTime);
    }

    updateOscillatorType(type) {
        if (this.oscillator) {
            this.oscillator.type = type;
        }
        if (this.oscillator2) {
            this.oscillator2.type = type;
        }
    }

    updateLFOType(type) {
        if (this.lfo) {
            this.lfo.type = type;
            console.log('LFO type updated to:', type); // Debug log
        }
    }

    updateDistanceModel(model) {
        if (this.panner) {
            this.panner.distanceModel = model;
        }
    }

    updateMaxDistance(value) {
        if (this.panner) {
            this.panner.maxDistance = parseFloat(value);
            document.getElementById('maxDistanceValue').textContent = value;
        }
    }

    updateRolloffFactor(value) {
        if (this.panner) {
            this.panner.rolloffFactor = parseFloat(value);
            document.getElementById('rolloffFactorValue').textContent = value;
        }
    }

    start() {
        if (this.isPlaying) return;

        try {
            // Create audio context with proper error handling
            if (!this.audioContext) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                if (!AudioContext) {
                    throw new Error('Web Audio API is not supported in this browser');
                }
                this.audioContext = new AudioContext();
                
                // Resume audio context if it's suspended (autoplay policy)
                if (this.audioContext.state === 'suspended') {
                    this.audioContext.resume();
                }
            }

            // Create and configure analyser
            this.analyser = this.audioContext.createAnalyser();
            this.updateAnalyserSettings();
            const bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(bufferLength);

            // Get initial oscillator type from dropdown
            const oscillatorType = document.getElementById('oscillatorType').value;
            const lfoType = document.getElementById('lfoType').value;

            // Create first oscillator
            this.oscillator = this.audioContext.createOscillator();
            this.oscillator.type = oscillatorType;
            this.oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
            this.oscillator.start();

            // Create second oscillator
            this.oscillator2 = this.audioContext.createOscillator();
            this.oscillator2.type = oscillatorType;
            this.oscillator2.frequency.setValueAtTime(220, this.audioContext.currentTime);
            this.oscillator2.start();

            // Create low-pass filter
            this.lpf = this.audioContext.createBiquadFilter();
            this.lpf.type = 'lowpass';
            this.lpf.frequency.setValueAtTime(2000, this.audioContext.currentTime); // Initial cutoff frequency
            this.lpf.Q.setValueAtTime(10, this.audioContext.currentTime); // Moderate resonance for character
            this.lpf.gain.setValueAtTime(0, this.audioContext.currentTime); // No gain needed for lowpass

            // Create LFO
            this.lfo = this.audioContext.createOscillator();
            this.lfo.type = document.getElementById('lfoType').value; // Get initial LFO type from dropdown
            this.lfo.frequency.setValueAtTime(4, this.audioContext.currentTime); // Standard wobble rate
            this.lfo.start();

            // Create LFO gain node for filter modulation
            this.lfoGain = this.audioContext.createGain();
            this.lfoGain.gain.setValueAtTime(2000, this.audioContext.currentTime); // Increased initial modulation depth

            // Create main gain node
            this.gainNode = this.audioContext.createGain();
            this.gainNode.gain.setValueAtTime(1, this.audioContext.currentTime); // Moderate volume

            // Create panner node
            this.panner = this.audioContext.createPanner();
            this.panner.panningModel = 'HRTF';
            this.panner.distanceModel = document.getElementById('distanceModel').value;
            this.panner.refDistance = 0.5;
            this.panner.maxDistance = parseFloat(document.getElementById('maxDistance').value);
            this.panner.rolloffFactor = parseFloat(document.getElementById('rolloffFactor').value);
            this.panner.coneInnerAngle = 360;
            this.panner.coneOuterAngle = 0;
            this.panner.coneOuterGain = 1;

            // Create panner gain node correctly
            this.pannerGain = this.audioContext.createGain();
            this.pannerGain.gain.setValueAtTime(1, this.audioContext.currentTime);

            // Set initial position using the correct method
            this.panner.positionX.setValueAtTime(0, this.audioContext.currentTime);
            this.panner.positionY.setValueAtTime(0, this.audioContext.currentTime);
            this.panner.positionZ.setValueAtTime(0, this.audioContext.currentTime);

            // Connect nodes in the correct order
            this.lfo.connect(this.lfoGain);
            this.lfoGain.connect(this.lpf.frequency);
            this.oscillator.connect(this.lpf);
            this.oscillator2.connect(this.lpf);
            this.lpf.connect(this.gainNode);
            this.gainNode.connect(this.panner);
            this.panner.connect(this.pannerGain);
            this.pannerGain.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);

            // Start animation
            this.isPlaying = true;
            this.animate();
        } catch (error) {
            console.error('Error starting audio:', error);
            // More specific error message based on the error type
            if (error.name === 'NotAllowedError') {
                alert('Please click the start button again to allow audio playback.');
            } else if (error.name === 'NotSupportedError') {
                alert('Your browser does not support the required audio features.');
            } else {
                alert('Error starting audio: ' + error.message);
            }
            // Clean up any partially created nodes
            this.stop();
        }
    }

    updateAnalyserSettings() {
        if (!this.analyser) return;
        
        // Base FFT size is 2048, adjust based on detail level
        const baseFftSize = 2048;
        const fftSize = Math.round(baseFftSize * this.currentDetailLevel);
        
        // Ensure FFT size is a power of 2
        this.analyser.fftSize = Math.pow(2, Math.round(Math.log2(fftSize)));
    }

    checkPerformance(timestamp) {
        // Calculate FPS
        if (this.lastFrameTime) {
            const deltaTime = timestamp - this.lastFrameTime;
            this.fps = 1000 / deltaTime;
        }
        this.lastFrameTime = timestamp;

        // Check performance periodically
        if (timestamp - this.lastPerformanceCheck >= this.performanceCheckInterval) {
            this.lastPerformanceCheck = timestamp;
            
            // Adjust detail level based on FPS
            if (this.fps < this.fpsThreshold && this.currentDetailLevel > this.minDetailLevel) {
                // Reduce detail level
                this.currentDetailLevel = Math.max(this.minDetailLevel, this.currentDetailLevel * 0.5);
                this.updateAnalyserSettings();
            } else if (this.fps > this.fpsRecoveryThreshold && this.currentDetailLevel < this.maxDetailLevel) {
                // Increase detail level
                this.currentDetailLevel = Math.min(this.maxDetailLevel, this.currentDetailLevel * 2);
                this.updateAnalyserSettings();
            }
        }
    }

    stop() {
        if (!this.isPlaying) return;

        // Stop animation
        cancelAnimationFrame(this.animationId);
        this.isPlaying = false;

        // Stop and disconnect nodes
        if (this.oscillator) {
            this.oscillator.stop();
            this.oscillator.disconnect();
            this.oscillator = null;
        }
        if (this.oscillator2) {
            this.oscillator2.stop();
            this.oscillator2.disconnect();
            this.oscillator2 = null;
        }
        if (this.lfo) {
            this.lfo.stop();
            this.lfo.disconnect();
            this.lfo = null;
        }
        if (this.panner) {
            this.panner.disconnect();
            this.panner = null;
        }

        // Close audio context
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }

        // Clear canvas
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    animate(timestamp) {
        if (!this.isPlaying) return;

        // Check and adjust performance
        this.checkPerformance(timestamp);

        // Get frequency data
        this.analyser.getByteFrequencyData(this.dataArray);

        // Clear canvas
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw visualization bars
        const barWidth = (this.canvas.width / (this.dataArray.length / 4)) * 4;
        let barHeight;
        let x = 0;

        // Draw frequency bars
        for (let i = 0; i < this.dataArray.length; i += 4) {
            barHeight = (this.dataArray[i] / 255) * this.canvas.height;

            // Create gradient based on frequency
            const gradient = this.ctx.createLinearGradient(x, this.canvas.height, x, this.canvas.height - barHeight);
            const hue = (i / this.dataArray.length) * 360;
            gradient.addColorStop(0, `hsl(${hue}, 100%, 50%)`);
            gradient.addColorStop(1, `hsl(${(hue + 60) % 360}, 100%, 50%)`);

            // Draw the bar
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(x, this.canvas.height - barHeight, barWidth, barHeight);

            x += barWidth + 2;
        }

        // Draw 3D position indicator
        if (this.panner) {
            const centerX = this.canvas.width / 2;
            const centerY = this.canvas.height / 2;
            
            // Get position values directly from the panner
            const positionX = this.panner.positionX.value;
            const positionY = this.panner.positionY.value;
            const positionZ = this.panner.positionZ.value;
            
            // Calculate distance from center for intensity
            const distance = Math.sqrt(positionX * positionX + positionZ * positionZ);
            const maxDistance = Math.max(this.canvas.width, this.canvas.height) / 2; // Use canvas size for max distance
            const normalizedDistance = Math.min(distance / maxDistance, 1);
            
            // Create circular visualization
            const circleRadius = Math.min(this.canvas.width, this.canvas.height) / 2.5; // Larger circle
            const innerRadius = circleRadius * 0.3; // Proportional inner circle
            
            // Draw outer circle
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, circleRadius, 0, Math.PI * 2);
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // Draw inner circle
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            this.ctx.stroke();
            
            // Draw position indicator with dynamic color
            const indicatorX = centerX + (positionX * circleRadius / maxDistance);
            const indicatorY = centerY + (-positionZ * circleRadius / maxDistance); // Invert Z for visualization to match click position
            
            // Create multiple layers of glow for more intensity
            const glowLayers = [
                { radius: 40, opacity: 0.6 },
                { radius: 30, opacity: 0.8 },
                { radius: 20, opacity: 1 }
            ];
            
            // Color based on position and distance
            const hue = (Math.atan2(positionZ, positionX) * 180 / Math.PI + 360) % 360;
            const saturation = 100;
            const lightness = 50 + (normalizedDistance * 50);
            
            // Draw multiple glow layers
            glowLayers.forEach(layer => {
                const gradient = this.ctx.createRadialGradient(
                    indicatorX, indicatorY, 0,
                    indicatorX, indicatorY, layer.radius
                );
                
                gradient.addColorStop(0, `hsla(${hue}, ${saturation}%, ${lightness}%, ${layer.opacity})`);
                gradient.addColorStop(1, `hsla(${hue}, ${saturation}%, ${lightness}%, 0)`);
                
                this.ctx.beginPath();
                this.ctx.arc(indicatorX, indicatorY, layer.radius, 0, Math.PI * 2);
                this.ctx.fillStyle = gradient;
                this.ctx.fill();
            });
            
            // Draw connecting lines with gradient
            const lineGradient = this.ctx.createLinearGradient(
                centerX, centerY,
                indicatorX, indicatorY
            );
            lineGradient.addColorStop(0, `hsla(${hue}, ${saturation}%, ${lightness}%, 0.5)`);
            lineGradient.addColorStop(1, `hsla(${hue}, ${saturation}%, ${lightness}%, 0)`);
            
            this.ctx.beginPath();
            this.ctx.moveTo(centerX, centerY);
            this.ctx.lineTo(indicatorX, indicatorY);
            this.ctx.strokeStyle = lineGradient;
            this.ctx.lineWidth = 3; // Thicker line
            this.ctx.stroke();
            
            // Draw Y-axis indicator (height)
            const heightIndicatorY = centerY - 120;
            const heightBarWidth = 10;
            const heightBarHeight = 100;
            const heightPercentage = (positionY + 100) / 200; // Normalize Y position to 0-1
            
            // Draw height bar background
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            this.ctx.fillRect(centerX - heightBarWidth/2, heightIndicatorY, heightBarWidth, heightBarHeight);
            
            // Draw height indicator
            this.ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, 0.8)`;
            this.ctx.fillRect(
                centerX - heightBarWidth/2,
                heightIndicatorY + heightBarHeight * (1 - heightPercentage),
                heightBarWidth,
                heightBarHeight * heightPercentage
            );
        }

        // Draw normalized values
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'left';
        
        // Get current position values directly from panner
        const positionX = this.panner ? this.panner.positionX.value : 0;
        const positionY = this.panner ? this.panner.positionY.value : 0;
        const positionZ = this.panner ? this.panner.positionZ.value : 0;
        
        // Draw position values with labels
        this.ctx.fillText(`Position:`, 20, 30);
        this.ctx.font = '14px Arial';
        this.ctx.fillText(`X: ${positionX.toFixed(1)}`, 30, 50);
        this.ctx.fillText(`Y: ${positionY.toFixed(1)}`, 30, 70);
        this.ctx.fillText(`Z: ${positionZ.toFixed(1)}`, 30, 90);
        
        // Draw modulation values
        this.ctx.font = 'bold 16px Arial';
        this.ctx.fillText(`Modulation:`, 20, 120);
        this.ctx.font = '14px Arial';
        const xPercent = Math.abs(this.normalizedX || 0) * 100;
        const yPercent = Math.abs(this.normalizedY || 0) * 100;
        this.ctx.fillText(`X: ${Math.round(xPercent)}%`, 30, 140);
        this.ctx.fillText(`Y: ${Math.round(yPercent)}%`, 30, 160);

        // Draw performance info
        this.ctx.font = 'bold 16px Arial';
        this.ctx.fillText(`Performance:`, 20, 190);
        this.ctx.font = '14px Arial';
        this.ctx.fillText(`FPS: ${Math.round(this.fps)}`, 30, 210);
        this.ctx.fillText(`Detail: ${Math.round(this.currentDetailLevel * 100)}%`, 30, 230);

        // Continue animation
        this.animationId = requestAnimationFrame((timestamp) => this.animate(timestamp));
    }
}

// Initialize visualizer when the page loads
window.addEventListener('load', () => {
    new AudioVisualizer();
});
