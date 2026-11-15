import { describe, it, expect } from "vitest";
import { getPatientRecord, listPatientRecords, SESSION_PATIENT_ID } from "@/lib/records.server";

describe("scan records", () => {
  it("never returns another patient's record", () => {
    expect(getPatientRecord(SESSION_PATIENT_ID, "xr-hand-other")).toBeNull();
  });

  it("gives each released scan a structured report with unique citation IDs", () => {
    const records = listPatientRecords(SESSION_PATIENT_ID);
    expect(records).toHaveLength(3);
    for (const record of records) {
      expect(record.report.map((section) => section.heading)).toEqual(
        expect.arrayContaining(["Clinical information", "Technique", "Comparison", "Conclusion"]),
      );
      const ids = record.report.flatMap((section) =>
        section.sentences.map((sentence) => sentence.id),
      );
      expect(ids.length).toBeGreaterThan(12);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});
