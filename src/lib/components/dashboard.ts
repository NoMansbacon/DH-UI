// src/lib/components/dashboard.ts
import type DaggerheartPlugin from "../../main";
import { App, MarkdownPostProcessorContext, Notice, TFile } from "obsidian";
import React from "react";
import { createRoot, Root } from "react-dom/client";

import { BadgesView, type BadgeRow } from "./badges-view";
import { TrackerRowView, type TrackerKind } from "./trackers-view";
import { RestRowView } from "./rest-row";
import { AbilityView } from "./traits";
import { buildCards } from "../domains/abilities";
import { DamageInlineView } from "./damage-inline";

import { parseYamlSafe } from "../utils/yaml";
import { processTemplate, createTemplateContext } from "../utils/template";
import * as store from "../services/stateStore";
import { registerLiveCodeBlock } from "../liveBlock";
const roots = new WeakMap<HTMLElement, Root>();

type BadgeItem = { label?: string; value?: string | number | boolean | null };

type TrackersConf = {
  hp?: { state_key?: string; label?: string; uses?: number | string } | boolean;
  stress?: { state_key?: string; label?: string; uses?: number | string } | boolean;
  armor?: { state_key?: string; label?: string; uses?: number | string } | boolean;
  hope?: { state_key?: string; label?: string; uses?: number | string } | boolean;
};

type DamageConf = {
  title?: string;
  hp_key?: string;
  major_threshold?: number | string;
  severe_threshold?: number | string;
  base_major?: number | string;
  base_severe?: number | string;
  level?: number | string;
};

type DashboardYaml = {
  badges?: { items?: BadgeItem[] | Record<string, BadgeItem> };
  trackers?: TrackersConf;
  rest?: { short_label?: string; long_label?: string } | boolean;
  damage?: DamageConf | boolean;
  traits?: string | Record<string, any> | boolean;
  vitals?: boolean | Record<string, any>;
  class?: string;
};

function asNum(v: unknown, def = 0): number {
  if (v === null || v === undefined) return def;
  const n = Number(String(v).trim());
  return Number.isFinite(n) ? n : def;
}

function parseDoc(src: string): DashboardYaml {
  try { return parseYamlSafe<DashboardYaml>(src) ?? {}; } catch { return {}; }
}

function resolveCount(raw: number | string | undefined, el: HTMLElement, app: App, ctx: MarkdownPostProcessorContext, fallback = 0): number {
  if (raw == null || raw === "") return fallback;
  if (typeof raw === "number") { const n = Math.floor(raw); return Number.isFinite(n) ? Math.max(0, n) : fallback; }
  try { const tctx = createTemplateContext(el, app, ctx); const out = processTemplate(String(raw), tctx).trim(); const n = Math.floor(Number(out)); return Number.isFinite(n) ? Math.max(0, n) : fallback; } catch { return fallback; }
}

function toBadgeRows(el: HTMLElement, app: App, ctx: MarkdownPostProcessorContext, items?: BadgeItem[] | Record<string, BadgeItem>): BadgeRow[] {
  const arr: BadgeItem[] = Array.isArray(items) ? items : items && typeof items === "object" ? Object.values(items) : [];
  const tctx = createTemplateContext(el, app, ctx);
  const renderVal = (raw: BadgeItem["value"]): string => {
    if (raw === null || raw === undefined) return "";
    if (typeof raw === "number" || typeof raw === "boolean") return String(raw);
    try { return processTemplate(String(raw), tctx); } catch { return String(raw ?? ""); }
  };
  return arr.map(it => ({ label: String(it?.label ?? ""), value: renderVal(it?.value) }));
}

