// src/lib/components/damage-vault.ts
import type DaggerheartPlugin from "../../main";
import { MarkdownPostProcessorContext, Notice, TFile } from "obsidian";
import React from "react";
import { createRoot, Root } from "react-dom/client";
import { DamageInlineView } from "./damage-inline";
import { parseYamlSafe } from "../utils/yaml";
import * as store from "../services/stateStore";
import { registerLiveCodeBlock } from "../liveBlock";
const roots = new WeakMap<HTMLElement, Root>();

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
  nodes.forEach((n, i) => (n as HTMLDivElement).classList.toggle("on", i < filled));
}
function readFmNumber(fm: Record<string, any>, aliases: string[], def = NaN): number {
  for (const k of aliases) {
    if (fm[k] !== undefined) return asNum(fm[k], def);
  }
  return def;
}
function tierName(tier: number): "None" | "Minor" | "Major" | "Severe" {
  return tier <= 0 ? "None" : tier === 1 ? "Minor" : tier === 2 ? "Major" : "Severe";
}

type DamageYaml = {
  title?: string;
  hp_key?: string;
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
      const hpKey = String(conf.hp_key ?? "din_health");

      const resolveThresholds = () => {
        const fm = plugin.app.metadataCache.getFileCache(file as TFile)?.frontmatter ?? {};
        const fmMajor = readFmNumber(fm, ["majorthreshold","major_threshold","majorThreshold","major","armor_major_threshold"]);
        const fmSevere = readFmNumber(fm, ["severethreshold","severe_threshold","severeThreshold","severe","armor_severe_threshold"]);
        const yamlFinalMajor = conf.major_threshold;
        const yamlFinalSevere = conf.severe_threshold;
        const level = asNum(conf.level ?? fm.level ?? fm.tier ?? 0, 0);
        let finalMajor: number; let finalSevere: number; let subtitle: string;
        if (yamlFinalMajor != null || yamlFinalSevere != null || Number.isFinite(fmMajor) || Number.isFinite(fmSevere)) {
          finalMajor = asNum(yamlFinalMajor ?? fmMajor ?? 0, 0);
          finalSevere = asNum(yamlFinalSevere ?? fmSevere ?? 0, 0);
          subtitle = `Final thresholds — Major: ${finalMajor} • Severe: ${finalSevere}`;
        } else {
          const baseMajor = asNum(conf.base_major ?? 0, 0);
          const baseSevere = asNum(conf.base_severe ?? 0, 0);
          finalMajor = baseMajor + level;
          finalSevere = baseSevere + level;
          subtitle = `Thresholds — Major: ${finalMajor} • Severe: ${finalSevere} (base ${baseMajor}/${baseSevere} + level ${level})`;
        }
        return { finalMajor, finalSevere, subtitle };
      };

      const render = () => {
        const r = resolveThresholds();
        let root = roots.get(el);
        if (!root) { root = createRoot(el); roots.set(el, root); }
        root.render(React.createElement(DamageInlineView, { title: String(conf.title ?? "Damage"), subtitle: r.subtitle, onApply: async (rawAmtInput: number, tierReduceInput: number) => {
          const { finalMajor, finalSevere } = resolveThresholds();
          if (!Number.isFinite(finalMajor) || !Number.isFinite(finalSevere)) { new Notice("Damage: thresholds not found. Add majorthreshold/severethreshold to frontmatter, or base_major/base_severe in the block.", 6000); return; }
          const rawAmt = asNum(rawAmtInput, 0); const tierReduce = Math.max(0, Math.floor(asNum(tierReduceInput, 0)));
          let startTier = 0; if (rawAmt >= finalSevere) startTier = 3; else if (rawAmt >= finalMajor) startTier = 2; else if (rawAmt > 0) startTier = 1; else startTier = 0;
          const endTier = clamp(startTier - tierReduce, 0, 3);
          const scope = getPreviewScope(el); const hpBoxesEl = queryBoxesInScope(scope, "dh-track-hp"); const hpMax = maxBoxesOf(hpBoxesEl);
          const hpFilled0 = await readFilled(hpKey); let hpFilled1 = hpFilled0 + endTier; if (hpMax) hpFilled1 = clamp(hpFilled1, 0, hpMax);
          await writeFilled(hpKey, hpFilled1); paintBoxes(hpBoxesEl, hpFilled1);
          try { window.dispatchEvent(new CustomEvent('dh:tracker:changed', { detail: { key: hpKey, filled: hpFilled1 } })); } catch {}
          const toast = `Damage ${rawAmt} — Severity: ${tierName(startTier)} → ${tierName(endTier)} (reduced by ${tierReduce}) — Now HP on: ${hpFilled1}/${hpMax || "?"}`;
          new Notice(toast, 7000); if (hpMax && hpFilled1 >= hpMax) new Notice("You marked your last Hit Point - make a death move.", 7000);
        }}));
      };
      render();
  });
}
