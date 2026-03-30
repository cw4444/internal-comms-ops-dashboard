module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const body = request.body || {};
    const reqPayload = body.request || {};
    const score = body.score || {};

    if (!reqPayload.title || !reqPayload.owner || !reqPayload.brief) {
      response.status(400).json({ error: "Missing required request fields." });
      return;
    }

    const runtime = await import("../lib/ai-runtime.mjs");
    const provider = runtime.getPreferredProvider();

    if (provider === "demo") {
      response.status(503).json({
        error: "No AI provider is configured. Add OPENAI_API_KEY or ANTHROPIC_API_KEY to project environment variables."
      });
      return;
    }

    const result = await runtime.generateAiPack(reqPayload, score);
    response.status(200).json({
      provider: runtime.getProviderLabel(result.provider),
      model: result.model,
      pack: result.pack
    });
  } catch (error) {
    response.status(500).json({
      error: error instanceof Error ? error.message : "Unable to generate AI content."
    });
  }
};
