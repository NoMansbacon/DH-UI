// src/blocks/experiences.ts
// Simple experiences list block for players.
// Usage:
// ```experiences
// items:
//   - name: "Saved by the Stranger"
//     note: "You owe a favor to the mysterious stranger who pulled you from the river."
//   - name: "Haunted by the Flames"
//     note: "You survived a village fire that still stalks your dreams."
// ```
//
// The block intentionally does NOT encode what kinds of rolls each experience applies to;
// that conversation stays at the table between player and GM.

import type DaggerheartPlugin from "../main";
import type { MarkdownPostProcessorContext } from "obsidian";
import { parseYamlSafe } from "../utils/yaml";
import { registerLiveCodeBlock } from "../utils/liveBlock";

interface ExperienceItemYaml {
  name?: string;
  title?: string;
  label?: string;
  note?: string;
  description?: string;
  summary?: string;
  // Optional per-item bonus, e.g. "+2" or 3
  bonus?: number | string;
}

interface ExperiencesDocYaml {
  items?: ExperienceItemYaml[] | Record<string, ExperienceItemYaml>;
  class?: string;
  // Optional default bonus applied when this experience is used; defaults to +2 if omitted.
  // Per-item bonus overrides this when present.
  bonus?: number | string;
}

interface ExperienceRow {
  id: string;
  name: string;
  note: string;
  bonus?: number | null;
}

function parseBonus(val: unknown): number | null {
  if (val === null || val === undefined) return null;
  const s = String(val).trim();
  if (!s) return null;
  const n = Number(s.replace(/^\+/, ""));
  return Number.isFinite(n) && n !== 0 ? n : null;
}

function toRows(src: string): ExperienceRow[] {
  const raw = parseYamlSafe<ExperiencesDocYaml | ExperienceItemYaml | null | undefined>(src) ?? {};

  let items: ExperienceItemYaml[] = [];

  // Support a single item at root (no items:[] wrapper)
  if (
    raw &&
    !Array.isArray((raw as any).items) &&
    typeof (raw as any).items !== "object" &&
    ("name" in (raw as any) || "title" in (raw as any) || "label" in (raw as any) || "note" in (raw as any) || "description" in (raw as any))
  ) {
    items = [raw as ExperienceItemYaml];
  } else {
    const itemsAny = (raw as ExperiencesDocYaml).items;
    if (Array.isArray(itemsAny)) {
      items = itemsAny;
    } else if (itemsAny && typeof itemsAny === "object") {
      items = Object.values(itemsAny);
    }
  }

  const rows: ExperienceRow[] = [];
  items.forEach((it, idx) => {
    if (!it) return;
    const name = (it.name || it.title || it.label || "Experience").toString();
    const note = (it.note || it.description || it.summary || "").toString();
    const bonus = parseBonus((it as any).bonus);
    const id = `${idx}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "exp"}`;
    rows.push({ id, name, note, bonus });
  });

  return rows;
}

export function registerExperiencesBlock(plugin: DaggerheartPlugin) {
  registerLiveCodeBlock(plugin, "experiences", (el: HTMLElement, src: string, _ctx: MarkdownPostProcessorContext) => {
    const raw = (parseYamlSafe<any>(src)) ?? {};
    const klass = String(raw?.class ?? '').trim().split(/\s+/).filter(Boolean)[0];
    if (klass) el.addClass(klass);

    // Block-level default bonus; individual items can override via `bonus:`
    let defaultBonus = 2;
    if (raw && (raw as any).bonus !== undefined) {
      const parsed = parseBonus((raw as any).bonus);
      if (parsed !== null) defaultBonus = parsed;
    }

    const rows = toRows(src);
    if (!rows.length) {
      el.createEl("pre", {
        text:
          "No experiences found in ```experiences block.\n" +
          "Example:\n" +
          "items:\n" +
          "  - name: Saved by the Stranger\n" +
          "    note: You owe a favor to the mysterious stranger who pulled you from the river.",
      });
      return;
    }

    el.empty();
    el.addClass("dh-experiences");

    for (const row of rows) {
      const itemEl = el.createDiv({ cls: "dh-experience-row" });
      const head = itemEl.createDiv({ cls: "dh-experience-head" });
      head.createDiv({ cls: "dh-experience-name", text: row.name });

      const effBonus = (typeof row.bonus === "number" && row.bonus !== 0)
        ? row.bonus
        : defaultBonus;
      const bonusLabel = effBonus >= 0 ? `+${effBonus}` : String(effBonus);
      head.createDiv({ cls: "dh-experience-mod", text: bonusLabel });

      if (row.note) {
        itemEl.createDiv({ cls: "dh-experience-note", text: row.note });
      }
    }

    // Helper text: how to apply experiences in play
    const helper = el.createDiv({ cls: "dh-experience-helper" });
    helper.setText(
      "Using an experience: when you and your GM agree an experience is relevant, spend 1 Hope and add the listed bonus (for example +2) to your roll total. Apply the modifier yourself when you roll."
    );
  });
}
