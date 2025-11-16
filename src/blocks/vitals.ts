/**
 * Vitals code block processor
 * 
 * Registers: ```vitals, ```vital-trackers
 * 
 * Displays all four character vitals in a grid.
 * Trackers:
 * - HP (rectangles)
 * - Stress (rectangles)
 * - Armor (rectangles)
 * - Hope (diamonds)
 * 
 * Features template support, custom labels, and persistent state.
 */
import type DaggerheartPlugin from "../main";
import React from "react";
import { createRoot, Root } from "react-dom/client";
import { MarkdownPostProcessorContext } from "obsidian";
import { parseYamlSafe } from "../utils/yaml";
import { processTemplate, createTemplateContext } from "../utils/template";
import { TrackerRowView } from "../components/trackers-view";
import * as store from "../lib/services/stateStore";
import { registerLiveCodeBlock } from "../utils/liveBlock";

type VitalsYaml = {
  class?: string;
  // labels
  hp_label?: string; stress_label?: string; armor_label?: string; hope_label?: string;
  // counts (supports templates)
  hp?: number | string; stress?: number | string; armor?: number | string; hope?: number | string;
  // state keys
  hp_key?: string; stress_key?: string; armor_key?: string; hope_key?: string;
  // optional Hope feature footer (rows under trackers). Alias: `footer` for backwards-compat.
  hope_feature?: any;
  footer?: any;
};

function parseYaml(src: string): VitalsYaml {
  try { return parseYamlSafe<VitalsYaml>(src) ?? {}; } catch { return {}; }
}

function resolveCount(
  raw: number | string | undefined,
  el: HTMLElement,
  app: any,
  ctx: MarkdownPostProcessorContext
): number {
  if (raw == null) return 0;
  if (typeof raw === "number") {
    const n = Math.floor(raw);
    return Number.isFinite(n) ? Math.max(0, n) : 0;
  }
  try {
    const tctx = createTemplateContext(el, app, ctx);
    const s = String(raw).trim();
    const m = s.match(/^\{\{\s*frontmatter\.([a-zA-Z0-9_\-]+)\s*\}\}$|^frontmatter\.([a-zA-Z0-9_\-]+)$/);
    if (m) {
      const key = (m[1] || m[2]) as string;
      const v = (tctx.frontmatter as any)?.[key];
      const n = Math.floor(Number(String(v)));
      return Number.isFinite(n) ? Math.max(0, n) : 0;
    }
    const out = processTemplate(String(raw), tctx).trim();
    const n = Math.floor(Number(out));
    return Number.isFinite(n) ? Math.max(0, n) : 0;
  } catch {
    return 0;
  }
}

async function readState(key: string, max: number): Promise<number> {
  const n = Number(await store.get<number>(`tracker:${key}`, 0) ?? 0);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(max, n));
}

async function writeState(key: string, v: number) {
  await store.set<number>(`tracker:${key}`, Math.max(0, v | 0));
}

const roots = new WeakMap<HTMLElement, Root>();

