import Replicate from "replicate";

// 初始化 Replicate 客户端，它会自动读取 Vercel 里的 REPLICATE_API_TOKEN 环境变量
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export default async function handler(req, res) {
    // 限制只能用 POST 方法请求
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    try {
        // 创建一个异步预测任务（不会死等，瞬间返回）
        const prediction = await replicate.predictions.create({
            // 这里已经填入了你截图中确切的 ACE-Step-1.5 模型版本 Hash
            version: "74e3a7d383b18815e277de5223f5fe9d53d38832de15aa567fe729fa129d0d85",
            input: {
                prompt: req.body.prompt,      // 接收前端网页传过来的提示词
                lyrics: "[Instrumental]"      // 强制纯音乐模式，不要人声
            }
        });

        // 瞬间返回状态码 201 和任务信息（包含 id）给前端
        res.status(201).json(prediction);
    } catch (error) {
        console.error("Generate API Error:", error);
        res.status(500).json({ detail: error.message });
    }
}
