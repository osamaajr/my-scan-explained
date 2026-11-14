import { createServerFn } from "@tanstack/react-start";
import type { ChatAnswer } from "./answer-types";

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
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const { getPatientRecord, SESSION_PATIENT_ID } = await import("./records.server");
    return getPatientRecord(SESSION_PATIENT_ID, data.id);
  });

type Turn = { role: "user" | "assistant"; text: string };

export const askAboutResult = createServerFn({ method: "POST" })
  .inputValidator((d: { resultId: string; question: string; history: Turn[] }) => ({
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
    const { callGateway } = await import("./gateway.server");
    const answer = await answerQuestion(rec, data, callGateway);
    return { ...answer, resultId: rec.id };
  });
