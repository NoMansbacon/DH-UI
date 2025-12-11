/**
 * Centralized event helpers for cross-block reactivity.
 *
 * All custom "dh:*" events should be created and listened to via this module
 * so names and payload shapes stay consistent.
 */

export const DH_EVENT_KV_CHANGED = "dh:kv:changed" as const;
export const DH_EVENT_TRACKER_CHANGED = "dh:tracker:changed" as const;
export const DH_EVENT_REST_SHORT = "dh:rest:short" as const;
export const DH_EVENT_REST_LONG = "dh:rest:long" as const;

export type KvChangedDetail = { key: string; val: any };
export type TrackerChangedDetail = { key: string; filled: number };
export type RestEventDetail = {
  filePath: string;
  hpKey: string;
  stressKey: string;
  armorKey: string;
  hopeKey: string;
};

function safeDispatch<T>(type: string, detail: T) {
  try {
    window.dispatchEvent(new CustomEvent<T>(type, { detail }));
  } catch {
    // Ignore if window is not available (e.g. tests) or dispatch fails.
  }
}

// --- emitters ---

export function emitKvChanged(detail: KvChangedDetail) {
  safeDispatch<KvChangedDetail>(DH_EVENT_KV_CHANGED, detail);
}

export function emitTrackerChanged(detail: TrackerChangedDetail) {
  safeDispatch<TrackerChangedDetail>(DH_EVENT_TRACKER_CHANGED, detail);
}

export function emitRestShort(detail: RestEventDetail) {
  safeDispatch<RestEventDetail>(DH_EVENT_REST_SHORT, detail);
}

export function emitRestLong(detail: RestEventDetail) {
  safeDispatch<RestEventDetail>(DH_EVENT_REST_LONG, detail);
}

// --- listeners (return unsubscribe) ---

export function onTrackerChanged(handler: (detail: TrackerChangedDetail) => void): () => void {
  const wrapped = (e: Event) => {
    const ev = e as CustomEvent<TrackerChangedDetail>;
    if (ev.detail) handler(ev.detail);
  };
  window.addEventListener(DH_EVENT_TRACKER_CHANGED, wrapped as any);
  return () => window.removeEventListener(DH_EVENT_TRACKER_CHANGED, wrapped as any);
}

export function onKvChanged(handler: (detail: KvChangedDetail) => void): () => void {
  const wrapped = (e: Event) => {
    const ev = e as CustomEvent<KvChangedDetail>;
    if (ev.detail) handler(ev.detail);
  };
  window.addEventListener(DH_EVENT_KV_CHANGED, wrapped as any);
  return () => window.removeEventListener(DH_EVENT_KV_CHANGED, wrapped as any);
}

export function onRestShort(handler: (detail: RestEventDetail) => void): () => void {
  const wrapped = (e: Event) => {
    const ev = e as CustomEvent<RestEventDetail>;
    if (ev.detail) handler(ev.detail);
  };
  window.addEventListener(DH_EVENT_REST_SHORT, wrapped as any);
  return () => window.removeEventListener(DH_EVENT_REST_SHORT, wrapped as any);
}

export function onRestLong(handler: (detail: RestEventDetail) => void): () => void {
  const wrapped = (e: Event) => {
    const ev = e as CustomEvent<RestEventDetail>;
    if (ev.detail) handler(ev.detail);
  };
  window.addEventListener(DH_EVENT_REST_LONG, wrapped as any);
  return () => window.removeEventListener(DH_EVENT_REST_LONG, wrapped as any);
}
