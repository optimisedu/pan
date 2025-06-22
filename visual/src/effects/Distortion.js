export class Distortion {
    constructor(audioContext) {
        this.audioContext = audioContext;
        this.waveShaper = this.audioContext.createWaveShaper();
        this.amount = 50; // Default distortion amount
        this.waveShaper.oversample = '4x'; // Use oversampling for better quality
        this.updateCurve();
    }

    // Generate and set the distortion curve
    updateCurve() {
        const samples = 44100; // Number of samples
        const curve = new Float32Array(samples);
        const deg = Math.PI / 180;
        for (let i = 0; i < samples; i++) {
            const x = (i * 2) / samples - 1; // Normalize to [-1, 1]
            curve[i] = ((3 + this.amount) * x * 20 * deg) / (Math.PI + this.amount * Math.abs(x));
        }
        this.waveShaper.curve = curve;
    }

    // Set distortion amount
    setAmount(amount) {
        this.amount = amount;
        this.updateCurve();
    }

    // Get the WaveShaperNode
    getNode() {
        return this.waveShaper;
    }
}