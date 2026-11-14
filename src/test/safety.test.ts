import { describe, expect, it } from "vitest";
import { detectCurrentSymptoms } from "@/lib/safety";

// Phrase matching is a limited fallback; these pin down the cases the demo relies on.
describe("current-symptom detection", () => {
  it.each([
    ["I'm coughing up blood right now", true],
    ["I’m coughing up blood right now, what does that mean?", true],
    ["I have chest pain at the moment", true],
    ["I can't breathe properly", true],
    ["My knee is really swollen today", false],
    ["I've been coughing more since yesterday", false],
  ])("flags %j (urgent=%s)", (msg, urgent) => {
    expect(detectCurrentSymptoms(msg)).toEqual({ match: true, urgent });
  });

  it.each([
    "What does persistent cough mean in my report?",
    "What does 'pleural effusion' mean?",
    "What does coughing up blood mean?",
    "The clinical details say cough for 8 weeks. Is that me?",
    "Does this mean I have cancer?",
    "Is my next scan booked?",
    "I have a question about the knee effusion in the report",
    "What did the scan find?",
  ])("does not flag %j", (msg) => {
    expect(detectCurrentSymptoms(msg).match).toBe(false);
  });
});
