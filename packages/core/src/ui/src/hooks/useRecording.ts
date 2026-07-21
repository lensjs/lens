import { useSyncExternalStore } from "react";

/**
 * Global "recording" (live-updates) state, shared across the whole dashboard and
 * persisted across reloads. When paused, list views stop polling for new entries
 * — mirroring Laravel Telescope's pause button. The server keeps capturing; only
 * the UI's live feed is paused.
 */

const STORAGE_KEY = "lens:recording-paused";

function readInitial(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

let paused = readInitial();
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function setRecordingPaused(next: boolean) {
  if (paused === next) return;
  paused = next;
  try {
    localStorage.setItem(STORAGE_KEY, String(next));
  } catch {
    // ignore storage failures (e.g. private mode)
  }
  emit();
}

export function toggleRecordingPaused() {
  setRecordingPaused(!paused);
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function getSnapshot() {
  return paused;
}

export function useRecordingPaused(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
