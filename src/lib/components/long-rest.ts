// src/lib/components/long-rest.ts
import type DaggerheartPlugin from "../../main";
import { MarkdownPostProcessorContext, MarkdownRenderChild, Notice, TFile } from "obsidian";
import { parseYamlSafe } from "../utils/yaml";
import { LongRestModal } from "../../ui/rest-modals";
import React from "react";
import { createRoot, Root } from "react-dom/client";
import { RestButtonView } from "./rest-button";
import * as store from "../services/stateStore";
const roots = new WeakMap<HTMLElement, Root>();

/* ---------- helpers ---------- */
function asNum(v: unknown, def = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}
function btn(label: string, cls = "dh-rest-btn"): HTMLButtonElement {
  const b = document.createElement("button");
  b.className = cls;
  b.textContent = label;
  return b;
}
function pill(text: string, cls = "dh-rest-pill"): HTMLSpanElement {
  const s = document.createElement("span");
  s.className = cls;
  s.textContent = text;
  return s;
}

/* localStorage for trackers (same keys used by your trackers) */
async function readFilled(key: string): Promise<number> {
  const raw = await store.get<number>(`tracker:${key}`, 0);
  return asNum(raw, 0);
}
async function writeFilled(key: string, v: number) {
  await store.set<number>(`tracker:${key}`, asNum(v, 0));
}

