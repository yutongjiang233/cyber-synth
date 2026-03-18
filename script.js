let audioCtx;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function playOscillator(type) {
    initAudio();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(110, audioCtx.currentTime); 
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.05); 
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 1); 
}

function playSynthesisRiser() {
    initAudio();
    const osc = audioCtx.createOscillator();
    const filter = audioCtx.createBiquadFilter();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(40, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 2.8);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(100, audioCtx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(5000, audioCtx.currentTime + 2.8);
    filter.Q.value = 10;
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.5);
    gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 3);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 3.1);
}

document.addEventListener('DOMContentLoaded', () => {
    const oscButtons = document.querySelectorAll('#osc-buttons .cyber-btn');
    oscButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            oscButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const waveType = btn.getAttribute('data-wave');
            playOscillator(waveType);
        });
    });

    // 鼠标小尾巴
    const canvas = document.getElementById('trailCanvas');
    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];
    let mouse = { x: -100, y: -100 };

    function resize() { 
        width = canvas.width = window.innerWidth; 
        height = canvas.height = window.innerHeight; 
    }
    window.addEventListener('resize', resize);
    resize();

    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX; mouse.y = e.clientY;
        for(let i=0; i<3; i++) { particles.push(new Particle(mouse.x, mouse.y)); }
    });

    class Particle {
        constructor(x, y) {
            this.x = x + (Math.random() - 0.5) * 15;
            this.y = y + (Math.random() - 0.5) * 15;
            this.vx = (Math.random() - 0.5) * 1.5;
            this.vy = (Math.random() - 0.5) * 1.5 - 0.5;
            this.life = 1;
            this.color = Math.random() > 0.5 ? '#00e5ff' : '#b620e0';
            this.size = Math.random() * 2.5 + 1;
        }
        update() { this.x += this.vx; this.y += this.vy; this.life -= 0.02; }
        draw() {
            ctx.globalAlpha = Math.max(0, this.life);
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 15; ctx.shadowColor = this.color;
            ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill(); ctx.shadowBlur = 0; 
        }
    }
    
    function animateTrail() {
        ctx.clearRect(0, 0, width, height);
        for (let i = particles.length - 1; i >= 0; i--) {
            particles[i].update(); particles[i].draw();
            if (particles[i].life <= 0) { particles.splice(i, 1); }
        }
        requestAnimationFrame(animateTrail);
    }
    animateTrail();

    // BPM 和 生成逻辑
    const bpmRange = document.getElementById('bpmRange');
    const bpmText = document.getElementById('bpmText');
    bpmRange.addEventListener('input', (e) => { bpmText.innerText = e.target.value + ' BPM'; });

    const generateBtn = document.getElementById('generateBtn');
    const aiSliders = document.querySelectorAll('.ai-slider');

    generateBtn.addEventListener('click', async () => {
        playSynthesisRiser(); 
        generateBtn.innerText = "⚡ CONTACTING REPLICATE NEURAL DSP... ⚡";
        generateBtn.style.background = "linear-gradient(90deg, #005f73, #0a9396, #005f73)";
        generateBtn.style.pointerEvents = "none";
        
        let modInterval = setInterval(() => {
            aiSliders.forEach(slider => {
                let currentVal = parseInt(slider.value);
                let change = Math.floor(Math.random() * 15) - 7;
                slider.value = Math.max(0, Math.min(100, currentVal + change));
            });
        }, 120);

        const inputs = document.querySelectorAll('.cyber-input');
        const genre = inputs[0].value || "Cyberpunk synthwave";
        const sounds = inputs[1].value || "analog pads, deep bass";
        const structure = inputs[2].value || "building up tension";
        const bpm = document.getElementById('bpmRange').value;
        const finalPrompt = `${genre}, ${sounds}, ${structure}, ${bpm} BPM`;

        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: finalPrompt })
            });

            const data = await response.json();
            clearInterval(modInterval); 

            const actualAudioUrl = Array.isArray(data.audioUrl) ? data.audioUrl[0] : data.audioUrl;

            if (actualAudioUrl) {
                generateBtn.innerText = "🎵 RITUAL COMPLETE. PLAYING AUDIO 🎵";
                generateBtn.style.background = "linear-gradient(90deg, #b620e0, #00e5ff)";
                
                const audio = new Audio(actualAudioUrl);
                audio.play();

                audio.onended = () => {
                    generateBtn.innerText = "🔮 SYNTHESIZE AUDIO RITUAL 🔮";
                    generateBtn.style.background = ""; 
                    generateBtn.style.pointerEvents = "auto";
                };
            } else {
                throw new Error("No audio returned");
            }
        } catch (error) {
            console.error("生成出错:", error);
            clearInterval(modInterval);
            generateBtn.innerText = "❌ SYNTHESIS FAILED ❌";
            
            setTimeout(() => {
                generateBtn.innerText = "🔮 SYNTHESIZE AUDIO RITUAL 🔮";
                generateBtn.style.background = ""; 
                generateBtn.style.pointerEvents = "auto";
            }, 3000);
        }
    });
});