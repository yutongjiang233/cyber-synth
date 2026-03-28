import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    try {
        // 🔴 满血 2.5 版本：精准指向官方稳定版模型，拉满 3 分钟算力！
        const prediction = await replicate.predictions.create({
            model: "stability-ai/stable-audio-2.5", // 👈 精确指向最新的 2.5 版本
            input: {
                prompt: req.body.prompt,
                duration: 180, // 👈 物理极限拉满：180 秒（3分钟完整曲目）
                steps: 8       // 👈 画质参数拉满：官方允许的最高 8 步
            }
        });

        res.status(201).json(prediction);
    } catch (error) {
        console.error("Replicate Error:", error);
        res.status(500).json({ detail: error.message });
    }
}
