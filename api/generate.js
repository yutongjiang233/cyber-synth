import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    try {
        const prediction = await replicate.predictions.create({
            version: "74e3a7d383b18815e277de5223f5fe9d53d38832de15aa567fe729fa129d0d85",
            input: {
                prompt: req.body.prompt,      // 这里接收的将是 enhance.js 扩写后的长词
                lyrics: "[Instrumental]",     
                duration: 60                 // 强制 60 秒
            }
        });

        res.status(201).json(prediction);
    } catch (error) {
        console.error("Generate API Error:", error);
        res.status(500).json({ detail: error.message });
    }
}
