import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    try {
        // 🔴 满血 2.5 版本：精准指向官方稳定版模型，并正式接入底层消杀系统！
        const prediction = await replicate.predictions.create({
            model: "stability-ai/stable-audio-2.5", // 👈 精确指向最新的 2.5 版本
            input: {
                prompt: req.body.prompt,
                negative_prompt: req.body.negative_prompt || "", // 👈 🔴 新增：接住前端传来的消杀词，强行喂给模型！
                duration: 90,  // 保持你设置的 90 秒
                steps: 8       // 保持最高画质步数
            }
        });

        res.status(201).json(prediction);
    } catch (error) {
        console.error("Replicate Error:", error);
        res.status(500).json({ detail: error.message });
    }
}
