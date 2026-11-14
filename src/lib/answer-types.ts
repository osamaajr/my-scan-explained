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
