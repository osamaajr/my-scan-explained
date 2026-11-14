import { describe, expect, it, vi } from "vitest";
import { getPatientRecord, SESSION_PATIENT_ID } from "@/lib/records.server";
import { answerQuestion, type ModelCaller } from "@/lib/answer";
import { COULD_NOT_ANSWER, isSummaryRequest, SECTION_TITLES } from "@/lib/answer-types";
import { checkChestBooking, checkChestCancer, checkKneeBooking, unknownSources } from "./grounding";

const chest = getPatientRecord(SESSION_PATIENT_ID, "ct-chest-2026-11-12")!;
const knee = getPatientRecord(SESSION_PATIENT_ID, "mri-knee-2026-10-28")!;
const ask = (rec: typeof chest, question: string, model: ModelCaller, timeoutMs?: number) =>
  answerQuestion(rec, { question, history: [] }, model, timeoutMs);

// JSON a well-behaved model would return for each scripted demo question.
const chestCancerJSON = JSON.stringify({
  answer:
    'It\'s understandable to worry. The report doesn\'t say whether this is cancer. It describes a 7 mm nodule in the right upper lung that is "indeterminate" — its nature can\'t be decided from this scan alone. A question for your care team: "What will comparing my earlier scans tell us?"',
  sources: ["r2", "r3", "r8"],
  sections: [],
});
const chestBookingJSON = JSON.stringify({
  answer:
    "No booking is shown in your available record. The radiologist recommends comparing with previous chest imaging, or a follow-up CT in 3 months if none is available. Your care team is requesting your earlier images and will contact you.",
  sources: ["r8", "n1", "n2"],
  sections: [],
});
const kneeBookingJSON = JSON.stringify({
  answer:
    "The radiologist recommends an orthopaedic review. Your care team has booked an appointment for 2 December 2026 at 10:30.",
  sources: ["k8", "m1"],
  sections: [],
});

describe("isSummaryRequest", () => {
  it("treats summary wording as a summary request", () => {
    for (const q of [
      "What did the scan find?",
      "summarise my result",
      "explain my report",
      "give me an overview",
    ])
      expect(isSummaryRequest(q)).toBe(true);
  });
  it("does not treat a follow-up question as a summary request", () => {
    for (const q of [
      "Does this mean I have cancer?",
      "What does indeterminate mean?",
      "Is my next scan booked?",
    ])
      expect(isSummaryRequest(q)).toBe(false);
  });
});

describe("live answers are correct and grounded, given a well-formed model reply", () => {
  it("chest CT: cancer question keeps 7 mm and the uncertainty, citing supporting sentences", async () => {
    const a = await ask(chest, "Does this mean I have cancer?", async () => chestCancerJSON);
    expect(a.mode).toBe("live");
    expect(checkChestCancer(chest, a)).toEqual([]);
  });
  it("chest CT: booking question separates recommendation from booking", async () => {
    const a = await ask(chest, "Is my next scan booked?", async () => chestBookingJSON);
    expect(a.mode).toBe("live");
    expect(checkChestBooking(chest, a)).toEqual([]);
  });
  it("knee MRI: booking question gives the confirmed appointment", async () => {
    const a = await ask(knee, "Is my next scan booked?", async () => kneeBookingJSON);
    expect(a.mode).toBe("live");
    expect(checkKneeBooking(knee, a)).toEqual([]);
  });
  it("drops source IDs the model invents that aren't in the record", async () => {
    const a = await ask(chest, "Does this mean I have cancer?", async () =>
      JSON.stringify({ answer: "Text", sources: ["r2", "zz9"], sections: [] }),
    );
    expect(a).toMatchObject({ mode: "live", sources: ["r2"] });
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
  it("every record sentence ID is a valid source", () => {
    for (const rec of [chest, knee])
      expect(unknownSources(rec, { sources: ["not-an-id"] })).toEqual(["not-an-id"]);
  });
});

describe("no preset/offline mode: everything but safety goes to the model", () => {
  it("every non-symptom question calls the model, whatever it is", async () => {
    const model = vi.fn(async () =>
      JSON.stringify({ answer: "Here's an answer.", sources: [], sections: [] }),
    );
    for (const q of [
      "Does this mean I have cancer?",
      "Can I still go swimming?",
      "What's the weather like?",
    ]) {
      await ask(chest, q, model);
    }
    expect(model).toHaveBeenCalledTimes(3);
  });

  it("times out a hung live call, aborts it, and shows a plain apology (not report content)", async () => {
    let signal: AbortSignal | undefined;
    const model: ModelCaller = (args) => {
      signal = args.signal;
      return new Promise(() => {});
    };
    const started = Date.now();
    const a = await ask(chest, "Does this mean I have cancer?", model, 50);
    expect(Date.now() - started).toBeLessThan(1000);
    expect(a).toMatchObject({ mode: "error", answer: COULD_NOT_ANSWER, sources: [], sections: [] });
    expect(signal?.aborted).toBe(true);
  });

  it("shows the same plain apology when the gateway errors or returns unusable JSON", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(
      await ask(chest, "Is my next scan booked?", async () => {
        throw new Error("no key");
      }),
    ).toMatchObject({ mode: "error", answer: COULD_NOT_ANSWER });
    expect(await ask(chest, "Is my next scan booked?", async () => "not json")).toMatchObject({
      mode: "error",
      answer: COULD_NOT_ANSWER,
    });
    spy.mockRestore();
  });
});

describe("fixed safety check runs before the model", () => {
  it("routes a current symptom to NHS help without calling the model", async () => {
    const model = vi.fn();
    const a = await ask(chest, "I'm coughing up blood right now", model);
    expect(a).toMatchObject({ mode: "safety", urgent: true, sources: [] });
    expect(model).not.toHaveBeenCalled();
  });

  it("still sends a question about a symptom term in the report to the model", async () => {
    const model = vi.fn(async () =>
      JSON.stringify({ answer: "A persistent cough is...", sources: [], sections: [] }),
    );
    const a = await ask(chest, "What does persistent cough mean in my report?", model);
    expect(a.mode).toBe("live");
    expect(model).toHaveBeenCalledTimes(1);
  });
});

describe("SECTION_TITLES", () => {
  it("has exactly the three fixed summary headings, in order", () => {
    expect(SECTION_TITLES).toEqual([
      "What the report says",
      "What remains uncertain",
      "What happens next",
    ]);
  });
});
