import { useState } from "react";

// Fixed NHS guidance — not AI generated.
export function MedicalHelp({ compact }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`focus-nhs font-bold text-destructive underline underline-offset-4 ${compact ? "text-sm" : ""}`}
      >
        Get medical help
      </button>
      {open && (
        <div className="mt-2 border-l-8 border-destructive bg-card p-3 text-sm text-card-foreground">
          <p className="font-bold">If you feel unwell now:</p>
          <ul className="mt-1 list-disc pl-5">
            <li>Call <strong>999</strong> or go to A&amp;E in an emergency, such as chest pain, severe difficulty breathing, or coughing up a lot of blood.</li>
            <li>Call <strong>111</strong> or visit 111.nhs.uk if you need help urgently but it's not an emergency.</li>
            <li>Contact your GP practice for symptoms that are worrying you.</li>
          </ul>
          <p className="mt-1 text-muted-foreground">This guidance is fixed and is not written by the AI assistant.</p>
        </div>
      )}
    </div>
  );
}
