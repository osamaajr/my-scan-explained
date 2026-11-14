export type Section = { title: string; text: string; sources: string[] };
export type AnswerMode = "live" | "safety" | "error";
export type ChatAnswer = {
  answer: string;
  sources: string[];
  sections: Section[];
  mode: AnswerMode;
  urgent?: boolean;
};
export const SECTION_TITLES = [
  "What the report says",
  "What remains uncertain",
  "What happens next",
] as const;
export const isSummaryRequest = (q: string) =>
  /summar|what did the scan find|overview|explain (my|the) (report|result|scan)/i.test(q);

// Fixed text, not written by the AI — shown whenever a live call fails
// (timeout, gateway error, or an unusable reply). There is no canned
// fallback answer: this is only ever an apology, never report content.
export const COULD_NOT_ANSWER =
  "Sorry, I couldn't get an answer just now. Please try again in a moment, or ask your care team.";

// Fixed apology for the plain-English overview box specifically, shown when
// generating it fails. Also never report content.
export const COULD_NOT_GENERATE_OVERVIEW =
  "We couldn't generate a plain-English overview just now. Open the chat below to ask about this result instead.";

// The question asked once per result to generate the "Overview in plain
// English" box. Deliberately avoids isSummaryRequest's trigger words
// ("overview", "summar...", the exact phrase "what did the scan find", and
// "explain the/my report/result/scan") so it gets a short plain paragraph
// back, not the three-section summary-mode breakdown used in chat.
export const OVERVIEW_QUESTION =
  "In 2 to 4 short plain-English sentences (reading age about 11), describe what this scan found. Keep any measurements and uncertainty words exact.";
