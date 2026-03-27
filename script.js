let audioCtx;
let analysisManager; // 全局分析管理器

// 初始化 AudioContext 的标准函数
function initAudioContext() {
    if (!audioCtx) { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    if (audioCtx.state === 'suspended') { audioCtx.resume(); }
}

// 振荡器测试音效函数（保持不变）
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

// 生成时的充能音效函数（保持不变）
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

// 史诗级混音视觉动画管理类：魔法粒子流与真实音频同步
class AudioAnalysisManager {
    constructor(canvas, filterCanvas, oscCanvas) {
        this.canvas = canvas; this.ctx = canvas.getContext('2d');
        this.filterCanvas = filterCanvas; this.filterCtx = filterCanvas.getContext('2d');
        this.oscCanvas = oscCanvas; this.oscCtx = oscCanvas.getContext('2d');
        
        this.analyser = null;
        this.dataArray = null; // 用于频域数据
        this.timeDomainArray = null; // 用于时域波形数据
        this.active = false;
        this.time = 0;
        this.overallIntensity = 0; // 缓存整体响度 (RMS)，用于参数滑块同步
        
        this.eqData = new Array(20).fill(0); // 缓存EQ柱子高度，用于平滑过渡
        
        // 获取所有动态滑块，用于稍后同步
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

    // 🌟 关键魔术：将音频元素连接到分析器
    setupAnalyser(audioElement) {
        if (!audioCtx) initAudioContext();
        
        this.analyser = audioCtx.createAnalyser();
        this.analyser.fftSize = 1024; // 频域数据的分辨率
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        this.timeDomainArray = new Uint8Array(this.analyser.fftSize);
        
        // 创建音频源节点
        const source = audioCtx.createMediaElementSource(audioElement);
        // 连接：源 -> 分析器 -> 扬声器 (这样才能分析数据并且依然发声)
        source.connect(this.analyser);
        this.analyser.connect(audioCtx.destination);
    }

    // 计算整体响度 (RMS - Root Mean Square)
    calculateRMS(array) {
        let rms = 0;
        for (let i = 0; i < array.length; i++) {
            const val = (array[i] - 128) / 128; // 将 0-255 映射到 -1 到 1
            rms += val * val;
        }
        rms = Math.sqrt(rms / array.length);
        return rms;
    }

    // 计算特定频段的能量 (比如低音段：0-200Hz)
    getFrequencyEnergy(lowBin, highBin) {
        let energy = 0;
        for (let i = lowBin; i <= highBin; i++) { energy += this.dataArray[i]; }
        return energy / (highBin - lowBin + 1);
    }

    // 启动动画循环
    start() { this.active = true; this.animate(); }
    // 停止动画循环
    stop() { this.active = false; }

    animate() {
        if (!this.active) return;
        this.time++;

        // 默认背景和画布清除
        this.filterCtx.clearRect(0, 0, this.filterCanvas.width, this.filterCanvas.height);
        this.oscCtx.clearRect(0, 0, this.oscCanvas.width, this.oscCanvas.height);
        this.ctx.fillStyle = 'rgba(5, 5, 5, 0.1)'; // 深色背景，幽灵般拖影
        this.ctx.fillRect(0, 0, this.width, this.height);

        let rmsMultiplier = 1; // 响度系数，用于控制动画强度

        // 如果分析器已就绪，则获取真实音频数据
        if (this.analyser) {
            this.analyser.getByteFrequencyData(this.dataArray);
            this.analyser.getByteTimeDomainData(this.timeDomainArray);
            
            // 计算整体响度 (0 to 1 range)
            const rms = this.calculateRMS(this.timeDomainArray);
            this.overallIntensity = rms; // 缓存响度
            rmsMultiplier = rms * 2 + 1; // 增强系数
            
            // --- 真正的动态参数同步：让滑块也脉动起来！ ---
            // 根据不同的参数，同步不同的频段能量
            const lowEnergy = this.getFrequencyEnergy(0, 20); // 极低音 (kick)
            const midEnergy = this.getFrequencyEnergy(21, 60); // 中音 (synth, chords)
            
            this.dynamicSliders.forEach(slider => {
                const sliderLabel = slider.parentElement.querySelector('span')?.innerText;
                let audioSyncVal;
                
                // 真正的参数映射逻辑：
                if (sliderLabel === "Cutoff") {
                    // Cutoff 随着低音能量浮动
                    audioSyncVal = lowEnergy;
                    audioSyncVal = (audioSyncVal / 255) * 100; // 映射到 0-100
                    audioSyncVal = slider.value * 0.95 + audioSyncVal * 0.05; // 平滑过渡
                    slider.value = audioSyncVal; 
                } else if (sliderLabel === "Resonance") {
                    // Resonance 随着中音能量浮动
                    audioSyncVal = midEnergy;
                    audioSyncVal = (audioSyncVal / 255) * 100; 
                    audioSyncVal = slider.value * 0.9 + audioSyncVal * 0.1; // 平滑过渡
                    slider.value = audioSyncVal;
                } else if (sliderLabel === "Attack" || sliderLabel === "Decay") {
                    // 包络滑块：随着整体响度脉动
                    audioSyncVal = rms * 100;
                    audioSyncVal = slider.value * 0.8 + audioSyncVal * 0.2; // 响度反应快一些
                    slider.value = audioSyncVal;
                }
            });
            
            // BPM显示脉动效果
            this.bgBpm.style.color = `rgba(255, 255, 255, ${0.01 + rms * 0.1})`;
            this.bgBpm.parentElement.querySelector('.bpm-display').style.textShadow = `0 0 ${20 + rms * 50}px rgba(255,255,255,0.2)`;
            
        }

        // --- 全屏魔法粒子流背景：根据响度脉动 ---
        this.ctx.beginPath();
        for(let i = 0; i <= this.width; i += 20) {
            let amplitude = 20 + this.overallIntensity * 100; // 根据真实响度脉动
            let speed = this.time * 0.01;
            let y = this.height / 2 + Math.sin(i * 0.01 + speed) * amplitude + Math.cos(i * 0.02 - speed) * (amplitude/2);
            if(i === 0) this.ctx.moveTo(i, y);
            else this.ctx.lineTo(i, y);
        }
        // 根据是否在播放，改变颜色
        this.ctx.strokeStyle = this.analyser ? 'rgba(182, 32, 224, 0.5)' : 'rgba(139, 0, 0, 0.05)';
        this.ctx.lineWidth = 1;
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = this.analyser ? '#b620e0' : '#8b0000';
        this.ctx.stroke(); this.ctx.shadowBlur = 0;

        // --- 真正的动态波形图 (OSC Canvas)：根据时域数据绘制 ---
        if (this.analyser) {
            this.oscCtx.beginPath();
            const sliceWidth = this.oscCanvas.width / this.timeDomainArray.length;
            let x = 0;
            for(let i = 0; i < this.timeDomainArray.length; i++) {
                const v = this.timeDomainArray[i] / 128.0; // 0-2 range
                const y = v * (this.oscCanvas.height / 2.0); // 映射到画布高度
                if(i === 0) this.oscCtx.moveTo(x, y);
                else this.oscCtx.lineTo(x, y);
                x += sliceWidth;
            }
            this.oscCtx.strokeStyle = '#b620e0'; this.oscCtx.lineWidth = 2; // 紫色波形
            this.oscCtx.shadowBlur = 10; this.oscCtx.shadowColor = '#b620e0';
            this.oscCtx.stroke(); this.oscCtx.shadowBlur = 0;
        } else {
            // 默认一条直线
            this.oscCtx.beginPath();
            this.oscCtx.moveTo(0, oscCanvas.height/2); this.oscCtx.lineTo(oscCanvas.width, oscCanvas.height/2);
            this.oscCtx.strokeStyle = '#2e2e2e'; this.oscCtx.lineWidth = 1; this.oscCtx.stroke();
        }

        // --- 真正的动态 EQ 频谱图 (Filter Canvas)：根据频域数据绘制 ---
        if (this.analyser) {
            const barWidth = this.filterCanvas.width / this.eqData.length;
            for(let i=0; i<this.eqData.length; i++) {
                // 计算当前柱子的能量
                let bin = Math.floor(i * (this.analyser.frequencyBinCount / this.eqData.length));
                let target = this.dataArray[bin] / 255.0 * this.filterCanvas.height;
                this.eqData[i] += (target - this.eqData[i]) * 0.2; // 平滑过渡
                
                let gradient = this.filterCtx.createLinearGradient(0, this.filterCanvas.height, 0, 0);
                gradient.addColorStop(0, '#8b0000'); gradient.addColorStop(1, '#cf6214'); // 血红到橘
                this.filterCtx.fillStyle = gradient;
                this.filterCtx.fillRect(i * barWidth + 2, this.filterCanvas.height - this.eqData[i], barWidth - 4, this.eqData[i]);
            }
        }

        requestAnimationFrame(this.animate);
    }
}

// 网页加载完毕后的初始化逻辑
document.addEventListener('DOMContentLoaded', () => {
    // 初始化视觉管理器
    analysisManager = new AudioAnalysisManager(
        document.getElementById('trailCanvas'),
        document.getElementById('eqCanvas'),
        document.getElementById('oscCanvas')
    );
    analysisManager.start(); // 默认开启背景粒子动画

    // I. OSCILLATOR 按钮测试音效（已修复ID）
    const oscButtons = document.querySelectorAll('#osc-buttons .cyber-btn');
    oscButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            oscButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            playOscillatorTest(btn.getAttribute('data-wave'));
        });
    });

    // IV. LFO 按钮（已修复ID，添加点亮逻辑）
    const lfoButtons = document.querySelectorAll('#lfo-buttons .lfo-btn');
    lfoButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            lfoButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active'); // 添加 active class 点亮按钮
        });
    });

    // BPM 和 Tempo 滑块（已修复ID）
    const bpmRange = document.getElementById('bpmRange');
    const bpmText = document.getElementById('bpmText');
    const bgBpm = document.getElementById('bgBpm');
    bpmRange.addEventListener('input', (e) => { 
        bpmText.innerText = e.target.value + ' BPM'; 
        bgBpm.innerText = e.target.value;
    });

    // --- 核心逻辑：点击生成按钮 ---
    const generateBtn = document.getElementById('generateBtn');
    generateBtn.addEventListener('click', async () => {
        playSynthesisRiser(); // 播放本地充能音效测试
        
        // --- 视觉效果大升级：视觉同步引擎上线 ---
        generateBtn.innerText = "⚡ CONTACTING REPLICATE NEURAL DSP... ⚡";
        generateBtn.style.background = "linear-gradient(180deg, #101010, #cf6214)";
        generateBtn.style.pointerEvents = "none";
        generateBtn.style.boxShadow = "0 0 25px rgba(207, 98, 20, 0.5)";
        
        // --- 获取前端输入的咒语 (Prompt) ---
        // 我们需要把几个输入框的内容整合，并且加上音质增强关键词
        const inputs = document.querySelectorAll('.cyber-input');
        const genre = inputs[0].value || "Electronic";
        const sounds = inputs[1].value || "synth";
        const structure = inputs[2].value || "ambient";
        // 还要从 Tempo 滑块获取最新的 BPM
        const bpmRangeVal = document.getElementById('bpmRange').value;
        
        // 🔮 母带级音质增强外挂：用专业词汇强制AI做到：轨道分离、清晰、无浑浊感
        const masterKeywords = "distinct individual instruments, crisp and clear separation, mastered, perfectly balanced EQ, professional studio mix, lossless FLAC quality";
        const finalPrompt = `${genre}, ${sounds}, ${structure}, ${bpmRangeVal} BPM, ${masterKeywords}`;

        try {
            // 向你的 Vercel 后端发送请求
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: finalPrompt })
            });

            const data = await response.json();

            if (data.audioUrl) {
                // 生成成功后的视觉
                generateBtn.innerText = "🎵 RITUAL COMPLETE. CONNECTING ENGINE... 🎵";
                generateBtn.style.background = "linear-gradient(180deg, var(--distressed-orange), var(--blood-red))";

                // 创建一个 HTML5 Audio 元素，重要：开启跨域分析
                const ritualAudio = new Audio(data.audioUrl);
                ritualAudio.crossOrigin = "anonymous"; 
                
                // --- 魔法降临：将音频连接到赛博分析引擎 ---
                analysisManager.setupAnalyser(ritualAudio);

                // 播放完毕后的清理逻辑
                ritualAudio.onended = () => {
                    analysisManager.analyser = null; // 关闭分析器连接
                    generateBtn.innerText = "🔮 SYNTHESIZE AUDIO RITUAL 🔮";
                    generateBtn.style.background = ""; 
                    generateBtn.style.pointerEvents = "auto";
                    generateBtn.style.boxShadow = "0 0 25px rgba(139, 0, 0, 0.5)";
                };
                
                // --- 终极时刻：开始播放，真正的同步动画弹出来！ ---
                ritualAudio.play();

            } else { throw new Error("No audio returned"); }

        } catch (error) {
            console.error(error);
            generateBtn.innerText = "❌ SYNTHESIS FAILED ❌";
            setTimeout(() => {
                generateBtn.innerText = "🔮 SYNTHESIZE AUDIO RITUAL 🔮";
                generateBtn.style.background = ""; 
                generateBtn.style.pointerEvents = "auto";
            }, 3000);
        }
    });
});
