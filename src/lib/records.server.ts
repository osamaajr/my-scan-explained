// Fictional, server-side sample records. Never real patient data.
// Fictional consultant-style reports use structured headings and clinical
// terminology. Plain-English explanations come from chat.
export type Sentence = { id: string; text: string };
export type ImageKind = "ct-chest" | "mri-knee" | "mri-spine";
export type ScanRecord = {
  id: string;
  patientId: string;
  released: boolean;
  name: string;
  shortName: string;
  date: string; // ISO
  referringTeam: string;
  imageKind: ImageKind;
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
    imageKind: "ct-chest",
    report: [
      {
        heading: "Clinical information",
        sentences: [
          s(
            "r1",
            "Persistent cough for 8 weeks. Ex-smoker with an estimated 20 pack-year history. Referred to exclude bronchogenic malignancy.",
          ),
        ],
      },
      {
        heading: "Technique",
        sentences: [
          s(
            "r2",
            "Contrast-enhanced CT thorax acquired at 1.25 mm slice thickness from the lung apices through the upper abdomen. Axial images and coronal and sagittal multiplanar reformats reviewed on lung, mediastinal and bone windows.",
          ),
        ],
      },
      {
        heading: "Comparison",
        sentences: [
          s(
            "r3",
            "No prior chest CT or other imaging is available for direct comparison at the time of reporting.",
          ),
        ],
      },
      {
        heading: "Findings — lungs and airways",
        sentences: [
          s(
            "r4",
            "A solitary 7 mm solid, non-calcified pulmonary nodule is present in the right upper lobe (axial lung series).",
          ),
          s(
            "r5",
            "Its aetiology is indeterminate on this examination; stability cannot be assessed without prior imaging.",
          ),
          s(
            "r6",
            "No additional suspicious pulmonary nodule, focal pulmonary mass, air-space consolidation or lobar collapse.",
          ),
          s(
            "r9",
            "Mild upper-lobe-predominant centrilobular emphysema. Central tracheobronchial tree is patent.",
          ),
        ],
      },
      {
        heading: "Findings — mediastinum and pleura",
        sentences: [
          s(
            "r7",
            "No pathologically enlarged mediastinal, hilar or axillary lymph nodes by CT size criteria.",
          ),
          s("r8", "No pleural or pericardial effusion. No pneumothorax."),
          s("r14", "Thoracic aorta is normal in calibre. No mediastinal mass."),
        ],
      },
      {
        heading: "Findings — upper abdomen and bones",
        sentences: [
          s(
            "r10",
            "No acute abnormality in the imaged upper abdomen. No destructive osseous lesion in the imaged thoracic skeleton.",
          ),
        ],
      },
      {
        heading: "Conclusion",
        sentences: [
          s(
            "r11",
            "Solitary indeterminate 7 mm solid right upper lobe pulmonary nodule. No thoracic lymphadenopathy.",
          ),
          s(
            "r12",
            "Retrieve prior chest CT for comparison if available. If no suitable comparator is found, recommend low-dose thin-section CT at 3 months to assess growth, with subsequent surveillance guided by interval change and clinical risk in accordance with British Thoracic Society pulmonary nodule guidance.",
          ),
          s("r13", "Mild upper-lobe centrilobular emphysema."),
        ],
      },
    ],
    careNote: {
      author: "Respiratory team",
      date: "2026-11-13",
      patientVisible: true,
      sentences: [
        s(
          "n1",
          "We have received your CT report and are requesting your previous chest X-ray and scan images from your GP practice.",
        ),
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
    imageKind: "mri-knee",
    report: [
      {
        heading: "Clinical information",
        sentences: [
          s("k1", "Left knee pain and locking after a twisting injury sustained playing football."),
        ],
      },
      {
        heading: "Technique",
        sentences: [
          s(
            "k2",
            "Non-contrast MRI of the left knee with sagittal, coronal and axial proton-density and fluid-sensitive sequences, together with sagittal T1-weighted imaging.",
          ),
        ],
      },
      {
        heading: "Comparison",
        sentences: [s("k3", "No prior left knee MRI is available for comparison.")],
      },
      {
        heading: "Findings — menisci",
        sentences: [
          s(
            "k4",
            "Horizontal tear of the posterior horn of the medial meniscus, extending to the inferior articular surface. No displaced meniscal fragment.",
          ),
          s("k5", "Lateral meniscus is intact with preserved morphology and signal."),
        ],
      },
      {
        heading: "Findings — ligaments and extensor mechanism",
        sentences: [
          s("k6", "Anterior and posterior cruciate ligaments are intact."),
          s("k7", "Medial and lateral collateral ligament complexes are intact."),
          s("k14", "Quadriceps and patellar tendons are intact. Patella is normally aligned."),
        ],
      },
      {
        heading: "Findings — cartilage, bone and fluid",
        sentences: [
          s(
            "k9",
            "Mild partial-thickness chondral thinning in the medial femorotibial compartment without full-thickness defect or subchondral marrow change. Lateral and patellofemoral articular cartilage is preserved.",
          ),
          s("k10", "No acute fracture, marrow oedema or focal marrow-replacing lesion."),
          s(
            "k8",
            "Small knee joint effusion. No popliteal cyst or intra-articular loose body identified.",
          ),
        ],
      },
      {
        heading: "Conclusion",
        sentences: [
          s(
            "k11",
            "Undisplaced horizontal tear of the posterior horn of the medial meniscus with a small joint effusion.",
          ),
          s(
            "k12",
            "Mild medial compartment chondral loss. Cruciate and collateral ligaments are intact; no acute osseous injury.",
          ),
          s("k13", "Correlate with the reported mechanical symptoms at orthopaedic review."),
        ],
      },
    ],
    careNote: {
      author: "Orthopaedic clinic",
      date: "2026-10-30",
      patientVisible: true,
      sentences: [
        s("m1", "An orthopaedic clinic appointment has been booked for 2 December 2026 at 10:30."),
      ],
    },
  },
  {
    id: "mri-spine-2026-11-05",
    patientId: SESSION_PATIENT_ID,
    released: true,
    name: "MRI scan of the lumbar spine",
    shortName: "lumbar spine MRI",
    date: "2026-11-05",
    referringTeam: "Spinal Service, St Elsewhere Hospital",
    imageKind: "mri-spine",
    report: [
      {
        heading: "Clinical information",
        sentences: [
          s(
            "sp1",
            "Six-month history of worsening lower back pain radiating into the left leg, consistent with sciatica. No red-flag symptoms of cauda equina syndrome reported.",
          ),
        ],
      },
      {
        heading: "Technique",
        sentences: [
          s(
            "sp2",
            "Non-contrast MRI of the lumbar spine with sagittal T1-, T2- and fluid-sensitive sequences and axial T2-weighted images through the lumbar disc levels. Five lumbar-type vertebral bodies are assumed for numbering.",
          ),
        ],
      },
      {
        heading: "Comparison",
        sentences: [s("sp3", "No prior lumbar spine MRI is available for comparison.")],
      },
      {
        heading: "Findings — alignment and neural structures",
        sentences: [
          s(
            "sp4",
            "Lumbar alignment and vertebral body heights are maintained. No acute osseous abnormality or suspicious marrow-replacing lesion.",
          ),
          s(
            "sp8",
            "Conus medullaris terminates at L1 and has normal signal. Cauda equina roots are not compressed.",
          ),
          s("sp9", "No paraspinal soft tissue mass or collection."),
        ],
      },
      {
        heading: "Findings — disc levels",
        sentences: [
          s(
            "sp13",
            "T12/L1 to L3/4: Disc height is preserved, without focal protrusion or significant canal, subarticular recess or foraminal stenosis.",
          ),
          s("sp5", "Disc desiccation with mild loss of disc height at L4/5 and L5/S1."),
          s(
            "sp6",
            "L4/5: Broad-based posterior disc bulge with a superimposed left paracentral/subarticular protrusion narrows the left lateral recess and contacts the traversing left L5 nerve root. Mild central canal narrowing; no significant foraminal stenosis.",
          ),
          s(
            "sp7",
            "L5/S1: Mild bilateral facet arthropathy without significant canal, lateral recess or foraminal stenosis.",
          ),
        ],
      },
      {
        heading: "Conclusion",
        sentences: [
          s(
            "sp10",
            "L4/5 left paracentral/subarticular disc protrusion contacts the traversing left L5 nerve root, a potential correlate for left-sided radicular symptoms. Mild associated central canal narrowing.",
          ),
          s("sp11", "No high-grade canal stenosis or cauda equina compression."),
          s(
            "sp12",
            "Correlate with the neurological examination and symptom distribution; further management to be determined by the spinal clinical team.",
          ),
        ],
      },
    ],
    careNote: {
      author: "Spinal multidisciplinary team",
      date: "2026-11-07",
      patientVisible: true,
      sentences: [
        s(
          "pl1",
          "We have discussed your scan at our spinal multidisciplinary team meeting and are referring you for a physiotherapy assessment in the first instance.",
        ),
        s(
          "pl2",
          "If your symptoms have not improved in 6 weeks, we will arrange a spinal surgery clinic review.",
        ),
      ],
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
    imageKind: "ct-chest",
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
