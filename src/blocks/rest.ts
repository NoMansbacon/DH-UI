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
import React from "react";
import { Root } from "react-dom/client";
import { ControlsRowView } from "../components/controls-row";
import { registerLiveCodeBlock } from "../utils/liveBlock";
import { getOrCreateRoot } from "../utils/reactRoot";
import * as store from "../lib/services/stateStore";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { KVProvider } from "../components/state/kv-context";
import { LevelUpModal } from "../ui/levelup-modal";
import { CombinedRestModal } from "../ui/rest-modals";
import { emitTrackerChanged } from "../utils/events";

const roots = new WeakMap<HTMLElement, Root>();

type RestYaml = {
  // Labels
  rest_label?: string;
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

  // Optional: maximum number of rest moves a player can select in the modal.
  // Defaults to 2 (official rules allow two moves total per rest).
  max_picks?: number;

  // Preferred CSS class hook for styling the rest control row
  styleClass?: string;
  // Legacy CSS class alias (still honored for backwards compatibility)
  class?: string;
};

function parseYaml(src: string): RestYaml {
  try { return parseYamlSafe<RestYaml>(src) ?? {}; } catch { return {}; }
}

export function registerRest(plugin: DaggerheartPlugin) {
  registerLiveCodeBlock(plugin, "rest", async (el: HTMLElement, src: string, ctx: MarkdownPostProcessorContext) => {

      const conf = parseYaml(src);
      const klass = String((conf as any).styleClass ?? conf.class ?? '').trim().split(/\s+/).filter(Boolean)[0];
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
      const hpKey     = String(conf.hp_key     ?? detectKey('dh-track-hp',     `din_health::${ctx.sourcePath}`));
      const stressKey = String(conf.stress_key ?? detectKey('dh-track-stress', `din_stress::${ctx.sourcePath}`));
      const armorKey  = String(conf.armor_key  ?? detectKey('dh-track-armor',  `din_armor::${ctx.sourcePath}`));
      const hopeKey   = String(conf.hope_key   ?? detectKey('dh-track-hope',   `din_hope::${ctx.sourcePath}`));

      const maxPicks = (() => {
        const raw = (conf as any).max_picks;
        const n = Number(raw);
        return Number.isFinite(n) && n > 0 ? Math.floor(n) : 2;
      })();

      const mk = (scope: HTMLElement, cls: string, key: string) => ({
        getMax: () => (scope.querySelector(`.dh-tracker-boxes.${cls}`)?.querySelectorAll('.dh-track-box').length ?? 0),
        repaint: () => {
          // Repaint via the shared tracker event so React-based tracker rows stay in sync.
          store.get<number>(`tracker:${key}`, 0).then((val) => {
            const filled = Number(val ?? 0) || 0;
            emitTrackerChanged({ key, filled });
          });
        },
      });

      const trackers = {
        hp: mk(scope, 'dh-track-hp', hpKey),
        stress: mk(scope, 'dh-track-stress', stressKey),
        armor: mk(scope, 'dh-track-armor', armorKey),
        hope: mk(scope, 'dh-track-hope', hopeKey),
      };

      const openCombined = (initial: 'short' | 'long') => {
        const file = plugin.app.vault.getFileByPath(ctx.sourcePath) || plugin.app.workspace.getActiveFile();
        if (!file || !(file instanceof TFile)) {
          new Notice('Rest: could not resolve file');
          return;
        }
        new CombinedRestModal(
          plugin.app,
          file,
          { hp: hpKey, stress: stressKey, armor: armorKey, hope: hopeKey },
          trackers,
          maxPicks,
          initial,
        ).open();
      };

      const render = () => {
        const restLabel = String(conf.rest_label ?? "Rest");
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

        const r = getOrCreateRoot(roots, el);
        r.render(
          React.createElement(ErrorBoundary, { name: 'Controls' },
            React.createElement(KVProvider, null,
              React.createElement(ControlsRowView, {
                showShort, showLong, showLevelUp, showFullHeal, showResetAll,
                restLabel,
                shortLabel, longLabel, levelupLabel, fullHealLabel, resetAllLabel,
                // Combined "Rest" button opens with the combined modal focused on Short Rest by default.
                onRest: () => openCombined('short'),
                // Keyboard shortcuts still open with the relevant column highlighted.
                onShort: () => openCombined('short'),
                onLong: () => openCombined('long'),
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
                  for (const k of keys){
                    await store.set<number>('tracker:' + k, 0);
                    emitTrackerChanged({ key: k, filled: 0 });
                  }
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
                      emitTrackerChanged({ key: k, filled: 0 });
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
