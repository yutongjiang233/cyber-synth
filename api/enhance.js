import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const userPrompt = req.body.prompt;

    try {
        // 告诉大模型它的身份：全能音乐制作人
        const systemPrompt = `You are a master music producer. The user will give you a genre and some simple ideas. Expand them into a highly detailed, 50-word prompt for an AI music generator. 
        MUST include: professional mixing terms (mastering grade, high fidelity), specific instrument textures fitting the requested genre, and a clear timeline structure (e.g., 0:00 intro, 0:30 drop). 
        Return ONLY the expanded English prompt. No conversational text.`;

        // 请求 Llama 3 进行曲风定制扩写
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
        
        // 成功生成定制词，返回给前端
        res.status(200).json({ optimizedPrompt: enhancedPrompt });
    } catch (error) {
        // 🔴 降级保护：如果 LLM 意外超时或报错，不要崩溃！直接用通用高音质模版拼接。
        console.error("LLM Enhance Error:", error.message);
        const fallbackPrompt = `Mastering grade, high fidelity, professional mix. ${userPrompt}. Dynamic arrangement, rich textures, wide stereo image, perfectly EQed.`;
        res.status(200).json({ optimizedPrompt: fallbackPrompt });
    }
}