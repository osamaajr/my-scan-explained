import { useEffect, useRef, useState } from "react";
import { X, Send } from "lucide-react";
import { askAboutResult } from "@/lib/scans.functions";
import { formatDate } from "@/components/AppShell";
import { MedicalHelp } from "@/components/MedicalHelp";
import { setPresetMode, usePresetMode } from "@/lib/preset-mode";
import type { AnswerMode, FallbackReason, Section } from "@/lib/demo-answers";

type Msg = {
  role: "user" | "assistant";
  text: string;
  sources?: string[];
  sections?: Section[];
  mode?: AnswerMode | "error";
  fallbackReason?: FallbackReason | undefined;
};
type Result = { id: string; name: string; shortName: string; date: string };

// Conversations kept separately per result for this browser session.
const conversations = new Map<string, Msg[]>();
/** Test helper: forget all conversations. */
export function clearConversations() {
  conversations.clear();
}

const STARTERS = ["What did the scan find?", "What does this term mean?", "What happens next?"];

const FALLBACK_LABEL: Record<FallbackReason, string> = {
  timeout: "Live AI timed out",
  unavailable: "Live AI unavailable",
  invalid_response: "Live AI gave an unusable reply",
};

function ModeBadge({ m }: { m: Msg }) {
  if (m.mode === "live")
    return (
      <span className="rounded-sm bg-success px-1.5 text-xs font-bold text-primary-foreground">
        Live AI answer
      </span>
    );
  if (m.mode === "preset")
    return (
      <span className="rounded-sm bg-accent px-1.5 text-xs font-bold text-accent-foreground">
        Preset demo answer
      </span>
    );
  if (m.mode === "fallback")
    return (
      <span className="rounded-sm border-2 border-destructive px-1.5 text-xs font-bold text-destructive">
        {FALLBACK_LABEL[m.fallbackReason ?? "unavailable"]} · preset answer shown
      </span>
    );
  return null;
}

