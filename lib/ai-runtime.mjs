export function getConfiguredProviders() {
  return {
    openai: Boolean(process.env.OPENAI_API_KEY),
    anthropic: Boolean(process.env.ANTHROPIC_API_KEY)
  };
}

export function getPreferredProvider() {
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.OPENAI_API_KEY) return "openai";
  return "demo";
}

export function getProviderLabel(provider) {
  if (provider === "anthropic") return "Anthropic";
  if (provider === "openai") return "OpenAI";
  return "Demo";
}

export function getPreferredModel(provider) {
  if (provider === "anthropic") {
    return process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514";
  }

  return process.env.OPENAI_MODEL || "gpt-4o";
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

function extractOpenAiText(response) {
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
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const models = Array.from(
    new Set([process.env.OPENAI_MODEL, "gpt-4o", "gpt-4-turbo"].filter(Boolean))
  );

  for (const model of models) {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        input: buildPrompt(request, score)
      })
    });

    const payload = await response.json();
    if (!response.ok) {
      const errorMessage =
        payload && payload.error && payload.error.message ? payload.error.message : "OpenAI request failed";
      const missingModel =
        response.status === 403 &&
        typeof errorMessage === "string" &&
        errorMessage.includes("does not have access to model");

      if (missingModel) {
        continue;
      }

      throw new Error(errorMessage);
    }

    const text = extractOpenAiText(payload);
    const parsed = parseJsonResponse(text);

    if (!parsed || !validateAiPack(parsed)) {
      throw new Error("OpenAI returned an unexpected response shape.");
    }

    return {
      provider: "openai",
      model,
      pack: parsed
    };
  }

  throw new Error("OpenAI is configured but no accessible model was available.");
}

async function generateAnthropicPack(request, score) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured.");
  }

  const model = getPreferredModel("anthropic");
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model,
      max_tokens: 1600,
      messages: [
        {
          role: "user",
          content: JSON.stringify({
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
              "Return valid JSON only.",
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
    })
  });

  const payload = await response.json();
  if (!response.ok) {
    const errorMessage =
      payload && payload.error && payload.error.message ? payload.error.message : "Anthropic request failed";
    throw new Error(errorMessage);
  }

  const text = Array.isArray(payload.content)
    ? payload.content
        .filter((item) => item.type === "text")
        .map((item) => item.text)
        .join("\n")
        .trim()
    : "";
  const parsed = parseJsonResponse(text);

  if (!parsed || !validateAiPack(parsed)) {
    throw new Error("Anthropic returned an unexpected response shape.");
  }

  return {
    provider: "anthropic",
    model,
    pack: parsed
  };
}

export async function generateAiPack(request, score) {
  const preferredProvider = getPreferredProvider();

  if (preferredProvider === "anthropic") {
    return generateAnthropicPack(request, score);
  }

  if (preferredProvider === "openai") {
    return generateOpenAiPack(request, score);
  }

  throw new Error("No AI provider configured.");
}
