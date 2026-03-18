export default async function handler(req, res) {
  // 1. 从云端保险箱拿密码（绝对不会暴露给前端）
  const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

  if (!REPLICATE_API_TOKEN) {
    return res.status(500).json({ detail: "未配置 API Key" });
  }

  // 2. 接收前端的生成请求
  if (req.method === "POST") {
    const response = await fetch("https://api.replicate.com/v1/models/stability-ai/stable-audio/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: {
            prompt: req.body.prompt,
            seconds_total: 30
        }
      }),
    });

    const prediction = await response.json();
    res.status(201).json(prediction);

  // 3. 接收前端的进度查询请求（防止云端超时断连）
  } else if (req.method === "GET") {
    const response = await fetch(`https://api.replicate.com/v1/predictions/${req.query.id}`, {
      headers: {
        "Authorization": `Bearer ${REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
    });
    const prediction = await response.json();
    res.status(200).json(prediction);
    
  } else {
    res.status(405).json({ detail: "Method not allowed" });
  }
}