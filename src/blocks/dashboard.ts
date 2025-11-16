/**
 * Dashboard code block
 *
 * Registers: ```dashboard
 *
 * Renders a compact dashboard that combines:
 * - Vitals trackers (HP, Stress, Armor, Hope)
 * - Rest controls (Short/Long, optional Level Up / Full Heal / Reset All)
 */
import type DaggerheartPlugin from "../main";
import React from "react";
import { createRoot, Root } from "react-dom/client";
import { MarkdownPostProcessorContext, Notice, TFile } from "obsidian";
import { TrackerRowView } from "../components/trackers-view";
import { ControlsRowView } from "../components/controls-row";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { KVProvider } from "../components/state/kv-context";
import { parseYamlSafe } from "../utils/yaml";
import { processTemplate, createTemplateContext } from "../utils/template";
import { registerLiveCodeBlock } from "../utils/liveBlock";
import * as store from "../lib/services/stateStore";
import { openShortRestUI } from "./short-rest";
import { openLongRestUI } from "./long-rest";
import { AbilityScoreView } from "../components/abilityscoreview";
import { BadgesView, type BadgeRow } from "../components/badges-view";
import { ConsumablesView, type ConsumableRow } from "../components/consumables-view";
import { DamageInlineView } from "../components/damage-inline";
import { applyDamage } from "../core/damage-calculator";
import { renderDomainPicker } from "./domain-picker";

// YAML shape supported by the dashboard block
// Example:
// ```dashboard
// class: my-dashboard
// hp: "{{ frontmatter.hp }}"
// stress: 8
// armor: "{{ add 2 frontmatter.armor }}"
// hope: 6
// hp_key: din_health
// stress_key: din_stress
// armor_key: din_armor
// hope_key: din_hope
// hp_label: HP
// show_levelup: true
// show_full_heal: true
// show_reset_all: true
// ```

type DashboardYaml = {
  class?: string;
  // tracker labels
  hp_label?: string; stress_label?: string; armor_label?: string; hope_label?: string;
  // tracker counts (supports templates)
  hp?: number | string; stress?: number | string; armor?: number | string; hope?: number | string;
  // keys for persistence
  hp_key?: string; stress_key?: string; armor_key?: string; hope_key?: string;
  // controls visibility
  show_short?: boolean; show_long?: boolean; show_levelup?: boolean; show_full_heal?: boolean; show_reset_all?: boolean;
  // control labels
  short_label?: string; long_label?: string; levelup_label?: string; full_heal_label?: string; reset_all_label?: string;
  // section visibility
  show_badges?: boolean; show_abilities?: boolean; show_vitals?: boolean; show_damage?: boolean; show_consumables?: boolean; show_features?: boolean; show_domainpicker?: boolean;
  // hero image
  hero?: string; hero_height?: number | string;
  // badges section
  badges?: { items?: Array<{ label?: string; value?: string | number | boolean | null }>; } | undefined;
  // consumables section (mirrors consumables block shapes)
  consumables?: any;
  // features section
  features?: {
    ancestry?: Array<{ label?: string; value?: string | number | boolean | null }>;
    class?: Array<{ label?: string; value?: string | number | boolean | null }>;
    subclass?: Array<{ label?: string; value?: string | number | boolean | null }>;
    community?: Array<{ label?: string; value?: string | number | boolean | null }>;
  } | undefined;
  // damage config (optional)
  damage?: {
    title?: string;
    hp_key?: string;
    armor_key?: string;
    major_threshold?: number | string;
    severe_threshold?: number | string;
    base_major?: number | string;
    base_severe?: number | string;
    level?: number | string;
  } | undefined;
};

function parseYaml(src: string): DashboardYaml { try { return parseYamlSafe<DashboardYaml>(src) ?? {}; } catch { return {}; } }

function resolveCount(
  raw: number | string | undefined,
  el: HTMLElement,
  app: any,
  ctx: MarkdownPostProcessorContext
): number {
  if (raw == null) return 0;
  if (typeof raw === "number") { const n = Math.floor(raw); return Number.isFinite(n) ? Math.max(0, n) : 0; }
  try {
    const tctx = createTemplateContext(el, app, ctx);
    const s = String(raw).trim();
    // Robust: allow either "{{ frontmatter.key }}" or plain "frontmatter.key"
    const m = s.match(/^\{\{\s*frontmatter\.([a-zA-Z0-9_\-]+)\s*\}\}$|^frontmatter\.([a-zA-Z0-9_\-]+)$/);
    if (m) {
      const key = (m[1] || m[2]) as string;
      const v = (tctx.frontmatter as any)?.[key];
      const n = Math.floor(Number(String(v)));
      return Number.isFinite(n) ? Math.max(0, n) : 0;
    }
    const out = processTemplate(s, tctx).trim();
    const n = Math.floor(Number(out));
    return Number.isFinite(n) ? Math.max(0, n) : 0;
  } catch { return 0; }
}

