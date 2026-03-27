let audioCtx;
let analysisManager;

function initAudioContext() {
    if (!audioCtx) { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    if (audioCtx.state === 'suspended') { audioCtx.resume(); }
}

function playOscillatorTest(type) {
    initAudioContext();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(110, audioCtx.currentTime); 
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.05); 
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
    osc.connect(gainNode); gainNode.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 1); 
}

function playSynthesisRiser() {
    initAudioContext();
    const osc = audioCtx.createOscillator();
    const filter = audioCtx.createBiquadFilter();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(40, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 2.8);
    filter.type = 'lowpass'; filter.frequency.setValueAtTime(100, audioCtx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(5000, audioCtx.currentTime + 2.8); filter.Q.value = 10;
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.5);
    gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 3);
    osc.connect(filter); filter.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 3.1);
}

class AudioAnalysisManager {
    constructor(canvas, filterCanvas, oscCanvas) {
        this.canvas = canvas; this.ctx = canvas.getContext('2d');
        this.filterCanvas = filterCanvas; this.filterCtx = filterCanvas.getContext('2d');
        this.oscCanvas = oscCanvas; this.oscCtx = oscCanvas.getContext('2d');
        
        this.analyser = null;
        this.dataArray = null; 
        this.timeDomainArray = null; 
        this.active = false;
        this.time = 0;
        this.overallIntensity = 0; 
        
        this.eqData = new Array(20).fill(0); 
        this.dynamicSliders = document.querySelectorAll('.dyn-slider'); 
        this.bgBpm = document.getElementById('bgBpm');
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.animate = this.animate.bind(this);
    }

    resize() {
        this.width = this.canvas.width = window.innerWidth;
        this.height = this.canvas.height = window.innerHeight;
    }

    setupAnalyser(audioElement) {
        if (!audioCtx) initAudioContext();
        this.analyser = audioCtx.createAnalyser();
        this.analyser.fftSize = 1024; 
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        this.timeDomainArray = new Uint8Array(this.analyser.fftSize);
        const source = audioCtx.createMediaElementSource(audioElement);
        source.connect(this.analyser);
        this.analyser.connect(audioCtx.destination);
    }

    calculateRMS(array) {
        let rms = 0;
        for (let i = 0; i < array.length; i++) {
            const val = (array[i] - 128) / 128; 
            rms += val * val;
        }
        return Math.sqrt(rms / array.length);
    }

    getFrequencyEnergy(lowBin, highBin) {
        let energy = 0;
        for (let i = lowBin; i <= highBin; i++) { energy += this.dataArray[i]; }
        return energy / (highBin - lowBin + 1);
    }

    start() { this.active = true; this.animate(); }
    stop() { this.active = false; }

