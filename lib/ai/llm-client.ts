import { getAiConfig, type AiConfig } from "@/lib/ai/env";

export type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export async function completeJsonPrompt(params: {
  system: string;
  user: string;
}): Promise<{ content: string; provider: AiConfig["provider"] }> {
  const config = getAiConfig();
  if (config.provider === "none" || !config.apiKey) {
    throw new Error("AI_NOT_CONFIGURED");
  }

  if (config.provider === "gemini") {
    return {
      content: await completeWithGeminiJson(config, params),
      provider: "gemini",
    };
  }

  return {
    content: await completeWithOpenAiCompatibleJson(config, params),
    provider: config.provider,
  };
}

/** Multi-turn plain-text chat (no JSON mode). */
export async function completeChat(params: {
  system: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
}): Promise<{ content: string; provider: AiConfig["provider"] }> {
  const config = getAiConfig();
  if (config.provider === "none" || !config.apiKey) {
    throw new Error("AI_NOT_CONFIGURED");
  }

  if (config.provider === "gemini") {
    return {
      content: await completeWithGeminiChat(config, params),
      provider: "gemini",
    };
  }

  return {
    content: await completeWithOpenAiCompatibleChat(config, params),
    provider: config.provider,
  };
}

async function completeWithOpenAiCompatibleJson(
  config: AiConfig,
  params: { system: string; user: string }
): Promise<string> {
  const baseUrl = config.baseUrl.replace(/\/$/, "");
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: params.system },
        { role: "user", content: params.user },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`AI provider error (${res.status}): ${body.slice(0, 240)}`);
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty AI response");
  return content;
}

async function completeWithOpenAiCompatibleChat(
  config: AiConfig,
  params: {
    system: string;
    messages: Array<{ role: "user" | "assistant"; content: string }>;
  }
): Promise<string> {
  const baseUrl = config.baseUrl.replace(/\/$/, "");
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      temperature: 0.4,
      messages: [
        { role: "system", content: params.system },
        ...params.messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`AI provider error (${res.status}): ${body.slice(0, 240)}`);
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty AI response");
  return content;
}

async function completeWithGeminiJson(
  config: AiConfig,
  params: { system: string; user: string }
): Promise<string> {
  const url = new URL(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.model)}:generateContent`
  );
  url.searchParams.set("key", config.apiKey);

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: params.system }] },
      contents: [{ role: "user", parts: [{ text: params.user }] }],
      generationConfig: {
        temperature: 0.3,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Gemini error (${res.status}): ${body.slice(0, 240)}`);
  }

  const json = (await res.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };
  const content = json.candidates?.[0]?.content?.parts
    ?.map((p) => p.text ?? "")
    .join("")
    .trim();
  if (!content) throw new Error("Empty Gemini response");
  return content;
}

async function completeWithGeminiChat(
  config: AiConfig,
  params: {
    system: string;
    messages: Array<{ role: "user" | "assistant"; content: string }>;
  }
): Promise<string> {
  const url = new URL(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.model)}:generateContent`
  );
  url.searchParams.set("key", config.apiKey);

  const contents = params.messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  // Gemini requires the conversation to start with a user turn.
  const normalized =
    contents[0]?.role === "model"
      ? [{ role: "user", parts: [{ text: "Hi" }] }, ...contents]
      : contents;

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: params.system }] },
      contents: normalized,
      generationConfig: {
        temperature: 0.4,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Gemini error (${res.status}): ${body.slice(0, 240)}`);
  }

  const json = (await res.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };
  const content = json.candidates?.[0]?.content?.parts
    ?.map((p) => p.text ?? "")
    .join("")
    .trim();
  if (!content) throw new Error("Empty Gemini response");
  return content;
}