/* scope + repaint helpers */
function getPreviewScope(el: HTMLElement): HTMLElement {
  return (el.closest(".markdown-preview-view") as HTMLElement) ?? document.body;
}
function queryBoxesInScope(scope: HTMLElement, typeCls: string): HTMLElement | null {
  return scope.querySelector(`.dh-tracker-boxes.${typeCls}`) as HTMLElement | null;
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

/* ---------- YAML ---------- */
type LongRestYaml = {
  label?: string;

  hp_key?: string;
  stress_key?: string;
  armor_key?: string;
  hope_key?: string;
  class?: string;
};

function parseYaml(src: string): LongRestYaml {
  try {
    return parseYamlSafe<LongRestYaml>(src) ?? {};
  } catch {
    return {};
  }
}

/* ---------- registration ---------- */
export function registerLongRest(plugin: DaggerheartPlugin) {
  const langs = ["long-rest", "long"] as const;
  for (const lang of langs) plugin.registerMarkdownCodeBlockProcessor(
    lang,
    async (src: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
      el.empty();

      const file = plugin.app.vault.getFileByPath(ctx.sourcePath) || plugin.app.workspace.getActiveFile();
      if (!file) {
        el.createEl("pre", { text: "Long Rest: could not resolve file (showing trigger anyway)." });
      }

      const conf = parseYaml(src);
      const klass = String(conf.class ?? '').trim().split(/\s+/).filter(Boolean)[0];
      el.addClass('dh-long-rest-block');
      if (klass) el.addClass(klass);
      const triggerLabel = String(conf.label ?? "Long Rest");

      const hpKey    = String(conf.hp_key    ?? "din_health");
      const stressKey= String(conf.stress_key?? "din_stress");
      const armorKey = String(conf.armor_key ?? "din_armor");
      const hopeKey  = String(conf.hope_key  ?? "din_hope");

      let root: Root | null = null;
      const onClick = () => {
        const theFile = plugin.app.vault.getFileByPath(ctx.sourcePath) || plugin.app.workspace.getActiveFile();
        if (!theFile) { new Notice("Long Rest: could not resolve file"); return; }
        // modal shell
        const modal = document.createElement("div");
        modal.className = "dh-rest-modal";
        const backdrop = document.createElement("div");
        backdrop.className = "dh-rest-backdrop";
        modal.appendChild(backdrop);

        const panel = document.createElement("div");
        panel.className = "dh-rest-chooser";
        modal.appendChild(panel);

        // Header
        const head = panel.createDiv({ cls: "dh-rest-headerbar" });
        const titleWrap = head.createDiv({ cls: "dh-rest-titlewrap" });
        titleWrap.createDiv({ cls: "dh-rest-title", text: "Long Rest" });
        titleWrap.createDiv({
          cls: "dh-rest-sub",
          text: "Choose exactly two moves (you may choose the same move twice).",
        });

        // (Optional little pills; Long rest has no tier math)
        head.createDiv({ cls: "dh-rest-party" }).append(
          pill("Camped & Rested")
        );

        const picks = head.createDiv({ cls: "dh-rest-picks" });
        picks.setText("Selected: 0/2");

        const closeBtn = head.createEl("button", { cls: "dh-rest-close", text: "×" });
        closeBtn.setAttr("aria-label", "Close");

        // Choices
        const actions = panel.createDiv({ cls: "dh-rest-actions" });

        const CHOICES = [
          { key: "heal_all",   label: "Tend to All Wounds (Clear ALL HP)" },
          { key: "stress_all", label: "Clear All Stress" },
          { key: "armor_all",  label: "Repair All Armor" },
          { key: "prepare",    label: "Prepare (+1 Hope)" },
          { key: "prepare_party", label: "Prepare with Party (+2 Hope)" },
          { key: "project",    label: "Work on a Project" }, // no tracker change, just logs
        ] as const;

        const counts: Record<string, number> =
          Object.fromEntries(CHOICES.map(c => [c.key, 0]));

        const totalSelected = () => Object.values(counts).reduce((a, b) => a + b, 0);
        const refreshCount  = () => (picks.textContent = `Selected: ${totalSelected()}/2`);

        const choiceBtns: Record<string, HTMLButtonElement> = {};
        const labelWithCount = (label: string, count: number) =>
          count === 0 ? label : `${label} ×${count}`;

        for (const c of CHOICES) {
          const b = btn(c.label);
          choiceBtns[c.key] = b;

          const updateButton = () => {
            const ct = counts[c.key];
            b.textContent = labelWithCount(c.label, ct);
            b.classList.toggle("on", ct > 0);
          };
          updateButton();

          b.onclick = () => {
            // Mutual exclusion between prepare and prepare_party
            if (c.key === "prepare" && counts["prepare_party"] > 0) {
              counts["prepare_party"] = 0;
              const lbl = CHOICES.find(x => x.key === "prepare_party")!.label;
              choiceBtns["prepare_party"].textContent = lbl;
              choiceBtns["prepare_party"].classList.remove("on");
            }
            if (c.key === "prepare_party" && counts["prepare"] > 0) {
              counts["prepare"] = 0;
              const lbl = CHOICES.find(x => x.key === "prepare")!.label;
              choiceBtns["prepare"].textContent = lbl;
              choiceBtns["prepare"].classList.remove("on");
            }

            // Cycle: 0 → 1 → 2 → 0, but never exceed total = 2
            const cur = counts[c.key];
            const next = (cur + 1) % 3;
            const delta = next - cur;
            if (delta > 0 && totalSelected() + delta > 2) {
              new Notice("Select exactly two total moves.");
              return;
            }
            counts[c.key] = next;
            updateButton();
            refreshCount();
          };

          actions.appendChild(b);
        }
        refreshCount();

        // Apply
        const applyRow = panel.createDiv({ cls: "dh-rest-apply" });
        const applyBtn = btn("Apply Long Rest", "dh-event-btn");
        applyRow.appendChild(applyBtn);

        // Close wiring
        const closeModal = () => {
          if (modal.parentElement) document.body.removeChild(modal);
          window.removeEventListener("keydown", onKey);
        };
        const onKey = (ev: KeyboardEvent) => {
          if (ev.key === "Escape") closeModal();
        };
        backdrop.onclick = closeModal;
        closeBtn.onclick = closeModal;
        window.addEventListener("keydown", onKey);

        // Scope + current DOM trackers
        const scope = getPreviewScope(el);
        const hpBoxesEl     = queryBoxesInScope(scope, "dh-track-hp");
        const stressBoxesEl = queryBoxesInScope(scope, "dh-track-stress");
        const armorBoxesEl  = queryBoxesInScope(scope, "dh-track-armor");
        const hopeBoxesEl   = queryBoxesInScope(scope, "dh-track-hope");

        const hpMax     = maxBoxesOf(hpBoxesEl);
        const stressMax = maxBoxesOf(stressBoxesEl);
        const armorMax  = maxBoxesOf(armorBoxesEl);
        const hopeMax   = maxBoxesOf(hopeBoxesEl);

        applyBtn.onclick = async () => {
          if (totalSelected() !== 2) {
            new Notice("Select exactly two total moves.");
            return;
          }

          // Current filled values
          let hpFilled     = await readFilled(hpKey);
          let stressFilled = await readFilled(stressKey);
          let armorFilled  = await readFilled(armorKey);
          let hopeFilled   = await readFilled(hopeKey);

          const lines: string[] = [];

          // Apply each move for its count (twice for prepare kinds is meaningful)
          for (let i = 0; i < counts["heal_all"]; i++) {
            hpFilled = 0;
            lines.push("Tend to All Wounds: HP fully restored.");
          }
          for (let i = 0; i < counts["stress_all"]; i++) {
            stressFilled = 0;
            lines.push("Clear All Stress: Stress fully cleared.");
          }
          for (let i = 0; i < counts["armor_all"]; i++) {
            armorFilled = 0;
            lines.push("Repair All Armor: Armor fully repaired.");
          }
          for (let i = 0; i < counts["prepare"]; i++) {
            hopeFilled = hopeFilled + 1;
            if (hopeMax) hopeFilled = Math.min(hopeFilled, hopeMax);
            lines.push("Prepare: +1 Hope.");
          }
          for (let i = 0; i < counts["prepare_party"]; i++) {
            hopeFilled = hopeFilled + 2;
            if (hopeMax) hopeFilled = Math.min(hopeFilled, hopeMax);
            lines.push("Prepare with Party: +2 Hope.");
          }
          for (let i = 0; i < counts["project"]; i++) {
            lines.push("Work on a Project: progress recorded (no tracker change).");
          }

          // Persist
          await writeFilled(hpKey, hpFilled);
          await writeFilled(stressKey, stressFilled);
          await writeFilled(armorKey, armorFilled);
          await writeFilled(hopeKey, hopeFilled);
          try{ window.dispatchEvent(new CustomEvent('dh:tracker:changed', { detail: { key: hpKey, filled: hpFilled } })); }catch{}
          try{ window.dispatchEvent(new CustomEvent('dh:tracker:changed', { detail: { key: stressKey, filled: stressFilled } })); }catch{}
          try{ window.dispatchEvent(new CustomEvent('dh:tracker:changed', { detail: { key: armorKey, filled: armorFilled } })); }catch{}
          try{ window.dispatchEvent(new CustomEvent('dh:tracker:changed', { detail: { key: hopeKey, filled: hopeFilled } })); }catch{}

          // Repaint
          // Repaint all matching containers with the same state keys (safer in pages with multiple instances)
          const paintKey = (cls: string, key: string, val: number) => {
            const sel = `.dh-tracker[data-dh-key="${CSS.escape(key)}"] .${cls}`;
            document.querySelectorAll(sel).forEach((n) => paintBoxes(n as HTMLElement, val));
          };
          paintKey('dh-track-hp', hpKey, hpFilled);
          paintKey('dh-track-stress', stressKey, stressFilled);
          paintKey('dh-track-armor', armorKey, armorFilled);
          paintKey('dh-track-hope', hopeKey, hopeFilled);

          // Toast summary
          const summary =
            `Now: HP ${hpFilled}${hpMax ? `/${hpMax}` : ""} • ` +
            `Stress ${stressFilled}${stressMax ? `/${stressMax}` : ""} • ` +
            `Armor ${armorFilled}${armorMax ? `/${armorMax}` : ""} • ` +
            `Hope ${hopeFilled}${hopeMax ? `/${hopeMax}` : ""}`;

          const toast = (lines.length ? lines.join(" • ") + " — " : "") + summary;
          new Notice(toast, 7000);

          closeModal();
        };

        document.body.appendChild(modal);
        setTimeout(() => actions.querySelector("button")?.focus(), 0);
      };

      // Render a trigger button via React
      let r = roots.get(el);
      if (r && el.childElementCount === 0) { try { r.unmount(); } catch {} roots.delete(el); r = undefined as any; }
      if (!r) { el.empty(); r = createRoot(el); roots.set(el, r); }
      r.render(React.createElement(RestButtonView, { label: triggerLabel, onClick }));

      const child = new MarkdownRenderChild(el);
      ctx.addChild(child);
    }
  );
}

export function openLongRestUI(
  plugin: DaggerheartPlugin,
  el: HTMLElement,
  ctx: MarkdownPostProcessorContext,
  keys: { hp: string; stress: string; armor: string; hope: string }
) {
  const file = plugin.app.vault.getFileByPath(ctx.sourcePath) || plugin.app.workspace.getActiveFile();
  if (!file) { new Notice('Long Rest: no active file'); return; }
  const scope = (el.closest('.markdown-preview-view') as HTMLElement) ?? document.body;
  const mk = (cls: string, key: string) => ({
    getMax: () => {
      const cont = scope.querySelector('.dh-tracker-boxes.' + cls) as HTMLElement | null;
      return cont ? cont.querySelectorAll('.dh-track-box').length : 0;
    },
    repaint: () => {
      const cont = scope.querySelector('.dh-tracker-boxes.' + cls) as HTMLElement | null;
      if (!cont) return;
      store.get<number>('tracker:' + key, 0).then((val) => {
        const filled = Number(val ?? 0) || 0;
        cont.querySelectorAll('.dh-track-box').forEach((n, i) => (n as HTMLDivElement).classList.toggle('on', i < filled));
      });
    },
  });
  new LongRestModal(plugin.app, file as TFile, { hp: keys.hp, stress: keys.stress, armor: keys.armor, hope: keys.hope }, {
    hp: mk('dh-track-hp', keys.hp),
    stress: mk('dh-track-stress', keys.stress),
    armor: mk('dh-track-armor', keys.armor),
    hope: mk('dh-track-hope', keys.hope),
  } as any).open();
}
