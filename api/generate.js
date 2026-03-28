import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    try {
        // 🔴 终极满血版：直接榨干 GPU，生成 3 分钟完整曲目！
        const prediction = await replicate.predictions.create({
            model: "stability-ai/stable-audio", // 稳定的官方主线模型
            input: {
                prompt: req.body.prompt,
                duration: 180, // 👈 物理极限拉满，生成 3 分钟的完整歌曲
                steps: 8       // 👈 官方允许的最高画质步数
            }
        });

        res.status(201).json(prediction);
    } catch (error) {
        console.error("Replicate Error:", error);
        res.status(500).json({ detail: error.message });
    }
}
