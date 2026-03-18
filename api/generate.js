import Replicate from "replicate";

// 🚨 终极护盾：突破 Vercel 免费版的 10 秒限制，允许最多运行 60 秒！
// Stable Audio 生成高质量音频需要时间，这行代码是保命符
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
    console.log("正在召唤真正的 DiT 算力 (Stable Audio)，提示词：", prompt);

    // 🚀 核心替换：换成 Stability AI 的官方 DiT 模型
    const output = await replicate.run(
      "stability-ai/stable-audio", 
      {
        input: {
          prompt: prompt,
          // 注意！Stable Audio 控制时长的参数名是 seconds_total，而不是 duration
          seconds_total: 30,
          // 增加 steps 参数可以提升音质（数值越大音质越好，但生成越慢，默认一般是 100）
          steps: 100 
        }
      }
    );

    // 把生成的高清音频链接返回给你的前端赛博 UI
    res.status(200).json({ audioUrl: output });

  } catch (error) {
    console.error("生成失败:", error);
    res.status(500).json({ error: error.message });
  }
}
