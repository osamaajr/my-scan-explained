// Fictional, server-side sample records. Never real patient data.
export type Sentence = { id: string; text: string };
export type ScanRecord = {
  id: string;
  patientId: string;
  released: boolean;
  name: string;
  shortName: string;
  date: string; // ISO
  referringTeam: string;
  overview: string;
  report: { heading: string; sentences: Sentence[] }[];
  careNote: { author: string; date: string; patientVisible: boolean; sentences: Sentence[] } | null;
};

export const SESSION_PATIENT_ID = "pt-demo-001"; // simulated logged-in patient

const s = (id: string, text: string): Sentence => ({ id, text });

export const RECORDS: ScanRecord[] = [
  {
    id: "ct-chest-2026-11-12",
    patientId: SESSION_PATIENT_ID,
    released: true,
    name: "CT scan of the chest",
    shortName: "chest CT",
    date: "2026-11-12",
    referringTeam: "Respiratory Medicine, St Elsewhere Hospital",
    overview:
      "The scan found a small spot (nodule) in the right lung. The radiologist could not tell from this scan alone what it is. They recommend comparing it with any earlier chest scans.",
    report: [
      { heading: "Clinical details", sentences: [s("r1", "Persistent cough for 8 weeks. Ex-smoker.")] },
      {
        heading: "Findings",
        sentences: [
          s("r2", "There is a 7 mm solid pulmonary nodule in the right upper lobe."),
          s("r3", "The nodule is indeterminate and its nature cannot be determined on this study alone."),
          s("r4", "No enlarged mediastinal or hilar lymph nodes."),
          s("r5", "No pleural effusion."),
          s("r6", "Mild emphysematous changes in both upper lobes."),
        ],
      },
      {
        heading: "Conclusion",
        sentences: [
          s("r7", "Indeterminate 7 mm right upper lobe nodule."),
          s("r8", "Recommend comparison with any previous chest imaging to assess stability; if none is available, a follow-up CT in 3 months is suggested."),
        ],
      },
    ],
    careNote: {
      author: "Respiratory team",
      date: "2026-11-13",
      patientVisible: true,
      sentences: [
        s("n1", "We have received your CT report and are requesting your previous chest X-ray and scan images from your GP practice."),
        s("n2", "We will contact you once we have reviewed them together."),
      ],
    },
  },
  {
    id: "mri-knee-2026-10-28",
    patientId: SESSION_PATIENT_ID,
    released: true,
    name: "MRI scan of the left knee",
    shortName: "knee MRI",
    date: "2026-10-28",
    referringTeam: "Trauma & Orthopaedics, St Elsewhere Hospital",
    overview:
      "The scan shows a tear in the inner cartilage (medial meniscus) of the left knee and some mild wear. The ligaments look intact.",
    report: [
      { heading: "Clinical details", sentences: [s("k1", "Left knee pain and locking after a twisting injury playing football.")] },
      {
        heading: "Findings",
        sentences: [
          s("k2", "There is a horizontal tear of the posterior horn of the medial meniscus."),
          s("k3", "The anterior and posterior cruciate ligaments are intact."),
          s("k4", "The collateral ligaments are intact."),
          s("k5", "Small joint effusion."),
          s("k6", "Mild cartilage thinning in the medial compartment."),
        ],
      },
      {
        heading: "Conclusion",
        sentences: [
          s("k7", "Horizontal tear of the posterior horn of the medial meniscus with small effusion."),
          s("k8", "Recommend orthopaedic review to discuss management."),
        ],
      },
    ],
    careNote: {
      author: "Orthopaedic clinic",
      date: "2026-10-30",
      patientVisible: true,
      sentences: [s("m1", "An orthopaedic clinic appointment has been booked for 2 December 2026 at 10:30.")],
    },
  },
  {
    // Another patient's record — must never be returned for this session.
    id: "xr-hand-other",
    patientId: "pt-other-999",
    released: true,
    name: "X-ray of the right hand",
    shortName: "hand X-ray",
    date: "2026-09-01",
    referringTeam: "Emergency Department",
    overview: "",
    report: [],
    careNote: null,
  },
];

/** Only the session patient's released records, with only patient-visible notes. */
export function getPatientRecord(patientId: string, resultId: string): ScanRecord | null {
  const r = RECORDS.find((x) => x.id === resultId && x.patientId === patientId && x.released);
  if (!r) return null;
  return { ...r, careNote: r.careNote?.patientVisible ? r.careNote : null };
}

export function listPatientRecords(patientId: string): ScanRecord[] {
  return RECORDS.filter((x) => x.patientId === patientId && x.released);
}
