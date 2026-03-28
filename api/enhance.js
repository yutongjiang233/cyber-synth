import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// 🔴 进阶消杀层：除了人声，增加了对相位问题(phase issues)、爆音(clipping)和低频浑浊(muddy bass)的消杀
const NEGATIVE_PROMPT = "dialogue, speaking, vocals, singing, choir, lyrics, hiss, noise, high-frequency artifacts, harsh treble, clipping, muddy bass, worst quality, low quality, poorly made, robotic, MIDI, blurry, muffled, mono, phase issues";

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const userPrompt = req.body.prompt;
    // 🔴 关键修复：找回前端的物理旋钮 BPM 数据，默认 120
    const userBpm = req.body.bpm || "120"; 

    try {
        // ==========================================
        // 🔴 终极大满配：融合了 Era(年代)、Key(调性)、智能字典与结构流
        // 彻底榨干 Stable Audio 2.5 的模型潜力
        // ==========================================
        const systemPrompt = `You are an elite audio engineer and AI music prompt expert. Expand the user's input into a highly detailed, professional prompt for Stable Audio 2.5.

CRITICAL RULES YOU MUST FOLLOW:

1. MANDATORY BPM (CRUCIAL): You MUST start the prompt EXACTLY with "${userBpm} BPM |". Do not change or invent this number.

2. STRICT SYNTAX & ORDER: Use this exact sequential pipe-separated format:
   "${userBpm} BPM | Key: [Pick a suitable musical key, e.g., C Minor, F# Major] | Era: [Pick a decade/era, e.g., Modern, 1980s, Vintage 70s] | Genre: [2-3 detailed sub-genres] | Instruments: [Specific gear & playing styles] | Mood: [3-4 high-order emotional terms] | Structure: [e.g., Intro -> Build-up -> Drop -> Fade] | Mix: [Production quality]"

3. SMART SOUND DICTIONARY (UPGRADE USER INPUTS):
   - If Lofi/Chillhop: Use "dusty SP-1200", "warped detuned Rhodes piano", "vinyl crackle".
   - If EDM/House: Use "euphoric supersaw leads", "hypnotic rolling bassline", "punchy 909 kick".
   - If Cinematic: Use "Hans Zimmer style brass swells", "epic staccato strings", "booming taiko".
   - If Bossa/Jazz: Use "syncopated nylon-string guitar", "brushed snare with human swing", "upright bass".
   - BASS RULE: Always use "tight punchy bass" or "deep analog bass". Never use "heavy sub-bass" to prevent distortion.

4. FORMAT OVERRIDE: 
   - If the user explicitly asks for a solo instrument, start the Instruments section with "Solo [Instrument]" and enforce "beatless, zero percussion".

5. HIGH-FIDELITY MIXING GLUE: End the "Mix:" section EXACTLY with:
   "44.1k high fidelity, pristine studio recording, Dolby Atmos, wide stereo separation, cohesive glued mix, heavy mix bus compression, pristine transients, zero muddiness."

Return ONLY the expanded English prompt string. Do not include conversational text, quotes, or JSON formatting.`;

        const llmResponse = await replicate.run(
            "meta/meta-llama-3-8b-instruct",
            {
                input: {
                    prompt: `User input: ${userPrompt}\n\nExpanded Prompt:`,
                    system_prompt: systemPrompt,
                    max_tokens: 180
                }
            }
        );

        let enhancedPrompt = llmResponse.join("").trim();
        
        // 清理大模型可能带上的多余双引号
        if (enhancedPrompt.startsWith('"') && enhancedPrompt.endsWith('"')) {
            enhancedPrompt = enhancedPrompt.slice(1, -1);
        }

        res.status(200).json({ 
            optimizedPrompt: enhancedPrompt,
            negativePrompt: NEGATIVE_PROMPT
        });
        
    } catch (error) {
        console.error("LLM Enhance Error:", error.message);
        
        // 🔴 兜底策略也必须遵循最新的管道流和物理 BPM
        const fallbackPrompt = `${userBpm} BPM | Key: A Minor | Era: Modern | Genre: Pop, Cinematic | Instruments: modern synthesis, tight punchy bass | Mood: Epic, expressive | Structure: Intro -> Build -> Drop -> Outro | Mix: 44.1k high fidelity, pristine studio recording, Dolby Atmos, cohesive glued mix, heavy mix bus compression.`;
        
        res.status(200).json({ 
            optimizedPrompt: fallbackPrompt,
            negativePrompt: NEGATIVE_PROMPT
        });
    }
}
