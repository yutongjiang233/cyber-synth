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
    console.log("正在召唤顶级 DiT 算力 (Stable Audio 2.5)，提示词：", prompt);

    // 🚀 调用永远在线、速度极快的官方 2.5 版本
    const output = await replicate.run(
      "stability-ai/stable-audio-2.5", 
      {
        input: {
          prompt: prompt,
          duration: 30, // 完美支持 30 秒（最高甚至支持 190 秒）
          steps: 8 // ⚠️ 关键修复：2.5 版本的官方最高画质步数就是 8，千万不能写 100！
        }
      }
    );

    res.status(200).json({ audioUrl: output });

  } catch (error) {
    console.error("生成失败:", error);
    // 把 Replicate 真正的报错信息返回给前端，方便排查
    res.status(500).json({ error: error.message });
  }
}
