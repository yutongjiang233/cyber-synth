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
    
    // 🎛️ 核心魔法：母带级音质增强外挂
    // 强制要求 AI 做到：轨道分离、乐器清晰、无浑浊感、宽广立体声
    const enhancedPrompt = `${prompt}, multi-track, distinct individual instruments, crisp and clear separation, professional 3D studio mix, wide stereo imaging, extreme high fidelity, lossless FLAC quality, mastered, perfectly balanced EQ, zero muddiness, punchy transients`;

    console.log("正在召唤顶级 DiT 算力，增强后的咒语：", enhancedPrompt);

    // 调用官方 2.5 版本大模型
    const output = await replicate.run(
      "stability-ai/stable-audio-2.5", 
      {
        input: {
          prompt: enhancedPrompt, // 注入我们强化过的神级提示词
          duration: 30, // 30秒完整时长
          steps: 8 // 官方最佳步数
        }
      }
    );

    res.status(200).json({ audioUrl: output });

  } catch (error) {
    console.error("生成失败:", error);
    res.status(500).json({ error: error.message });
  }
}
