const http = require("http");
const fs = require("fs");
const path = require("path");

loadEnvFile(path.join(__dirname, ".env"));

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");

async function getAiRuntime() {
  return import("./lib/ai-runtime.mjs");
}

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

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Content-Security-Policy": "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self' https://api.notion.com"
};

const rateLimiter = new Map();
const RATE_LIMIT_REQUESTS = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;

function isRateLimited(req) {
  const ip = req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const entry = rateLimiter.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimiter.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  if (entry.count >= RATE_LIMIT_REQUESTS) return true;
  entry.count++;
  return false;
}

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

async function handleApi(req, res) {
  const pathname = getPathname(req.url);

  if (req.method === "GET" && pathname.endsWith("/api/status")) {
    const runtime = await getAiRuntime();
    const provider = runtime.getPreferredProvider();

    sendJson(res, 200, {
      configured: provider !== "demo",
      provider: runtime.getProviderLabel(provider),
      model: runtime.getPreferredModel(provider === "demo" ? "openai" : provider),
      mode: provider === "demo" ? "demo" : "live",
      providers: runtime.getConfiguredProviders(),
      notion: Boolean(process.env.NOTION_API_KEY && process.env.NOTION_DATABASE_ID)
    });
    return true;
  }

  if (req.method === "POST" && pathname.endsWith("/api/publish-notion")) {
    if (isRateLimited(req)) {
      sendJson(res, 429, { error: "Too many requests. Please wait before trying again." });
      return true;
    }

    const notionKey = process.env.NOTION_API_KEY;
    const databaseId = process.env.NOTION_DATABASE_ID;

    if (!notionKey || !databaseId) {
      sendJson(res, 503, {
        error: "Notion is not configured. Add NOTION_API_KEY and NOTION_DATABASE_ID to your .env file."
      });
      return true;
    }

    try {
      const body = await readJsonBody(req);
      const { title, owner, businessUnit, priority, draftType, draft, recommendation } = body;

      if (!title || !draft) {
        sendJson(res, 400, { error: "Missing required fields: title, draft." });
        return true;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15_000);

      try {
        const notionResponse = await fetch("https://api.notion.com/v1/pages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${notionKey}`,
            "Notion-Version": "2022-06-28"
          },
          signal: controller.signal,
          body: JSON.stringify({
            parent: { database_id: databaseId },
            properties: {
              Name: { title: [{ text: { content: title } }] },
              ...(owner ? { Owner: { rich_text: [{ text: { content: owner } }] } } : {}),
              ...(businessUnit ? { "Business Unit": { rich_text: [{ text: { content: businessUnit } }] } } : {}),
              ...(priority ? { Priority: { rich_text: [{ text: { content: priority } }] } } : {}),
              ...(draftType ? { "Draft Type": { rich_text: [{ text: { content: draftType } }] } } : {})
            },
            children: [
              {
                object: "block",
                type: "heading_2",
                heading_2: { rich_text: [{ type: "text", text: { content: `${draftType || "Draft"}: ${title}` } }] }
              },
              ...(recommendation
                ? [
                    {
                      object: "block",
                      type: "callout",
                      callout: {
                        rich_text: [
                          {
                            type: "text",
                            text: {
                              content: `Audience: ${recommendation.audience}\nChannels: ${(recommendation.channels || []).join(", ")}\nCadence: ${recommendation.cadence || "N/A"}`
                            }
                          }
                        ]
                      }
                    }
                  ]
                : []),
              {
                object: "block",
                type: "paragraph",
                paragraph: {
                  rich_text: [{ type: "text", text: { content: draft.slice(0, 2000) } }]
                }
              },
              ...(draft.length > 2000
                ? [
                    {
                      object: "block",
                      type: "paragraph",
                      paragraph: {
                        rich_text: [{ type: "text", text: { content: draft.slice(2000, 4000) } }]
                      }
                    }
                  ]
                : [])
            ]
          })
        });

        const notionPayload = await notionResponse.json();
        if (!notionResponse.ok) {
          throw new Error(notionPayload?.message || "Notion API request failed.");
        }

        sendJson(res, 200, {
          success: true,
          url: notionPayload.url,
          pageId: notionPayload.id
        });
      } finally {
        clearTimeout(timeoutId);
      }

      return true;
    } catch (error) {
      sendJson(res, 500, { error: error.message || "Failed to publish to Notion." });
      return true;
    }
  }

  if (req.method === "POST" && pathname.endsWith("/api/refine")) {
    if (isRateLimited(req)) {
      sendJson(res, 429, { error: "Too many requests. Please wait before trying again." });
      return true;
    }

    try {
      const body = await readJsonBody(req);
      const { draftType, currentDraft, feedback, request: reqPayload } = body;

      if (!draftType || !currentDraft || !feedback || !reqPayload) {
        sendJson(res, 400, { error: "Missing required fields: draftType, currentDraft, feedback, request." });
        return true;
      }

      if (typeof feedback !== "string" || feedback.length > 2000) {
        sendJson(res, 400, { error: "Feedback must be a string of 2000 characters or fewer." });
        return true;
      }

      const runtime = await getAiRuntime();
      const result = await runtime.refineDraft(draftType, currentDraft, feedback, reqPayload);
      sendJson(res, 200, result);
      return true;
    } catch (error) {
      sendJson(res, 500, { error: error.message || "Unable to refine draft." });
      return true;
    }
  }

  if (req.method === "POST" && pathname.endsWith("/api/generate")) {
    if (isRateLimited(req)) {
      sendJson(res, 429, { error: "Too many requests. Please wait before trying again." });
      return true;
    }

    try {
      const body = await readJsonBody(req);
      const request = body.request || {};
      const score = body.score || {};

      const requiredStrings = ["title", "owner", "brief"];
      for (const field of requiredStrings) {
        if (typeof request[field] !== "string" || !request[field].trim()) {
          sendJson(res, 400, { error: `Missing or invalid required field: ${field}.` });
          return true;
        }
      }

      const MAX_FIELD_LENGTHS = { title: 200, owner: 100, brief: 2000, businessUnit: 100, objective: 100 };
      for (const [field, max] of Object.entries(MAX_FIELD_LENGTHS)) {
        if (typeof request[field] === "string" && request[field].length > max) {
          sendJson(res, 400, { error: `Field "${field}" exceeds the maximum allowed length.` });
          return true;
        }
      }

      const runtime = await getAiRuntime();
      const provider = runtime.getPreferredProvider();

      if (provider === "demo") {
        sendJson(res, 503, {
          error: "No AI provider is configured. Add OPENAI_API_KEY or ANTHROPIC_API_KEY to your .env file."
        });
        return true;
      }

      const result = await runtime.generateAiPack(request, score);
      sendJson(res, 200, {
        provider: runtime.getProviderLabel(result.provider),
        model: result.model,
        pack: result.pack
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
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    res.setHeader(key, value);
  }
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

server.listen(PORT, async () => {
  const runtime = await getAiRuntime();
  const provider = runtime.getPreferredProvider();
  console.log(`Internal Comms Ops dashboard running at http://localhost:${PORT}`);
  console.log(
    provider === "demo"
      ? "No AI provider configured. Running in demo mode."
      : `${runtime.getProviderLabel(provider)} connected in live mode using model ${runtime.getPreferredModel(provider)}.`
  );
});
