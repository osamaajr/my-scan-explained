// Optional paid live check. Run with OPENAI_API_KEY or LOVABLE_API_KEY set.
import { describe, expect, it } from "vitest";
import { answerQuestion, sentenceIds } from "@/lib/answer";
import { getPatientRecord, SESSION_PATIENT_ID, type ScanRecord } from "@/lib/records.server";
import { callOpenAI, callOpenAIVerifier } from "@/lib/openai.server";
import { callGateway } from "@/lib/gateway.server";

const caller = process.env.OPENAI_API_KEY ? callOpenAI : callGateway;
const verifier = process.env.OPENAI_API_KEY ? callOpenAIVerifier : callGateway;
const live = (rec: ScanRecord, question: string) =>
  answerQuestion(rec, { question, history: [] }, caller, undefined, verifier);

describe.skipIf(!process.env.OPENAI_API_KEY && !process.env.LOVABLE_API_KEY)("live source selection", () => {
  it.each([
    ["ct-chest-2026-11-12", "Does this mean I have cancer?"],
    ["mri-knee-2026-10-28", "Is my appointment booked?"],
    ["mri-spine-2026-11-05", "What did the MRI find?"],
  ])("%s: selects only existing report sentences", async (id, question) => {
    const rec = getPatientRecord(SESSION_PATIENT_ID, id)!;
    const a = await live(rec, question);
    expect(a.mode).toBe("live");
    expect(a.sources.length).toBeGreaterThan(0);
    const valid = sentenceIds(rec);
    expect(a.sources.every((source) => valid.has(source))).toBe(true);
    expect(a.answer.length).toBeGreaterThan(20);
  });
});
