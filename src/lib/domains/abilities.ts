// src/lib/domains/abilities.ts
import { parseYamlSafe } from "../utils/yaml";

export type AbilityName =
  | "Agility"
  | "Strength"
  | "Finesse"
  | "Instinct"
  | "Presence"
  | "Knowledge";

export const ABILITIES_ORDER: AbilityName[] = [
  "Agility",
  "Strength",
  "Finesse",
  "Instinct",
  "Presence",
  "Knowledge",
];

export type AbilityMap = Partial<Record<AbilityName, number>>;

export interface TraitsBlock {
  abilities?: AbilityMap;
  trait?: AbilityMap | AbilityMap[];
}

export interface AbilityCard {
  /** e.g., "AGI" */
  label: string;
  /** total (base + trait bonuses) */
  total: number;
  /** full name for display/title, e.g. "Agility" */
  name: AbilityName;
  /** persistent toggle state key (for localStorage) */
  storageKey: string;
  /** whether toggle is ON initially */
  toggled: boolean;
}

/* ---------------- helpers ---------------- */

function normalizeMap(obj: any): AbilityMap {
  const out: AbilityMap = {};
  if (!obj || typeof obj !== "object") return out;

  // Accept canonical names (Agility) and case-insensitive keys (agility)
  const lowerToCanon = new Map<string, AbilityName>(
    ABILITIES_ORDER.map((n) => [n.toLowerCase(), n])
  );

  // Iterate provided keys for flexibility
  for (const key of Object.keys(obj)) {
    const canon = lowerToCanon.get(key.toLowerCase());
    if (!canon) continue;
    const num = Number((obj as any)[key] ?? 0);
    if (!Number.isNaN(num)) out[canon] = num;
  }

  // Ensure missing keys are treated as 0 downstream (handled by callers)
  return out;
}

function addMaps(a: AbilityMap, b: AbilityMap): AbilityMap {
  const out: AbilityMap = {};
  for (const k of ABILITIES_ORDER) {
    out[k] = (a[k] ?? 0) + (b[k] ?? 0);
  }
  return out;
}

/* ---------------- primary API ---------------- */

export function parseTraitsYaml(src: string): { base: AbilityMap; traitSum: AbilityMap } {
  let doc: TraitsBlock = {};
  try {
    doc = (parseYamlSafe<TraitsBlock>(src)) ?? {};
  } catch {
    doc = {};
  }

  const base = normalizeMap(doc.abilities);
  let traitSum: AbilityMap = {};
  const t = doc.trait;
  if (Array.isArray(t)) {
    traitSum = t.reduce((acc, cur) => addMaps(acc, normalizeMap(cur)), {} as AbilityMap);
  } else {
    traitSum = normalizeMap(t);
  }
  return { base, traitSum };
}

export function buildCards(filePath: string, src: string): AbilityCard[] {
  const { base, traitSum } = parseTraitsYaml(src);

  const cards: AbilityCard[] = [];
  for (const name of ABILITIES_ORDER) {
    const total = (base[name] ?? 0) + (traitSum[name] ?? 0);
    const abbr = name.slice(0, 3).toUpperCase();
    const storageKey = `dh:traitToggle:${filePath}:${name}`;
    const toggled = typeof localStorage !== "undefined" && localStorage.getItem(storageKey) === "1";
    cards.push({
      label: abbr,
      total,
      name,
      storageKey,
      toggled,
    });
  }
  return cards;
}

/* ---------------- compatibility exports ----------------
   Some parts of your code (e.g., utils/template.ts) still import
   parseTraitsBlock / computeAbilities. Export thin adapters so the
   bundle builds even if those functions aren’t used.
--------------------------------------------------------- */

/** Back-compat alias: same as parseTraitsYaml */
export function parseTraitsBlock(src: string): { base: AbilityMap; traitSum: AbilityMap } {
  return parseTraitsYaml(src);
}

/**
 * Back-compat helper: return a flat AbilityMap of final totals for templates.
 * If a template passes the raw YAML, totals = base + trait.
 * If it passes nothing, return zeros.
 */
export function computeAbilities(src?: string): AbilityMap {
  if (!src) {
    return {
      Agility: 0,
      Strength: 0,
      Finesse: 0,
      Instinct: 0,
      Presence: 0,
      Knowledge: 0,
    };
  }
  const { base, traitSum } = parseTraitsYaml(src);
  const totals: AbilityMap = {};
  for (const k of ABILITIES_ORDER) {
    totals[k] = (base[k] ?? 0) + (traitSum[k] ?? 0);
  }
  return totals;
}
