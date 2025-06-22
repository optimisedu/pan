//TODO:
// FIRST FIX CANVAS RESIZE [X] - DONE
// ADD DRY WET - FOR WAVESHAPER AND LFO DEPTH [NEXT TASK!!!]
// THINKING ADDING WAVESHAPER[X] - DONE
// FIX GAIN

//LONGER TERM PLAN BREAK UP THIS MONSTER CLASS
// MATRIX WAS A BIT UNESSICARY THERE ARE BETER WAYS TO VISULISE 3D SPACE
 
// Split canvas computing and normalising values into seperate static methods eventually own fileF
// MODULATED MODE
// CURRENTLY LAID OUT FOR SPACIAL MODE, MODELATOR MODE (FOR MOUSEMOVE ON OSC FREQIEMCY- Multiband distortion as well)
// MOUSEUTIL TODO
// Consider breaking up the mouseutil functions into a separate class or own Class module instead of static.
// Range of centerX/Y being 0/inverted/floating - I can probably improve generated sounds

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
        this.oscillatorFrequency = null;
        this.oscillatorFrequency2 = null;
        this.oscillator2 = null;
        this.subOsc = null;
        this.gainNode = null;
        this.lpf = null;
        this.lfo = null;
        this.staticLfo = null;
        this.lfoGain = null;
        this.lfoDepth = null;
        this.panner = null;
        this.gradient = null;
        this.lastFrameTime = 0;
        this.frameCount = 0;
        this.fps = 60;
        this.sphereGradient = null;
        this.performanceCheckInterval = 1000; // Check performance every second
        this.lastPerformanceCheck = 0;
        this.currentDetailLevel = 1; // 1 = high, 0.5 = medium, 0.25 = low
        this.minDetailLevel = 0.25;
        this.maxDetailLevel = 1;
        this.fpsThreshold = 45; // If FPS drops below this, reduce detail
        this.fpsRecoveryThreshold = 55; // If FPS recovers above this, increase detail
        this.lastMouseMoveTime = 0;
        this.mouseMoveThrottle = 1000 / 60; // 60fps throttle for mouse events
        this.frameInterval = 1000 / 60; // Target 60fps for animation
        this.isThrottled = false;
        this.x = null;
        this.y = null;

        
       // Set canvas size
       this.resizeCanvas();
       window.addEventListener('resize', () => this.resizeCanvas());


        // event listeners
        document.getElementById('startButton').addEventListener('click', () => this.start());
        document.getElementById('stopButton').addEventListener('click', () => this.stop());
        document.getElementById('oscillatorType').addEventListener('change', (e) => this.updateOscillatorType(e.target.value));
        document.getElementById('lfoType').addEventListener('change', (e) => this.updateLFOType(e.target.value));
        // document.getElementById('distanceModel').addEventListener('change', (e) => this.updateDistanceModel(e.target.value));
        document.getElementById('maxDistance').addEventListener('input', (e) => this.updateMaxDistance(e.target.value));
        document.getElementById('rolloffFactor').addEventListener('input', (e) => this.updateRolloffFactor(e.target.value));
     //   document.getElementById('lfoDepth').addEventListener('input', (e) => this.updateLFODepth(e.target.value));

const maxDistanceInput = document.getElementById('maxDistance');
const rolloffFactorInput = document.getElementById('rolloffFactor');
const staticLfoInput = document.getElementById('staticLfoFrequency');

maxDistanceInput.addEventListener('input', (e) => {
    const value = e.target.value;
    document.getElementById('maxDistanceValue').textContent = value;
    if (this.panner) {
        this.panner.maxDistance = parseFloat(value);
    }
});

staticLfoInput.addEventListener('input', (e) => {
    const value = e.target.value;
    document.getElementById('staticLfoFrequencyValue').textContent = value;
    if (this.staticLfo) {
        this.staticLfo.frequency.value = parseFloat(value);
    }
});

rolloffFactorInput.addEventListener('input', (e) => {
    const value = e.target.value;
    document.getElementById('rolloffFactorValue').textContent = value;
    if (this.panner) {
        this.panner.rolloffFactor = parseFloat(value);
    }
});

// document.getElementById('lfoDepth').addEventListener('input', (e) => {
//     const depth = parseFloat(e.target.value);
 
// });

// updateLFODepth(depth) {
//     if (this.panGain) {
//         this.panGain.gain.setValueAtTime(depth, this.audioContext.currentTime);
//         console.log(`LFO Depth updated to: ${depth}`); // Debug log
//     }
// }
// document.getElementById('lfoDepthValue').textContent = value;
// this.updateLFODepth(depth);

