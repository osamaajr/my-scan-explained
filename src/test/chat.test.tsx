import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { getPatientRecord, SESSION_PATIENT_ID } from "@/lib/records.server";
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
const liveReply = (rec: typeof chest, answer: string, sources: string[] = []) => ({
  answer,
  sources,
  sections: [],
  mode: "live" as const,
  resultId: rec.id,
});

beforeEach(() => {
  clearConversations();
  mockAsk.mockReset();
});
afterEach(cleanup);

describe("there is no preset/offline toggle", () => {
  it("every question is sent to the server with no preset flag", async () => {
    render(<Panel rec={chest} />);
    mockAsk.mockResolvedValueOnce(liveReply(chest, "The report describes a 7 mm nodule."));
    await send("Does this mean I have cancer?");
    expect(screen.queryByText("Preset demo mode")).not.toBeInTheDocument();
    expect(mockAsk.mock.calls[0]![0]!.data).toEqual({
      resultId: chest.id,
      question: "Does this mean I have cancer?",
      history: [],
    });
  });

  it("shows the fixed NHS help guidance for a safety reply, without calling it a preset", async () => {
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

  it("shows a plain apology, not report content, when the server call fails outright", async () => {
    render(<Panel rec={chest} />);
    mockAsk.mockRejectedValueOnce(new Error("network down"));
    await send("Is my next scan booked?");
    expect(screen.getByText(/couldn't reach the assistant/)).toBeInTheDocument();
  });
});

describe("source highlights", () => {
  it("Show source passes the cited sentence IDs, and those sentences render highlighted", async () => {
    const onShowSource = vi.fn();
    render(<Panel rec={chest} onShowSource={onShowSource} />);
    mockAsk.mockResolvedValueOnce(liveReply(chest, "It's indeterminate.", ["r4", "r5", "r12"]));
    await send("Does this mean I have cancer?");
    fireEvent.click(screen.getByText("Show source"));
    const ids = onShowSource.mock.calls[0]![0] as string[];
    expect(ids).toEqual(["r4", "r5", "r12"]);
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
    expect(lit).toEqual(["s-r4", "s-r5", "s-r12"]);
    expect(container.querySelector("#s-r5")!.textContent).toMatch(/indeterminate/);
  });
});

describe("switching scans while a reply is pending", () => {
  it("never shows the chest reply in the knee chat, and files it under the chest scan", async () => {
    let resolve!: (v: unknown) => void;
    mockAsk.mockReturnValueOnce(new Promise((r) => (resolve = r)) as never);
    const { rerender } = render(<Panel rec={chest} />);
    await send("Does this mean I have cancer?");
    expect(screen.getByText("Reading your report…")).toBeInTheDocument();

    rerender(<Panel rec={knee} />);
    expect(screen.getByText(/your knee MRI/)).toBeInTheDocument();
    await act(async () => {
      resolve(liveReply(chest, "The 7 mm nodule is indeterminate."));
    });
    expect(screen.queryByText(/7 mm nodule/)).not.toBeInTheDocument();
    expect(screen.queryByText("Reading your report…")).not.toBeInTheDocument();

    rerender(<Panel rec={chest} />);
    expect(screen.getByText("Does this mean I have cancer?")).toBeInTheDocument();
    expect(screen.getByText(/7 mm nodule/)).toBeInTheDocument();
  });
});
