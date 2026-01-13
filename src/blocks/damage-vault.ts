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
import { Root } from "react-dom/client";
import { getOrCreateRoot } from "../utils/reactRoot";
import { DamageInlineView } from "../components/damage-inline";
import { parseYamlSafe } from "../utils/yaml";
import { registerLiveCodeBlock } from "../utils/liveBlock";
import { createTemplateContext, processTemplate } from "../utils/template";
import { applyDamage } from "../core/damage-calculator";
import * as store from "../lib/services/stateStore";
import { asNum, clamp } from "../utils/number";

const roots = new WeakMap<HTMLElement, Root>();

const HP_KEY = "din_health";
const ARMOR_KEY = "din_armor";

function getPreviewScope(el: HTMLElement): HTMLElement {
  return (el.closest(".markdown-preview-view") as HTMLElement) ?? document.body;
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
        const root = getOrCreateRoot(roots, el);
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
