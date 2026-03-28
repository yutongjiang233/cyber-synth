import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    try {
        // 🔴 核心修改：正式接入 Stable Audio 商业级大模型，输出 44.1kHz 母带音质
        const prediction = await replicate.predictions.create({
            model: "stability-ai/stable-audio", 
            input: {
                prompt: req.body.prompt,
                seconds_total: 60, // Stable Audio 专属的时间参数
                steps: 100         // 强制增加步数，让音质更加细腻
            }
        });

        res.status(201).json(prediction);
    } catch (error) {
        console.error("Replicate Error:", error);
        res.status(500).json({ detail: error.message });
    }
}
