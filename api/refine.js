module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const body = request.body || {};
    const { draftType, currentDraft, feedback, request: reqPayload } = body;

    if (!draftType || !currentDraft || !feedback || !reqPayload) {
      response.status(400).json({ error: "Missing required fields: draftType, currentDraft, feedback, request." });
      return;
    }

    if (typeof feedback !== "string" || feedback.length > 2000) {
      response.status(400).json({ error: "Feedback must be a string of 2000 characters or fewer." });
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

    const result = await runtime.refineDraft(draftType, currentDraft, feedback, reqPayload);
    response.status(200).json(result);
  } catch (error) {
    response.status(500).json({
      error: error instanceof Error ? error.message : "Unable to refine draft."
    });
  }
};
