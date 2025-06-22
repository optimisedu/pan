class AudioVisualizer {
    constructor() {
        // Canvas and context setup
        this.canvas = document.getElementById('visualizer');
        this.ctx = this.canvas.getContext('2d');

        // Audio context and nodes
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.oscillator = null;
        this.oscillator2 = null;
        this.subOsc = null;
        this.lfo = null;
        this.staticLfo = null;
        this.waveShaper = null;
        this.lpf = null;
        this.panner = null;
        this.pannerGain = null;
        this.lfoGain = null;
        this.lfoDepth = null;

        // State variables
        this.isPlaying = false;
        this.animationId = null;
        this.fps = 60;
        this.currentDetailLevel = 1;
        this.normalizedX = 0;
        this.normalizedY = 0;

        // Initialize canvas and event listeners
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        this.addEventListeners();
    }

    // Resize canvas to fit the window
    resizeCanvas() {
        this.canvas.width = window.innerWidth * 0.8;
        this.canvas.height = window.innerHeight * 0.8;
    }

    // Add UI and canvas event listeners
    addEventListeners() {
        document.getElementById('startButton').addEventListener('click', () => this.start());
        document.getElementById('stopButton').addEventListener('click', () => this.stop());
        document.getElementById('oscillatorType').addEventListener('change', (e) => this.updateOscillatorType(e.target.value));
        document.getElementById('lfoType').addEventListener('change', (e) => this.updateLFOType(e.target.value));
        document.getElementById('maxDistance').addEventListener('input', (e) => this.updateMaxDistance(e.target.value));
        document.getElementById('rolloffFactor').addEventListener('input', (e) => this.updateRolloffFactor(e.target.value));

        // Add mouse event listeners
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    }

    // Start the audio and visualization
    start() {
        if (this.isPlaying) return;

        try {
            // Initialize audio context
            if (!this.audioContext) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                if (!AudioContext) throw new Error('Web Audio API is not supported in this browser');
                this.audioContext = new AudioContext();
                if (this.audioContext.state === 'suspended') this.audioContext.resume();
            }

            // Create and configure analyser
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 2048;
            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

            // Create audio nodes
            this.createAudioNodes();

            // Connect audio nodes
            this.connectAudioNodes();

            // Start oscillators and LFOs
            this.oscillator.start();
            this.oscillator2.start();
            this.subOsc.start();
            this.lfo.start();
            this.staticLfo.start();

            // Start animation
            this.isPlaying = true;
            this.animate();
        } catch (error) {
            console.error('Error starting audio:', error);
            this.stop();
        }
    }

    // Stop the audio and visualization
    stop() {
        if (!this.isPlaying) return;

        cancelAnimationFrame(this.animationId);
        this.isPlaying = false;

        // Stop and disconnect nodes
        [this.oscillator, this.oscillator2, this.subOsc, this.lfo, this.staticLfo].forEach((node) => {
            if (node) {
                node.stop();
                node.disconnect();
            }
        });

        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // Create audio nodes
    createAudioNodes() {
        // Oscillators
        this.oscillator = this.createOscillator('sine', 440);
        this.oscillator2 = this.createOscillator('sine', 220);
        this.subOsc = this.createOscillator('sine', 30);

        // LFOs
        this.lfo = this.createOscillator('sine', 4);
        this.staticLfo = this.createOscillator('sine', 0.5);

        // WaveShaper
        this.waveShaper = this.audioContext.createWaveShaper();
        this.waveShaper.curve = this.createWaveShaperCurve();
        this.waveShaper.oversample = '2x';

        // Filters
        this.lpf = this.audioContext.createBiquadFilter();
        this.lpf.type = 'lowpass';
        this.lpf.frequency.setValueAtTime(2000, this.audioContext.currentTime);
        this.lpf.Q.setValueAtTime(1.25, this.audioContext.currentTime);

        // Panner
        this.panner = this.audioContext.createPanner();
        this.panner.panningModel = 'HRTF';
        this.panner.distanceModel = 'inverse';
        this.panner.refDistance = 0.5;
        this.panner.maxDistance = 1000;
        this.panner.rolloffFactor = 1;

        // Gain nodes
        this.pannerGain = this.audioContext.createGain();
        this.lfoGain = this.audioContext.createGain();
        this.lfoDepth = this.audioContext.createGain();
    }

    // Connect audio nodes
    connectAudioNodes() {
        this.oscillator.connect(this.waveShaper);
        this.oscillator2.connect(this.waveShaper);
        this.subOsc.connect(this.waveShaper);

        this.waveShaper.connect(this.lpf);
        this.lpf.connect(this.panner);
        this.panner.connect(this.pannerGain);
        this.pannerGain.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);

        this.lfo.connect(this.lfoGain);
        this.lfoGain.connect(this.lpf.frequency);
    }

    // Create an oscillator
    createOscillator(type, frequency) {
        const osc = this.audioContext.createOscillator();
        osc.type = type;
        osc.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        return osc;
    }

    // Create a WaveShaper curve
    createWaveShaperCurve() {
        const curve = new Float32Array(65536);
        const saturation = 0.2;
        for (let i = 0; i < 65536; i++) {
            const x = (i / 65536) * 2 - 1;
            curve[i] = Math.tanh(x * saturation);
        }
        return curve;
    }

    // Handle mouse move
    handleMouseMove(e) {
        const { normalizedX, normalizedY } = AudioVisualizer.normalizeMousePosition(e, this.canvas);
        this.normalizedX = normalizedX;
        this.normalizedY = normalizedY;

        if (this.panner) {
            this.panner.positionX.setValueAtTime(normalizedX * 100, this.audioContext.currentTime);
            this.panner.positionZ.setValueAtTime(normalizedY * 100, this.audioContext.currentTime);
        }
    }

    // Normalize mouse position
    static normalizeMousePosition(e, canvas) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        return {
            normalizedX: (x - centerX) / centerX,
            normalizedY: (y - centerY) / centerY,
        };
    }

    // Animation loop
    animate() {
        if (!this.isPlaying) return;

        this.analyser.getByteFrequencyData(this.dataArray);

        // Clear canvas
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw frequency bars
        const barWidth = this.canvas.width / this.dataArray.length;
        let x = 0;
        for (let i = 0; i < this.dataArray.length; i++) {
            const barHeight = (this.dataArray[i] / 255) * this.canvas.height;
            this.ctx.fillStyle = `hsl(${(i / this.dataArray.length) * 360}, 100%, 50%)`;
            this.ctx.fillRect(x, this.canvas.height - barHeight, barWidth, barHeight);
            x += barWidth + 1;
        }

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    // Update oscillator type
    updateOscillatorType(type) {
        if (this.oscillator) this.oscillator.type = type;
        if (this.oscillator2) this.oscillator2.type = type;
    }

    // Update LFO type
    updateLFOType(type) {
        if (this.lfo) this.lfo.type = type;
    }

    // Update max distance
    updateMaxDistance(value) {
        if (this.panner) this.panner.maxDistance = parseFloat(value);
    }

    // Update rolloff factor
    updateRolloffFactor(value) {
        if (this.panner) this.panner.rolloffFactor = parseFloat(value);
    }
}

// Initialize the visualizer
window.addEventListener('load', () => {
    new AudioVisualizer();
});