    animate() {
        if (!this.active) return;
        this.time++;

        this.filterCtx.clearRect(0, 0, this.filterCanvas.width, this.filterCanvas.height);
        this.oscCtx.clearRect(0, 0, this.oscCanvas.width, this.oscCanvas.height);
        this.ctx.fillStyle = 'rgba(7, 3, 15, 0.1)'; 
        this.ctx.fillRect(0, 0, this.width, this.height);

        if (this.analyser) {
            this.analyser.getByteFrequencyData(this.dataArray);
            this.analyser.getByteTimeDomainData(this.timeDomainArray);
            
            const rms = this.calculateRMS(this.timeDomainArray);
            this.overallIntensity = rms; 
            
            const lowEnergy = this.getFrequencyEnergy(0, 20); 
            const midEnergy = this.getFrequencyEnergy(21, 60); 
            
            this.dynamicSliders.forEach(slider => {
                const sliderLabel = slider.parentElement.querySelector('span')?.innerText;
                let audioSyncVal;
                
                if (sliderLabel === "Cutoff") {
                    audioSyncVal = (lowEnergy / 255) * 100; 
                    slider.value = slider.value * 0.95 + audioSyncVal * 0.05; 
                } else if (sliderLabel === "Reson") {
                    audioSyncVal = (midEnergy / 255) * 100; 
                    slider.value = slider.value * 0.9 + audioSyncVal * 0.1; 
                } else if (sliderLabel === "Attack" || sliderLabel === "Decay") {
                    audioSyncVal = rms * 100;
                    slider.value = slider.value * 0.8 + audioSyncVal * 0.2; 
                }
            });
            
            this.bgBpm.style.color = `rgba(255, 255, 255, ${0.01 + rms * 0.1})`;
            this.bgBpm.parentElement.querySelector('.bpm-display').style.textShadow = `0 0 ${20 + rms * 50}px rgba(176, 38, 255, 0.4)`;
        }

        this.ctx.beginPath();
        for(let i = 0; i <= this.width; i += 20) {
            let amplitude = 20 + this.overallIntensity * 100; 
            let speed = this.time * 0.01;
            let y = this.height / 2 + Math.sin(i * 0.01 + speed) * amplitude + Math.cos(i * 0.02 - speed) * (amplitude/2);
            if(i === 0) this.ctx.moveTo(i, y);
            else this.ctx.lineTo(i, y);
        }
        this.ctx.strokeStyle = this.analyser ? 'rgba(0, 240, 255, 0.4)' : 'rgba(176, 38, 255, 0.1)';
        this.ctx.lineWidth = 2;
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = this.analyser ? '#00f0ff' : '#b026ff';
        this.ctx.stroke(); this.ctx.shadowBlur = 0;

        if (this.analyser) {
            this.oscCtx.beginPath();
            const sliceWidth = this.oscCanvas.width / this.timeDomainArray.length;
            let x = 0;
            for(let i = 0; i < this.timeDomainArray.length; i++) {
                const v = this.timeDomainArray[i] / 128.0; 
                const y = v * (this.oscCanvas.height / 2.0); 
                if(i === 0) this.oscCtx.moveTo(x, y);
                else this.oscCtx.lineTo(x, y);
                x += sliceWidth;
            }
            this.oscCtx.strokeStyle = '#39ff14'; this.oscCtx.lineWidth = 2; 
            this.oscCtx.shadowBlur = 10; this.oscCtx.shadowColor = '#39ff14';
            this.oscCtx.stroke(); this.oscCtx.shadowBlur = 0;
        }

        if (this.analyser) {
            const barWidth = this.filterCanvas.width / this.eqData.length;
            for(let i=0; i<this.eqData.length; i++) {
                let bin = Math.floor(i * (this.analyser.frequencyBinCount / this.eqData.length));
                let target = this.dataArray[bin] / 255.0 * this.filterCanvas.height;
                this.eqData[i] += (target - this.eqData[i]) * 0.2; 
                
                let gradient = this.filterCtx.createLinearGradient(0, this.filterCanvas.height, 0, 0);
                gradient.addColorStop(0, '#00f0ff'); gradient.addColorStop(1, '#b026ff'); 
                this.filterCtx.fillStyle = gradient;
                this.filterCtx.fillRect(i * barWidth + 2, this.filterCanvas.height - this.eqData[i], barWidth - 4, this.eqData[i]);
            }
        }

        requestAnimationFrame(this.animate);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    analysisManager = new AudioAnalysisManager(
        document.getElementById('trailCanvas'),
        document.getElementById('eqCanvas'),
        document.getElementById('oscCanvas')
    );
    analysisManager.start(); 

    const oscButtons = document.querySelectorAll('#osc-buttons .cyber-btn');
    oscButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            oscButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            playOscillatorTest(btn.getAttribute('data-wave'));
        });
    });

    const lfoButtons = document.querySelectorAll('#lfo-buttons .lfo-btn');
    lfoButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            lfoButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    const bpmRange = document.getElementById('bpmRange');
    const bpmText = document.getElementById('bpmText');
    const bgBpm = document.getElementById('bgBpm');
    bpmRange.addEventListener('input', (e) => { 
        bpmText.innerText = e.target.value + ' BPM'; 
        bgBpm.innerText = e.target.value;
    });

    const generateBtn = document.getElementById('generateBtn');
    generateBtn.addEventListener('click', async () => {
        playSynthesisRiser(); 
        
        generateBtn.innerText = "✨ CHANNELING NEURAL ENERGY... ✨";
        generateBtn.style.background = "linear-gradient(90deg, #1a0b2e, #00f0ff, #1a0b2e)";
        generateBtn.style.pointerEvents = "none";
        generateBtn.style.boxShadow = "0 0 40px rgba(0, 240, 255, 0.5)";
        
        const inputs = document.querySelectorAll('.cyber-input');
        const genre = inputs[0].value || "Shpongle Psytrance";
        const sounds = inputs[1].value || "Bioluminescent pads";
        const structure = inputs[2].value || "Organic swell";
        const bpmRangeVal = document.getElementById('bpmRange').value;
        
        const masterKeywords = "distinct individual instruments, crisp and clear separation, mastered, perfectly balanced EQ, professional studio mix, lossless FLAC quality";
        const finalPrompt = `${genre}, ${sounds}, ${structure}, ${bpmRangeVal} BPM, ${masterKeywords}`;

        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: finalPrompt })
            });

            const data = await response.json();

            if (data.audioUrl) {
                generateBtn.innerText = "🎵 MANDALA AWAKENED 🎵";
                generateBtn.style.background = "linear-gradient(90deg, var(--bio-blue), var(--bio-purple))";

                const ritualAudio = new Audio(data.audioUrl);
                ritualAudio.crossOrigin = "anonymous"; 
                
                analysisManager.setupAnalyser(ritualAudio);

                ritualAudio.onended = () => {
                    analysisManager.analyser = null; 
                    generateBtn.innerText = "✨ AWAKEN THE MANDALA ✨";
                    generateBtn.style.background = ""; 
                    generateBtn.style.pointerEvents = "auto";
                    generateBtn.style.boxShadow = "0 0 30px rgba(176, 38, 255, 0.4)";
                };
                
                ritualAudio.play();

            } else { throw new Error("No audio returned"); }

        } catch (error) {
            console.error("生成出错:", error);
            generateBtn.innerText = "❌ SYNTHESIS FAILED ❌";
            setTimeout(() => {
                generateBtn.innerText = "✨ AWAKEN THE MANDALA ✨";
                generateBtn.style.background = ""; 
                generateBtn.style.pointerEvents = "auto";
            }, 3000);
        }
    });
});
