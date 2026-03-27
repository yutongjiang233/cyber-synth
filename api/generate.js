import Replicate from "replicate";

export const maxDuration = 60; // 突破 Vercel 10 秒限制，允许运行 60 秒

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN, 
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { prompt } = req.body;
    
    // 调用 Stability AI 的官方高端 DiT 模型：stable-audio-open
    // 强制生成 30 秒
    const output = await replicate.run(
      "stability-ai/stable-audio-open",
      {
        input: {
          prompt: prompt, // 用户的 Prompt (script.js 里已经整合了 master 关键词)
          output_format: "wav",
          duration: 30 // 生成 30 秒音乐
        }
      }
    );

    res.status(200).json({ audioUrl: output });

  } catch (error) {
    console.error("生成出错:", error);
    res.status(500).json({ error: error.message });
  }
}
