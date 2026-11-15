import type { ModelCaller } from "./answer";

// Direct OpenAI calls for local development. This module is only imported by
// server functions, so OPENAI_API_KEY never reaches the browser bundle.
async function requestOpenAI(
  model: string,
  { instructions, input, schema, signal }: Parameters<ModelCaller>[0],
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is missing from the server environment");

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      instructions,
      input,
      text: { format: { type: "json_schema", name: "answer", strict: true, schema } },
      reasoning: { effort: "low" },
      max_output_tokens: model === (process.env.OPENAI_MODEL || "gpt-6-astra") ? 1500 : 500,
      store: false,
    }),
    signal,
  });
  if (!response.ok) {
    // Status is enough to diagnose credentials, quota, and model access without
    // logging the report or response body.
    throw new Error(`OpenAI request failed (HTTP ${response.status})`);
  }

  const data = (await response.json()) as {
    status?: string;
    output?: { type: string; content?: { type: string; text?: string }[] }[];
  };
  if (data.status !== "completed") throw new Error(`OpenAI response status: ${data.status ?? "unknown"}`);
  const text = (data.output ?? [])
    .filter((item) => item.type === "message")
    .flatMap((item) => item.content ?? [])
    .filter((part) => part.type === "output_text")
    .map((part) => part.text ?? "")
    .join("");
  if (!text) throw new Error("OpenAI returned no answer text");
  return text;
}

export const callOpenAI: ModelCaller = (args) =>
  requestOpenAI(process.env.OPENAI_MODEL || "gpt-6-astra", args);

export const callOpenAIVerifier: ModelCaller = (args) =>
  requestOpenAI(process.env.OPENAI_VERIFIER_MODEL || "gpt-6.1-terra", args);
