import { useSyncExternalStore } from "react";

// "Preset demo mode" lives outside any one chat, so it stays selected when the
// presenter switches scans (and survives a page refresh in the same tab).
const KEY = "askAboutMyScan.presetMode";
const listeners = new Set<() => void>();

function read(): boolean {
  try {
    return typeof window !== "undefined" && window.sessionStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

let value = read();

export function setPresetMode(next: boolean) {
  value = next;
  try {
    window.sessionStorage.setItem(KEY, next ? "1" : "0");
  } catch {
    // storage unavailable: keep the in-memory value
  }
  listeners.forEach((l) => l());
}

export function usePresetMode(): boolean {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => value,
    () => false,
  );
}
