import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export default async function handler(req, res) {
    // 从前端请求的 URL 里拿到任务的 ID (例如: /api/status?id=xxxx)
    const { id } = req.query; 

    if (!id) return res.status(400).json({ error: "Missing prediction ID" });

    try {
        // 用官方的方法查询这个 ID 的当前状态
        const prediction = await replicate.predictions.get(id);
        
        // 把最新状态（starting, processing, succeeded 或者是 failed）返回给前端
        res.status(200).json(prediction);
    } catch (error) {
        console.error("Status API Error:", error);
        res.status(500).json({ detail: error.message });
    }
}