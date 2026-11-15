import { useEffect, useRef, useState } from "react";
import { FileText, X, Send } from "lucide-react";
import { askAboutResult } from "@/lib/scans.functions";
import { formatDate } from "@/components/AppShell";
import { MedicalHelp } from "@/components/MedicalHelp";
import type { AnswerMode, Section } from "@/lib/answer-types";

type Msg = {
  role: "user" | "assistant";
  text: string;
  sources?: string[];
  sections?: Section[];
  mode?: AnswerMode | "clienterror";
};
type Result = { id: string; name: string; shortName: string; date: string };

// Conversations kept separately per result for this browser session.
const conversations = new Map<string, Msg[]>();
/** Test helper: forget all conversations. */
export function clearConversations() {
  conversations.clear();
}

const STARTERS = ["What did the scan find?", "What happens next?", "Is my next scan booked?"];

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
    text: `I can help explain your ${result.shortName} report from ${formatDate(result.date, { day: "numeric", month: "long" })} in everyday language. What would you like to know?`,
  };
  const [msgs, setMsgs] = useState<Msg[]>(() => conversations.get(result.id) ?? [greeting]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const live = useRef(true);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false; // this panel's scan was closed or switched
    };
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
      .filter((m) => m.mode !== "error" && m.mode !== "safety" && m.mode !== "clienterror")
      .map(({ role, text }) => ({ role, text }));
    setMsgs((m) => [...m, { role: "user", text: question }]);
    setInput("");
    setPending(true);
    const forId = result.id;
    let reply: Msg;
    try {
      const res = await askAboutResult({ data: { resultId: forId, question, history } });
      if (res.resultId !== forId) throw new Error("Answer was for a different result");
      reply = {
        role: "assistant",
        text: res.answer,
        sources: res.sources,
        sections: res.sections,
        mode: res.mode,
      };
    } catch {
      reply = {
        role: "assistant",
        text: "Sorry, I couldn't reach the assistant just now. Please try again.",
        mode: "clienterror",
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
        className="flex h-[88vh] w-full max-w-xl flex-col bg-card shadow-2xl sm:h-[80vh] sm:rounded-md"
      >
        <div className="px-4 pb-2 pt-4 sm:rounded-t-md">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-2xl font-bold leading-tight">Ask about this result</h2>
              <p className="mt-1 text-base text-muted-foreground">
                {result.name} · {formatDate(result.date)}
              </p>
            </div>
            <button onClick={onClose} aria-label="Close chat" className="focus-nhs rounded-sm p-1">
              <X className="size-6" />
            </button>
          </div>
        </div>
        <div className="px-4 py-2">
          <MedicalHelp compact />
        </div>
        <p className="px-4 pb-2 text-xs text-muted-foreground">
          AI explains your report using its source lines and may make mistakes. It cannot diagnose or
          change your care. Check medical decisions with your care team.
        </p>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-3" aria-live="polite">
          {msgs.map((m, i) => (
            <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
              <div
                className={
                  m.role === "user"
                    ? "max-w-[85%] rounded-3xl bg-chat-user px-4 py-3 text-foreground"
                    : "max-w-[90%] rounded-3xl bg-chat-assistant px-4 py-3 text-foreground"
                }
              >
                <p className="whitespace-pre-wrap">{m.text}</p>
                {m.mode === "safety" && (
                  <div className="mt-2">
                    <MedicalHelp defaultOpen />
                  </div>
                )}
                {m.sections?.map((s) => (
                  <section key={s.title} className="mt-3 border-t border-border pt-3">
                    <h3 className="font-bold">{s.title}</h3>
                    <p className="mt-1">{s.text}</p>
                    {s.sources.length > 0 && (
                      <button
                        onClick={() => onShowSource(s.sources)}
                        className="focus-nhs mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-primary underline underline-offset-4"
                      >
                        <FileText className="size-4" aria-hidden="true" />
                        Show in report
                      </button>
                    )}
                  </section>
                ))}
                {m.role === "assistant" && m.sources && m.sources.length > 0 && (
                  <button
                    onClick={() => onShowSource(m.sources!)}
                    className="focus-nhs mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-primary underline underline-offset-4"
                  >
                    <FileText className="size-4" aria-hidden="true" />
                    Show in report
                  </button>
                )}
              </div>
            </div>
          ))}
          {pending && <p className="text-sm text-muted-foreground">Reading your report…</p>}
          <div ref={endRef} />
        </div>

        <div
          aria-label="Suggested questions"
          className="flex shrink-0 gap-2 overflow-x-auto px-4 py-3"
        >
          {STARTERS.filter((s) => !msgs.some((m) => m.role === "user" && m.text === s)).map((s) => (
            <button
              key={s}
              type="button"
              disabled={pending}
              onClick={() => ask(s)}
              className="focus-nhs shrink-0 rounded-xl border-2 border-primary bg-card px-3 py-2 text-sm font-bold text-primary disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
          className="shrink-0 bg-card px-4 pb-4"
        >
          <div className="flex items-end gap-2 rounded-2xl border-2 border-input bg-card p-1.5">
            <label htmlFor="chat-q" className="sr-only">
              Your question
            </label>
            <textarea
              id="chat-q"
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  ask(input);
                }
              }}
              placeholder="Ask a question"
              className="focus-nhs min-h-12 min-w-0 flex-1 resize-none rounded-lg bg-card px-3 py-3 outline-none"
            />
            <button
              type="submit"
              disabled={pending || !input.trim()}
              aria-label="Send"
              className="focus-nhs flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-50"
            >
              <Send className="size-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
