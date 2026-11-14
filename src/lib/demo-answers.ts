export type Section = { title: string; text: string; sources: string[] };
export type ChatAnswer = { answer: string; sources: string[]; sections: Section[]; mode: "ai" | "demo" };
export const SECTION_TITLES = ["What the report says", "What remains uncertain", "What happens next"] as const;
export const isSummaryRequest = (q: string) => /summar|what did the scan find|overview|explain (my|the) (report|result|scan)/i.test(q);

const SUMMARIES: Record<string, Section[]> = {
  chest: [
    { title: SECTION_TITLES[0], text: "The scan found a 7 mm solid nodule (a small spot) in the upper part of your right lung. No enlarged lymph nodes or fluid around the lungs were seen. There are mild emphysema changes (some wear to the small air sacs) in both upper lungs.", sources: ["r2", "r4", "r5", "r6"] },
    { title: SECTION_TITLES[1], text: "The radiologist describes the nodule as \"indeterminate\": its nature can't be decided from this scan alone. The report doesn't say what the nodule is.", sources: ["r3", "r7"] },
    { title: SECTION_TITLES[2], text: "The radiologist recommends comparing this scan with any earlier chest images. If none are available, they suggest a follow-up CT in 3 months. Your care team says they're requesting earlier images from your GP and will contact you. No booking is shown in your available record.", sources: ["r8", "n1", "n2"] },
  ],
  knee: [
    { title: SECTION_TITLES[0], text: "There is a horizontal tear in the back part of the inner knee cartilage (medial meniscus), a small amount of extra fluid, and mild cartilage thinning on the inner side. The main ligaments are intact.", sources: ["k2", "k3", "k4", "k5", "k6"] },
    { title: SECTION_TITLES[1], text: "The report doesn't say how the tear should be treated or whether the cartilage thinning is causing your symptoms. These are questions for your orthopaedic team.", sources: [] },
    { title: SECTION_TITLES[2], text: "The radiologist recommends an orthopaedic review. Your care team has booked a clinic appointment for 2 December 2026 at 10:30.", sources: ["k8", "m1"] },
  ],
};

// Preset answers for demo mode (used when live AI is off or unavailable).
export function demoAnswer(resultId: string, q: string): Omit<ChatAnswer, "mode"> {
  const chest = resultId.startsWith("ct-chest");
  if (isSummaryRequest(q))
    return { answer: "Here's a summary of your result.", sources: [], sections: SUMMARIES[chest ? "chest" : "knee"] };
  return { sections: [], ...plainAnswer(chest, q) };
}

function plainAnswer(chest: boolean, q: string): { answer: string; sources: string[] } {
  const t = q.toLowerCase();
  if (chest) {
    if (/cancer|serious|tumou?r|malignan/.test(t))
      return {
        answer:
          "It's understandable to worry. The report doesn't say whether this is cancer. It describes a 7 mm nodule in the right upper lung that is \"indeterminate\" — meaning its nature can't be decided from this scan alone. That's why the radiologist recommends comparing it with earlier scans. A question for your care team: \"What will comparing my earlier scans tell us about this nodule?\"",
        sources: ["r2", "r3", "r8"],
      };
    if (/book|appointment|next scan|when/.test(t))
      return {
        answer:
          "No booking is shown in your available record. The radiologist recommends comparing with previous chest imaging, and suggests a follow-up CT in 3 months only if no earlier images are available. Your care team says they're requesting your earlier images and will contact you. You could ask them: \"Will I need a follow-up CT, and when?\"",
        sources: ["r8", "n1", "n2"],
      };
    if (/next|happen/.test(t))
      return {
        answer:
          "The radiologist recommends comparing this scan with any earlier chest scans to see if the nodule has changed. Your care team says they're requesting those images from your GP and will contact you after reviewing them. Nothing is booked in your record yet.",
        sources: ["r8", "n1", "n2"],
      };
    if (/term|mean|nodule|indeterminate|emphysema/.test(t))
      return {
        answer:
          "Nodule: a small, rounded spot in the lung. Indeterminate: the scan can't show what it is yet. Emphysema: some damage to the small air sacs, described here as mild. Is there a specific word you'd like explained?",
        sources: ["r2", "r3", "r6"],
      };
    return {
      answer:
        "The scan found a 7 mm nodule (small spot) in the right upper lung. The radiologist couldn't tell what it is from this scan alone. No enlarged lymph nodes or fluid were seen, and there are mild emphysema changes.",
      sources: ["r2", "r3", "r4", "r6"],
    };
  }
  if (/book|appointment|next|happen|when/.test(t))
    return {
      answer:
        "The radiologist recommends an orthopaedic review. Your care team has booked an orthopaedic clinic appointment for 2 December 2026 at 10:30.",
      sources: ["k8", "m1"],
    };
  if (/term|mean|menisc|effusion/.test(t))
    return {
      answer:
        "Meniscus: a C-shaped cushion of cartilage in the knee. Medial means the inner side. Effusion: extra fluid in the joint, described here as small.",
      sources: ["k2", "k5"],
    };
  if (/cancer/.test(t))
    return {
      answer:
        "This knee MRI report doesn't mention anything about cancer. It describes a tear in the inner cartilage of the knee and some mild wear. If you're worried, ask your care team directly.",
      sources: ["k7"],
    };
  return {
    answer:
      "The scan shows a horizontal tear in the back part of the inner knee cartilage (medial meniscus), a small amount of fluid, and mild cartilage thinning. The main ligaments are intact.",
    sources: ["k2", "k3", "k5", "k6"],
  };
}
