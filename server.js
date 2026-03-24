const http = require("http");
const fs = require("fs");
const path = require("path");

loadEnvFile(path.join(__dirname, ".env"));

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5-mini";

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon"
};

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, "");

    if (key && !(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function sendFile(res, filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[extension] || "application/octet-stream";

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(error.code === "ENOENT" ? 404 : 500, {
        "Content-Type": "text/plain; charset=utf-8"
      });
      res.end(error.code === "ENOENT" ? "Not found" : "Server error");
      return;
    }

    res.writeHead(200, { "Content-Type": contentType });
    res.end(content);
  });
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Request body too large"));
        req.destroy();
      }
    });

    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(new Error("Invalid JSON body"));
      }
    });

    req.on("error", reject);
  });
}

function buildPrompt(request, score) {
  return [
    {
      role: "system",
      content: [
        {
          type: "input_text",
          text:
            "You are an enterprise internal communications strategist and writer. Return valid JSON only. No markdown fences. Be concise, realistic and specific. Your output must include recommendation, drafts and insights for a large enterprise environment."
        }
      ]
    },
    {
      role: "user",
      content: [
        {
          type: "input_text",
          text: JSON.stringify({
            task: "Create an internal communications recommendation and draft pack.",
            outputShape: {
              recommendation: {
                audience: "string",
                channels: ["string"],
                cadence: "string",
                rationale: "string"
              },
              drafts: {
                email: "string",
                intranet: "string",
                faq: "string",
                manager: "string"
              },
              insights: [
                {
                  title: "string",
                  severity: "risk|review|active",
                  summary: "string",
                  points: ["string"]
                }
              ]
            },
            constraints: [
              "Keep channels limited to the most credible three or four options.",
              "Make the drafts immediately usable by an enterprise comms operator.",
              "FAQ should include at least five questions.",
              "Manager brief should give clear cascade guidance and likely employee questions.",
              "Insights should focus on overlap risk, duplication risk and likely questions."
            ],
            request,
            score
          })
        }
      ]
    }
  ];
}

function extractOutputText(response) {
  if (typeof response.output_text === "string" && response.output_text.trim()) {
    return response.output_text.trim();
  }

  const chunks = [];
  for (const item of response.output || []) {
    if (!item.content) continue;
    for (const part of item.content) {
      if (part.type === "output_text" && part.text) {
        chunks.push(part.text);
      }
    }
  }

  return chunks.join("\n").trim();
}

function parseJsonResponse(text) {
  const cleaned = text.trim();
  const direct = tryParse(cleaned);
  if (direct) return direct;

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return tryParse(cleaned.slice(firstBrace, lastBrace + 1));
  }

  return null;
}

function tryParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function validateAiPack(payload) {
  return Boolean(
    payload &&
      payload.recommendation &&
      payload.drafts &&
      payload.insights &&
      typeof payload.recommendation.audience === "string" &&
      Array.isArray(payload.recommendation.channels) &&
      typeof payload.drafts.email === "string" &&
      typeof payload.drafts.intranet === "string" &&
      typeof payload.drafts.faq === "string" &&
      typeof payload.drafts.manager === "string" &&
      Array.isArray(payload.insights)
  );
}

async function generateOpenAiPack(request, score) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      input: buildPrompt(request, score)
    })
  });

  const payload = await response.json();
  if (!response.ok) {
    const errorMessage =
      payload && payload.error && payload.error.message
        ? payload.error.message
        : "OpenAI request failed";
    throw new Error(errorMessage);
  }

  const text = extractOutputText(payload);
  const parsed = parseJsonResponse(text);

  if (!parsed || !validateAiPack(parsed)) {
    throw new Error("OpenAI returned an unexpected response shape.");
  }

  return parsed;
}

async function handleApi(req, res) {
  const pathname = getPathname(req.url);

  if (req.method === "GET" && pathname.endsWith("/api/status")) {
    sendJson(res, 200, {
      configured: Boolean(OPENAI_API_KEY),
      provider: "OpenAI",
      model: OPENAI_MODEL,
      mode: OPENAI_API_KEY ? "live" : "demo"
    });
    return true;
  }

  if (req.method === "POST" && pathname.endsWith("/api/generate")) {
    try {
      const body = await readJsonBody(req);
      const request = body.request || {};
      const score = body.score || {};

      if (!request.title || !request.owner || !request.brief) {
        sendJson(res, 400, { error: "Missing required request fields." });
        return true;
      }

      if (!OPENAI_API_KEY) {
        sendJson(res, 503, {
          error: "OpenAI is not configured. Add OPENAI_API_KEY to your .env file."
        });
        return true;
      }

      const pack = await generateOpenAiPack(request, score);
      sendJson(res, 200, {
        provider: "OpenAI",
        model: OPENAI_MODEL,
        pack
      });
      return true;
    } catch (error) {
      sendJson(res, 500, {
        error: error.message || "Unable to generate AI content."
      });
      return true;
    }
  }

  return false;
}

function getPathname(urlValue) {
  if (!urlValue) return "/";

  try {
    return new URL(urlValue, "http://localhost").pathname;
  } catch {
    const questionMarkIndex = urlValue.indexOf("?");
    return questionMarkIndex === -1 ? urlValue : urlValue.slice(0, questionMarkIndex);
  }
}

const server = http.createServer(async (req, res) => {
  if ((await handleApi(req, res)) === true) {
    return;
  }

  const requestPath = req.url === "/" ? "/index.html" : req.url;
  const safePath = path.normalize(requestPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(PUBLIC_DIR, safePath);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Forbidden");
    return;
  }

  fs.stat(filePath, (error, stats) => {
    if (error) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }

    if (stats.isDirectory()) {
      sendFile(res, path.join(filePath, "index.html"));
      return;
    }

    sendFile(res, filePath);
  });
});

server.listen(PORT, () => {
  console.log(`Internal Comms Ops dashboard running at http://localhost:${PORT}`);
  console.log(
    OPENAI_API_KEY
      ? `OpenAI connected in live mode using model ${OPENAI_MODEL}.`
      : "OpenAI not configured. Running in demo mode."
  );
});
