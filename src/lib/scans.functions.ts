import { createServerFn } from "@tanstack/react-start";
import type { ChatAnswer } from "./answer-types";
import type { ModelCaller } from "./answer";

export const listResults = createServerFn({ method: "GET" }).handler(async () => {
  const { listPatientRecords, SESSION_PATIENT_ID } = await import("./records.server");
  return listPatientRecords(SESSION_PATIENT_ID).map((r) => ({
    id: r.id,
    name: r.name,
    date: r.date,
    referringTeam: r.referringTeam,
  }));
});

export const getResult = createServerFn({ method: "GET" })
  .validator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const { getPatientRecord, SESSION_PATIENT_ID } = await import("./records.server");
    return getPatientRecord(SESSION_PATIENT_ID, data.id);
  });
type Turn = { role: "user" | "assistant"; text: string };

export const askAboutResult = createServerFn({ method: "POST" })
  .validator((d: { resultId: string; question: string; history: Turn[] }) => ({
    resultId: String(d.resultId),
    question: String(d.question).slice(0, 1000),
    history: (Array.isArray(d.history) ? d.history : []).slice(-10).map((t) => ({
      role: t.role === "assistant" ? ("assistant" as const) : ("user" as const),
      text: String(t.text).slice(0, 2000),
    })),
  }))
  .handler(async ({ data }): Promise<ChatAnswer & { resultId: string }> => {
    const { getPatientRecord, SESSION_PATIENT_ID } = await import("./records.server");
    const rec = getPatientRecord(SESSION_PATIENT_ID, data.resultId);
    if (!rec) throw new Error("Result not found");
    const { answerQuestion } = await import("./answer");
    let callModel: ModelCaller;
    let callVerifier: ModelCaller;
    if (process.env.OPENAI_API_KEY) {
      const provider = await import("./openai.server");
      callModel = provider.callOpenAI;
      callVerifier = provider.callOpenAIVerifier;
    } else {
      callModel = (await import("./gateway.server")).callGateway;
      callVerifier = callModel;
    }
    const answer = await answerQuestion(rec, data, callModel, undefined, callVerifier);
    return { ...answer, resultId: rec.id };
  });
