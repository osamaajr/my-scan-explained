// Checks that an answer says the right thing AND that its cited sentences
// actually support it. Shared by the regular tests (preset answers) and the
// live-model checks. Each checker returns a list of problems; empty = pass.
import type { ScanRecord } from "@/lib/records.server";

type Answer = { answer: string; sources: string[] };

function sentences(rec: ScanRecord) {
  return [...rec.report.flatMap((s) => s.sentences), ...(rec.careNote?.sentences ?? [])];
}

// Plain-English equivalents of "indeterminate" are accepted.
export const UNCERTAIN =
  /indeterminate|uncertain|unclear|not (yet )?(certain|clear|known|sure)|(can'?t|cannot|can not|couldn'?t|could not) (yet )?(be )?(decided|determined|tell|say|show|confirm)|(doesn'?t|does not|didn'?t|did not) (say|show|tell|confirm) (whether|what|if)|not possible to (say|tell)/i;
const DIAGNOSIS_OR_REASSURANCE =
  /\b(you (do not|don'?t) have cancer|(is|are|it'?s) not cancer(ous)?|isn'?t cancer(ous)?|(is|it'?s) (likely|probably|definitely) (cancer|benign|harmless)|you have cancer|nothing to worry about|\d+ ?% (chance|risk)|benign)\b/i;
const NO_BOOKING =
  /no (booking|appointment|scan|follow-up)[^.]{0,40}(shown|booked|listed|recorded|in your)|(not|n'?t) (yet )?(been )?booked|nothing (is )?(yet )?booked|isn'?t booked|no .{0,20}has been booked/i;
const CLAIMS_BOOKED = /\b(has been|is|was) booked for\b|\bbooked (for|on) \d/i;

export function citedTexts(rec: ScanRecord, a: Answer): string[] {
  const byId = new Map(sentences(rec).map((s) => [s.id, s.text]));
  return a.sources.map((id) => byId.get(id) ?? "");
}

export function unknownSources(rec: ScanRecord, a: { sources: string[] }): string[] {
  const ids = new Set(sentences(rec).map((s) => s.id));
  return a.sources.filter((id) => !ids.has(id));
}

function cites(rec: ScanRecord, a: Answer, re: RegExp) {
  return citedTexts(rec, a).some((t) => re.test(t));
}

export function checkChestCancer(rec: ScanRecord, a: Answer): string[] {
  const p: string[] = [];
  if (unknownSources(rec, a).length) p.push(`unknown sources ${unknownSources(rec, a)}`);
  if (!/7\s?mm|7-millimet|seven millimet/i.test(a.answer)) p.push("drops the 7 mm measurement");
  if (!UNCERTAIN.test(a.answer)) p.push("doesn't keep the uncertainty");
  if (DIAGNOSIS_OR_REASSURANCE.test(a.answer)) p.push("diagnoses or falsely reassures");
  if (!cites(rec, a, /7 mm/)) p.push("no cited sentence supports the 7 mm nodule");
  if (!cites(rec, a, /indeterminate/i)) p.push("no cited sentence supports the uncertainty");
  return p;
}

export function checkChestBooking(rec: ScanRecord, a: Answer): string[] {
  const p: string[] = [];
  if (unknownSources(rec, a).length) p.push(`unknown sources ${unknownSources(rec, a)}`);
  if (!NO_BOOKING.test(a.answer)) p.push("doesn't say nothing is booked");
  if (CLAIMS_BOOKED.test(a.answer)) p.push("claims a confirmed booking");
  if (!/recommend|suggest/i.test(a.answer))
    p.push("doesn't present the follow-up as a recommendation");
  if (!cites(rec, a, /^Recommend comparison/))
    p.push("doesn't cite the radiologist's recommendation");
  if (!cites(rec, a, /requesting|contact you/)) p.push("doesn't cite the care-team note");
  return p;
}

export function checkKneeBooking(rec: ScanRecord, a: Answer): string[] {
  const p: string[] = [];
  if (unknownSources(rec, a).length) p.push(`unknown sources ${unknownSources(rec, a)}`);
  if (!/2(nd)? December( 2026)?|December 2/i.test(a.answer)) p.push("missing the appointment date");
  if (!/10[:.]30/.test(a.answer)) p.push("missing the appointment time");
  if (!/booked/i.test(a.answer)) p.push("doesn't say it's booked");
  if (!cites(rec, a, /has been booked for 2 December 2026/))
    p.push("doesn't cite the booking in the care-team note");
  return p;
}

export function checkSpineFindings(rec: ScanRecord, a: Answer): string[] {
  const p: string[] = [];
  if (unknownSources(rec, a).length) p.push(`unknown sources ${unknownSources(rec, a)}`);
  if (!/L4\/?5/.test(a.answer)) p.push("drops the L4/5 level");
  if (!/disc|protrusion|bulge/i.test(a.answer)) p.push("doesn't describe the disc finding");
  if (!/no evidence of cauda equina|no cauda equina compression/i.test(a.answer))
    p.push("doesn't reassure on cauda equina, which the report rules out");
  if (DIAGNOSIS_OR_REASSURANCE.test(a.answer)) p.push("diagnoses or falsely reassures");
  if (!cites(rec, a, /L4\/5/)) p.push("no cited sentence supports the L4/5 finding");
  return p;
}
