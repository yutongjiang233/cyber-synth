import Replicate from "replicate";

// 🛡️ 突破 Vercel 免费版的 10 秒死线
export const maxDuration = 60; 

// 🔐 安全读取 Vercel 云端密码
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN, 
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { prompt } = req.body;
    
    // 🎛️ 终极融合外挂：强制 AI 把所有突兀的声音（如鸟叫）胶合进高质量的电子乐空间中
    const enhancedPrompt = `${prompt}, pristine audio quality, masterfully mixed, high fidelity, 320kbps, clear studio recording, integrated foley fX seamlessly blended, mastered sound glue`;

    console.log("正在召唤真正的 DiT 引擎 (Stable Audio 2.5)，提示词：", enhancedPrompt);

    // 🚀 核心纠正：这里绝对是官方满血版的 stable-audio-2.5！
    const output = await replicate.run(
      "stability-ai/stable-audio-2.5",
      {
        input: {
          prompt: enhancedPrompt, 
          duration: 30, // 给你完整的 30 秒！
          steps: 8 // 2.5 版本的官方限制，最完美的画质步数
        }
      }
    );

    res.status(200).json({ audioUrl: output });

  } catch (error) {
    console.error("生成失败:", error);
    res.status(500).json({ error: error.message });
  }
}
