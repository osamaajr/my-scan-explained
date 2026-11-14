import { describe, it, expect } from "vitest";
import { getPatientRecord, SESSION_PATIENT_ID } from "@/lib/records.server";

describe("scan records", () => {
  it("never returns another patient's record", () => {
    expect(getPatientRecord(SESSION_PATIENT_ID, "xr-hand-other")).toBeNull();
  });
});
