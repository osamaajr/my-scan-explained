import type { ModelCaller } from "./answer";

export const LIVE_MODEL = "openai/gpt-6-astra";

// Real model call through Lovable's AI gateway. No retries: the caller's
// timeout is the whole budget, so a slow gateway can't stall the demo.
export const callGateway: ModelCaller = async ({ instructions, input, schema, signal }) => {
  const { generateResponse } = await import("@lovable.dev/ai-gateway");
  const res = await generateResponse(
    {
      model: LIVE_MODEL,
      instructions,
      input,
      text: { format: { type: "json_schema", name: "answer", strict: true, schema } },
    },
    { signal, maxRetries: 0 },
  );
  let text = "";
  for (const item of res.output ?? []) {
    if (item.type === "message")
      for (const c of item.content) if (c.type === "output_text") text += c.text;
  }
  return text;
};
