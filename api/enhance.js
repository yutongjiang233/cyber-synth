import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const userPrompt = req.body.prompt;

    try {
        // ==========================================
        // 🔴 核心修改：赋予 AI “流派感知”能力，动态决定是否有律动
        // ==========================================
        const systemPrompt = `You are a master audio engineer and musicologist. Expand the user's input into a highly detailed, 60-word prompt for the Stable Audio AI model.
        CRITICAL RULES YOU MUST FOLLOW:
        1. BRACKET TIMESTAMPS: Use bracketed timestamps to force structure (e.g., "[0:00] intro, [0:30] drop/change").
        2. MIXING GLUE: End the prompt EXACTLY with: "Mastering grade, cohesive glued mix, heavy mix bus compression, warm analog tape saturation, elements perfectly blended."
        3. GENRE-AWARE RHYTHM (CRUCIAL): Analyze the requested genre. 
           - IF it is a rhythm-driven genre (like Bossa Nova, House, Jazz, Hip-Hop): You MUST explicitly emphasize its signature rhythmic pattern (e.g., "authentic Bossa Nova clave", "driving groove", "sharp drum transients").
           - IF it is a beatless genre (like Ambient, Drone, Cinematic): You MUST explicitly enforce "beatless, floating, zero percussion, no drums".
        Return ONLY the expanded English prompt. No conversational text.`;

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

        const enhancedPrompt = llmResponse.join("").trim();
        res.status(200).json({ optimizedPrompt: enhancedPrompt });
    } catch (error) {
        console.error("LLM Enhance Error:", error.message);
        const fallbackPrompt = `[0:00] intro, [0:30] genre-specific elements enter. ${userPrompt}. clear mix. Mastering grade, cohesive glued mix, heavy mix bus compression, warm analog tape saturation, elements perfectly blended.`;
        res.status(200).json({ optimizedPrompt: fallbackPrompt });
    }
}