export function ChatPanel({
  result,
  open,
  onClose,
  onShowSource,
}: {
  result: Result;
  open: boolean;
  onClose: () => void;
  onShowSource: (ids: string[]) => void;
}) {
  const greeting: Msg = {
    role: "assistant",
    text: `I'm looking at your ${result.shortName} from ${formatDate(result.date, { day: "numeric", month: "long" })}. What would you like to understand?`,
  };
  const [msgs, setMsgs] = useState<Msg[]>(() => conversations.get(result.id) ?? [greeting]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const preset = usePresetMode();
  const live = useRef(true);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
    }; // this panel's scan was closed or switched
  }, []);
  useEffect(() => {
    conversations.set(result.id, msgs);
    endRef.current?.scrollIntoView?.({ block: "end" });
  }, [msgs, result.id]);
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open, pending]);

  async function ask(q: string) {
    const question = q.trim();
    if (!question || pending) return;
    // Error and fixed-safety messages aren't part of the conversation the model sees.
    const history = msgs
      .slice(1)
      .filter((m) => m.mode !== "error" && m.mode !== "safety")
      .map(({ role, text }) => ({ role, text }));
    setMsgs((m) => [...m, { role: "user", text: question }]);
    setInput("");
    setPending(true);
    const forId = result.id;
    let reply: Msg;
    try {
      const res = await askAboutResult({ data: { resultId: forId, question, history, preset } });
      if (res.resultId !== forId) throw new Error("Answer was for a different result");
      reply = {
        role: "assistant",
        text: res.answer,
        sources: res.sources,
        sections: res.sections,
        mode: res.mode,
        fallbackReason: res.fallbackReason,
      };
    } catch {
      reply = {
        role: "assistant",
        text: "Sorry, I couldn't answer just now. Please try again, or switch on preset demo mode.",
        mode: "error",
      };
    }
    if (live.current) {
      setMsgs((m) => [...m, reply]);
      setPending(false);
    } else {
      // The presenter switched scans while waiting: file the reply under the
      // scan it belongs to, never in the chat that's now open.
      conversations.set(forId, [...(conversations.get(forId) ?? []), reply]);
    }
  }

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-foreground/40 sm:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label={`Chat about your ${result.name}`}
        onClick={(e) => e.stopPropagation()}
        className="flex h-[88vh] w-full max-w-xl flex-col bg-background shadow-2xl sm:h-[80vh] sm:rounded-md"
      >
        <div className="bg-header px-4 py-3 text-primary-foreground sm:rounded-t-md">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm">Ask about this result</p>
              <h2 className="text-lg font-bold">
                {result.name} · {formatDate(result.date)}
              </h2>
            </div>
            <button onClick={onClose} aria-label="Close chat" className="focus-nhs rounded-sm p-1">
              <X className="size-6" />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 border-b border-border bg-card px-4 py-2">
          <MedicalHelp compact />
          <div className="flex items-center gap-2">
            <span
              className={`rounded-sm px-1.5 text-xs font-bold ${preset ? "bg-accent text-accent-foreground" : "bg-success text-primary-foreground"}`}
            >
              {preset ? "Answers: preset" : "Answers: live AI"}
            </span>
            <label className="flex items-center gap-2 text-sm font-bold">
              <input
                type="checkbox"
                checked={preset}
                onChange={(e) => setPresetMode(e.target.checked)}
                className="size-4 accent-primary"
              />
              Preset demo mode
            </label>
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
          {msgs.map((m, i) => (
            <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
              <div
                className={
                  m.role === "user"
                    ? "max-w-[85%] rounded-md bg-primary px-3 py-2 text-primary-foreground"
                    : "max-w-[95%]"
                }
              >
                <p className="whitespace-pre-wrap">{m.text}</p>
                {m.mode === "safety" && (
                  <div className="mt-2">
                    <MedicalHelp defaultOpen />
                  </div>
                )}
                {m.sections?.map((s) => (
                  <section key={s.title} className="mt-3 border-l-4 border-primary bg-card p-3">
                    <h3 className="font-bold">{s.title}</h3>
                    <p className="mt-1">{s.text}</p>
                    {s.sources.length > 0 && (
                      <button
                        onClick={() => onShowSource(s.sources)}
                        className="focus-nhs mt-1 text-sm font-bold text-primary underline underline-offset-4"
                      >
                        Show source
                      </button>
                    )}
                  </section>
                ))}
                {m.role === "assistant" &&
                (m.sources?.length || (m.mode && m.mode !== "safety" && m.mode !== "error")) ? (
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-sm">
                    {m.sources && m.sources.length > 0 && (
                      <button
                        onClick={() => onShowSource(m.sources!)}
                        className="focus-nhs font-bold text-primary underline underline-offset-4"
                      >
                        Show source
                      </button>
                    )}
                    <ModeBadge m={m} />
                  </div>
                ) : null}
              </div>
            </div>
          ))}
          {pending && <p className="text-muted-foreground">Reading your report…</p>}
          {msgs.length === 1 && (
            <div className="flex flex-col items-start gap-2 pt-1">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => ask(s)}
                  className="focus-nhs rounded-md border-2 border-primary bg-card px-3 py-2 font-bold text-primary"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          <div ref={endRef} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
          className="border-t border-border bg-card p-3"
        >
          <div className="flex items-end gap-2">
            <label htmlFor="chat-q" className="sr-only">
              Your question
            </label>
            <textarea
              id="chat-q"
              ref={inputRef}
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  ask(input);
                }
              }}
              placeholder="Type your question"
              className="focus-nhs flex-1 resize-none rounded-sm border-2 border-input bg-background px-3 py-2"
            />
            <button
              type="submit"
              disabled={pending || !input.trim()}
              aria-label="Send"
              className="focus-nhs flex size-12 items-center justify-center rounded-md bg-primary text-primary-foreground disabled:opacity-50"
            >
              <Send className="size-5" />
            </button>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            AI explains your report only. It can't diagnose or change your care. Ask your care team
            about decisions.
          </p>
        </form>
      </div>
    </div>
  );
}
