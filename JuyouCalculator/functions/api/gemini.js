// functions/api/gemini.js

export async function onRequestPost(context) {
  const API_KEY = context.env.GEMINI_API_KEY;

  if (!API_KEY) {
    return new Response(JSON.stringify({ error: "Server API Key not configured" }), { status: 500 });
  }

  try {
    const reqBody = await context.request.json();
    const { prompt } = reqBody;

    // 🔴 关键修改 1：在这里修改模型名称
    // 注意：请确认 "gemini-3-flash-preview" 是准确的模型名。
    // 如果是笔误，常用的最新版可能是 "gemini-1.5-flash" 或 "gemini-2.0-flash-exp"
    const MODEL_NAME = "gemini-3-flash-preview"; 

    const googleResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          // 🔴 关键修改 2：在这里加上 JSON 模式配置
          generationConfig: { 
            responseMimeType: "application/json" 
          }
        })
      }
    );

    // 错误处理：如果 Google 返回错误（比如模型不存在），要透传给前端
    if (!googleResponse.ok) {
        const errorData = await googleResponse.json();
        return new Response(JSON.stringify(errorData), { status: googleResponse.status });
    }

    const data = await googleResponse.json();

    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}