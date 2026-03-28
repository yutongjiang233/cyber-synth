import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const userPrompt = req.body.prompt;
    // 🔴 接收前端旋钮传来的 BPM，如果没有传，默认给 120
    const userBpm = req.body.bpm || "120"; 

    try {
        const systemPrompt = `You are a master audio engineer and AI music prompt expert. Expand the user's input into a highly detailed, 60-word prompt for the Stable Audio 2.5 AI model.
        CRITICAL RULES YOU MUST FOLLOW:
        1. MANDATORY BPM (CRUCIAL): You MUST explicitly start the prompt with exactly "${userBpm} BPM". This is non-negotiable.
        2. BRACKET TIMESTAMPS: Use bracketed timestamps (e.g., "[0:00] [Intro]", "[0:30] [Drop]").
        3. MIXING GLUE: End the prompt EXACTLY with: "Mastering grade, FLAC quality, cohesive glued mix, heavy mix bus compression, pristine transients."
        4. SMART SOUND DICTIONARY: Automatically detect genre and inject viral AI music keywords (e.g., "euphoric supersaw drops", "dusty SP-1200", "taiko hits").
        Return ONLY the expanded English prompt. No conversational text.`;

        const llmResponse = await replicate.run(
            "meta/meta-llama-3-8b-instruct",
            {
                input: {
                    // 🔴 把 BPM 强制贴在用户输入的开头喂给大模型
                    prompt: `TEMPO IS EXACTLY ${userBpm} BPM. User input: ${userPrompt}\n\nExpanded Prompt:`,
                    system_prompt: systemPrompt,
                    max_tokens: 180
                }
            }
        );

        const enhancedPrompt = llmResponse.join("").trim();
        res.status(200).json({ optimizedPrompt: enhancedPrompt });
    } catch (error) {
        console.error("LLM Enhance Error:", error.message);
        // 兜底方案也焊死 BPM
        const fallbackPrompt = `${userBpm} BPM, [0:00] [Intro], [0:30] [Drop]. ${userPrompt}. Mastering grade, FLAC quality, cohesive glued mix, heavy mix bus compression.`;
        res.status(200).json({ optimizedPrompt: fallbackPrompt });
    }
}
