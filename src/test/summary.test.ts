import { describe, it, expect } from "vitest";
import { demoAnswer, isSummaryRequest, SECTION_TITLES } from "@/lib/demo-answers";

describe("summary answers", () => {
  it("treats summary wording as a summary request", () => {
    for (const q of ["What did the scan find?", "summarise my result", "explain my report", "give me an overview"])
      expect(isSummaryRequest(q)).toBe(true);
  });

  it("does not treat a follow-up question as a summary request", () => {
    for (const q of ["Does this mean I have cancer?", "What does indeterminate mean?", "Is my next scan booked?"])
      expect(isSummaryRequest(q)).toBe(false);
  });

  it("returns the three summary sections in order for both scans", () => {
    for (const id of ["ct-chest-2026-11-12", "mri-knee-2026-10-28"]) {
      const sections = demoAnswer(id, "What did the scan find?").sections;
      expect(sections.map((s) => s.title)).toEqual([...SECTION_TITLES]);
      expect(sections.every((s) => s.text.trim().length > 0)).toBe(true);
    }
  });

  it("keeps ordinary answers as plain text with no sections", () => {
    const answer = demoAnswer("ct-chest-2026-11-12", "Does this mean I have cancer?");
    expect(answer.sections).toEqual([]);
    expect(answer.answer).toMatch(/indeterminate/);
  });
});
