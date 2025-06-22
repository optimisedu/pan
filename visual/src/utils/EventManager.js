export class EventManager {
    constructor(canvas, audioVisualizer) {
        this.canvas = canvas;
        this.visualizer = audioVisualizer;
        this.lastMouseMoveTime = 0;
        this.mouseMoveThrottle = 1000 / 60; // 60fps throttle
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousemove', (e) => this.throttledMouseMove(e));
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));

        // Audio control events
        document.getElementById('startButton').addEventListener('click', () => this.visualizer.start());
        document.getElementById('stopButton').addEventListener('click', () => this.visualizer.stop());
        document.getElementById('oscillatorType').addEventListener('change', 
            (e) => this.visualizer.updateOscillatorType(e.target.value));
        document.getElementById('lfoType').addEventListener('change', 
            (e) => this.visualizer.updateLFOType(e.target.value));
        document.getElementById('distanceModel').addEventListener('change', 
            (e) => this.visualizer.updateDistanceModel(e.target.value));

        // Range input events
        this.setupRangeInputs();
        this.setupListenerControls();
    }

    setupRangeInputs() {
        const maxDistanceInput = document.getElementById('maxDistance');
        const rolloffFactorInput = document.getElementById('rolloffFactor');
        
        maxDistanceInput.addEventListener('input', (e) => {
            const value = e.target.value;
            document.getElementById('maxDistanceValue').textContent = value;
            if (this.visualizer.panner) {
                this.visualizer.panner.maxDistance = parseFloat(value);
            }
        });
        
        rolloffFactorInput.addEventListener('input', (e) => {
            const value = e.target.value;
            document.getElementById('rolloffFactorValue').textContent = value;
            if (this.visualizer.panner) {
                this.visualizer.panner.rolloffFactor = parseFloat(value);
            }
        });
    }

    setupListenerControls() {
        ['X', 'Y', 'Z'].forEach(axis => {
            const input = document.getElementById(`listener${axis}`);
            input.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                document.getElementById(`listener${axis}Value`).textContent = value;
                this.visualizer.updateListenerPosition();
            });
        });
    }

    throttledMouseMove(e) {
        const currentTime = performance.now();
        if (currentTime - this.lastMouseMoveTime >= this.mouseMoveThrottle) {
            this.handleMouseMove(e);
            this.lastMouseMoveTime = currentTime;
        }
    }

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Normalize coordinates
        const normalizedX = (x / this.canvas.width) * 2 - 1;
        const normalizedY = (y / this.canvas.height) * 2 - 1;
        
        this.visualizer.handlePositionUpdate(normalizedX, normalizedY);
    }

    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Update panner position
        if (this.visualizer.panner) {
            const normalizedX = (x / this.canvas.width) * 2 - 1;
            const normalizedY = (y / this.canvas.height) * 2 - 1;
            
            const currentTime = this.visualizer.audioContext.currentTime;
            this.visualizer.panner.positionX.setValueAtTime(normalizedX * 10, currentTime);
            this.visualizer.panner.positionY.setValueAtTime(normalizedY * 10, currentTime);
            this.visualizer.panner.positionZ.setValueAtTime(0, currentTime);
        }
    }
}
