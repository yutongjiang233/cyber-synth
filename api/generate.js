import Replicate from "replicate";

// 🚨 终极护盾：突破 Vercel 免费版的 10 秒限制，允许最多运行 60 秒！
// 没有这一行，生成 30 秒音乐一定会超时报错
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
    console.log("正在召唤 Replicate 算力，提示词：", prompt);

    const output = await replicate.run(
      "meta/musicgen:b05b1dff1d8c6dc63d14b0cdb42135378dcb87f6373b0d3d341ede46e59e2b38",
      {
        input: {
          prompt: prompt,
          model_version: "stereo-large",
          output_format: "wav",
          // 👇 魔法就在这里！把 8 改成了 30，现在你可以生成 30 秒的完整片段了！
          duration: 30 
        }
      }
    );

    res.status(200).json({ audioUrl: output });

  } catch (error) {
    console.error("生成失败:", error);
    res.status(500).json({ error: error.message });
  }
}
