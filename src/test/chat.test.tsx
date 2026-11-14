import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { getPatientRecord, SESSION_PATIENT_ID } from "@/lib/records.server";
import { demoAnswer } from "@/lib/demo-answers";
import { setPresetMode } from "@/lib/preset-mode";
import { ReportSections, ReportSentence } from "@/components/ReportView";

vi.mock("@/lib/scans.functions", () => ({ askAboutResult: vi.fn() }));
import { askAboutResult } from "@/lib/scans.functions";
import { ChatPanel, clearConversations } from "@/components/ChatPanel";

const mockAsk = vi.mocked(askAboutResult);
const chest = getPatientRecord(SESSION_PATIENT_ID, "ct-chest-2026-11-12")!;
const knee = getPatientRecord(SESSION_PATIENT_ID, "mri-knee-2026-10-28")!;

function Panel({
  rec,
  onShowSource = () => {},
}: {
  rec: typeof chest;
  onShowSource?: (ids: string[]) => void;
}) {
  return (
    <ChatPanel key={rec.id} result={rec} open onClose={() => {}} onShowSource={onShowSource} />
  );
}
async function send(text: string) {
  fireEvent.change(screen.getByLabelText("Your question"), { target: { value: text } });
  await act(async () => {
    fireEvent.click(screen.getByLabelText("Send"));
  });
}
const reply = (
  rec: typeof chest,
  q: string,
  mode: "live" | "preset" | "fallback" | "safety",
  extra = {},
) => ({
  ...demoAnswer(rec.id, q),
  mode,
  resultId: rec.id,
  ...extra,
});

beforeEach(() => {
  clearConversations();
  setPresetMode(false);
  mockAsk.mockReset();
});
afterEach(cleanup);

describe("answer mode is visible", () => {
  it("labels live, preset and fallback answers differently", async () => {
    render(<Panel rec={chest} />);
    mockAsk.mockResolvedValueOnce(reply(chest, "Does this mean I have cancer?", "live"));
    await send("Does this mean I have cancer?");
    expect(screen.getByText("Live AI answer")).toBeInTheDocument();

    mockAsk.mockResolvedValueOnce(
      reply(chest, "Is my next scan booked?", "fallback", { fallbackReason: "timeout" }),
    );
    await send("Is my next scan booked?");
    expect(screen.getByText(/Live AI timed out · preset answer shown/)).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Preset demo mode"));
    mockAsk.mockResolvedValueOnce(reply(chest, "What happens next?", "preset"));
    await send("What happens next?");
    expect(screen.getByText("Preset demo answer")).toBeInTheDocument();
    expect(mockAsk.mock.calls.at(-1)![0]!.data.preset).toBe(true);
  });

  it("keeps preset mode selected when switching scans", async () => {
    const { rerender } = render(<Panel rec={chest} />);
    fireEvent.click(screen.getByLabelText("Preset demo mode"));
    rerender(<Panel rec={knee} />);
    expect(screen.getByLabelText("Preset demo mode")).toBeChecked();
    expect(screen.getByText("Answers: preset")).toBeInTheDocument();
    mockAsk.mockResolvedValueOnce(reply(knee, "Is my next scan booked?", "preset"));
    await send("Is my next scan booked?");
    expect(mockAsk.mock.calls[0]![0]!.data).toMatchObject({ resultId: knee.id, preset: true });
  });

  it("shows the fixed NHS help guidance for a safety reply", async () => {
    render(<Panel rec={chest} />);
    mockAsk.mockResolvedValueOnce({
      answer: "It sounds like…",
      sources: [],
      sections: [],
      mode: "safety",
      urgent: true,
      resultId: chest.id,
    });
    await send("I'm coughing up blood right now");
    expect(
      screen.getByText(/This guidance is fixed and is not written by the AI/),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Get medical help").length).toBeGreaterThanOrEqual(2); // header link + panel
  });
});

describe("source highlights", () => {
  it("Show source passes the cited sentence IDs, and those sentences render highlighted", async () => {
    const onShowSource = vi.fn();
    render(<Panel rec={chest} onShowSource={onShowSource} />);
    mockAsk.mockResolvedValueOnce(reply(chest, "Does this mean I have cancer?", "preset"));
    await send("Does this mean I have cancer?");
    fireEvent.click(screen.getByText("Show source"));
    const ids = onShowSource.mock.calls[0]![0] as string[];
    expect(ids).toEqual(["r2", "r3", "r8"]);
    cleanup();

    const { container } = render(
      <div>
        <ReportSections report={chest.report} highlight={ids} />
        {chest.careNote!.sentences.map((s) => (
          <ReportSentence key={s.id} sentence={s} highlight={ids} />
        ))}
      </div>,
    );
    const lit = [...container.querySelectorAll("[data-highlighted]")].map((e) => e.id);
    expect(lit).toEqual(["s-r2", "s-r3", "s-r8"]);
    expect(container.querySelector("#s-r3")!.textContent).toMatch(/indeterminate/);
  });
});

describe("switching scans while a reply is pending", () => {
  it("never shows the chest reply in the knee chat, and files it under the chest scan", async () => {
    let resolve!: (v: unknown) => void;
    mockAsk.mockReturnValueOnce(
      new Promise((r) => {
        resolve = r;
      }) as never,
    );
    const { rerender } = render(<Panel rec={chest} />);
    await send("Does this mean I have cancer?");
    expect(screen.getByText("Reading your report…")).toBeInTheDocument();

    rerender(<Panel rec={knee} />);
    expect(screen.getByText(/your knee MRI/)).toBeInTheDocument();
    await act(async () => {
      resolve(reply(chest, "Does this mean I have cancer?", "live"));
    });
    expect(screen.queryByText(/7 mm nodule/)).not.toBeInTheDocument();
    expect(screen.queryByText("Reading your report…")).not.toBeInTheDocument();

    rerender(<Panel rec={chest} />);
    expect(screen.getByText("Does this mean I have cancer?")).toBeInTheDocument();
    expect(screen.getByText(/7 mm nodule/)).toBeInTheDocument();
  });
});