async function readState(key: string, max: number): Promise<number> {
  const n = Number(await store.get<number>(`tracker:${key}`, 0) ?? 0);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(max, n));
}

// badges util
function computeBadges(el: HTMLElement, app: any, ctx: MarkdownPostProcessorContext, items: Array<{ label?: string; value?: any }>): BadgeRow[] {
  const tctx = createTemplateContext(el, app, ctx);
  const renderValue = (raw: any): string => {
    if (raw === null || raw === undefined) return "";
    if (typeof raw === "number" || typeof raw === "boolean") return String(raw);
    if (typeof raw === "string") { try { return processTemplate(raw, tctx); } catch { return raw; } }
    return "";
  };
  return (items || []).map((it) => ({ label: String(it?.label ?? ""), value: renderValue(it?.value) }));
}

// consumables util (mirrors consumables-block)
function parseConsumables(doc: any): Array<{ label: string; state_key: string; uses: number }>{
  const src = doc || {};
  const itemsAny = (src as any)?.items ?? src;
  const normOne = (x: any) => ({ label: x?.label ?? "Consumable", state_key: x?.state_key ?? "", uses: x?.uses ?? 0 });
  if (Array.isArray(itemsAny)) return itemsAny.map(normOne);
  if (itemsAny && typeof itemsAny === 'object' && !("label" in itemsAny || "state_key" in itemsAny || "uses" in itemsAny)) return Object.values(itemsAny).map(normOne);
  if (itemsAny && typeof itemsAny === 'object') return [normOne(itemsAny)];
  return [];
}

function toConsumableRows(el: HTMLElement, app: any, ctx: MarkdownPostProcessorContext, items: Array<{ label: string; state_key: string; uses: number }>): ConsumableRow[] {
  const tctx = createTemplateContext(el, app, ctx);
  const rows: ConsumableRow[] = [];
  for (const it of items){
    const label = String(it?.label ?? "Consumable");
    const stateKey = String(it?.state_key ?? "").trim();
    let usesNum = 0; const rawUses = (it?.uses ?? 0);
    if (typeof rawUses === 'string') { const resolved = processTemplate(rawUses, tctx).trim(); const n = Number(resolved); usesNum = Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0; }
    else { const n = Number(rawUses); usesNum = Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0; }
    rows.push({ label, stateKey, uses: usesNum, filled: 0 });
  }
  return rows;
}

// damage thresholds util (mirrors damage-vault)
function asNum(v: unknown, def = 0): number { if (v === null || v === undefined) return def; const n = Number(String(v).trim()); return Number.isFinite(n) ? n : def; }
function readFmNumber(fm: Record<string, any>, aliases: string[], def = NaN): number { for (const k of aliases) { if (fm[k] !== undefined) return asNum(fm[k], def); } return def; }


// Resolve resource URL for an image path or absolute URL
function resourceFor(app: any, path: string | undefined): string | undefined {
  if (!path) return undefined;
  if (/^(app|https?):/i.test(path)) return path;
  try {
    const af: any = app.vault.getAbstractFileByPath(path);
    if (af && af.extension) return app.vault.getResourcePath(af);
  } catch {}
  return undefined;
}

