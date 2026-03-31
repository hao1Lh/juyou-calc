// 1. 必须有的预检请求处理，不写这个本地测试必报 CORS 错误
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const API_KEY = env.GEMINI_API_KEY;

  // ========== 新增：核心防盗刷白名单 ==========
  const origin = request.headers.get('Origin');
  const allowedOrigins = [
    'https://calc.juyou-tool.site',
    'https://compass.juyou-tool.site',
    'https://ielts.juyou-tool.site',
    'https://juyou-tool.site',
    'http://localhost:8788',
    'http://localhost:3000'
  ];
  const isAllowed = allowedOrigins.includes(origin);

  // 统一准备好 CORS 响应头
  const corsHeaders = {
    'Access-Control-Allow-Origin': isAllowed ? origin : 'null',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // 拦截盗用：不在白名单里的，统统踢出去！
  if (origin && !isAllowed) {
    return new Response(JSON.stringify({ error: 'Forbidden: 未授权的访问' }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
  // ==========================================

  if (!API_KEY) {
    return new Response(JSON.stringify({ error: "Server API Key not configured" }), { 
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }

  try {
    const reqBody = await request.json();
    const { prompt } = reqBody;

    // 最新模型
    const MODEL_NAME = "gemini-3.1-pro-preview"; 

    const googleResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json"
          }
        })
      }
    );

    if (!googleResponse.ok) {
      const errorData = await googleResponse.json();
      return new Response(JSON.stringify(errorData), { 
        status: googleResponse.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    const data = await googleResponse.json();

    // 成功返回时，也必须带上跨域头
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
}
