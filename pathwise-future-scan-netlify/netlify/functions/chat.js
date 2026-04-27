const SILICONFLOW_API_URL =
  process.env.SILICONFLOW_API_URL || "https://api.siliconflow.cn/v1/chat/completions";
const API_KEY = process.env.SILICONFLOW_API_KEY || process.env.OPENAI_API_KEY;
const MODEL = process.env.SILICONFLOW_MODEL || process.env.OPENAI_MODEL || "Qwen/Qwen2.5-7B-Instruct";

function buildPrompt(messages, context) {
  const transcript = messages
    .map((m) => `${m.role === "assistant" ? "Assistant" : "Student"}: ${m.content}`)
    .join("\n");

  return [
    "You are Pathwise, a professional Future Career Planning Advisor embedded in a career exploration website.",
    "Style: warm, rigorous, concise, supportive, and practical. Keep replies short enough for a small floating chat box.",
    "Do not override the website workflow. Help the student reflect, clarify options, understand STEM relevance, and ask better questions.",
    "If the student asks for medical, legal, or financial decisions, give general educational guidance and recommend consulting a qualified professional.",
    `Current website context: ${JSON.stringify(context || {})}`,
    "Conversation:",
    transcript,
  ].join("\n\n");
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ error: "Method not allowed." }),
    };
  }

  if (!API_KEY) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ error: "SILICONFLOW_API_KEY is not configured on the server." }),
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const messages = Array.isArray(body.messages) ? body.messages.slice(-10) : [];
    const prompt = buildPrompt(messages, body.context || {});

    const response = await fetch(SILICONFLOW_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        stream: false,
        max_output_tokens: 420,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({ error: data.error?.message || data.message || "SiliconFlow API request failed." }),
      };
    }

    const reply =
      data.choices?.[0]?.message?.content ||
      data.choices?.[0]?.text ||
      "";

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ reply }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ error: error.message || "AI chat is temporarily unavailable." }),
    };
  }
};
