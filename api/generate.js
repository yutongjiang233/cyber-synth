import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    try {
        // 这是用户在网页上输入的简短词汇
        const userPrompt = req.body.prompt; 

        // ==========================================
        // 核心魔法 1：召唤 Llama 3 帮你自动扩写“大师级咒语”
        // ==========================================
        const systemPrompt = `You are a master underground electronic music producer. 
        The user will give you simple keywords. Expand them into a highly detailed, 60-word prompt for an AI music generator. 
        MUST include: pacing, dark atmospheric details, specific textures (like 'screaming TB-303', 'extreme filter resonance'), pounding 909 kicks, and a clear timeline structure (e.g. '0:00 ambient intro, 0:15 tense build-up, 0:30 explosive drop'). 
        Return ONLY the expanded English prompt. No conversation, no quotes.`;

        // 调用目前速度最快、最聪明的开源文本模型（1-2秒即可完成，不会超时）
        const llmResponse = await replicate.run(
            "meta/meta-llama-3-8b-instruct",
            {
                input: {
                    prompt: `User keywords: ${userPrompt}\n\nExpanded Prompt:`,
                    system_prompt: systemPrompt,
                    max_tokens: 150,
                    temperature: 0.7
                }
            }
        );

        // Replicate 的文本模型返回的是文字碎片数组，我们需要把它拼成完整的一段话
        const enhancedPrompt = llmResponse.join("").trim();
        
        // （可选）你可以在 Vercel 的 Logs 里看到 AI 帮你写了什么神仙咒语
        console.log("🔥 自动优化的终极咒语: ", enhancedPrompt);

        // ==========================================
        // 核心魔法 2：把“大师级咒语”发给音乐大模型
        // ==========================================
        const prediction = await replicate.predictions.create({
            model: "fishaudio/ace-step-1.5", 
            input: {
                prompt: enhancedPrompt,      // 🔴 这里传入的是刚刚被扩写后的高级提示词！
                lyrics: "[Instrumental]",    
                duration: 60                 // 🔴 强制生成 60 秒，给足做 Build-up 和 Drop 的时间
            }
        });

        // 瞬间返回任务小票给前端
        res.status(201).json(prediction);
    } catch (error) {
        console.error("Generate API Error:", error);
        res.status(500).json({ detail: error.message });
    }
}
