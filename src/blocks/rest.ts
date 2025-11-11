/**
 * Unified rest code block processor
 * 
 * Registers: ```rest
 * 
 * Displays both short and long rest buttons.
 * Opens modals for:
 * - Short rest (choose 2 moves, 1d4 + tier healing)
 * - Long rest (choose 2 moves, full recovery options)
 * 
 * Integrates with vitals trackers for HP/stress/armor/hope updates.
 */
import type DaggerheartPlugin from "../main";
import { MarkdownPostProcessorContext, Notice, TFile } from "obsidian";
import { parseYamlSafe } from "../utils/yaml";
import { openShortRestUI } from "./short-rest";
import { openLongRestUI } from "./long-rest";
import React from "react";
import { createRoot, Root } from "react-dom/client";
import { ControlsRowView } from "../components/controls-row";
import { registerLiveCodeBlock } from "../utils/liveBlock";
import * as store from "../lib/services/stateStore";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { KVProvider } from "../components/state/kv-context";
import { LevelUpModal } from "../ui/levelup-modal";
const roots = new WeakMap<HTMLElement, Root>();

type RestYaml = {
  // Labels
  short_label?: string;
  long_label?: string;
  levelup_label?: string;
  full_heal_label?: string;
  reset_all_label?: string;

  // Keys (used for Short/Long rest; Full Heal/Reset All auto-scan the current note)
  hp_key?: string;
  stress_key?: string;
  armor_key?: string;
  hope_key?: string;

  // Visibility flags
  show_short?: boolean;
  show_long?: boolean;
  show_levelup?: boolean;
  show_full_heal?: boolean;
  show_reset_all?: boolean;

  class?: string;
};

function parseYaml(src: string): RestYaml {
  try { return parseYamlSafe<RestYaml>(src) ?? {}; } catch { return {}; }
}

