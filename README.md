# My Scan, Explained

**A plain-English companion for radiology reports.** Patients can ask questions about a released scan result, read an explanation in everyday language, and jump back to the exact report lines behind the answer.

Built for the **National MedTech Hackathon 2026**, sponsored by [Lovable](https://lovable.dev). Our team built the patient-facing assistant and its report-grounding workflow using existing AI model APIs, with Lovable supporting rapid prototyping.

> [!IMPORTANT]
> **Hackathon concept demo.** The patient, records, and NHS-style interface are fictional. This is not an NHS service, a diagnostic tool, or a substitute for a clinician. Scan images are AI-generated illustrations, not the fictional patient's actual images.

## The idea

Radiology reports are written for clinical communication and can be hard for patients to read. My Scan, Explained sits beside the original report and helps a patient understand its wording without changing the report or making clinical decisions. The patient can ask a question in their own words rather than choose from a list of preset answers.

![Illustrative knee MRI used in the demo](public/scans/left-knee-mri.webp)

*Illustrative image used on the knee result page. It is AI-generated and is not a diagnostic image.*

## What the prototype does

- Shows three fictional imaging results in a simulated patient portal, including the full radiology report and any patient-visible care-team note.
- Answers new questions about the selected result using a live AI model. Suggested questions are shortcuts, not canned responses.
- Asks the model to link each explanation to one report or care-team sentence. **Show in report** takes the reader back to the source wording.
- Checks generated explanations against their source sentences with server-side rules and a separate model verification call. If a paraphrase cannot be verified, the app shows the exact source wording instead.
- Preserves uncertainty and the difference between a recommended follow-up and a confirmed booking. It does not diagnose, estimate risk, or give treatment advice.
- Directs questions about current symptoms to a medical-help panel. If the AI service is unavailable, it shows an error instead of inventing an answer.

The safety checks reduce risk; they do not guarantee that every explanation is correct. This prototype has not undergone clinical validation, NHS deployment review, or regulatory assessment.

## Try it locally

You need Node.js, npm, and an [OpenAI Platform API key](https://platform.openai.com/api-keys) with available API credit for live answers. API billing is separate from a ChatGPT subscription.

```sh
npm install
cp .env.local.example .env.local
```

Open `.env.local` and set `OPENAI_API_KEY` to your key. Keep that file private; Git ignores it. Then run:

```sh
npm run dev
```

Open the local URL printed by Vite, choose a result, and select **Ask about this result**. The model and verification calls run on the server; the API key is not sent to the browser. `OPENAI_MODEL` and `OPENAI_VERIFIER_MODEL` are optional server-side overrides.

When hosted through Lovable, the app can use the Lovable AI gateway if `OPENAI_API_KEY` is absent and the gateway is configured. The Lovable project files and dependencies remain in the repository for that integration.

## How an answer is produced

1. The patient asks a question about a selected result.
2. The server retrieves that patient's released report and visible care-team note.
3. A live AI model selects relevant source sentences and explains them in plain English.
4. Server-side rules and a second model check each explanation against its source.
5. The answer links back to the report. If a simplification cannot be verified, the app shows the exact source wording.

The demo's fictional records are defined server-side in `src/lib/records.server.ts`. `src/lib/scans.functions.ts` exposes the selected result and chat endpoint. `src/lib/answer.ts` contains the source-grounding and verification pipeline. `src/lib/openai.server.ts` handles local OpenAI calls; `src/lib/gateway.server.ts` handles the Lovable gateway path.

## Checks

```sh
npm test
npm run build
```

`npm run test:live` exercises the external AI service and requires a configured key; it can incur API charges. Unit tests cover source grounding, invented bookings, safety routing, errors, and result access.

## Built with

TanStack Start, React, TypeScript, Vite, and Tailwind CSS. We used [Lovable](https://lovable.dev/projects/24a996ba-4369-58ce-ab1a-24a835c283cd) during prototyping and integrated live AI through the OpenAI Responses API for local development. The app's prompts, report selection, source checks, verification flow, and patient-facing interface are part of this project.

## Next steps

Before any use with real patients, this concept would need clinical partners, representative de-identified test reports, clinician review of errors and omissions, direct testing of patient comprehension, security and privacy work, and assessment against the relevant UK clinical safety and regulatory requirements.
