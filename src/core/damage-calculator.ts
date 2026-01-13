/**
 * Core damage calculation and application logic
 * 
 * Responsibilities:
 * - Calculate damage tiers based on thresholds (None/Minor/Major/Severe)
 * - Apply armor-based tier reduction
 * - Update HP and armor tracker states
 * - Validate armor slot availability
 * - Generate damage notification messages
 * 
 * Used by: damage block, dashboard damage component
 */
import * as store from "../lib/services/stateStore";
import { emitTrackerChanged } from "../utils/events";
import { asNum, clamp } from "../utils/number";

async function readFilled(key: string): Promise<number> {
  const raw = await store.get<number>(`tracker:${key}`, 0);
  return asNum(raw, 0);
}

async function writeFilled(key: string, v: number) {
  await store.set<number>(`tracker:${key}`, asNum(v, 0));
}

function queryBoxesInScope(scope: HTMLElement, typeCls: string): HTMLElement | null {
  return scope.querySelector(`.dh-tracker-boxes.${typeCls}`) as HTMLElement | null;
}
function queryBoxesAllByKey(typeCls: string, key: string): HTMLElement[] {
  const safe = (CSS && (CSS as any).escape) ? (CSS as any).escape : (s: string) => String(s).replace(/["\\]/g,'\\$&');
  return Array.from(document.querySelectorAll(`.dh-tracker[data-dh-key="${safe(key)}"] .${typeCls}`)) as HTMLElement[];
}

function maxBoxesOf(container: HTMLElement | null): number {
  if (!container) return 0;
  return container.querySelectorAll(".dh-track-box").length;
}

function paintBoxes(container: HTMLElement | null, filled: number) {
  if (!container) return;
  const nodes = container.querySelectorAll(".dh-track-box");
  nodes.forEach((n, i) => (n as HTMLDivElement).classList.toggle("on", i < filled));
}

export function tierName(tier: number): "None" | "Minor" | "Major" | "Severe" {
  return tier <= 0 ? "None" : tier === 1 ? "Minor" : tier === 2 ? "Major" : "Severe";
}

/** Shared damage application logic for both standalone and dashboard */
export async function applyDamage(params: {
  rawAmt: number;
  tierReduce: number;
  finalMajor: number;
  finalSevere: number;
  hpKey: string;
  armorKey: string;
  scope: HTMLElement;
}): Promise<{ success: boolean; message?: string }> {
  const { rawAmt, tierReduce, finalMajor, finalSevere, hpKey, armorKey, scope } = params;

  if (!Number.isFinite(finalMajor) || !Number.isFinite(finalSevere)) {
    return { success: false, message: "Damage: thresholds not found. Add majorthreshold/severethreshold to frontmatter, or base_major/base_severe in the block." };
  }

  // Calculate damage tier based on thresholds
  let startTier = 0;
  if (rawAmt >= finalSevere) startTier = 3;
  else if (rawAmt >= finalMajor) startTier = 2;
  else if (rawAmt > 0) startTier = 1;

  const endTier = clamp(startTier - tierReduce, 0, 3);

  // Get HP tracker elements
  const hpBoxesEl = queryBoxesInScope(scope, "dh-track-hp");
  const hpMax = maxBoxesOf(hpBoxesEl);
  const hpFilled0 = await readFilled(hpKey);

  // Handle armor reduction if requested
  if (tierReduce > 0) {
    const armorBoxesEl = queryBoxesInScope(scope, "dh-track-armor");
    if (armorBoxesEl) {
      const armorMax = maxBoxesOf(armorBoxesEl);
      const armorFilled0 = await readFilled(armorKey);
      const remainingArmorSlots = armorMax - armorFilled0;

      // Check if we have enough armor slots
      if (tierReduce > remainingArmorSlots) {
        return { 
          success: false, 
          message: `Cannot reduce damage tier by ${tierReduce} - requires ${tierReduce} armor slots but only ${remainingArmorSlots} remaining!` 
        };
      }

      // Apply armor reduction
      const armorFilled1 = armorFilled0 + tierReduce;
      await writeFilled(armorKey, armorFilled1);
      paintBoxes(armorBoxesEl, armorFilled1);

      emitTrackerChanged({ key: armorKey, filled: armorFilled1 });
    }
  }

  // Apply HP damage based on final tier
  let hpFilled1 = hpFilled0 + endTier;
  if (hpMax) hpFilled1 = clamp(hpFilled1, 0, hpMax);
  await writeFilled(hpKey, hpFilled1);
  // Repaint all trackers bound to this HP key (covers standalone and dashboard instances)
  paintBoxes(hpBoxesEl, hpFilled1);
  try {
    for (const el of queryBoxesAllByKey("dh-track-hp", hpKey)) paintBoxes(el, hpFilled1);
  } catch {}

  emitTrackerChanged({ key: hpKey, filled: hpFilled1 });

  // Build success message
  const armorBoxesEl = queryBoxesInScope(scope, "dh-track-armor");
  const armorInfo = armorBoxesEl ? ` — Armor: ${await readFilled(armorKey)}/${maxBoxesOf(armorBoxesEl) || "?"}` : '';
  let message = `Damage ${rawAmt} — Severity: ${tierName(startTier)} → ${tierName(endTier)}`;
  if (tierReduce > 0) message += ` (reduced by ${tierReduce})`;
  message += ` — HP: ${hpFilled1}/${hpMax || "?"}${armorInfo}`;

  if (hpMax && hpFilled1 >= hpMax) {
    message += " — You marked your last Hit Point - make a death move.";
  }

  return { success: true, message };
}
