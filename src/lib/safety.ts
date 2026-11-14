// Limited safety fallback: phrase matching for clear "how I feel now" messages.
// It runs before any answer mode. It is not a triage tool and will miss some
// messages; the system prompt still tells the live model to route symptoms too.

// Symptoms that warrant the help panel even when phrased as a question
// ("I'm coughing up blood right now, what does that mean?").
const URGENT_SYMPTOM =
  /\b(cough\w*( up)? blood|blood when i cough|chest pain|chest (hurts|is hurting|feels tight)|tight chest|can'?t breathe|cannot breathe|struggling to breathe|difficulty breathing|trouble breathing|passed out|collaps\w*|faint(ed|ing))\b/i;

const SYMPTOM =
  /\b(cough\w*|wheez\w*|breathless\w*|short of breath|pain\w*|hurts?|hurting|ach(e|es|ing)|bleed\w*|dizz\w*|swell\w*|swollen|fever\w*|temperature|vomit\w*|numb\w*|locking|locked|giving way|can'?t (walk|bend|straighten|put weight))\b/i;

// First-person, present-tense cues: the person is describing themselves now.
const NOW =
  /\b(i'?m|i am|im|i'?ve (been|got)|i have|i keep|i can'?t|i cannot|i feel|i'?m feeling|my \w+ (is|are|keeps|has been|hurts|feels)|right now|at the moment|currently|since (this morning|yesterday|last night)|today|tonight|this morning|just now|getting worse)\b/i;

// Questions about wording in the report, not about how the person feels.
const REPORT_TERM =
  /\b(what (does|do|is|are)|what'?s|meaning|mean|define|definition|explain|in (the|my) (report|scan|result)|the report (says|mentions)|clinical details)\b/i;

export type SymptomCheck = { match: boolean; urgent: boolean };

export function detectCurrentSymptoms(message: string): SymptomCheck {
  const t = message.replace(/[’‘]/g, "'");
  if (!NOW.test(t)) return { match: false, urgent: false };
  if (URGENT_SYMPTOM.test(t)) return { match: true, urgent: true };
  if (SYMPTOM.test(t) && !REPORT_TERM.test(t)) return { match: true, urgent: false };
  return { match: false, urgent: false };
}

// Fixed text, not written by the AI.
export const SAFETY_MESSAGE =
  "It sounds like you may be describing how you feel now. I can't check symptoms, so please use the NHS guidance below.";