export function registerRest(plugin: DaggerheartPlugin) {
  registerLiveCodeBlock(plugin, "rest", async (el: HTMLElement, src: string, ctx: MarkdownPostProcessorContext) => {

      const conf = parseYaml(src);
      const klass = String(conf.class ?? '').trim().split(/\s+/).filter(Boolean)[0];
      el.addClass('dh-rest-block');
      if (klass) el.addClass(klass);
      // Prefer provided keys, but auto-detect from visible trackers if not supplied
      const scope = (el.closest('.markdown-preview-view') as HTMLElement) ?? document.body;
      const detectKey = (cls: string, fallback: string) => {
        // Find the first tracker row for this type and read its data-dh-key
        const n = scope.querySelector(`.dh-tracker-boxes.${cls}`)?.closest('.dh-tracker') as HTMLElement | null;
        const k = (n?.getAttribute('data-dh-key') || '').trim();
        return k || fallback;
      };
      const hpKey     = String(conf.hp_key     ?? detectKey('dh-track-hp',     'din_health'));
      const stressKey = String(conf.stress_key ?? detectKey('dh-track-stress', `din_stress::${ctx.sourcePath}`));
      const armorKey  = String(conf.armor_key  ?? detectKey('dh-track-armor',  `din_armor::${ctx.sourcePath}`));
      const hopeKey   = String(conf.hope_key   ?? detectKey('dh-track-hope',   `din_hope::${ctx.sourcePath}`));

      const mk = (scope: HTMLElement, cls: string, key: string) => ({
        getMax: () => (scope.querySelector(`.dh-tracker-boxes.${cls}`)?.querySelectorAll('.dh-track-box').length ?? 0),
        repaint: () => {
          const cont = scope.querySelector(`.dh-tracker-boxes.${cls}`);
          if (!cont) return;
          store.get<number>(`tracker:${key}`, 0).then((val) => {
            const filled = Number(val ?? 0) || 0;
            cont.querySelectorAll('.dh-track-box').forEach((n, i) => (n as HTMLDivElement).classList.toggle('on', i < filled));
          });
        },
      });

      const render = () => {
        const shortLabel = String(conf.short_label ?? "Short Rest");
        const longLabel = String(conf.long_label ?? "Long Rest");
        const levelupLabel = String(conf.levelup_label ?? "Level Up");
        const fullHealLabel = String(conf.full_heal_label ?? "Full Heal");
        const resetAllLabel = String(conf.reset_all_label ?? "Reset All");

        const showShort = conf.show_short !== false; // default true
        const showLong = conf.show_long !== false;   // default true
        const showLevelUp = conf.show_levelup === true;
        const showFullHeal = conf.show_full_heal === true;
        const showResetAll = conf.show_reset_all === true;

        let r = roots.get(el);
        if (!r) { r = createRoot(el); roots.set(el, r); }
        r.render(
          React.createElement(ErrorBoundary, { name: 'Controls' },
            React.createElement(KVProvider, null,
              React.createElement(ControlsRowView, {
                showShort, showLong, showLevelUp, showFullHeal, showResetAll,
                shortLabel, longLabel, levelupLabel, fullHealLabel, resetAllLabel,
                onShort: () => openShortRestUI(plugin, el, ctx, { hp: hpKey, stress: stressKey, armor: armorKey, hope: hopeKey }),
                onLong: () => openLongRestUI(plugin, el, ctx, { hp: hpKey, stress: stressKey, armor: armorKey, hope: hopeKey }),
                onLevelUp: () => {
                  const f = plugin.app.vault.getFileByPath(ctx.sourcePath) || plugin.app.workspace.getActiveFile();
                  if (f && f instanceof TFile) new LevelUpModal(plugin.app as any, plugin, f).open();
                  else new Notice('Level Up: could not resolve file for modal');
                },
                onFullHeal: async () => {
                  // Scope to current note preview; affect only HP trackers present here
                  const scope = (el.closest('.markdown-preview-view') as HTMLElement) ?? document.body;
                  const keys = new Set<string>();
                  scope.querySelectorAll('.dh-tracker .dh-track-hp').forEach((n)=>{
                    const k = (n.closest('.dh-tracker') as HTMLElement | null)?.getAttribute('data-dh-key') || '';
                    if (k) keys.add(k);
                  });
                  for (const k of keys){ await store.set<number>('tracker:' + k, 0); try { window.dispatchEvent(new CustomEvent('dh:tracker:changed', { detail: { key: k, filled: 0 } })); } catch {} }
                  new Notice(keys.size ? 'HP fully restored for this note.' : 'No HP tracker found in this note.');
                },
                onResetAll: async () => {
                  // Scope to current note preview; affect only trackers present here
                  const scope = (el.closest('.markdown-preview-view') as HTMLElement) ?? document.body;
                  const kinds = ['hp','stress','armor','hope'] as const;
                  const classFor: Record<typeof kinds[number], string> = { hp: 'dh-track-hp', stress: 'dh-track-stress', armor: 'dh-track-armor', hope: 'dh-track-hope' } as any;
                  const keysByKind: Record<string, Set<string>> = { hp: new Set(), stress: new Set(), armor: new Set(), hope: new Set() } as any;
                  kinds.forEach(kind => {
                    scope.querySelectorAll('.dh-tracker .' + classFor[kind]).forEach((n)=>{
                      const k = (n.closest('.dh-tracker') as HTMLElement | null)?.getAttribute('data-dh-key') || '';
                      if (k) (keysByKind[kind] as Set<string>).add(k);
                    });
                  });
                  let changed = 0;
                  for (const kind of kinds){
                    for (const k of keysByKind[kind]){
                      await store.set<number>('tracker:' + k, 0);
                      changed++;
                      try { window.dispatchEvent(new CustomEvent('dh:tracker:changed', { detail: { key: k, filled: 0 } })); } catch {}
                    }
                  }
                  new Notice(changed ? 'All trackers in this note reset.' : 'No trackers found in this note.');
                },
              })
            )
          )
        );
      };
      render();
  });
}
