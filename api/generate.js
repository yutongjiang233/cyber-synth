import Replicate from "replicate";

// 护盾：允许 Vercel 运行最多 60 秒
export const maxDuration = 60; 

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN, 
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { prompt } = req.body;
    
    // 🛡️ 终极“傻瓜式”融合外挂：将用户的输入包裹在强制性的系统指令中
    const enhancedPrompt = `A cohesive, professionally mastered musical composition. 
    User's requested vibe and elements: [ ${prompt} ]. 
    STRICT INSTRUCTION: Any mention of real-world sounds, animals, nature, or foley (e.g., birds, water, noise) MUST be heavily processed, synthesized, pitched, and washed in reverb to act as ambient musical instruments. DO NOT generate raw, dry, or realistic sound effects. Everything must be a seamless organic fusion, glued together, harmonically rich, with a wide stereo soundscape and extreme high fidelity.`;

    console.log("拦截用户输入，转换后的神级咒语：", enhancedPrompt);

    // 调用官方 2.5 版本大模型
    const output = await replicate.run(
      "stability-ai/stable-audio-2.5", 
      {
        input: {
          prompt: enhancedPrompt, 
          duration: 30, 
          steps: 8 
        }
      }
    );

    res.status(200).json({ audioUrl: output });

  } catch (error) {
    console.error("生成失败:", error);
    res.status(500).json({ error: error.message });
  }
}
