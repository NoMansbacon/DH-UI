// Shared numeric helpers used across multiple modules.
// Keep this file dependency-light so it can be imported from core, UI, and blocks.

export function asNum(v: unknown, def = 0): number {
  if (v === null || v === undefined) return def;
  const n = Number(String(v).trim());
  return Number.isFinite(n) ? n : def;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
