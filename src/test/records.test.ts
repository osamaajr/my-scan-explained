import { describe, it, expect } from "vitest";
import { getPatientRecord, SESSION_PATIENT_ID } from "@/lib/records.server";
import { demoAnswer } from "@/lib/demo-answers";

describe("scan records", () => {
  it("never returns another patient's record", () => {
    expect(getPatientRecord(SESSION_PATIENT_ID, "xr-hand-other")).toBeNull();
  });
  it("chest CT has no confirmed booking in demo answer", () => {
    expect(demoAnswer("ct-chest-2026-11-12", "Is my next scan booked?").answer).toMatch(/No booking is shown/);
  });
});
