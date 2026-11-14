import type { Sentence } from "@/lib/records.server";

// One report or care-note sentence; highlighted when an answer cites it.
export function ReportSentence({
  sentence,
  highlight,
}: {
  sentence: Sentence;
  highlight: string[];
}) {
  const on = highlight.includes(sentence.id);
  return (
    <span
      id={`s-${sentence.id}`}
      data-highlighted={on ? "true" : undefined}
      className={
        on ? "rounded-sm bg-highlight px-0.5 font-bold outline outline-2 outline-foreground" : ""
      }
    >
      {sentence.text}{" "}
    </span>
  );
}

export function ReportSections({
  report,
  highlight,
}: {
  report: { heading: string; sentences: Sentence[] }[];
  highlight: string[];
}) {
  return (
    <>
      {report.map((sec) => (
        <div key={sec.heading}>
          <h3 className="font-sans font-bold">{sec.heading}</h3>
          <p>
            {sec.sentences.map((s) => (
              <ReportSentence key={s.id} sentence={s} highlight={highlight} />
            ))}
          </p>
        </div>
      ))}
    </>
  );
}