export function registerVitals(plugin: DaggerheartPlugin) {
  // Primary name fits the theme; alias provided for discoverability
  const names = ["vitals", "vital-trackers"] as const;

  for (const name of names) {
    registerLiveCodeBlock(plugin, name, async (el, src, ctx) => {
      const app = plugin.app;
      const y = parseYaml(src);

      const klass = String(y.class ?? '').trim().split(/\s+/).filter(Boolean)[0];
      el.addClass('dh-vitals-block');
      if (klass) el.addClass(klass);

      const hpKey     = String(y.hp_key     ?? 'din_health');
      const stressKey = String(y.stress_key ?? (`din_stress::${ctx.sourcePath}`));
      const armorKey  = String(y.armor_key  ?? (`din_armor::${ctx.sourcePath}`));
      const hopeKey   = String(y.hope_key   ?? (`din_hope::${ctx.sourcePath}`));

      let hpCount     = resolveCount(y.hp,     el, app, ctx);
      let stressCount = resolveCount(y.stress, el, app, ctx);
      let armorCount  = resolveCount(y.armor,  el, app, ctx);
      let hopeCount   = resolveCount(y.hope,   el, app, ctx);
      if (!hopeCount) hopeCount = 6; // default hope to 6 like standalone

      const hpLabel     = String(y.hp_label     ?? 'HP');
      const stressLabel = String(y.stress_label ?? 'Stress');
      const armorLabel  = String(y.armor_label  ?? 'Armor');
      const hopeLabel   = String(y.hope_label   ?? 'Hope');

      const [hpFilled, stressFilled, armorFilled, hopeFilled] = await Promise.all([
        readState(hpKey, hpCount),
        readState(stressKey, stressCount),
        readState(armorKey, armorCount),
        readState(hopeKey, hopeCount),
      ]);

      // Optional Hope feature rows under the trackers
      const tctx = createTemplateContext(el, app, ctx);
      const rawHF: any = (y as any).hope_feature ?? (y as any).footer;
      const hopeFeatures: Array<{ label: string; value: string }> = [];
      const normOne = (item: any) => {
        if (item == null) return;
        if (typeof item === 'string') {
          const v = processTemplate(String(item), tctx).trim();
          if (v) hopeFeatures.push({ label: '', value: v });
          return;
        }
        if (typeof item === 'object') {
          const lbl = (item.label ?? item.lable ?? '').toString();
          const val = (item.value ?? '').toString();
          const nLbl = lbl ? processTemplate(lbl, tctx).trim() : '';
          const nVal = val ? processTemplate(val, tctx).trim() : '';
          if (nLbl || nVal) hopeFeatures.push({ label: nLbl, value: nVal });
        }
      };
      try {
        if (Array.isArray(rawHF)) rawHF.forEach(normOne);
        else if (rawHF != null) normOne(rawHF);
      } catch {}

      let root = roots.get(el) || null;
      if (!root) { root = createRoot(el); roots.set(el, root); }

      const onFilled = (key: string) => async (v: number) => {
        await writeState(key, v);
        try { window.dispatchEvent(new CustomEvent('dh:tracker:changed', { detail: { key, filled: v } })); } catch {}
      };

      root.render(
        React.createElement(
          'div',
          { className: 'dh-vitals' },
          React.createElement(
            'div',
            { className: 'dh-vitals-grid' },
            React.createElement(TrackerRowView as any, {
              label: hpLabel,
              kind: 'hp',
              shape: 'rect',
              total: hpCount,
              initialFilled: hpFilled,
              onChange: onFilled(hpKey),
              stateKey: hpKey,
            }),
            React.createElement(TrackerRowView as any, {
              label: stressLabel,
              kind: 'stress',
              shape: 'rect',
              total: stressCount,
              initialFilled: stressFilled,
              onChange: onFilled(stressKey),
              stateKey: stressKey,
            }),
            React.createElement(TrackerRowView as any, {
              label: armorLabel,
              kind: 'armor',
              shape: 'rect',
              total: armorCount,
              initialFilled: armorFilled,
              onChange: onFilled(armorKey),
              stateKey: armorKey,
            }),
            React.createElement(TrackerRowView as any, {
              label: hopeLabel,
              kind: 'hope',
              shape: 'diamond',
              total: hopeCount,
              initialFilled: hopeFilled,
              onChange: onFilled(hopeKey),
              stateKey: hopeKey,
            })
          ),
          hopeFeatures.length
            ? React.createElement(
                'div',
                { className: 'dh-vitals-hope' },
                ...hopeFeatures.map((f) =>
                  React.createElement(
                    'div',
                    { className: 'dh-vitals-hope-row' },
                    f.label ? React.createElement('div', { className: 'label' }, f.label) : null,
                    React.createElement('div', { className: 'value' }, f.value)
                  )
                )
              )
            : null
        )
      );
    });
  }
}
