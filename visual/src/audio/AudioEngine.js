export class AudioEngine {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.gainNode = null;
        this.panner = null;
        this.lpf = null;
        this.dataArray = null;
    }

    initialize() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.setupNodes();
    }

    setupNodes() {
        // Create audio nodes
        this.analyser = this.audioContext.createAnalyser();
        this.gainNode = this.audioContext.createGain();
        this.panner = this.audioContext.createPanner();
        this.lpf = this.audioContext.createBiquadFilter();

        // Configure analyser
        this.analyser.fftSize = 2048;
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

        // Configure panner
        this.panner.panningModel = 'HRTF';
        this.panner.distanceModel = 'inverse';
        this.panner.refDistance = 1;
        this.panner.maxDistance = 10000;
        this.panner.rolloffFactor = 1;
        this.panner.coneInnerAngle = 360;
        this.panner.coneOuterAngle = 0;
        this.panner.coneOuterGain = 0;

        // Configure low-pass filter
        this.lpf.type = 'lowpass';
        this.lpf.frequency.value = 1000;

        // Connect nodes
        this.panner.connect(this.lpf);
        this.lpf.connect(this.gainNode);
        this.gainNode.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);
    }

    updateAnalyserSettings() {
        if (this.analyser) {
            this.analyser.fftSize = 2048;
            this.analyser.minDecibels = -90;
            this.analyser.maxDecibels = -10;
            this.analyser.smoothingTimeConstant = 0.85;
        }
    }

    updateDistanceModel(model) {
        if (this.panner) {
            this.panner.distanceModel = model;
        }
    }

    getFrequencyData() {
        if (this.analyser && this.dataArray) {
            this.analyser.getByteFrequencyData(this.dataArray);
            return this.dataArray;
        }
        return null;
    }

    dispose() {
        if (this.audioContext) {
            this.audioContext.close();
        }
    }
}
