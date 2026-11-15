import { describe, expect, it, vi } from "vitest";
import { answerQuestion, type ModelCaller } from "@/lib/answer";
import { COULD_NOT_ANSWER, SECTION_TITLES } from "@/lib/answer-types";
import { getPatientRecord, SESSION_PATIENT_ID } from "@/lib/records.server";

const chest = getPatientRecord(SESSION_PATIENT_ID, "ct-chest-2026-11-12")!;
const sentence = (id: string) => [
  ...chest.report.flatMap((section) => section.sentences),
  ...(chest.careNote?.sentences ?? []),
].find((s) => s.id === id)!.text;
const model = (selection: object): ModelCaller => async () => JSON.stringify(selection);
const ask = (question: string, selection: object, verifier?: ModelCaller) =>
  answerQuestion(chest, { question, history: [] }, model(selection), 1000, verifier);

describe("plain-English, report-grounded chat", () => {
  it("uses a short paraphrase linked to its exact source", async () => {
    const result = await ask("What did the scan find?", {
      items: [],
      sections: [
        { title: SECTION_TITLES[0], items: [{ id: "r11", plain: "The scan found a 7 mm spot in the upper part of the right lung, but its cause is uncertain." }] },
        { title: SECTION_TITLES[1], items: [{ id: "r5", plain: "This scan cannot show whether the spot has changed without earlier images." }] },
        { title: SECTION_TITLES[2], items: [] },
      ],
    });
    expect(result.mode).toBe("live");
    expect(result.sections[0].text).toContain("7 mm spot");
    expect(result.sections[0].sources).toEqual(["r11"]);
    expect(result.sections.map((s) => s.title)).toEqual(SECTION_TITLES);
  });

  it("shows exact wording when a paraphrase changes the scan type and invents a booking", async () => {
    const result = await ask("What happens next?", {
      items: [{ id: "r12", plain: "A thin-section MRI is booked in 3 months." }], sections: [],
    });
    expect(result.mode).toBe("live");
    expect(result.answer).toContain(sentence("r12"));
    expect(result.answer).not.toContain("MRI is booked");
  });

  it("does not imply a recommended scan has been booked", async () => {
    const result = await ask("Has my repeat CT scan been booked yet?", {
      items: [{ id: "r12", plain: sentence("r12") }], sections: [],
    });
    expect(result.answer).toMatch(/^I can't confirm from this record that a scan has been booked\./);
    expect(result.sources).toEqual(["r12"]);
  });

  it("falls back to exact wording when the independent verifier rejects a paraphrase", async () => {
    const verifier = vi.fn(async () => JSON.stringify({ supported: false, issues: ["unsupported meaning"] }));
    const result = await ask("What did it find?", {
      items: [{ id: "r11", plain: "The report found a 7 mm spot." }], sections: [],
    }, verifier);
    expect(result.answer).toContain(sentence("r11"));
    expect(verifier).toHaveBeenCalledOnce();
  });

  it("says when the available record does not answer", async () => {
    const result = await ask("Can I go swimming?", { items: [], sections: [] });
    expect(result.answer).toContain("does not answer that question");
    expect(result.sources).toEqual([]);
  });

  it("rejects invented source IDs", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await ask("What did it find?", {
      items: [{ id: "fake", plain: "It is fine." }], sections: [],
    });
    expect(result).toMatchObject({ mode: "error", answer: COULD_NOT_ANSWER });
    spy.mockRestore();
  });

  it("routes current symptoms before any model call", async () => {
    const call = vi.fn();
    const result = await answerQuestion(chest, { question: "I'm coughing up blood right now", history: [] }, call);
    expect(result.mode).toBe("safety");
    expect(call).not.toHaveBeenCalled();
  });

  it("fails closed when the model times out", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await answerQuestion(
      chest, { question: "What did it find?", history: [] },
      () => new Promise(() => {}), 30,
    );
    expect(result).toMatchObject({ mode: "error", answer: COULD_NOT_ANSWER });
    spy.mockRestore();
  });
});
