import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const userPrompt = req.body.prompt;

    try {
        // ==========================================
        // 🔴 核心修改：专为 Stable Audio 定制的“中括号时间戳 + 胶水混音”死命令
        // ==========================================
        const systemPrompt = `You are a master audio engineer. Expand the user's genre and ideas into a highly detailed, 60-word prompt specifically for the Stable Audio AI model.
        CRITICAL RULES YOU MUST FOLLOW:
        1. BRACKET TIMESTAMPS: You MUST use bracketed timestamps to force structure (e.g., "[0:00] atmospheric intro, [0:15] rising build-up, [0:30] massive rhythmic drop").
        2. MIXING GLUE (CRUCIAL): To prevent stem tearing and ensure cohesion, you MUST end the prompt EXACTLY with this phrase: "Mastering grade, cohesive glued mix, heavy mix bus compression, warm analog tape saturation, shared spatial room reverb, elements perfectly blended."
        3. CLEAN BASS: Use "tight punchy bassline" instead of "heavy sub-bass" to avoid distortion.
        Return ONLY the expanded English prompt. No conversational text.`;

        const llmResponse = await replicate.run(
            "meta/meta-llama-3-8b-instruct",
            {
                input: {
                    prompt: `User idea: ${userPrompt}\n\nExpanded Prompt:`,
                    system_prompt: systemPrompt,
                    max_tokens: 150
                }
            }
        );

        const enhancedPrompt = llmResponse.join("").trim();
        res.status(200).json({ optimizedPrompt: enhancedPrompt });
    } catch (error) {
        console.error("LLM Enhance Error:", error.message);
        // 如果大模型报错，这个兜底方案也能保证强制输出胶水混音和时间戳
        const fallbackPrompt = `[0:00] clear intro, [0:15] build-up, [0:30] dynamic drop. ${userPrompt}. tight punchy bassline. Mastering grade, cohesive glued mix, heavy mix bus compression, warm analog tape saturation, shared spatial room reverb, elements perfectly blended.`;
        res.status(200).json({ optimizedPrompt: fallbackPrompt });
    }
}
