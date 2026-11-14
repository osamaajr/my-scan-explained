// Live-model checks for the demo script. Needs LOVABLE_API_KEY; skipped otherwise.
// Run with: bun run test:live   (not part of `bun run test`)
import { describe, expect, it } from "vitest";
import { getPatientRecord, SESSION_PATIENT_ID } from "@/lib/records.server";
import { answerQuestion } from "@/lib/answer";
import { callGateway } from "@/lib/gateway.server";
import { checkChestBooking, checkChestCancer, checkKneeBooking, checkSpineFindings } from "../grounding";

const chest = getPatientRecord(SESSION_PATIENT_ID, "ct-chest-2026-11-12")!;
const knee = getPatientRecord(SESSION_PATIENT_ID, "mri-knee-2026-10-28")!;
const spine = getPatientRecord(SESSION_PATIENT_ID, "mri-spine-2026-11-05")!;
const live = (rec: typeof chest, question: string) => answerQuestion(rec, { question, history: [] }, callGateway);

describe.skipIf(!process.env["LOVABLE_API_KEY"])("live model: demo script", () => {
  it("chest CT: 'Does this mean I have cancer?'", async () => {
    const a = await live(chest, "Does this mean I have cancer?");
    expect(a.mode).toBe("live");
    expect(checkChestCancer(chest, a), a.answer).toEqual([]);
  });
  it("chest CT: 'Is my next scan booked?'", async () => {
    const a = await live(chest, "Is my next scan booked?");
    expect(a.mode).toBe("live");
    expect(checkChestBooking(chest, a), a.answer).toEqual([]);
  });
  it("knee MRI: 'Is my next scan booked?'", async () => {
    const a = await live(knee, "Is my next scan booked?");
    expect(a.mode).toBe("live");
    expect(checkKneeBooking(knee, a), a.answer).toEqual([]);
  });
  it("spine MRI: 'What did the MRI find in my spine?'", async () => {
    const a = await live(spine, "What did the MRI find in my spine?");
    expect(a.mode).toBe("live");
    expect(checkSpineFindings(spine, a), a.answer).toEqual([]);
  });
});
