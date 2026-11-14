import { describe, expect, it, vi } from "vitest";
import { getPatientRecord, SESSION_PATIENT_ID } from "@/lib/records.server";
import { answerQuestion, type ModelCaller } from "@/lib/answer";
import { demoAnswer, PRESET_CANT_ANSWER } from "@/lib/demo-answers";
import { checkChestBooking, checkChestCancer, checkKneeBooking, unknownSources } from "./grounding";

const chest = getPatientRecord(SESSION_PATIENT_ID, "ct-chest-2026-11-12")!;
const knee = getPatientRecord(SESSION_PATIENT_ID, "mri-knee-2026-10-28")!;
const ask = (
  rec = chest,
  question: string,
  preset = true,
  model: ModelCaller = vi.fn(),
  timeoutMs?: number,
) => answerQuestion(rec, { question, history: [], preset }, model, timeoutMs);

describe("preset answers are correct and grounded", () => {
  it("chest CT: cancer question keeps 7 mm and the uncertainty, citing supporting sentences", async () => {
    expect(checkChestCancer(chest, await ask(chest, "Does this mean I have cancer?"))).toEqual([]);
  });
  it("chest CT: booking question separates recommendation from booking", async () => {
    expect(checkChestBooking(chest, await ask(chest, "Is my next scan booked?"))).toEqual([]);
  });
  it("knee MRI: booking question gives the confirmed appointment", async () => {
    expect(checkKneeBooking(knee, await ask(knee, "Is my next scan booked?"))).toEqual([]);
  });
  it("every preset source ID exists in its record", () => {
    const qs = [
      "What did the scan find?",
      "What does this term mean?",
      "What happens next?",
      "Does this mean I have cancer?",
      "Is my next scan booked?",
      "What does the report say?",
    ];
    for (const rec of [chest, knee])
      for (const q of qs) {
        const a = demoAnswer(rec.id, q);
        expect(unknownSources(rec, a)).toEqual([]);
        for (const s of a.sections) expect(unknownSources(rec, s)).toEqual([]);
      }
  });
});

describe("grounding checks catch bad answers", () => {
  it("accepts plain-English wording for 'indeterminate'", () => {
    const a = {
      answer: "The 7 mm nodule is uncertain: the scan can't tell what it is yet.",
      sources: ["r2", "r3"],
    };
    expect(checkChestCancer(chest, a)).toEqual([]);
  });
  it("rejects citations that don't support the claims", () => {
    const a = { answer: "There is a 7 mm nodule and it is indeterminate.", sources: ["r4", "r5"] };
    expect(checkChestCancer(chest, a)).toEqual(
      expect.arrayContaining([
        "no cited sentence supports the 7 mm nodule",
        "no cited sentence supports the uncertainty",
      ]),
    );
  });
  it("rejects false reassurance and a made-up booking", () => {
    expect(
      checkChestCancer(chest, {
        answer: "The 7 mm indeterminate nodule is not cancer.",
        sources: ["r2", "r3"],
      }),
    ).toContain("diagnoses or falsely reassures");
    expect(
      checkChestBooking(chest, {
        answer: "Your follow-up CT has been booked for 3 months, as recommended.",
        sources: ["r8", "n1"],
      }),
    ).toContain("claims a confirmed booking");
  });
});

describe("answer modes", () => {
  it("preset mode never calls the model", async () => {
    const model = vi.fn();
    expect((await ask(chest, "Is my next scan booked?", true, model)).mode).toBe("preset");
    expect(model).not.toHaveBeenCalled();
  });

  it("preset mode says the demo can't answer unrecognised questions, without blaming the record", async () => {
    const a = await ask(chest, "Can I still go swimming?");
    expect(a.answer).toBe(PRESET_CANT_ANSWER);
    expect(a.answer).not.toMatch(
      /record (doesn'?t|does not)|not in your record|isn'?t in your record/i,
    );
    expect(a.sources).toEqual([]);
  });

  it("live mode returns the model's answer and drops unknown source IDs", async () => {
    const model: ModelCaller = async () =>
      JSON.stringify({ answer: "Live text", sources: ["r2", "zz9"], sections: [] });
    const a = await ask(chest, "Does this mean I have cancer?", false, model);
    expect(a).toMatchObject({ mode: "live", answer: "Live text", sources: ["r2"] });
  });

  it("times out a hung live call, aborts it and falls back visibly", async () => {
    let signal: AbortSignal | undefined;
    const model: ModelCaller = (args) => {
      signal = args.signal;
      return new Promise(() => {});
    };
    const started = Date.now();
    const a = await ask(chest, "Does this mean I have cancer?", false, model, 50);
    expect(Date.now() - started).toBeLessThan(1000);
    expect(a).toMatchObject({ mode: "fallback", fallbackReason: "timeout" });
    expect(signal?.aborted).toBe(true);
    expect(checkChestCancer(chest, a)).toEqual([]);
  });

  it("falls back when the gateway errors or returns unusable JSON", async () => {
    const vi1 = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(
      await ask(chest, "Is my next scan booked?", false, async () => {
        throw new Error("no key");
      }),
    ).toMatchObject({ mode: "fallback", fallbackReason: "unavailable" });
    expect(
      await ask(chest, "Is my next scan booked?", false, async () => "not json"),
    ).toMatchObject({ mode: "fallback", fallbackReason: "invalid_response" });
    vi1.mockRestore();
  });

  it("fallback for an unrecognised question says live AI is unavailable", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const a = await ask(chest, "Can I still go swimming?", false, async () => {
      throw new Error("down");
    });
    expect(a.answer).toMatch(/live assistant isn't available/);
  });
});

describe("fixed safety check runs before either mode", () => {
  for (const preset of [true, false])
    it(`routes a current symptom to NHS help (${preset ? "preset" : "live"})`, async () => {
      const model = vi.fn();
      const a = await ask(chest, "I'm coughing up blood right now", preset, model);
      expect(a).toMatchObject({ mode: "safety", urgent: true, sources: [] });
      expect(model).not.toHaveBeenCalled();
    });

  it("still answers a question about a symptom term in the report", async () => {
    const a = await ask(chest, "What does persistent cough mean in my report?");
    expect(a.mode).toBe("preset");
  });
});
