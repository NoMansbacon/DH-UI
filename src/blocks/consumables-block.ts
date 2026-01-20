// src/lib/components/consumables-block.ts
import type DaggerheartPlugin from "../main";
import { MarkdownPostProcessorContext } from "obsidian";
import { parseYamlSafe } from "../utils/yaml";
import { processTemplate, createTemplateContext } from "../utils/template";
import React from "react";
import { Root } from "react-dom/client";
import { ConsumablesView, type ConsumableRow } from "../components/consumables-view";
import { getOrCreateRoot } from "../utils/reactRoot";
const roots = new WeakMap<HTMLElement, Root>();

/**
 * Supported YAML shapes:
 *
 * A) List:
 * items:
 *   - label: "Health Potion"
 *     state_key: din_hp_pots
 *     uses: 3
 *   - label: "Rage"
 *     state_key: din_rage
 *     uses: "{{ frontmatter.rage_uses }}"
 *
 * B) Single item (no "items"):
 * label: "Health Potion"
 * state_key: din_hp_pots
 * uses: "{{ add 1 frontmatter.slots }}"
 *
 * C) Map under items:
 * items:
 *   hp:
 *     label: "Health Potion"
 *     state_key: din_hp_pots
 *     uses: 3
 */

type ConsumableItem = {
  label?: string;
  state_key?: string;
  uses?: number | string;
};

type DocLoose =
  | {
      items?: ConsumableItem[] | Record<string, ConsumableItem>;
      label?: string;
      state_key?: string;
      uses?: number | string;
    }
  | undefined
  | null;

function parseRootToItems(src: string): ConsumableItem[] {
  let raw: DocLoose;
  try {
    raw = (parseYamlSafe<DocLoose>(src)) ?? {};
  } catch (e) {
    console.error("[DH-UI] consumables YAML error:", e);
    return [];
  }

  // B) Single item at root
  if (
    raw &&
    typeof raw === "object" &&
    !Array.isArray((raw as any).items) &&
    typeof (raw as any).items !== "object" &&
    ("label" in raw || "state_key" in raw || "uses" in raw)
  ) {
    return [
      {
        label: (raw as any).label ?? "Consumable",
        state_key: (raw as any).state_key ?? "",
        uses: (raw as any).uses ?? 0,
      },
    ];
  }

  // A/C) items exists
  const itemsAny = (raw as any)?.items;

  if (Array.isArray(itemsAny)) {
    return itemsAny.map((x) => ({
      label: x?.label ?? "Consumable",
      state_key: x?.state_key ?? "",
      uses: x?.uses ?? 0,
    }));
  }

  if (itemsAny && typeof itemsAny === "object") {
    return Object.values(itemsAny).map((x: any) => ({
      label: x?.label ?? "Consumable",
      state_key: x?.state_key ?? "",
      uses: x?.uses ?? 0,
    }));
  }

  return [];
}

function readState(key: string, maxUses: number): number {
  try {
    const raw = localStorage.getItem(`dh:consumable:${key}`);
    if (!raw) return 0;
    const n = Number(JSON.parse(raw));
    if (isNaN(n)) return 0;
    return Math.max(0, Math.min(maxUses, n));
  } catch {
    return 0;
  }
}

function writeState(key: string, filled: number) {
  try {
    localStorage.setItem(`dh:consumable:${key}`, JSON.stringify(filled));
  } catch {}
}

export function registerConsumablesBlock(plugin: DaggerheartPlugin) {
  plugin.registerMarkdownCodeBlockProcessor("consumables", (src: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
    const app = plugin.app;

    // Parse top-level YAML to pick up styleClass / class, but use src again for items parsing
    const raw = (parseYamlSafe<any>(src)) ?? {};
    const klass = String((raw as any)?.styleClass ?? raw?.class ?? "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)[0];
    if (klass) el.addClass(klass);

    const items = parseRootToItems(src);
    if (!items.length) {
      el.createEl("pre", { text: "No 'items:' in ```consumables block." });
      return;
    }

    const computeRows = (): ConsumableRow[] => {
      const tctx = createTemplateContext(el, app, ctx);
      return items.map((it) => {
        const label = (it?.label ?? "").toString() || "Consumable";
        const stateKey = (it?.state_key ?? "").toString().trim();
        let usesNum = 0;
        const rawUses = it?.uses ?? 0;
        if (typeof rawUses === "string") {
          const resolved = processTemplate(rawUses, tctx).trim();
          const n = Number(resolved);
          usesNum = Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
        } else {
          const n = Number(rawUses);
          usesNum = Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
        }
        const filled = stateKey ? readState(stateKey, usesNum) : 0;
        return { label, stateKey, uses: usesNum, filled };
      });
    };

    const rows = computeRows();
    const root = getOrCreateRoot(roots, el);
    root.render(
      React.createElement(ConsumablesView, {
        rows,
        onChange: (stateKey: string, filled: number) => stateKey && writeState(stateKey, filled),
      })
    );
  });
}
