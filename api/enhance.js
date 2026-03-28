import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// 🔴 进阶消杀层：新增了 "looping, repetitive, monotonous, static" (循环、重复、单调、静态)，从物理层面绞杀复读机行为
const NEGATIVE_PROMPT = "looping, repetitive, monotonous, static, dialogue, speaking, vocals, singing, choir, lyrics, hiss, noise, high-frequency artifacts, harsh treble, clipping, muddy bass, worst quality, low quality, poorly made, robotic, MIDI, blurry, muffled, mono, phase issues";

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const userPrompt = req.body.prompt;
    const userBpm = req.body.bpm || "120"; 

    try {
        const systemPrompt = `You are an elite audio engineer and AI music prompt expert. Expand the user's input into a highly detailed, professional prompt for Stable Audio 2.5.

CRITICAL RULES YOU MUST FOLLOW:

1. MANDATORY BPM (CRUCIAL): You MUST start the prompt EXACTLY with "${userBpm} BPM |". Do not change or invent this number.

2. STRICT SYNTAX & ORDER: Use this exact sequential pipe-separated format:
   "${userBpm} BPM | Key: [Pick a suitable musical key] | Era: [Pick a decade/era] | Genre: [2-3 detailed sub-genres] | Instruments: [Specific gear & playing styles] | Mood: [3-4 high-order emotional terms] | Structure: [e.g., Intro -> Build-up -> Drop -> Fade] | Mix: [Production quality]"

3. SMART SOUND DICTIONARY:
   - Enhance the user's instruments with professional studio terms (e.g., "tight punchy bass", "warm analog synths", "syncopated live drums").
   - NEVER use "heavy sub-bass" to prevent distortion.

4. FORMAT OVERRIDE: 
   - If the user explicitly asks for a solo instrument, start the Instruments section with "Solo [Instrument]" and enforce "beatless, zero percussion".

5. HIGH-FIDELITY MIXING GLUE: End the "Mix:" section EXACTLY with:
   "44.1k high fidelity, pristine studio recording, Dolby Atmos, wide stereo separation, cohesive glued mix, heavy mix bus compression, pristine transients, zero muddiness."

6. 🔴 ANTI-LOOPING PROTOCOL (ABSOLUTE PRIORITY): 
   AI models are lazy and tend to create boring, repetitive loops. You MUST force the music to be dynamic.
   - Inside the "Structure:" or "Instruments:" section of EVERY prompt, you MUST inject at least two of these anti-looping commands: "through-composed, constantly evolving, shifting dynamics, unpredictable phrasing, continuous generative variation, complex ghost notes".
   - NEVER use words like "loop, repetitive, ostinato, static, monotonous".

Return ONLY the expanded English prompt string. Do not include conversational text, quotes, or JSON formatting.`;

        const llmResponse = await replicate.run(
            "meta/meta-llama-3-8b-instruct",
            {
                input: {
                    prompt: `User input: ${userPrompt}\n\nExpanded Prompt:`,
                    system_prompt: systemPrompt,
                    max_tokens: 200
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
        
        // 兜底策略也加上了反循环神词
        const fallbackPrompt = `${userBpm} BPM | Key: A Minor | Era: Modern | Genre: Cinematic Electronic | Instruments: modern synthesis, tight punchy bass, constantly evolving drums | Mood: Epic, expressive | Structure: Intro -> evolving build -> unpredictable drop -> Outro, through-composed | Mix: 44.1k high fidelity, pristine studio recording, Dolby Atmos, cohesive glued mix.`;
        
        res.status(200).json({ 
            optimizedPrompt: fallbackPrompt,
            negativePrompt: NEGATIVE_PROMPT
        });
    }
}
