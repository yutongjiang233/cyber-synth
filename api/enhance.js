import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const userPrompt = req.body.prompt;

    try {
      // ==========================================
        // 🔴 核心修改区：加入“母带级 EQ”指令，解决闷和放屁的问题
        // ==========================================
        const systemPrompt = `You are a master audio engineer and music producer. The user will give you a genre and some simple ideas. Expand them into a highly detailed, 60-word prompt for an AI music generator. 
        CRITICAL RULES YOU MUST FOLLOW:
        1. NO REPETITIVE LOOPS: The music must have drastic dynamic changes.
        2. MANDATORY STRUCTURE: Inject exact timestamps for build-ups and drops (e.g., "0:00 intro, 0:15 build, 0:30 drop").
        3. PRISTINE AUDIO QUALITY (CRUCIAL): You MUST include these exact phrases to ensure clear sound: "crystal clear high-end, crisp transients, bright sparkling treble, tight punchy bassline, ultra-clean mix, wide stereo separation". 
        4. AVOID MUDDINESS: Specifically describe the bass as "tight and punchy" NEVER "heavy sub-bass" to avoid distortion.
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
        // 即使 LLM 报错，兜底的模版也带上了强制结构
        const fallbackPrompt = `Mastering grade, high fidelity, professional mix. ${userPrompt}. 0:00 atmospheric intro, 0:15 rising build-up, 0:30 explosive heavy drop, dynamic arrangement, no loops.`;
        res.status(200).json({ optimizedPrompt: fallbackPrompt });
    }
}
