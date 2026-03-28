import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// 🔴 新增：硬编码的消杀层负向提示词
const NEGATIVE_PROMPT = "dialogue, speaking, vocals, singing, choir, lyrics, hiss, high-frequency artifacts, harsh treble, worst quality, low quality, poorly made, robotic, MIDI, blurry, muffled";

export default async function handler(req, res) {
    if (req.method!== 'POST') return res.status(405).send('Method Not Allowed');

    const userPrompt = req.body.prompt;

    try {
        // ==========================================
        // 🔴 核心修改：针对 Stable Audio 2.5 的全新增强规则
        // 移除了时间戳，强制使用管道符(|)和精确的BPM数值
        // ==========================================
        const systemPrompt = `You are a master audio engineer and musicologist. Your task is to expand the user's short input into a highly detailed, expert-level prompt for the Stable Audio 2.5 AI model.

CRITICAL RULES YOU MUST FOLLOW:

1. STRICT SYNTAX & ORDER (CRUCIAL): You MUST structure the prompt EXACTLY in this sequential order, separated by pipes (|). Do NOT use bracketed timestamps:
   "Format: | Genre: | Instruments: | Mood: [High-order emotional terms] | [Numerical] BPM | [Production Quality]"

2. FORMAT OVERRIDE: 
   - If the user asks for a single instrument, stem, sound effect, or isolated track, you MUST start with "Format: Solo" to strip background elements.
   - For all other full songs, default to "Format: Band" or "Format: Orchestra".

3. GENRE-AWARE RHYTHM & BPM:
   - You MUST specify an exact numerical BPM appropriate for the genre (e.g., "125 BPM" for House, "70 BPM" for Slowcore).
   - IF rhythm-driven (House, Jazz, Hip-Hop): Explicitly emphasize signature patterns (e.g., "syncopated rhythm", "polyrhythmic groove", "driving four-on-the-floor").
   - IF beatless (Ambient, Cinematic, Drone): You MUST explicitly enforce "beatless, floating, zero percussion, no drums".

4. HIGH-FIDELITY MIXING GLUE: End the prompt EXACTLY with these acoustic modifiers to guarantee 3D sound and eliminate algorithmic artifacts:
   "44.1k high fidelity, pristine studio recording, Dolby Atmos, Wall of Sound, mastering grade, cohesive glued mix, heavy mix bus compression, warm analog tape saturation."

Return ONLY the expanded English prompt string. Do not include conversational text, quotes, or JSON formatting.`;

        const llmResponse = await replicate.run(
            "meta/meta-llama-3-8b-instruct",
            {
                input: {
                    prompt: `User input: ${userPrompt}\n\nExpanded Prompt:`,
                    system_prompt: systemPrompt,
                    max_tokens: 150
                }
            }
        );

        let enhancedPrompt = llmResponse.join("").trim();
        
        // 清理大模型可能带上的多余双引号
        if (enhancedPrompt.startsWith('"') && enhancedPrompt.endsWith('"')) {
            enhancedPrompt = enhancedPrompt.slice(1, -1);
        }

        // 🔴 修改返回值：同时返回正向提示词和负向提示词，供你发给 Stable Audio
        res.status(200).json({ 
            optimizedPrompt: enhancedPrompt,
            negativePrompt: NEGATIVE_PROMPT
        });
        
    } catch (error) {
        console.error("LLM Enhance Error:", error.message);
        
        // 🔴 更新兜底策略（Fallback）：遵循 Stable Audio 2.5 的管道符格式
        const fallbackPrompt = `Format: Band | Genre: Pop, Cinematic | Instruments: modern synthesis, deep bass | Mood: Epic, expressive | 120 BPM | 44.1k high fidelity, pristine studio recording, Dolby Atmos, Wall of Sound, mastering grade.`;
        
        res.status(200).json({ 
            optimizedPrompt: fallbackPrompt,
            negativePrompt: NEGATIVE_PROMPT
        });
    }
}