export function registerDashboard(plugin: DaggerheartPlugin) {
  registerLiveCodeBlock(plugin, "dashboard", async (el, src, ctx) => {

    const doc = parseDoc(src);
    const app = plugin.app;
    const file = app.vault.getFileByPath(ctx.sourcePath) || app.workspace.getActiveFile();
    if (!file) { el.createEl("pre", { text: "Dashboard: could not resolve file." }); return; }

    let root = roots.get(el);
    if (!root) { root = createRoot(el); roots.set(el, root); }
    // Apply optional custom classes to container
    const klass = String((doc as any).class ?? '').trim().split(/\s+/).filter(Boolean)[0];
    el.addClass('dh-dashboard-block');
    if (klass) el.addClass(klass);

    const computeKinds = () => {
      // Only render standalone trackers if the dashboard explicitly provides a `trackers` section
      if ((doc as any).trackers === undefined || (doc as any).trackers === false) return [] as Array<{ kind: TrackerKind; label: string; key: string; total: number; shape: "rect" | "diamond" }>;
      const tconf = (doc as any).trackers ?? {};
      const list: Array<{ kind: TrackerKind; label: string; key: string; total: number; shape: "rect" | "diamond" }>
        = (['hp','stress','armor','hope'] as TrackerKind[]).map((k) => {
          const raw = (tconf as any)?.[k];
          if (raw === false) return null as any;
          const obj = (raw && typeof raw === 'object') ? raw : {};
          const label = String(obj.label ?? k.toUpperCase());
          const key = String(obj.state_key ?? (k === 'hp' ? 'din_health' : k === 'stress' ? 'din_stress' : k === 'armor' ? 'din_armor' : 'din_hope'));
          const usesRaw = (typeof raw === 'object') ? (obj as any).uses : raw; // allow shorthand: hp: "{{ frontmatter.hp }}"
          const total = resolveCount(usesRaw as any, el, app as any, ctx, k === 'hope' ? 6 : 0);
          const shape: "rect" | "diamond" = (k === 'hope' ? 'diamond' : 'rect');
          return { kind: k, label, key, total, shape };
        }).filter(Boolean) as any;
      return list;
    };

    // Optional: allow "vitals:" section to provide its own counts/labels/keys without affecting standalone trackers
    const computeVitalsKinds = () => {
      const vconf = (doc as any).vitals;
      if (!vconf || typeof vconf !== 'object') return computeKinds();
      const list: Array<{ kind: TrackerKind; label: string; key: string; total: number; shape: "rect" | "diamond" }>
        = (['hp','stress','armor','hope'] as TrackerKind[]).map((k) => {
          const raw = (vconf as any)?.[k];
          if (raw === false) return null as any;
          const obj = (raw && typeof raw === 'object') ? raw : {};
          const label = String(obj.label ?? k.toUpperCase());
          const key = String(obj.state_key ?? (k === 'hp' ? 'din_health' : k === 'stress' ? 'din_stress' : k === 'armor' ? 'din_armor' : 'din_hope'));
          const usesRaw = (typeof raw === 'object') ? (obj as any).uses : raw;
          const total = resolveCount(usesRaw as any, el, app as any, ctx, k === 'hope' ? 6 : 0);
          const shape: "rect" | "diamond" = (k === 'hope' ? 'diamond' : 'rect');
          return { kind: k, label, key, total, shape };
        }).filter(Boolean) as any;
      return list;
    };

    const resolveDamageThresholds = () => {
      const dconf = (doc.damage === true ? {} : (doc.damage || {})) as DamageConf;
      const fm = app.metadataCache.getFileCache(file as TFile)?.frontmatter ?? {};
      const getFmNum = (names: string[]): number => { for (const n of names) { if (fm[n] !== undefined) return asNum(fm[n], NaN); } return NaN; };
      const fmMajor = getFmNum(["majorthreshold","major_threshold","majorThreshold","major","armor_major_threshold"]);
      const fmSevere = getFmNum(["severethreshold","severe_threshold","severeThreshold","severe","armor_severe_threshold"]);
      const level = asNum(dconf.level ?? fm.level ?? fm.tier ?? 0, 0);
      let finalMajor: number; let finalSevere: number; let subtitle: string;
      if ((dconf as any).major_threshold != null || (dconf as any).severe_threshold != null || Number.isFinite(fmMajor) || Number.isFinite(fmSevere)){
        finalMajor = asNum((dconf as any).major_threshold ?? fmMajor ?? 0, 0);
        finalSevere = asNum((dconf as any).severe_threshold ?? fmSevere ?? 0, 0);
        subtitle = `Final thresholds — Major: ${finalMajor} • Severe: ${finalSevere}`;
      } else {
        const baseMajor = asNum((dconf as any).base_major ?? 0, 0);
        const baseSevere = asNum((dconf as any).base_severe ?? 0, 0);
        finalMajor = baseMajor + level; finalSevere = baseSevere + level;
        subtitle = `Thresholds — Major: ${finalMajor} • Severe: ${finalSevere} (base ${baseMajor}/${baseSevere} + level ${level})`;
      }
      const hpKey = String((dconf as any).hp_key ?? 'din_health');
      return { finalMajor, finalSevere, subtitle, hpKey };
    };

    const render = async () => {
      const badgeRows = toBadgeRows(el, app as any, ctx, doc.badges?.items);
      const kinds = computeKinds();
      const vitalsKinds = computeVitalsKinds();
      const { subtitle, hpKey } = resolveDamageThresholds();

      const onShort = () => plugin && (require('./short-rest') as any).openShortRestUI
        ? (require('./short-rest') as any).openShortRestUI(plugin, el, ctx, {
            hp: vitalsKinds.find(k=>k.kind==='hp')?.key ?? kinds.find(k=>k.kind==='hp')?.key ?? 'din_health',
            stress: vitalsKinds.find(k=>k.kind==='stress')?.key ?? kinds.find(k=>k.kind==='stress')?.key ?? 'din_stress',
            armor: vitalsKinds.find(k=>k.kind==='armor')?.key ?? kinds.find(k=>k.kind==='armor')?.key ?? 'din_armor',
            hope: vitalsKinds.find(k=>k.kind==='hope')?.key ?? kinds.find(k=>k.kind==='hope')?.key ?? 'din_hope',
          })
        : null;

      const onLong = () => plugin && (require('./long-rest') as any).openLongRestUI
        ? (require('./long-rest') as any).openLongRestUI(plugin, el, ctx, {
            hp: vitalsKinds.find(k=>k.kind==='hp')?.key ?? kinds.find(k=>k.kind==='hp')?.key ?? 'din_health',
            stress: vitalsKinds.find(k=>k.kind==='stress')?.key ?? kinds.find(k=>k.kind==='stress')?.key ?? 'din_stress',
            armor: vitalsKinds.find(k=>k.kind==='armor')?.key ?? kinds.find(k=>k.kind==='armor')?.key ?? 'din_armor',
            hope: vitalsKinds.find(k=>k.kind==='hope')?.key ?? kinds.find(k=>k.kind==='hope')?.key ?? 'din_hope',
          })
        : null;

      const restConf = (doc.rest === true ? {} : (doc.rest || {})) as { short_label?: string; long_label?: string };
      const shortLabel = String(restConf.short_label ?? 'Short Rest');
      const longLabel = String(restConf.long_label ?? 'Long Rest');

      // Preload values for vitals trackers only
      const savedMap = new Map<string, number>();
      await Promise.all(
        vitalsKinds.map(async (k) => {
          const v = Number(await store.get<number>(`tracker:${k.key}`, 0) ?? 0);
          savedMap.set(k.key, Math.max(0, Math.min(k.total, v)));
        })
      );

      // Traits (optional)
      let traitsNode: any = null;
      try {
        const tconf = (doc as any).traits;
        if (tconf) {
          const srcStr = typeof tconf === 'string' ? tconf : JSON.stringify(tconf);
          const cards = buildCards(file.path, srcStr);
          if (cards && cards.length) {
            traitsNode = React.createElement('div', { className: 'dh-dash-traits' }, React.createElement(AbilityView, { data: cards }));
          }
        }
      } catch {}

      const vitalsFiltered = vitalsKinds.filter(k => (k.total ?? 0) > 0);
      const vitalsNode = ((doc as any).vitals && vitalsFiltered.length)
        ? React.createElement(
            'div',
            { className: 'dh-dash-vitals' },
            React.createElement(
              'div',
              { className: 'dh-vitals' },
              React.createElement(
                'div',
                { className: 'dh-vitals-grid' },
                vitalsFiltered.map((k) =>
                  React.createElement(TrackerRowView, {
                    key: `vitals:${k.kind}:${k.key}`,
                    label: k.label,
                    kind: k.kind,
                    shape: k.shape,
                    total: k.total,
                    initialFilled: savedMap.get(k.key) ?? 0,
                    stateKey: k.key,
                    onChange: async (filled: number) => {
                      const v = Math.max(0, Math.min(k.total, filled));
                      await store.set<number>(`tracker:${k.key}`, v);
                      try { window.dispatchEvent(new CustomEvent('dh:tracker:changed', { detail: { key: k.key, filled: v } })); } catch {}
                    }
                  })
                )
              ),
              React.createElement(
                'div',
                { className: 'dh-vitals-actions' },
                React.createElement(RestRowView as any, { shortLabel, longLabel, onShort: onShort as any, onLong: onLong as any }),
                React.createElement(DamageInlineView as any, {
                  title: String((doc.damage && (doc.damage as any).title) || 'Damage'),
                  subtitle,
                  onApply: async (rawAmtInput: number, tierReduceInput: number) => {
                    const { finalMajor, finalSevere } = resolveDamageThresholds();
                    if (!Number.isFinite(finalMajor) || !Number.isFinite(finalSevere)) { new Notice('Damage: thresholds not found.', 6000); return; }
                    const rawAmt = asNum(rawAmtInput, 0); const tierReduce = Math.max(0, Math.floor(asNum(tierReduceInput, 0)));
                    let startTier = 0; if (rawAmt >= finalSevere) startTier = 3; else if (rawAmt >= finalMajor) startTier = 2; else if (rawAmt > 0) startTier = 1; else startTier = 0;
                    const endTier = Math.max(0, Math.min(3, startTier - tierReduce));
                    const scope = (el.closest('.markdown-preview-view') as HTMLElement) ?? document.body;
                    const hpBoxesEl = scope.querySelector('.dh-tracker-boxes.dh-track-hp') as HTMLElement | null; const hpMax = hpBoxesEl ? hpBoxesEl.querySelectorAll('.dh-track-box').length : 0;
                    const hpFilled0 = await store.get<number>(`tracker:${hpKey}`, 0); let hpFilled1 = hpFilled0 + endTier; if (hpMax) hpFilled1 = Math.max(0, Math.min(hpMax, hpFilled1));
                    await store.set<number>(`tracker:${hpKey}`, hpFilled1);
                    try { window.dispatchEvent(new CustomEvent('dh:tracker:changed', { detail: { key: hpKey, filled: hpFilled1 } })); } catch {}
                    if (hpBoxesEl) { hpBoxesEl.querySelectorAll('.dh-track-box').forEach((n, i) => (n as HTMLDivElement).classList.toggle('on', i < hpFilled1)); }
                    const toast = `Damage ${rawAmt} – Severity: ${['None','Minor','Major','Severe'][startTier]} → ${['None','Minor','Major','Severe'][endTier]} – Now HP on: ${hpFilled1}/${hpMax || '?'}`;
                    new Notice(toast, 7000);
                  }
                })
              )
            )
          )
        : null;
      // Build per-dashboard data attributes from YAML
      const dashAttrs: Record<string, any> = { className: 'dh-dashboard' };
      try {
        const s: any = (doc as any);
        const surface = String(s.surface || '').trim(); if (surface === 'minimal' || surface === 'card') (dashAttrs as any)['data-surface'] = surface;
        if (s.compact === true) (dashAttrs as any)['data-compact'] = 'true';
        const hover = String(s.hover || '').trim(); if (hover === 'off' || hover === 'on') (dashAttrs as any)['data-hover'] = hover;
        const extra = (s.attrs && typeof s.attrs === 'object') ? s.attrs : {};
        for (const [k,v] of Object.entries(extra)) { (dashAttrs as any)[k] = v as any; }
      } catch {}
      const dash = React.createElement(
        'div', dashAttrs,
        badgeRows.length ? React.createElement('div', { className: 'dh-dash-badges' }, React.createElement(BadgesView, { items: badgeRows })) : null,
        traitsNode,
        vitalsNode,
        // trackers section removed; vitals is the single combined area
        React.createElement('div', { className: 'dh-dash-actions' },
          React.createElement(RestRowView, { shortLabel, longLabel, onShort: onShort as any, onLong: onLong as any }),
          React.createElement(DamageInlineView, {
            title: String((doc.damage && (doc.damage as any).title) || 'Damage'),
            subtitle,
            onApply: async (rawAmtInput: number, tierReduceInput: number) => {
              const { finalMajor, finalSevere } = resolveDamageThresholds();
              if (!Number.isFinite(finalMajor) || !Number.isFinite(finalSevere)) { new Notice('Damage: thresholds not found.', 6000); return; }
              const rawAmt = asNum(rawAmtInput, 0); const tierReduce = Math.max(0, Math.floor(asNum(tierReduceInput, 0)));
              let startTier = 0; if (rawAmt >= finalSevere) startTier = 3; else if (rawAmt >= finalMajor) startTier = 2; else if (rawAmt > 0) startTier = 1; else startTier = 0;
              const endTier = Math.max(0, Math.min(3, startTier - tierReduce));
              const scope = (el.closest('.markdown-preview-view') as HTMLElement) ?? document.body;
              const hpBoxesEl = scope.querySelector('.dh-tracker-boxes.dh-track-hp') as HTMLElement | null; const hpMax = hpBoxesEl ? hpBoxesEl.querySelectorAll('.dh-track-box').length : 0;
            const hpFilled0 = await store.get<number>(`tracker:${hpKey}`, 0); let hpFilled1 = hpFilled0 + endTier; if (hpMax) hpFilled1 = Math.max(0, Math.min(hpMax, hpFilled1));
            await store.set<number>(`tracker:${hpKey}`, hpFilled1);
            try { window.dispatchEvent(new CustomEvent('dh:tracker:changed', { detail: { key: hpKey, filled: hpFilled1 } })); } catch {}
            if (hpBoxesEl) { hpBoxesEl.querySelectorAll('.dh-track-box').forEach((n, i) => (n as HTMLDivElement).classList.toggle('on', i < hpFilled1)); }
              const toast = `Damage ${rawAmt} — Severity: ${['None','Minor','Major','Severe'][startTier]} → ${['None','Minor','Major','Severe'][endTier]} — Now HP on: ${hpFilled1}/${hpMax || '?'}`;
              new Notice(toast, 7000);
            }
          })
        )
      );

      root!.render(dash);

      // no manual DOM hydration; components mount with initialFilled and update via events
    };

    await render();
  });
}



