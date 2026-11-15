import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function AppShell({ children, back }: { children: ReactNode; back?: boolean }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-accent px-4 py-1.5 text-center text-sm font-bold text-accent-foreground">
        My Scan, Explained · Hackathon prototype · Simulated NHS App · Fictional patient
      </div>
      <header className="bg-header text-primary-foreground">
        <div className="mx-auto flex max-w-xl items-center justify-between px-4 py-3">
          <Link to="/" className="focus-nhs flex items-center gap-2 rounded-sm">
            <img src="/nhs-logo.png" alt="NHS" width="70" height="28" className="h-7 w-auto" />
            <span className="font-bold">App</span>
          </Link>
          <span className="text-sm">Sam Taylor · NHS no. 000 000 0000</span>
        </div>
      </header>
      <main className="mx-auto max-w-xl px-4 pb-32 pt-4">
        {back && (
          <Link to="/" className="focus-nhs mb-3 inline-block rounded-sm font-bold text-primary underline underline-offset-4">
            ‹ Back to test results
          </Link>
        )}
        {children}
      </main>
    </div>
  );
}

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" }) {
  return new Date(iso + "T12:00:00Z").toLocaleDateString("en-GB", { timeZone: "UTC", ...opts });
}
