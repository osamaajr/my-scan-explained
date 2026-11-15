import { createFileRoute, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { MessageCircleQuestion } from "lucide-react";
import { getResult } from "@/lib/scans.functions";
import { AppShell, formatDate } from "@/components/AppShell";
import { ChatPanel } from "@/components/ChatPanel";
import { MedicalHelp } from "@/components/MedicalHelp";
import { ReportSections, ReportSentence } from "@/components/ReportView";
import { ScanImage } from "@/components/ScanImage";

const resultQuery = (id: string) =>
  queryOptions({ queryKey: ["result", id], queryFn: () => getResult({ data: { id } }) });

export const Route = createFileRoute("/results/$id")({
  loader: async ({ context, params }) => {
    const r = await context.queryClient.ensureQueryData(resultQuery(params.id));
    if (!r) throw notFound();
    return { name: r.name };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.name ?? "Result"} · My Scan, Explained` },
      {
        name: "description",
        content: "Your scan result explained in plain English, with the original report.",
      },
      { property: "og:title", content: `${loaderData?.name ?? "Result"} · My Scan, Explained` },
      {
        property: "og:description",
        content: "Your scan result explained in plain English, with the original report.",
      },
    ],
  }),
  component: ResultPage,
});

function ResultPage() {
  const { id } = Route.useParams();
  const { data: r } = useSuspenseQuery(resultQuery(id));
  const [chatOpen, setChatOpen] = useState(false);
  const [highlight, setHighlight] = useState<string[]>([]);

  useEffect(() => {
    setHighlight([]);
    setChatOpen(false);
  }, [id]);

  if (!r) return null;

  const showSource = (ids: string[]) => {
    setHighlight(ids);
    setChatOpen(false);
    setTimeout(
      () =>
        document
          .getElementById(`s-${ids[0]}`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" }),
      80,
    );
  };

  return (
    <AppShell back>
      <h1 className="text-3xl font-bold">{r.name}</h1>
      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 bg-card p-4">
        <dt className="font-bold">Date</dt>
        <dd>{formatDate(r.date)}</dd>
        <dt className="font-bold">Requested by</dt>
        <dd>{r.referringTeam}</dd>
        <dt className="font-bold">Status</dt>
        <dd>Reported and released to you</dd>
      </dl>

      <ScanImage kind={r.imageKind} />

      <section className="mt-5 bg-card p-4" aria-labelledby="radiology-report-title">
        <h2 id="radiology-report-title" className="text-xl font-bold">
          Radiology report
        </h2>
        <div className="mt-4 space-y-4 leading-relaxed">
          <ReportSections report={r.report} highlight={highlight} />
        </div>
      </section>

      {r.careNote && (
        <section className="mt-5 border-l-8 border-success bg-card p-4">
          <h2 className="text-xl font-bold">Note from your care team</h2>
          <p className="text-sm text-muted-foreground">
            {r.careNote.author} · {formatDate(r.careNote.date)}
          </p>
          <p className="mt-2">
            {r.careNote.sentences.map((s) => (
              <ReportSentence key={s.id} sentence={s} highlight={highlight} />
            ))}
          </p>
        </section>
      )}

      <div className="mt-6">
        <MedicalHelp />
      </div>

      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="focus-nhs fixed bottom-5 right-5 z-30 flex items-center gap-2 rounded-full bg-primary px-5 py-3.5 font-bold text-primary-foreground shadow-lg"
        >
          <MessageCircleQuestion className="size-6" aria-hidden /> Ask about this result
        </button>
      )}
      <ChatPanel
        key={r.id}
        result={r}
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        onShowSource={showSource}
      />
    </AppShell>
  );
}
