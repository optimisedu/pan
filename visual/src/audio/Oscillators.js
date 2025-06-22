export class OscillatorManager {
    constructor(audioContext) {
        this.audioContext = audioContext;
        this.oscillator = null;
        this.oscillator2 = null;
        this.lfo = null;
        this.lfoGain = null;
    }

    setupOscillators() {
        // Create oscillators
        this.oscillator = this.audioContext.createOscillator();
        this.oscillator2 = this.audioContext.createOscillator();
        this.lfo = this.audioContext.createOscillator();
        this.lfoGain = this.audioContext.createGain();

        // Configure oscillators
        this.oscillator.type = 'sine';
        this.oscillator2.type = 'sine';
        this.lfo.type = 'sine';
        this.lfoGain.gain.value = 100;

        // Set initial frequencies
        this.oscillator.frequency.value = 440;
        this.oscillator2.frequency.value = 440;
        this.lfo.frequency.value = 1;
    }

    start() {
        const currentTime = this.audioContext.currentTime;
        this.oscillator.start(currentTime);
        this.oscillator2.start(currentTime);
        this.lfo.start(currentTime);
    }

    stop() {
        const currentTime = this.audioContext.currentTime;
        this.oscillator.stop(currentTime);
        this.oscillator2.stop(currentTime);
        this.lfo.stop(currentTime);
        this.dispose();
    }

    updateOscillatorType(type) {
        if (this.oscillator && this.oscillator2) {
            this.oscillator.type = type;
            this.oscillator2.type = type;
        }
    }

    updateLFOType(type) {
        if (this.lfo) {
            this.lfo.type = type;
        }
    }

    updateFrequencies(normalizedX, normalizedY) {
        if (!this.oscillator || !this.oscillator2) return;

        const currentTime = this.audioContext.currentTime;
        const baseFreq = 440;
        const maxFreqOffset = 200;

        this.oscillator.frequency.setValueAtTime(
            baseFreq + (normalizedX * maxFreqOffset),
            currentTime
        );
        this.oscillator2.frequency.setValueAtTime(
            baseFreq + (normalizedY * maxFreqOffset),
            currentTime
        );
    }

    dispose() {
        this.oscillator = null;
        this.oscillator2 = null;
        this.lfo = null;
        this.lfoGain = null;
    }
}