// HANDLE EVENT METHOD CALLS
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    //     this.canvas.addEventListener('click', (e) => {
    //         const { normalizedX, normalizedY } = AudioVisualizer.normalizeMousePosition(e, this.canvas);
    //         particles.push(new Particle(normalizedX * this.canvas.width, normalizedY * this.canvas.height, 20, 'white'));
    //     });
    // }
}

    normalizeMousePosition(e, canvas) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        console.log(`Mouse Position: X=${x}, Y=${y}`); // DEBUG - check mouse position

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
    
        // Normalize [-1 || 1]
        const normalizedX = (e.clientX - rect.left - centerX) / centerX;
        const normalizedY = (e.clientY - rect.top - centerY) / centerY;
    
        return { x, y, normalizedX, normalizedY, centerX, centerY };
    }
//FIX
resizeCanvas() {
    this.canvas.width = window.innerWidth * 0.8;
    this.canvas.height = window.innerHeight * 0.8;

    // Add a background gradient for a more visually appealing effect
    // this.gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
    // this.gradient.addColorStop(0, 'rgba(0, 0, 50, 1)');
    // this.gradient.addColorStop(1, 'rgba(0, 50, 100, 1)');
    // this.ctx.fillStyle = this.gradient;
    // this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    // this.canvas.height = window.innerHeight * 0.8;

    // // Apply sinusoidal distortion to the canvas
    //     const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    //     const data = imageData.data;
    //     const amplitude = 20; // Amplitude of the sinusoidal wave
    //     const frequency = 0.02; // Frequency of the sinusoidal wave

    //     for (let y = 0; y < this.canvas.height; y++) {
    //         const offset = Math.sin(y * frequency) * amplitude;
    //         for (let x = 0; x < this.canvas.width; x++) {
    //             const srcX = Math.min(Math.max(Math.round(x + offset), 0), this.canvas.width - 1);
    //             const srcIndex = (y * this.canvas.width + srcX) * 4;
    //             const destIndex = (y * this.canvas.width + x) * 4;

    //             data[destIndex] = data[srcIndex];
    //             data[destIndex + 1] = data[srcIndex + 1];
    //             data[destIndex + 2] = data[srcIndex + 2];
    //             data[destIndex + 3] = data[srcIndex + 3];
    //         }
    //     }

    //     this.ctx.putImageData(imageData, 0, 0);
}
            handleMouseMove(e) {
                if (!this.isPlaying || !this.oscillator || !this.oscillator2) return;

                const { x,y,normalizedX, normalizedY, centerX, centerY } = AudioVisualizer.normalizeMousePosition(e, this.canvas);

                // Store normalized values for progress bars
                this.normalizedX = normalizedX;
                this.normalizedY = normalizedY;

            // Calculate orientation angles (-45 to 45 degrees)
            const orientationX = normalizedX * 45;
            const orientationY = normalizedY * 45;
            const orientationZ = normalizedY * 45;

            // Update panner orientation
            if (this.panner) {
                this.panner.orientationX.setValueAtTime(orientationX, this.audioContext.currentTime);
                this.panner.orientationY.setValueAtTime(orientationY, this.audioContext.currentTime);
                this.panner.orientationZ.setValueAtTime(orientationZ, this.audioContext.currentTime);
            }

            // Set LFO frequency based on Y position (0.5Hz to 8Hz)
            const lfoFrequency = 0.5 + Math.abs(normalizedY) * 7.5;
            this.lfo.frequency.setValueAtTime(lfoFrequency, this.audioContext.currentTime);

            // Update filter cutoff frequency based on oscillator frequency with inverted exponential scaling
            const invertedY = 1 - Math.abs(normalizedY); // Invert Y position (1 to 0)
            const filterCutoffFreq = this.oscillatorFrequency * Math.pow(invertedY, 2); // Exponential scaling
            this.lpf.frequency.setTargetAtTime(filterCutoffFreq, this.audioContext.currentTime, 0.1);

    //DEBUG
            const panGain = 100 * Math.abs(x); // PAN LFO MOD
            this.lfoGain.gain.setTargetAtTime(panGain, this.audioContext.currentTime, 0.1);
        }

        handleMouseDown(e) {
            if (!this.isPlaying || !this.panner) return;

            const { normalizedX, normalizedY, centerX, centerY } = AudioVisualizer.normalizeMousePosition(e, this.canvas);

            this.normalizedX = normalizedX;
            this.normalizedY = normalizedY;

            // Oscillator frequency: 55Hz to 880Hz (sub-bass to mid-bass range)
            const baseFreq = 55;
            const freqRange = 880;
            this.oscillatorFrequency = baseFreq + Math.abs(normalizedX) * freqRange;
            this.oscillatorFrequency2 = this.oscillatorFrequency / 2;

            this.oscillator.frequency.exponentialRampToValueAtTime(this.oscillatorFrequency, this.audioContext.currentTime + 1);
            this.oscillator2.frequency.exponentialRampToValueAtTime(this.oscillatorFrequency2, this.audioContext.currentTime + 1);
        
            const panValue = normalizedX;
            const zValue = normalizedY;


            // Create a curve for more pronounced movement
            const duration = 3; // Duration of the movement in seconds
            const currentTime = this.audioContext.currentTime;
            // Create a curve that overshoots and settles
            const curve = new Float32Array([0, panValue * 1.5, panValue * 0.8, panValue]);
            const times = new Float32Array ([0, duration * 0.3, duration * 0.6, duration])
            this.panner.positionX.exponentialRampToValueAtTime(curve, currentTime, times);

            // Create a similar curve for Z position
            const zCurve = new Float32Array([0, zValue * 1.5, zValue * 0.8, zValue]);
            this.panner.positionZ.exponentialRampToValueAtTime(zCurve, currentTime, times);

            // Add a slight delay to Y position for more dynamic movement
            const yCurve = new Float32Array([0, zValue * 1.2, zValue * 0.9, zValue]);
            this.panner.positionY.exponentialRampToValueAtTime(yCurve, currentTime + duration * 0.2, times);
        }

        //mouseup ramp to max pan direction and back to center

    handleMouseUp(e) {
        if (!this.isPlaying || !this.panner) return;

        const { normalizedX, normalizedY } = AudioVisualizer.normalizeMousePosition(e, this.canvas);

        // Update panner position
        this.panner.positionX(normalizedX * 1.25, this.audioContext.currentTime + 1);
        this.panner.positionZ.exponentialRampToValueAtTime(normalizedY * 1.25, this.audioContext.currentTime + 1);

        console.log(`Updated panner position: X=${normalizedX}, Z=${normalizedY}`);
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
                console.log(this.audioContext); // Debug log
                
                // Resume audio context if it's suspended (autoplay policy)
                if (this.audioContext.state === 'suspended') {
                    this.audioContext.resume();
                }
            }

            // Create and configure analyser
            this.analyser = this.audioContext.createAnalyser();
            this.#updateAnalyserSettings();
            const bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(bufferLength);

            // Get initial oscillator type from dropdown

               // Create first oscillator
               this.oscillator = this.audioContext.createOscillator();
               this.oscillator.type = oscillatorType;
               this.oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
               
               // Create second oscillator
               this.oscillator2 = this.audioContext.createOscillator();
               this.oscillator2.type = oscillatorType;
               this.oscillator2.frequency.setValueAtTime(220, this.audioContext.currentTime);
               
               // static subosc
               this.subOsc = this.audioContext.createOscillator();
               this.subOsc.type = 'sine';
               this.subOsc.frequency.value = 30;

                  // static / secondary LFO - likely to be more widely used more in future 
                  this.staticLfo = this.audioContext.createOscillator();
                  this.staticLfo.type = 'sine';
                  this.staticLfo.frequency.value = 0.5;

            // Create low-pass filter
            this.lpf = this.audioContext.createBiquadFilter();
            this.lpf.type = 'lowpass';
            this.lpf.frequency.linearRampToValueAtTime(2000, this.audioContext.currentTime + 3); // Initial cutoff frequency sweep
            this.lpf.Q.setValueAtTime(1.25, this.audioContext.currentTime); // FIXED POPPING

            
            // Create a WaveShaperNode
            this.waveShaper = this.audioContext.createWaveShaper();

            const makeSubtleCurve = () => {
                const curve = new Float32Array(65536);
                const saturation = 0.2; // Lower saturation for a more subtle effect
                for (let i = 0; i < 65536; i++) {
                    let x = (i / 65536) * 2 - 1;
                    curve[i] = Math.tanh(x * saturation);
                }
                return curve;
            };
            this.waveShaper.curve = makeSubtleCurve();
            this.waveShaper.oversample = '2x';


            // Connect the WaveShaperNode to the audio graph
            // this.oscillator.connect(this.waveShaper);
            // this.waveShaper.connect(this.lpf); // Continue the chain

            // Create LFO
            this.lfo = this.audioContext.createOscillator();
            this.lfo.type = document.getElementById('lfoType').value; // Get initial LFO type from dropdown
            this.lfo.frequency.setValueAtTime(4, this.audioContext.currentTime); // Standard wobble rate

            // Create LFO gain node for filter modulation
            this.lfoGain = this.audioContext.createGain();
            this.lfoGain.gain.setValueAtTime(1000, this.audioContext.currentTime); // NEW PAN GAIN TEMP FIX

            
            // Create main gain node
            this.lfoDepth = this.audioContext.createGain();
            this.lfoDepth.gain.setValueAtTime(75, this.audioContext.currentTime); // Moderate volume

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

            // PANNERGAIN TO BE REPLACED WITH DRY WET DISTORTION
            this.pannerGain = this.audioContext.createGain();
            this.pannerGain.gain.setValueAtTime(1, this.audioContext.currentTime);

            // Set initial position using the correct method
            this.panner.positionX.setValueAtTime(0, this.audioContext.currentTime);
            this.panner.positionY.setValueAtTime(0, this.audioContext.currentTime);
            this.panner.positionZ.setValueAtTime(0, this.audioContext.currentTime);

            // Connect nodes in the correct order
            this.staticLfo.connect(this.lfo.frequency)
            this.lfo.connect(this.lfoDepth);
            //this.lfo.connect(this.pannerGain.gain);

            this.lfoDepth.connect(this.lpf.frequency);
            this.oscillator.connect(this.waveShaper);
            this.oscillator2.connect(this.waveShaper);
            this.waveShaper.connect(this.lpf);//Add mid filter?
            this.waveShaper.connect(this.panner);
            this.panner.connect(this.pannerGain);
            this.pannerGain.connect(this.analyser);
            this.subOsc.connect(this.audioContext.destination);
            this.analyser.connect(this.audioContext.destination);


            this.oscillator.start();
            this.oscillator2.start();
            this.staticLfo.start();
            this.subOsc.start()
            this.lfo.start();

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

    #updateAnalyserSettings() {
        if (!this.analyser) return;
    
        const baseFftSize = 2048;
        const fftSize = Math.round(baseFftSize * this.currentDetailLevel);
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
                this.#updateAnalyserSettings();
            } else if (this.fps > this.fpsRecoveryThreshold && this.currentDetailLevel < this.maxDetailLevel) {
                // Increase detail level
                this.currentDetailLevel = Math.min(this.maxDetailLevel, this.currentDetailLevel * 2);
                this.#updateAnalyserSettings();
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
        if (this.subOsc) {
            this.subOsc.stop();
            this.subOsc.disconnect();
            this.subOsc = null;
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

            // Create this.gradient based on frequency
            this.gradient = this.ctx.createLinearGradient(x, this.canvas.height, x, this.canvas.height - barHeight);
            const hue = (i / this.dataArray.length) * 360;
            this.gradient.addColorStop(0, `hsl(${hue}, 100%, 50%)`);
            this.gradient.addColorStop(1, `hsl(${(hue + 60) % 360}, 100%, 50%)`);

            // Draw the bar
            this.ctx.fillStyle = this.gradient;
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
            
            // Draw position indicator with dynamic color and pulsing animation
            const indicatorX = Math.abs(Math.round(centerX + (positionX * circleRadius / maxDistance)));
            const indicatorY = Math.abs(Math.round(centerY + (-positionZ * circleRadius / maxDistance))); // Invert Z for visualization to match click position

            // Color based on position and distance
            const hue = (Math.atan2(positionZ, positionX) * 180 / Math.PI + 360) % 360;
            const saturation = 100;
            const lightness = 50 + (normalizedDistance * 50);

            // Pulsing effect based on timestamp
            const pulseRadius = 20 + (isFinite(timestamp) ? Math.sin(timestamp / 200) * 10 : 0); // Pulsing radius
            const pulseOpacity = 0.5 + (isFinite(timestamp) ? Math.sin(timestamp / 200) * 0.3 : 0); // Pulsing opacity

            // Create a glowing sphere with pulsing effect
            if (isFinite(indicatorX) && isFinite(indicatorY) && isFinite(pulseRadius) && pulseRadius > 0) {
                this.sphereGradient = this.ctx.createRadialGradient(
                    indicatorX, indicatorY, 0,
                    indicatorX, indicatorY, Math.max(0, isFinite(pulseRadius) ? pulseRadius : 0)
                );
                this.sphereGradient.addColorStop(0, `hsla(${hue}, ${saturation}%, ${lightness}%, ${pulseOpacity})`);
                this.sphereGradient.addColorStop(1, `hsla(${hue}, ${saturation}%, ${lightness}%, 0)`);

                this.ctx.beginPath();
                this.ctx.arc(indicatorX, indicatorY, pulseRadius, 0, Math.PI * 2);
                this.ctx.fillStyle = this.sphereGradient;
                this.ctx.fill();
            } else {
                console.warn('Non-finite or invalid values detected for radial gradient:', { indicatorX, indicatorY, pulseRadius });
            }

            this.ctx.beginPath();
            this.ctx.arc(indicatorX, indicatorY, pulseRadius, 0, Math.PI * 2);
            this.ctx.fillStyle = this.sphereGradient;
            this.ctx.fill();

            // Use dMatix method to visualize 3D transformation
            this.dMatix(positionX, positionY, positionZ);
            
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
            // Create a DOMMatrix to represent the 3D position
            this.dMatix(positionX, positionY, positionZ);
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

    dMatix(positionX, positionY, positionZ) {
        const matrix = new DOMMatrix();
        matrix.translateSelf(positionX, positionY, positionZ);

        // Visualize the DOMMatrix as a 3D transformation
        const matrixString = `
                // [ ${matrix.m11.toFixed(2)}, ${matrix.m12.toFixed(2)}, ${matrix.m13.toFixed(2)}, ${matrix.m14.toFixed(2)} ]
                // [ ${matrix.m21.toFixed(2)}, ${matrix.m22.toFixed(2)}, ${matrix.m23.toFixed(2)}, ${matrix.m24.toFixed(2)} ]
                // [ ${matrix.m31.toFixed(2)}, ${matrix.m32.toFixed(2)}, ${matrix.m33.toFixed(2)}, ${matrix.m34.toFixed(2)} ]
                [ ${matrix.m41.toFixed(2)}, ${matrix.m42.toFixed(2)}, ${matrix.m43.toFixed(2)}, ${matrix.m44.toFixed(2)} ]
            `;

        // Display the matrix on the canvas
        this.ctx.font = '12px Arial';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('DOMMatrix:', 20, 260);
        this.ctx.fillText(matrixString, 20, 280);

        // Add a 3D cube visualization to represent the matrix transformation
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const cubeSize = 50;
        
        // Calculate cube vertices based on position
        const vertices = [
            { x: -cubeSize, y: -cubeSize, z: -cubeSize },
            { x: cubeSize, y: -cubeSize, z: -cubeSize },
            { x: cubeSize, y: cubeSize, z: -cubeSize },
            { x: -cubeSize, y: cubeSize, z: -cubeSize },
            { x: -cubeSize, y: -cubeSize, z: cubeSize },
            { x: cubeSize, y: -cubeSize, z: cubeSize },
            { x: cubeSize, y: cubeSize, z: cubeSize },
            { x: -cubeSize, y: cubeSize, z: cubeSize },
        ];

        // Apply matrix transformation to vertices
        const transformedVertices = vertices.map(v => {
            const point = new DOMPoint(v.x, v.y, v.z);
            const transformedPoint = point.matrixTransform(matrix);
            return {
                x: centerX + transformedPoint.x,
                y: centerY - transformedPoint.y, // Invert Y for canvas coordinates
                z: transformedPoint.z,
            };
        });

        // Draw edges of the cube
        const edges = [
            [0, 1], [1, 2], [2, 3], [3, 0], // Front face
            [4, 5], [5, 6], [6, 7], [7, 4], // Back face
            [0, 4], [1, 5], [2, 6], [3, 7], // Connecting edges
        ];

        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 1;

        edges.forEach(([start, end]) => {
            const v1 = transformedVertices[start];
            const v2 = transformedVertices[end];
            this.ctx.beginPath();
            this.ctx.moveTo(v1.x, v1.y);
            this.ctx.lineTo(v2.x, v2.y);
            this.ctx.stroke();
        });

        // Draw a glowing this.sphere at the current position
        const sphereRadius = 10;
        this.gradient = this.ctx.createRadialGradient(
            centerX + positionX, centerY - positionZ, 0,
            centerX + positionX, centerY - positionZ, sphereRadius
        );
        this.gradient.addColorStop(0, 'rgb(255, 255, 255)');
        this.gradient.addColorStop(1, 'rgba(76, 64, 202, 0.39)');

        this.ctx.beginPath();
        this.ctx.arc(centerX + positionX, centerY - positionZ, sphereRadius, 0, Math.PI * 2);
        this.ctx.fillStyle = this.gradient;
        this.ctx.fill();
    }
}   

// Initialize visualizer when the page loads
window.addEventListener('load', () => {
    new AudioVisualizer();
});