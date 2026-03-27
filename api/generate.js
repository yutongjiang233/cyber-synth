import Replicate from "replicate";

// 🔐 安全第一：让代码去读取 Vercel 的环境变量，而不是把密码写在明面上！
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN, 
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { prompt } = req.body;
    
    // 🎛️ 核心修复逻辑：声音融合外挂 (防止鸟叫声太突兀)
    const enhancedPrompt = `${prompt}, pristine audio quality, masterfully mixed, high fidelity, 320kbps, clear studio recording, integrated foley fX seamlessly blended, mastered sound glue`;

    console.log("正在召唤顶级 DiT 算力，增强后的提示词：", enhancedPrompt);

    // 调用 Stability AI 的官方高端 DiT 模型
    const output = await replicate.run(
      "stability-ai/stable-audio-open",
      {
        input: {
          prompt: enhancedPrompt, 
          output_format: "wav",
          duration: 15 // 生成 15 秒高清音乐
        }
      }
    );

    res.status(200).json({ audioUrl: output });

  } catch (error) {
    console.error("生成失败:", error);
    res.status(500).json({ error: error.message });
  }
}