export function registerDashboard(plugin: DaggerheartPlugin) {
  registerLiveCodeBlock(plugin, "dashboard", async (el: HTMLElement, src: string, ctx: MarkdownPostProcessorContext) => {
    const app = plugin.app;
    const y = parseYaml(src);
    const yv: any = (y as any).vitals || {};

    const klass = String(y.class ?? '').trim().split(/\s+/).filter(Boolean)[0];
    el.addClass('dh-dashboard-block');
    if (klass) el.addClass(klass);

    // Prefer provided keys; otherwise use defaults
    const hpKey     = String((y as any).hp_key     ?? yv.hp_key     ?? 'din_health');
    const stressKey = String((y as any).stress_key ?? yv.stress_key ?? (`din_stress::${ctx.sourcePath}`));
    const armorKey  = String((y as any).armor_key  ?? yv.armor_key  ?? (`din_armor::${ctx.sourcePath}`));
    const hopeKey   = String((y as any).hope_key   ?? yv.hope_key   ?? (`din_hope::${ctx.sourcePath}`));

    // Counts (resolve templates)
    let hpCount     = resolveCount((y as any).hp     ?? yv.hp,     el, app, ctx);
    let stressCount = resolveCount((y as any).stress ?? yv.stress, el, app, ctx);
    let armorCount  = resolveCount((y as any).armor  ?? yv.armor,  el, app, ctx);
    let hopeCount   = resolveCount((y as any).hope   ?? yv.hope,   el, app, ctx);
    if (!hopeCount) hopeCount = 6;

    const hpLabel     = String((y as any).hp_label     ?? yv.hp_label     ?? 'HP');
    const stressLabel = String((y as any).stress_label ?? yv.stress_label ?? 'Stress');
    const armorLabel  = String((y as any).armor_label  ?? yv.armor_label  ?? 'Armor');
    const hopeLabel   = String((y as any).hope_label   ?? yv.hope_label   ?? 'Hope');

    const [hpFilled, stressFilled, armorFilled, hopeFilled] = await Promise.all([
      readState(hpKey, hpCount),
      readState(stressKey, stressCount),
      readState(armorKey, armorCount),
      readState(hopeKey, hopeCount),
    ]);

    // Controls
    const shortLabel = String(y.short_label ?? "Short Rest");
    const longLabel = String(y.long_label ?? "Long Rest");
    const levelupLabel = String(y.levelup_label ?? "Level Up");
    const fullHealLabel = String(y.full_heal_label ?? "Full Heal");
    const resetAllLabel = String(y.reset_all_label ?? "Reset All");

    const showShort = y.show_short !== false; // default true
    const showLong = y.show_long !== false;   // default true
    const showLevelUp = y.show_levelup === true;
    const showFullHeal = y.show_full_heal === true;
    const showResetAll = y.show_reset_all === true;

    let root: Root | null = (null as any);
    const ensureRoot = () => { if (!root) { root = createRoot(el); } return root!; };

    const onFilled = (key: string) => async (v: number) => {
      await store.set<number>(`tracker:${key}`, Math.max(0, v|0));
      try { window.dispatchEvent(new CustomEvent('dh:tracker:changed', { detail: { key, filled: v } })); } catch {}
    };

    const render = () => {

      const cards: any[] = [];
      let heroCard: any = null;
      let restCard: any = null;
      let vitalsCard: any = null;
      let consumablesCard: any = null;
      let featuresCard: any = null;
      let domainsCard: any = null;

      // Hero image (optional)
      try {
        const file = plugin.app.vault.getFileByPath(ctx.sourcePath) as TFile | null;
        const fm = file ? (plugin.app.metadataCache.getFileCache(file)?.frontmatter ?? {}) : {};
        const tctx = createTemplateContext(el, app, ctx);
        const rawHero = (y as any).hero ?? (fm as any).art ?? (fm as any).image ?? (fm as any).hero;
        let heroUrl: string | undefined;
        if (rawHero) {
          const s = typeof rawHero === 'string' ? rawHero : String(rawHero);
          const resolved = processTemplate(s, tctx).trim();
          heroUrl = resourceFor(app, resolved) || resolved;
        }
        const hhRaw = (y as any).hero_height;
        const heroH = typeof hhRaw === 'string' ? hhRaw : (Number.isFinite(hhRaw as any) ? `${hhRaw}px` : undefined);
        // Optional fit/position controls for the portrait image
        const heroFit = (y as any).hero_fit ? String((y as any).hero_fit) : undefined; // 'cover' | 'contain'
        const heroPos = (y as any).hero_position ? String((y as any).hero_position) : undefined; // e.g. 'top', 'center', 'top-left'
        if (heroUrl) {
          const heroAttrs: any = { className: 'dh-dash-section card-hero dh-dash-hero', style: heroH ? ({ ['--dh-hero-h']: heroH } as any) : undefined, 'data-fixed-h': heroH ? '1' : undefined };
          if (heroFit) heroAttrs['data-fit'] = heroFit;
          if (heroPos) heroAttrs['data-pos'] = heroPos;
          heroCard = React.createElement('div', heroAttrs,
            React.createElement('div', { className: 'dh-dash-title' }, 'Portrait'),
            React.createElement('img', { className: 'dh-hero-img', src: heroUrl, alt: 'Portrait' })
          );
        }
      } catch {}

      // Badges & Rest (always render; abilities optional below)
      const abilMount = (y.show_abilities !== false)
        ? React.createElement('div', { className: 'dh-abilities-wrap', ref: (node: HTMLDivElement | null) => {
            if (!node) return;
            try { node.innerHTML = ''; const view = new AbilityScoreView(app as any); view.render('', node, ctx); }
            catch (e) { /* noop */ }
          }})
        : null;
      restCard = React.createElement('div', { className: 'dh-dash-section card-rest dh-dash-badgesrest' },
        React.createElement('div', { className: 'dh-dash-title' }, 'Badges & Rest'),
        // badges (if provided)
        (y.show_badges !== false && y.badges && Array.isArray(y.badges.items) && y.badges.items.length)
          ? React.createElement(BadgesView, { items: computeBadges(el, app, ctx, y.badges.items as any) })
          : null,
        // abilities (traits) in the middle
        abilMount,
        // controls row under traits (styled like standalone rest block)
        React.createElement('div', { className: 'block-language-rest dh-rest-embed' },
          React.createElement(ControlsRowView, {
            showShort, showLong, showLevelUp, showFullHeal, showResetAll,
            shortLabel, longLabel, levelupLabel, fullHealLabel, resetAllLabel,
            onShort: () => openShortRestUI(plugin, el, ctx, { hp: hpKey, stress: stressKey, armor: armorKey, hope: hopeKey }),
            onLong: () => openLongRestUI(plugin, el, ctx, { hp: hpKey, stress: stressKey, armor: armorKey, hope: hopeKey }),
            onLevelUp: () => {
              const f = plugin.app.vault.getFileByPath(ctx.sourcePath) || plugin.app.workspace.getActiveFile();
              if (f && f instanceof TFile) { try { (new (require('../ui/levelup-modal').LevelUpModal)(plugin.app as any, plugin, f)).open(); } catch { new Notice('Level Up: failed to open modal'); } }
              else new Notice('Level Up: could not resolve file for modal');
            },
            onFullHeal: async () => {
              const scope = (el.closest('.markdown-preview-view') as HTMLElement) ?? document.body;
              const keys = new Set<string>();
              scope.querySelectorAll('.dh-tracker .dh-track-hp').forEach((n)=>{ const k = (n.closest('.dh-tracker') as HTMLElement | null)?.getAttribute('data-dh-key') || ''; if (k) keys.add(k); });
              for (const k of keys){ await store.set<number>('tracker:' + k, 0); try { window.dispatchEvent(new CustomEvent('dh:tracker:changed', { detail: { key: k, filled: 0 } })); } catch {} }
              new Notice(keys.size ? 'HP fully restored for this note.' : 'No HP tracker found in this note.');
            },
            onResetAll: async () => {
              const scope = (el.closest('.markdown-preview-view') as HTMLElement) ?? document.body;
              const kinds = ['hp','stress','armor','hope'] as const;
              const classFor: Record<typeof kinds[number], string> = { hp: 'dh-track-hp', stress: 'dh-track-stress', armor: 'dh-track-armor', hope: 'dh-track-hope' } as any;
              const keysByKind: Record<string, Set<string>> = { hp: new Set(), stress: new Set(), armor: new Set(), hope: new Set() } as any;
              kinds.forEach(kind => { scope.querySelectorAll('.dh-tracker .' + classFor[kind]).forEach((n)=>{ const k = (n.closest('.dh-tracker') as HTMLElement | null)?.getAttribute('data-dh-key') || ''; if (k) (keysByKind[kind] as Set<string>).add(k); }); });
              let changed = 0; for (const kind of kinds){ for (const k of keysByKind[kind]){ await store.set<number>('tracker:' + k, 0); changed++; try { window.dispatchEvent(new CustomEvent('dh:tracker:changed', { detail: { key: k, filled: 0 } })); } catch {} } }
              new Notice(changed ? 'All trackers in this note reset.' : 'No trackers found in this note.');
            },
          })
        )
      );

// Vitals + Damage
      if (y.show_vitals !== false) {
        const vitalsInner: any[] = [
          React.createElement('div', { className: 'dh-vitals-grid' },
            React.createElement(TrackerRowView as any, { label: hpLabel, kind: 'hp', shape: 'rect', total: hpCount, initialFilled: hpFilled, onChange: onFilled(hpKey), stateKey: hpKey }),
            React.createElement(TrackerRowView as any, { label: stressLabel, kind: 'stress', shape: 'rect', total: stressCount, initialFilled: stressFilled, onChange: onFilled(stressKey), stateKey: stressKey }),
            React.createElement(TrackerRowView as any, { label: armorLabel, kind: 'armor', shape: 'rect', total: armorCount, initialFilled: armorFilled, onChange: onFilled(armorKey), stateKey: armorKey }),
            React.createElement(TrackerRowView as any, { label: hopeLabel, kind: 'hope', shape: 'diamond', total: hopeCount, initialFilled: hopeFilled, onChange: onFilled(hopeKey), stateKey: hopeKey }),
          )
        ];
        // Optional: hope features/footer nested under vitals: { footer: [...] }
        try {
          const tctx = createTemplateContext(el, app, ctx);
          const rawHF: any = yv.hope_feature ?? yv.footer;
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
          if (Array.isArray(rawHF)) rawHF.forEach(normOne); else if (rawHF != null) normOne(rawHF);
          if (hopeFeatures.length) {
            vitalsInner.push(
              React.createElement('div', { className: 'dh-vitals-hope' },
                ...hopeFeatures.map((f) => React.createElement('div', { className: 'dh-vitals-hope-row' }, f.label ? React.createElement('div', { className: 'label' }, f.label) : null, React.createElement('div', { className: 'value' }, f.value)))
              )
            );
          }
        } catch {}
        const children: any[] = [
          React.createElement('div', { className: 'dh-dash-title' }, 'Vitals & Damage'),
          React.createElement('div', { className: 'dh-vitals' }, ...vitalsInner),
        ];
        if (y.show_damage !== false) {
          const dmgCfg = (y.damage || {}) as any;
          const HP_KEY = String(dmgCfg.hp_key ?? hpKey);
          const ARMOR_KEY = String(dmgCfg.armor_key ?? armorKey);
          const resolveThresholds = () => {
            try {
              const file = plugin.app.vault.getFileByPath(ctx.sourcePath) as TFile | null;
              const fm = file ? (plugin.app.metadataCache.getFileCache(file)?.frontmatter ?? {}) : {};
              const tctx = createTemplateContext(el, app, ctx);
              const mRaw = dmgCfg.major_threshold != null ? String(dmgCfg.major_threshold) : undefined;
              const sRaw = dmgCfg.severe_threshold != null ? String(dmgCfg.severe_threshold) : undefined;
              const mTpl = mRaw ? processTemplate(mRaw, tctx) : undefined;
              const sTpl = sRaw ? processTemplate(sRaw, tctx) : undefined;
              const parsedMajorFromTemplate = (typeof mTpl === 'string' && mTpl.trim() !== '') ? Number(mTpl) : NaN;
              const parsedSevereFromTemplate = (typeof sTpl === 'string' && sTpl.trim() !== '') ? Number(sTpl) : NaN;
              const fmMajor = Number.isFinite(parsedMajorFromTemplate) ? parsedMajorFromTemplate : readFmNumber(fm, ["majorthreshold","major_threshold","majorThreshold","major","armor_major_threshold"]);
              const fmSevere = Number.isFinite(parsedSevereFromTemplate) ? parsedSevereFromTemplate : readFmNumber(fm, ["severethreshold","severe_threshold","severeThreshold","severe","armor_severe_threshold"]);
              const level = asNum(dmgCfg.level ?? fm.level ?? fm.tier ?? 0, 0);
              const baseMajor = asNum(dmgCfg.base_major ?? 0, 0);
              const baseSevere = asNum(dmgCfg.base_severe ?? 0, 0);
              const sourceMajor = Number.isFinite(fmMajor) ? fmMajor : baseMajor;
              const sourceSevere = Number.isFinite(fmSevere) ? fmSevere : baseSevere;
              const finalMajor = asNum(sourceMajor, 0) + level;
              const finalSevere = asNum(sourceSevere, 0) + level;
              return { finalMajor, finalSevere };
            } catch { return { finalMajor: 0, finalSevere: 0 }; }
          };
          const thr = resolveThresholds();
          children.push(
            React.createElement(DamageInlineView, {
              title: String(dmgCfg.title ?? 'Damage'),
              majorThreshold: thr.finalMajor,
              severeThreshold: thr.finalSevere,
              onApply: async (rawAmtInput: number, tierReduceInput: number) => {
                const { finalMajor, finalSevere } = resolveThresholds();
                const rawAmt = asNum(rawAmtInput, 0);
                const tierReduce = Math.max(0, Math.floor(asNum(tierReduceInput, 0)));
                const result = await applyDamage({ rawAmt, tierReduce, finalMajor, finalSevere, hpKey: HP_KEY, armorKey: ARMOR_KEY, scope: (el.closest('.markdown-preview-view') as HTMLElement) ?? document.body });
                if (!result.success) new Notice(result.message || 'Damage application failed', 6000); else new Notice(result.message || 'Damage applied', 6000);
              }
            })
          );
        }
        vitalsCard = React.createElement('div', { className: 'dh-dash-section card-vitals dh-dash-vitalsdamage' }, ...children);
      }

      // Row 2 sections

      // Consumables (optional)
      {
        // Accept both 'consumables' and the common misspelling 'consummables'
        const rawCons = (y as any).consumables ?? (y as any).consummables;
        const items = parseConsumables(rawCons);
        const rows = toConsumableRows(el, app, ctx, items);
        // Visibility policy: if show_consumables===true force show; if false hide; otherwise show only if rows>0
        const force = (y as any).show_consumables === true;
        const hide = (y as any).show_consumables === false;
        const showCons = force ? true : hide ? false : rows.length > 0;
        if (showCons) {
          consumablesCard = React.createElement(
            'div',
            { className: 'dh-dash-section card-consumables dh-dash-consumables' },
            React.createElement('div', { className: 'dh-dash-title' }, 'Consumables'),
            rows.length
              ? React.createElement(ConsumablesView, {
                  rows,
                  onChange: async (stateKey: string, filled: number) => {
                    try { localStorage.setItem(`dh:consumable:${stateKey}`, JSON.stringify(filled)); } catch {}
                  }
                })
              : React.createElement('div', null, 'No consumables configured')
          );
        }
        // Inform features layout whether consumables exist
        (y as any).__hasConsumables = showCons;
      }

      // Features list
      if (y.show_features !== false && y.features) {
        const tctx = createTemplateContext(el, app, ctx);
        const renderVal = (v: any) => {
          if (v === null || v === undefined) return '';
          if (typeof v === 'number' || typeof v === 'boolean') return String(v);
          if (typeof v === 'string') { try { return processTemplate(v, tctx); } catch { return v; } }
          return '';
        };
        const sec = (key: 'ancestry'|'class'|'subclass'|'community', title: string) => {
          const arr = (y.features as any)?.[key];
          if (!Array.isArray(arr) || !arr.length) return null;
          return React.createElement('div', { className: `dh-features-section dh-features-${key}` },
            React.createElement('div', { className: 'dh-features-heading' }, title),
            ...arr.map((it:any, i:number)=> React.createElement('div', { key: `${key}-${i}`, className: 'dh-feature-item' },
              it?.label ? React.createElement('div', { className: 'dh-feature-label' }, String(it.label)) : null,
              it?.value ? React.createElement('div', { className: 'dh-feature-value' }, renderVal(it.value)) : null
            ))
          );
        };
        featuresCard = React.createElement(
          'div',
          { className: `dh-dash-section card-features ${ (y as any).__hasConsumables ? '' : 'card-features--full ' }dh-dash-features dh-features-list dh-features--grid` },
          React.createElement('div', { className: 'dh-dash-title' }, 'Features'),
          sec('ancestry','Ancestry'),
          sec('class','Class'),
          sec('subclass','Subclass'),
          sec('community','Community')
        );
      }

      // Domain Picker
      if (y.show_domainpicker === true) {
        const pickerHost = React.createElement('div', { className: 'dh-dash-section card-domains dh-dash-domainpicker', ref: (node: HTMLDivElement | null) => {
          if (!node) return;
          try { node.innerHTML = ''; renderDomainPicker(node, plugin, ctx); } catch {}
        }},
          React.createElement('div', { className: 'dh-dash-title' }, 'Domain Cards')
        );
        domainsCard = pickerHost;
      }

      // Compose cards in DOM order (CSS grid-template-areas will position them)
      if (heroCard) cards.push(heroCard);
      if (restCard) cards.push(restCard);
      if (vitalsCard) cards.push(vitalsCard);
      if (consumablesCard) cards.push(consumablesCard);
      if (featuresCard) cards.push(featuresCard);
      if (domainsCard) cards.push(domainsCard);

      ensureRoot().render(
        React.createElement(ErrorBoundary, { name: 'Dashboard' },
          React.createElement(KVProvider, null,
            React.createElement('div', { className: 'dh-dashboard dh-grid', 'data-layout': 'areas' }, ...cards)
          )
        )
      );
    };

    render();
  });
}