// src/lib/components/short-rest.ts (rebuilt using long-rest style)
import type DaggerheartPlugin from "../main";
import { MarkdownPostProcessorContext, MarkdownRenderChild, Notice, TFile } from "obsidian";
import { parseYamlSafe } from "../utils/yaml";
import React from "react";
import { createRoot, Root } from "react-dom/client";
import { RestButtonView } from "../components/rest-button";
import * as store from "../lib/services/stateStore";
import { CombinedRestModal, RestType } from "../ui/rest-modals";

const roots = new WeakMap<HTMLElement, Root>();

// ---------- helpers ----------
function asNum(v: unknown, def = 0): number { const n = Number(v); return Number.isFinite(n) ? n : def; }
function rollD4(): number { return 1 + Math.floor(Math.random() * 4); }
function btn(label: string, cls = "dh-rest-btn"): HTMLButtonElement { const b = document.createElement("button"); b.className = cls; b.textContent = label; return b; }
function pill(text: string, cls = "dh-rest-pill"): HTMLSpanElement { const s = document.createElement("span"); s.className = cls; s.textContent = text; return s; }
function scopeOf(el: HTMLElement): HTMLElement { return (el.closest('.markdown-preview-view') as HTMLElement) ?? document.body; }
function cssEscape(s: string){ try { return (CSS as any).escape(s); } catch { return String(s).replace(/["\\]/g,'\\$&'); } }

async function readFilled(key: string): Promise<number>{ return asNum(await store.get<number>(`tracker:${key}`, 0), 0); }
async function writeFilled(key: string, v: number){ await store.set<number>(`tracker:${key}`, asNum(v,0)); }

function minBoxesFor(scope: HTMLElement, cls: string, key: string): number{
  const sel = `.dh-tracker[data-dh-key="${cssEscape(key)}"] .${cls}`;
  const list = Array.from(scope.querySelectorAll(sel)) as HTMLElement[];
  if (!list.length) return 0;
  const counts = list.map(n => n.querySelectorAll('.dh-track-box').length).filter(n => Number.isFinite(n) && n>0) as number[];
  return counts.length? Math.min(...counts): 0;
}

// ---------- YAML ----------
type ShortRestYaml = { label?: string; hp_key?: string; stress_key?: string; armor_key?: string; hope_key?: string; class?: string };
function parseYaml(src: string): ShortRestYaml { try { return parseYamlSafe<ShortRestYaml>(src) ?? {}; } catch { return {}; } }

// ---------- register (code block) ----------
export function registerShortRest(plugin: DaggerheartPlugin){
  const langs = ["short-rest","short"] as const;
  for (const lang of langs) plugin.registerMarkdownCodeBlockProcessor(lang, async (src, el, ctx) => {
    el.empty();

    const conf = parseYaml(src);
    const klass = String((conf as any)?.class ?? '').trim().split(/\s+/).filter(Boolean)[0];
    el.addClass('dh-short-rest-block');
    if (klass) el.addClass(klass);
    const triggerLabel = String(conf.label ?? 'Short Rest');
    const hpKey = String(conf.hp_key ?? 'din_health');
    const stressKey = String(conf.stress_key ?? 'din_stress');
    const armorKey = String(conf.armor_key ?? 'din_armor');
    const hopeKey = String(conf.hope_key ?? 'din_hope');

    const onClick = () => showShortRestModal(plugin, el, ctx, { hp: hpKey, stress: stressKey, armor: armorKey, hope: hopeKey });

    let r = roots.get(el);
    if (r && el.childElementCount === 0) { try { r.unmount(); } catch {} roots.delete(el); r = undefined as any; }
    if (!r) { el.empty(); r = createRoot(el); roots.set(el, r); }
    r.render(React.createElement(RestButtonView, { label: triggerLabel, onClick }));

    const child = new MarkdownRenderChild(el); ctx.addChild(child);
  });
}

// ---------- modal (long-rest style) ----------
function showShortRestModal(
  plugin: DaggerheartPlugin,
  el: HTMLElement,
  ctx: MarkdownPostProcessorContext,
  keys: { hp: string; stress: string; armor: string; hope: string }
){
  const file = plugin.app.vault.getFileByPath(ctx.sourcePath) || plugin.app.workspace.getActiveFile();
  if (!file) { new Notice('Short Rest: could not resolve file'); return; }
  const tier = asNum(plugin.app.metadataCache.getFileCache(file as TFile)?.frontmatter?.tier ?? 0, 0);
  const scope = scopeOf(el);

  const modal = document.createElement('div'); modal.className = 'dh-rest-modal';
  const backdrop = document.createElement('div'); backdrop.className = 'dh-rest-backdrop'; modal.appendChild(backdrop);
  const panel = document.createElement('div'); panel.className = 'dh-rest-chooser'; modal.appendChild(panel);

  const head = panel.createDiv({ cls: 'dh-rest-headerbar' });
  const titleWrap = head.createDiv({ cls: 'dh-rest-titlewrap' });
  titleWrap.createDiv({ cls: 'dh-rest-title', text: 'Short Rest' });
  titleWrap.createDiv({ cls: 'dh-rest-sub', text: 'Choose exactly two moves (you may choose the same move twice). 1d4 + Tier.' });
  head.createDiv({ cls: 'dh-rest-party' }).append(pill(`Tier ${tier}`));
  const picks = head.createDiv({ cls: 'dh-rest-picks' }); picks.setText('Selected: 0/2');
  const closeBtn = head.createEl('button', { cls: 'dh-rest-close', text: 'X' });

  const actions = panel.createDiv({ cls: 'dh-rest-actions' });
  const CHOICES = [
    { key: 'wounds', label: 'Tend to Wounds (Heal HP)' },
    { key: 'stress', label: 'Clear Stress' },
    { key: 'armor', label: 'Repair Armor' },
    { key: 'prepare', label: 'Prepare (+1 Hope)' },
    { key: 'prepare_party', label: 'Prepare with Party (+2 Hope)' },
  ] as const;
  const counts: Record<string, number> = Object.fromEntries(CHOICES.map(c=>[c.key,0]));
  const selected = () => Object.values(counts).reduce((a,b)=>a+b,0);
  const setPicks = () => picks.setText(`Selected: ${selected()}/2`);
  const labelWithCount = (label: string, count: number) => count===0? label : `${label} x${count}`;

  const btns: Record<string, HTMLButtonElement> = {};
  for(const c of CHOICES){
    const b = btn(c.label); btns[c.key]=b; const update=()=>{ const ct=counts[c.key]; b.textContent=labelWithCount(c.label, ct); b.classList.toggle('on', ct>0); }; update();
    b.onclick = ()=>{
      if (c.key==='prepare' && counts['prepare_party']>0){ counts['prepare_party']=0; btns['prepare_party'].classList.remove('on'); btns['prepare_party'].textContent=CHOICES.find(x=>x.key==='prepare_party')!.label; }
      if (c.key==='prepare_party' && counts['prepare']>0){ counts['prepare']=0; btns['prepare'].classList.remove('on'); btns['prepare'].textContent=CHOICES.find(x=>x.key==='prepare')!.label; }
      const cur = counts[c.key]; const next=(cur+1)%3; const delta=next-cur; if (delta>0 && selected()+delta>2){ new Notice('Select exactly two total moves.'); return; }
      counts[c.key]=next; update(); setPicks();
    };
    actions.appendChild(b);
  }
  setPicks();

  const applyRow = panel.createDiv({ cls: 'dh-rest-apply' });
  const applyBtn = btn('Apply Short Rest','dh-event-btn'); applyRow.appendChild(applyBtn);

  const closeModal = () => { if (modal.parentElement) document.body.removeChild(modal); window.removeEventListener('keydown', onKey); };
  const onKey = (ev: KeyboardEvent) => { if (ev.key==='Escape') closeModal(); };
  backdrop.onclick = closeModal; closeBtn.onclick = closeModal; window.addEventListener('keydown', onKey);

  applyBtn.onclick = async ()=>{
    if (selected()!==2){ new Notice('Select exactly two total moves.'); return; }

    // Read current state
    let hpFilled = await readFilled(keys.hp);
    let stressFilled = await readFilled(keys.stress);
    let armorFilled = await readFilled(keys.armor);
    let hopeFilled = await readFilled(keys.hope);

    // Determine clamp per tracker across all matching rows
    const hpMax = minBoxesFor(scope,'dh-track-hp', keys.hp);
    const stressMax = minBoxesFor(scope,'dh-track-stress', keys.stress);
    const armorMax = minBoxesFor(scope,'dh-track-armor', keys.armor);
    const hopeMax = minBoxesFor(scope,'dh-track-hope', keys.hope);

    const lines: string[] = [];
    const doRoll = (label: string)=>{ const d4=rollD4(); const total=d4+tier; lines.push(`${label}: 1d4(${d4}) + Tier(${tier}) = ${total}`); return total; };
    // HP / Stress / Armor effects (same as original short-rest)
    for(let i=0;i<counts['wounds'];i++){ const amt=doRoll('Tend to Wounds (HP)'); hpFilled = Math.max(0, hpFilled - amt); }
    for(let i=0;i<counts['stress'];i++){ const amt=doRoll('Clear Stress'); stressFilled = Math.max(0, stressFilled - amt); }
    for(let i=0;i<counts['armor'];i++){ const amt=doRoll('Repair Armor'); armorFilled = Math.max(0, armorFilled - amt); }
    // Hope effects (same as long-rest semantics, but clamped to visible boxes for this key)
    for(let i=0;i<counts['prepare'];i++){ hopeFilled = hopeFilled + 1; }
    for(let i=0;i<counts['prepare_party'];i++){ hopeFilled = hopeFilled + 2; }

    if (hpMax) hpFilled = Math.max(0, Math.min(hpMax, hpFilled));
    if (stressMax) stressFilled = Math.max(0, Math.min(stressMax, stressFilled));
    if (armorMax) armorFilled = Math.max(0, Math.min(armorMax, armorFilled));
    if (hopeMax) hopeFilled = Math.max(0, Math.min(hopeMax, hopeFilled));

    // Persist + broadcast; let React rows update state and repaint
    await writeFilled(keys.hp, hpFilled); await writeFilled(keys.stress, stressFilled); await writeFilled(keys.armor, armorFilled); await writeFilled(keys.hope, hopeFilled);
    try{ window.dispatchEvent(new CustomEvent('dh:tracker:changed', { detail: { key: keys.hp, filled: hpFilled } })); }catch{}
    try{ window.dispatchEvent(new CustomEvent('dh:tracker:changed', { detail: { key: keys.stress, filled: stressFilled } })); }catch{}
    try{ window.dispatchEvent(new CustomEvent('dh:tracker:changed', { detail: { key: keys.armor, filled: armorFilled } })); }catch{}
    try{ window.dispatchEvent(new CustomEvent('dh:tracker:changed', { detail: { key: keys.hope, filled: hopeFilled } })); }catch{}

    new Notice(lines.join(' | '), 8000);
    closeModal();
  };

  document.body.appendChild(modal);
  setTimeout(()=> actions.querySelector('button')?.focus(), 0);
}

// Unified entry used by rest block
// Now delegates to the combined Rest modal (short + long columns).
export function openShortRestUI(
  plugin: DaggerheartPlugin,
  el: HTMLElement,
  ctx: MarkdownPostProcessorContext,
  keys: { hp: string; stress: string; armor: string; hope: string }
) {
  const file = plugin.app.vault.getFileByPath(ctx.sourcePath) || plugin.app.workspace.getActiveFile();
  if (!file || !(file instanceof TFile)) {
    new Notice('Rest: could not resolve file');
    return;
  }
  const scope = scopeOf(el);
  const mk = (cls: string, key: string) => ({
    getMax: () => minBoxesFor(scope, cls, key),
    repaint: () => {
      const cont = scope.querySelector(`.dh-tracker-boxes.${cls}`) as HTMLElement | null;
      if (!cont) return;
      store.get<number>('tracker:' + key, 0).then((val) => {
        const filled = Number(val ?? 0) || 0;
        cont.querySelectorAll('.dh-track-box').forEach((n, i) => (n as HTMLDivElement).classList.toggle('on', i < filled));
      });
    },
  });

  new CombinedRestModal(
    plugin.app,
    file,
    keys,
    {
      hp: mk('dh-track-hp', keys.hp),
      stress: mk('dh-track-stress', keys.stress),
      armor: mk('dh-track-armor', keys.armor),
      hope: mk('dh-track-hope', keys.hope),
    },
    'short'
  ).open();
}
