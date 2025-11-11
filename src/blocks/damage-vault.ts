/**
 * Damage calculator code block processor
 * 
 * Registers: ```damage
 * 
 * Calculates and applies damage with tier reduction.
 * Features:
 * - Dynamic threshold calculation (major/severe)
 * - Armor-based tier reduction
 * - HP tracker updates
 * - Level/tier scaling
 * - Template support for thresholds
 */
import type DaggerheartPlugin from "../main";
import { MarkdownPostProcessorContext, Notice, TFile } from "obsidian";
import React from "react";
import { createRoot, Root } from "react-dom/client";
import { DamageInlineView } from "../components/damage-inline";
import { parseYamlSafe } from "../utils/yaml";
import { registerLiveCodeBlock } from "../utils/liveBlock";
import { createTemplateContext, processTemplate } from "../utils/template";
import { applyDamage } from "../core/damage-calculator";
import * as store from "../lib/services/stateStore";

const roots = new WeakMap<HTMLElement, Root>();

const HP_KEY = "din_health";
const ARMOR_KEY = "din_armor";

function asNum(v: unknown, def = 0): number {
  if (v === null || v === undefined) return def;
  const n = Number(String(v).trim());
  return Number.isFinite(n) ? n : def;
}
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
async function readFilled(key: string): Promise<number> {
  const raw = await store.get<number>(`tracker:${key}`, 0);
  return asNum(raw, 0);
}
async function writeFilled(key: string, v: number) {
  await store.set<number>(`tracker:${key}`, asNum(v, 0));
}
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
  
  nodes.forEach((n, i) => {
    const box = n as HTMLDivElement;
    box.classList.toggle("on", i < filled);
    
    if (!box.hasAttribute('data-click-handler')) {
      box.setAttribute('data-click-handler', 'true');
      box.addEventListener('click', async (e) => {
        const clickIndex = i;
        const currentlyOn = box.classList.contains("on");
        
        // If clicking an "on" box, clear it and all above
        // If clicking an "off" box, fill up to and including it
        const newFilled = currentlyOn ? clickIndex : clickIndex + 1;
        
        // Update all boxes based on the new filled value
        nodes.forEach((node, idx) => {
          (node as HTMLDivElement).classList.toggle("on", idx < newFilled);
        });

        const trackerContainer = box.closest('.dh-tracker-boxes');
        if (trackerContainer) {
          let key = "";
          if (trackerContainer.classList.contains('dh-track-hp')) {
            key = HP_KEY;
          } else if (trackerContainer.classList.contains('dh-track-armor')) {
            key = ARMOR_KEY;
          }

          if (key) {
            await writeFilled(key, newFilled);
            try {
              window.dispatchEvent(new CustomEvent('dh:tracker:changed', { 
                detail: { key: key, filled: newFilled }
              }));
            } catch {}
          }
        }
      });
    }
  });
}
function readFmNumber(fm: Record<string, any>, aliases: string[], def = NaN): number {
  for (const k of aliases) {
    if (fm[k] !== undefined) return asNum(fm[k], def);
  }
  return def;
}

type DamageYaml = {
  title?: string;
  hp_key?: string;
  armor_key?: string;  // Add this line
  major_threshold?: number | string;
  severe_threshold?: number | string;
  base_major?: number | string;
  base_severe?: number | string;
  level?: number | string;
  class?: string;
};

function parseYaml(src: string): DamageYaml {
  try { return parseYamlSafe<DamageYaml>(src) ?? {}; } catch { return {}; }
}

export function registerDamage(plugin: DaggerheartPlugin) {
  registerLiveCodeBlock(plugin, "damage", async (el: HTMLElement, src: string, ctx: MarkdownPostProcessorContext) => {

      const file = plugin.app.vault.getFileByPath(ctx.sourcePath);
      if (!file) { el.createEl("pre", { text: "Damage: could not resolve file." }); return; }

      const conf = parseYaml(src);
      const klass = String(conf.class ?? '').trim().split(/\s+/).filter(Boolean)[0];
      el.addClass('dh-damage-block');
      if (klass) el.addClass(klass);
      const hpKeyLocal = String(conf.hp_key ?? HP_KEY);
      const armorKeyLocal = String(conf.armor_key ?? (`${ARMOR_KEY}::${ctx.sourcePath}`));

      const resolveThresholds = () => {
        const tctx = createTemplateContext(el, plugin.app, ctx);
        const fm = plugin.app.metadataCache.getFileCache(file as TFile)?.frontmatter ?? {};

        const processMajor = conf.major_threshold ? processTemplate(String(conf.major_threshold), tctx) : undefined;
        const processSevere = conf.severe_threshold ? processTemplate(String(conf.severe_threshold), tctx) : undefined;

        // Prefer a non-empty processed template value, then frontmatter aliases, then base_*.
        const parsedMajorFromTemplate = (typeof processMajor === 'string' && processMajor.trim() !== '') ? Number(processMajor) : NaN;
        const parsedSevereFromTemplate = (typeof processSevere === 'string' && processSevere.trim() !== '') ? Number(processSevere) : NaN;

        const fmMajor = Number.isFinite(parsedMajorFromTemplate)
          ? parsedMajorFromTemplate
          : readFmNumber(fm, ["majorthreshold","major_threshold","majorThreshold","major","armor_major_threshold"]);

        const fmSevere = Number.isFinite(parsedSevereFromTemplate)
          ? parsedSevereFromTemplate
          : readFmNumber(fm, ["severethreshold","severe_threshold","severeThreshold","severe","armor_severe_threshold"]);

        // Per rules: threshold numbers get your level added. Determine level first.
        const level = asNum(conf.level ?? fm.level ?? fm.tier ?? 0, 0);

        // Choose source threshold: prefer explicit YAML/template/frontmatter; otherwise use base_*.
        const baseMajor = asNum(conf.base_major ?? 0, 0);
        const baseSevere = asNum(conf.base_severe ?? 0, 0);

        const sourceMajor = Number.isFinite(fmMajor) ? fmMajor : baseMajor;
        const sourceSevere = Number.isFinite(fmSevere) ? fmSevere : baseSevere;

        const finalMajor = asNum(sourceMajor, 0) + level;
        const finalSevere = asNum(sourceSevere, 0) + level;

        return { finalMajor, finalSevere };
      };

      const render = () => {
        const r = resolveThresholds();
        let root = roots.get(el);
        if (!root) { root = createRoot(el); roots.set(el, root); }
        root.render(React.createElement(DamageInlineView, { 
          majorThreshold: r.finalMajor,
          severeThreshold: r.finalSevere,
          onApply: async (rawAmtInput: number, tierReduceInput: number) => {
            const { finalMajor, finalSevere } = resolveThresholds();
            const rawAmt = asNum(rawAmtInput, 0);
            const tierReduce = Math.max(0, Math.floor(asNum(tierReduceInput, 0)));
            
            const result = await applyDamage({
              rawAmt,
              tierReduce,
              finalMajor,
              finalSevere,
              hpKey: hpKeyLocal,
              armorKey: armorKeyLocal,
              scope: getPreviewScope(el)
            });

            if (!result.success) {
              new Notice(result.message || "Damage application failed", 6000);
              return;
            }

            new Notice(result.message || "Damage applied", 7000);
          }
        }));
      };
      render();
  });
}
