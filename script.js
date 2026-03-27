// 简单本地测试音效 (Web Audio API)
let audioCtx;
function playLocalOsc(type) {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(110, audioCtx.currentTime); // 低音A
    gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1);
    osc.connect(gainNode); gainNode.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 1);
}

document.addEventListener('DOMContentLoaded', () => {
    // I. OSCILLATOR 按钮绑定本地音效测试
    const oscButtons = document.querySelectorAll('#osc-buttons .cyber-btn');
    oscButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            oscButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            playLocalOsc(btn.getAttribute('data-wave'));
        });
    });

    // 背景魔法能量流 (基于鼠标小尾巴的变体)
    const canvas = document.getElementById('trailCanvas');
    const ctx = canvas.getContext('2d');
    let width, height;
    function resize() { width = canvas.width = window.innerWidth; height = canvas.height = window.innerHeight; }
    window.addEventListener('resize', resize); resize();

    window.addEventListener('mousemove', (e) => {
        for(let i=0; i<3; i++) {
            const p = {
                x: e.clientX, y: e.clientY,
                vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2 - 1,
                life: 1,
                color: Math.random() > 0.5 ? '#00e5ff' : '#b620e0'
            };
            particles.push(p);
        }
    });

    let particles = [];
    function animateParticles() {
        ctx.clearRect(0, 0, width, height);
        for(let i=particles.length-1; i>=0; i--){
            const p = particles[i];
            p.x += p.vx; p.y += p.vy; p.life -= 0.02;
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.fillStyle = p.color;
            ctx.shadowBlur = 10; ctx.shadowColor = p.color;
            ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI * 2); ctx.fill();
            if(p.life <= 0) particles.splice(i, 1);
        }
        requestAnimationFrame(animateParticles);
    }
    animateParticles();

    // BPM 滑块
    const bpmRange = document.getElementById('bpmRange');
    const bpmText = document.getElementById('bpmText');
    bpmRange.addEventListener('input', (e) => { bpmText.innerText = e.target.value + ' BPM'; });

    // 🔮 生成按钮逻辑
    const generateBtn = document.getElementById('generateBtn');
    const aiSliders = document.querySelectorAll('.ai-slider');

    generateBtn.addEventListener('click', async () => {
        // 视觉效果：按钮变红，滑块跳动
        generateBtn.innerText = "⚡ CONTACTING REPLICATE NEURAL DSP... ⚡";
        generateBtn.style.background = "linear-gradient(90deg, #005f73, #0a9396, #005f73)";
        generateBtn.style.pointerEvents = "none";
        
        // 幽灵手滑动特效
        let modInterval = setInterval(() => {
            aiSliders.forEach(slider => {
                let currentVal = parseInt(slider.value);
                let change = Math.floor(Math.random() * 15) - 7;
                slider.value = Math.max(0, Math.min(100, currentVal + change));
            });
        }, 120);

        // 获取用户输入的咒语 (Prompt)
        const inputs = document.querySelectorAll('.cyber-input');
        const genre = inputs[0].value || "Cyberpunk synthwave";
        const sounds = inputs[1].value || "analog pads, deep bass";
        const structure = inputs[2].value || "building up tension";
        // 加上 BPM
        const bpm = document.getElementById('bpmRange').value;
        
        const finalPrompt = `${genre}, ${sounds}, ${structure}, ${bpm} BPM`;

        try {
            // 向你的 Vercel 后端发送请求
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: finalPrompt })
            });

            const data = await response.json();

            clearInterval(modInterval); // 停止滑块跳动

            if (data.audioUrl) {
                // 生成成功后的视觉
                generateBtn.innerText = "🎵 RITUAL COMPLETE. PLAYING AUDIO 🎵";
                generateBtn.style.background = "linear-gradient(90deg, #b620e0, #00e5ff)";
                
                const audio = new Audio(data.audioUrl);
                audio.play();

                // 音乐播放完毕后按钮复原
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
            
            // 3秒后复原按钮
            setTimeout(() => {
                generateBtn.innerText = "🔮 SYNTHESIZE AUDIO RITUAL 🔮";
                generateBtn.style.background = ""; 
                generateBtn.style.pointerEvents = "auto";
            }, 3000);
        }
    });
});
