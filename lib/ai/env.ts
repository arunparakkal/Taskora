export type AiProvider = "openai" | "groq" | "gemini" | "none";

export interface AiConfig {
  provider: AiProvider;
  apiKey: string;
  baseUrl: string;
  model: string;
}

/**
 * Resolve AI provider from env.
 * Preference: explicit AI_PROVIDER → Groq key → Gemini key → OpenAI/AI key.
 */
export function getAiConfig(): AiConfig {
  const providerHint = (process.env.AI_PROVIDER ?? "").trim().toLowerCase();

  const groqKey = process.env.GROQ_API_KEY?.trim() || "";
  const geminiKey =
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_API_KEY?.trim() ||
    "";
  const openaiKey =
    process.env.AI_API_KEY?.trim() ||
    process.env.OPENAI_API_KEY?.trim() ||
    "";

  if (providerHint === "groq" && groqKey) {
    return {
      provider: "groq",
      apiKey: groqKey,
      baseUrl:
        process.env.AI_API_BASE_URL?.trim() ||
        "https://api.groq.com/openai/v1",
      model: process.env.AI_MODEL?.trim() || "llama-3.3-70b-versatile",
    };
  }

  if (providerHint === "gemini" && geminiKey) {
    return {
      provider: "gemini",
      apiKey: geminiKey,
      baseUrl: "",
      model: process.env.AI_MODEL?.trim() || "gemini-2.0-flash",
    };
  }

  if (providerHint === "openai" && openaiKey) {
    return {
      provider: "openai",
      apiKey: openaiKey,
      baseUrl:
        process.env.AI_API_BASE_URL?.trim() ||
        process.env.OPENAI_BASE_URL?.trim() ||
        "https://api.openai.com/v1",
      model: process.env.AI_MODEL?.trim() || "gpt-4o-mini",
    };
  }

  if (groqKey) {
    return {
      provider: "groq",
      apiKey: groqKey,
      baseUrl:
        process.env.AI_API_BASE_URL?.trim() ||
        "https://api.groq.com/openai/v1",
      model: process.env.AI_MODEL?.trim() || "llama-3.3-70b-versatile",
    };
  }

  if (geminiKey) {
    return {
      provider: "gemini",
      apiKey: geminiKey,
      baseUrl: "",
      model: process.env.AI_MODEL?.trim() || "gemini-2.0-flash",
    };
  }

  if (openaiKey) {
    return {
      provider: "openai",
      apiKey: openaiKey,
      baseUrl:
        process.env.AI_API_BASE_URL?.trim() ||
        process.env.OPENAI_BASE_URL?.trim() ||
        "https://api.openai.com/v1",
      model: process.env.AI_MODEL?.trim() || "gpt-4o-mini",
    };
  }

  return { provider: "none", apiKey: "", baseUrl: "", model: "" };
}

export function isAiConfigured() {
  return getAiConfig().provider !== "none";
}

/** @deprecated use getAiConfig() */
export function getAiApiKey() {
  return getAiConfig().apiKey;
}

/** @deprecated use getAiConfig() */
export function getAiApiBaseUrl() {
  const cfg = getAiConfig();
  return cfg.baseUrl || "https://api.openai.com/v1";
}

/** @deprecated use getAiConfig() */
export function getAiModel() {
  return getAiConfig().model || "gpt-4o-mini";
}
