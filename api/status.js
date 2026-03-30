module.exports = async function handler(request, response) {
  const runtime = await import("../lib/ai-runtime.mjs");
  const provider = runtime.getPreferredProvider();

  response.status(200).json({
    configured: provider !== "demo",
    provider: runtime.getProviderLabel(provider),
    model: runtime.getPreferredModel(provider === "demo" ? "openai" : provider),
    mode: provider === "demo" ? "demo" : "live",
    providers: runtime.getConfiguredProviders()
  });
};
