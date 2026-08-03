import { useSyncExternalStore } from "react";

export type Toast = {
  id: number;
  title: string;
  description?: string;
  onClick?: () => void;
};

const AUTO_DISMISS_MS = 6000;
const MAX_TOASTS = 5;

let toasts: Toast[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function pushToast(toast: Omit<Toast, "id">): number {
  const id = nextId++;
  toasts = [{ id, ...toast }, ...toasts].slice(0, MAX_TOASTS);
  emit();
  setTimeout(() => dismissToast(id), AUTO_DISMISS_MS);
  return id;
}

export function dismissToast(id: number): void {
  const next = toasts.filter((t) => t.id !== id);
  if (next.length !== toasts.length) {
    toasts = next;
    emit();
  }
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function getSnapshot() {
  return toasts;
}

export function useToasts(): Toast[] {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
