import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const userPrompt = req.body.prompt;

    try {
        // ==========================================
        // 🔴 核心修改区：给 LLM 下达严苛的“底层死命令”
        // ==========================================
        const systemPrompt = `You are a master music producer. The user will give you a genre and some simple ideas. Expand them into a highly detailed, 60-word prompt for an AI music generator. 
        CRITICAL RULES YOU MUST FOLLOW:
        1. NO REPETITIVE LOOPS: The music must have drastic dynamic changes. It cannot be a flat 8-bar loop.
        2. MANDATORY 60-SECOND STRUCTURE: You MUST inject exact timestamps forcing a build-up and a drop. For example: "0:00 atmospheric intro, 0:15 rising tension build-up, 0:30 massive explosive drop with heavy bass, 0:45 rhythmic variation".
        3. HIGH CONTRAST: Ensure there is a clear difference in energy before and after the 0:30 drop.
        Include professional mixing terms. Return ONLY the expanded English prompt. No conversational text.`;

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
        // 即使 LLM 报错，兜底的模版也带上了强制结构
        const fallbackPrompt = `Mastering grade, high fidelity, professional mix. ${userPrompt}. 0:00 atmospheric intro, 0:15 rising build-up, 0:30 explosive heavy drop, dynamic arrangement, no loops.`;
        res.status(200).json({ optimizedPrompt: fallbackPrompt });
    }
}
