import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { listResults } from "@/lib/scans.functions";
import { AppShell, formatDate } from "@/components/AppShell";

const resultsQuery = queryOptions({ queryKey: ["results"], queryFn: () => listResults() });

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Test results · Ask About My Scan" },
      { name: "description", content: "Your scan results in a simulated NHS App, with plain-English explanations." },
      { property: "og:title", content: "Test results · Ask About My Scan" },
      { property: "og:description", content: "Your scan results in a simulated NHS App, with plain-English explanations." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(resultsQuery),
  component: Index,
});

function Index() {
  const { data } = useSuspenseQuery(resultsQuery);
  return (
    <AppShell>
      <h1 className="mb-1 text-3xl font-bold">Test results</h1>
      <p className="mb-5 text-muted-foreground">Imaging results released to you by your care team.</p>
      <ul className="space-y-3">
        {data.map((r) => (
          <li key={r.id}>
            <Link
              to="/results/$id"
              params={{ id: r.id }}
              className="focus-nhs block border-b-4 border-border bg-card p-4 hover:border-primary"
            >
              <span className="block text-lg font-bold text-primary underline underline-offset-4">{r.name}</span>
              <span className="mt-1 block">{formatDate(r.date)}</span>
              <span className="block text-sm text-muted-foreground">Requested by {r.referringTeam}</span>
            </Link>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
