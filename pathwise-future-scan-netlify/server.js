const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;

function loadLocalEnv() {
  const envPath = path.join(ROOT, ".env");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

loadLocalEnv();

const PORT = Number(process.env.PORT || 3000);
const SILICONFLOW_API_URL =
  process.env.SILICONFLOW_API_URL || "https://api.siliconflow.cn/v1/chat/completions";
const API_KEY = process.env.SILICONFLOW_API_KEY || process.env.OPENAI_API_KEY;
const MODEL = process.env.SILICONFLOW_MODEL || process.env.OPENAI_MODEL || "Qwen/Qwen2.5-7B-Instruct";

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".md": "text/markdown; charset=utf-8",
};

function send(res, status, body, type = "text/plain; charset=utf-8") {
  res.writeHead(status, { "Content-Type": type });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 80_000) {
        reject(new Error("Request body too large."));
        req.destroy();
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function safeFilePath(urlPath) {
  const cleanPath = decodeURIComponent(urlPath.split("?")[0]);
  const filePath = cleanPath === "/" ? "/index.html" : cleanPath;
  const resolved = path.normalize(path.join(ROOT, filePath));
  return resolved.startsWith(ROOT) ? resolved : null;
}

function staticHandler(req, res) {
  const file = safeFilePath(req.url);
  if (!file) return send(res, 403, "Forbidden");
  fs.readFile(file, (error, data) => {
    if (error) return send(res, 404, "Not found");
    const type = mimeTypes[path.extname(file)] || "application/octet-stream";
    send(res, 200, data, type);
  });
}

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

async function chatHandler(req, res) {
  if (!API_KEY) {
    return send(
      res,
      500,
      JSON.stringify({ error: "SILICONFLOW_API_KEY is not configured on the server." }),
      "application/json; charset=utf-8",
    );
  }

  try {
    const body = JSON.parse(await readBody(req));
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
      return send(
        res,
        response.status,
        JSON.stringify({ error: data.error?.message || data.message || "SiliconFlow API request failed." }),
        "application/json; charset=utf-8",
      );
    }

    const reply =
      data.choices?.[0]?.message?.content ||
      data.choices?.[0]?.text ||
      "";
    send(res, 200, JSON.stringify({ reply }), "application/json; charset=utf-8");
  } catch (error) {
    send(res, 500, JSON.stringify({ error: error.message }), "application/json; charset=utf-8");
  }
}

const server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/api/chat") return chatHandler(req, res);
  if (req.method === "GET" || req.method === "HEAD") return staticHandler(req, res);
  send(res, 405, "Method not allowed");
});

server.listen(PORT, () => {
  console.log(`Pathwise server running at http://localhost:${PORT}`);
});
