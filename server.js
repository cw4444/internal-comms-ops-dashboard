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
      providers: runtime.getConfiguredProviders()
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
