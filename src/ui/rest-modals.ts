import { App, Modal, Notice, TFile } from 'obsidian';
import * as store from "../lib/services/stateStore";

type RestKeys = { hp: string; stress: string; armor: string; hope: string };
type RestTrackers = {
  hp: { getMax(): number; repaint(): void } | null;
  stress: { getMax(): number; repaint(): void } | null;
  armor: { getMax(): number; repaint(): void } | null;
  hope: { getMax(): number; repaint(): void } | null;
};

function asNum(v: unknown, def = 0): number { if (v === null || v === undefined) return def; const n = Number(String(v).trim()); return Number.isFinite(n) ? n : def; }
function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)); }
function readFM(app: App, f: TFile) { return app.metadataCache.getFileCache(f)?.frontmatter ?? {}; }

function keyFor(k: string) { return `tracker:${k}`; }
async function readFilled(k: string): Promise<number> {
  const raw = await store.get<number>(keyFor(k), 0);
  return asNum(raw, 0);
}
async function writeFilled(k: string, v: number) { await store.set<number>(keyFor(k), asNum(v, 0)); }

export class ShortRestModal extends Modal {
  constructor(
    app: App,
    private file: TFile,
    private keys: RestKeys,
    private trackers: RestTrackers
  ) { super(app); }

  onOpen(): void {
    // Tag the root modal element so we can safely scope CSS overrides
    this.modalEl.addClass('dh-rest-modal-root');
    const fm = readFM(this.app, this.file);
    const tier = asNum(fm.tier ?? fm.level ?? 1, 1);
    const { contentEl } = this; contentEl.empty();
    contentEl.addClass('dh-rest-chooser');

    const head = contentEl.createDiv({ cls: 'dh-rest-headerbar' });
    const titleWrap = head.createDiv({ cls: 'dh-rest-titlewrap' });
    titleWrap.createDiv({ cls: 'dh-rest-title', text: 'Short Rest' });
    titleWrap.createDiv({ cls: 'dh-rest-sub', text: 'Choose exactly two moves (you may pick the same move twice).' });
    head.createDiv({ cls: 'dh-rest-party' }).append(`Tier ${tier}`);
    const picksEl = head.createDiv({ cls: 'dh-rest-picks' }); picksEl.setText('Selected: 0/2');
    const closeBtn = head.createEl('button', { cls: 'dh-rest-close', text: 'X' }); closeBtn.onclick = () => this.close();

    const actions = contentEl.createDiv({ cls: 'dh-rest-actions' });
    const CHOICES = [
      { key: 'heal', label: 'Tend to Wounds (1d4 + tier HP)' },
      { key: 'stress', label: 'Clear Stress (1d4 + tier)' },
      { key: 'armor', label: 'Repair Armor (1d4 + tier)' },
      { key: 'prepare', label: 'Prepare (+1 Hope)' },
      { key: 'prepare_party', label: 'Prepare with Party (+2 Hope)' },
    ] as const;
    const counts: Record<string, number> = Object.fromEntries(CHOICES.map(c => [c.key, 0]));
    const selected = () => Object.values(counts).reduce((a,b)=>a+b,0);
    const setPicks = () => picksEl.setText(`Selected: ${selected()}/2`);
    const labelWithCount = (label: string, count: number) => count === 0 ? label : `${label} x${count}`;

    const btns: Record<string, HTMLButtonElement> = {};
    for (const c of CHOICES) {
      const b = actions.createEl('button', { text: c.label, cls: 'dh-rest-btn' });
      btns[c.key] = b;
      const update = () => { const ct = counts[c.key]; b.textContent = labelWithCount(c.label, ct); b.classList.toggle('on', ct>0); };
      update();
      b.onclick = () => {
        if (c.key === 'prepare' && counts['prepare_party'] > 0) { counts['prepare_party'] = 0; btns['prepare_party'].classList.remove('on'); btns['prepare_party'].textContent = CHOICES.find(x=>x.key==='prepare_party')!.label; }
        if (c.key === 'prepare_party' && counts['prepare'] > 0) { counts['prepare'] = 0; btns['prepare'].classList.remove('on'); btns['prepare'].textContent = CHOICES.find(x=>x.key==='prepare')!.label; }
        const cur = counts[c.key]; const next = (cur + 1) % 3; const delta = next - cur; if (delta>0 && selected() + delta > 2) { new Notice('Select exactly two total moves.'); return; }
        counts[c.key] = next; update(); setPicks();
      };
    }
    setPicks();

    const applyRow = contentEl.createDiv({ cls: 'dh-rest-apply' });
    const applyBtn = applyRow.createEl('button', { text: 'Apply Short Rest', cls: 'dh-event-btn' });
    applyBtn.onclick = async () => {
      const roll1d4 = () => 1 + Math.floor(Math.random()*4);
      let hpFilled = await readFilled(this.keys.hp); let stressFilled = await readFilled(this.keys.stress); let armorFilled = await readFilled(this.keys.armor); let hopeFilled = await readFilled(this.keys.hope);
      const hpMax=this.trackers.hp?.getMax()??0; const stressMax=this.trackers.stress?.getMax()??0; const armorMax=this.trackers.armor?.getMax()??0; const hopeMax=this.trackers.hope?.getMax()??0;
      const lines: string[] = [];
      for(let i=0;i<counts['heal'];i++){ const r=roll1d4()+tier; const before=hpFilled; hpFilled=clamp(hpFilled-r,0,hpMax||999); lines.push(`Tend to Wounds: 1d4(${r-tier}) + ${tier} = ${r}; HP ${before} -> ${hpFilled}`); }
      for(let i=0;i<counts['stress'];i++){ const r=roll1d4()+tier; const before=stressFilled; stressFilled=clamp(stressFilled-r,0,stressMax||999); lines.push(`Clear Stress: 1d4(${r-tier}) + ${tier} = ${r}; Stress ${before} -> ${stressFilled}`); }
      for(let i=0;i<counts['armor'];i++){ const r=roll1d4()+tier; const before=armorFilled; armorFilled=clamp(armorFilled-r,0,armorMax||999); lines.push(`Repair Armor: 1d4(${r-tier}) + ${tier} = ${r}; Armor ${before} -> ${armorFilled}`); }
      for(let i=0;i<counts['prepare'];i++){ const before=hopeFilled; hopeFilled=clamp(hopeFilled+1,0,hopeMax||999); lines.push(`Prepare: +1 Hope; Hope ${before} -> ${hopeFilled}`); }
      for(let i=0;i<counts['prepare_party'];i++){ const before=hopeFilled; hopeFilled=clamp(hopeFilled+2,0,hopeMax||999); lines.push(`Prepare with Party: +2 Hope; Hope ${before} -> ${hopeFilled}`); }
      writeFilled(this.keys.hp, hpFilled); writeFilled(this.keys.stress, stressFilled); writeFilled(this.keys.armor, armorFilled); writeFilled(this.keys.hope, hopeFilled);
      this.trackers.hp?.repaint(); this.trackers.stress?.repaint(); this.trackers.armor?.repaint(); this.trackers.hope?.repaint();
      new Notice(lines.join(' | '), 8000); this.close();
    };
  }
}

export class LongRestModal extends Modal {
  constructor(
    app: App,
    private file: TFile,
    private keys: RestKeys,
    private trackers: RestTrackers
  ) { super(app); }

  onOpen(): void {
    // Tag the root modal element so we can safely scope CSS overrides
    this.modalEl.addClass('dh-rest-modal-root');
    const { contentEl } = this; contentEl.empty(); contentEl.addClass('dh-rest-chooser');
    const head = contentEl.createDiv({ cls: 'dh-rest-headerbar' });
    const titleWrap = head.createDiv({ cls: 'dh-rest-titlewrap' });
    titleWrap.createDiv({ cls: 'dh-rest-title', text: 'Long Rest' });
    titleWrap.createDiv({ cls: 'dh-rest-sub', text: 'Choose exactly two moves (you may choose the same move twice).' });
    const picksEl = head.createDiv({ cls: 'dh-rest-picks' });
    const closeBtn = head.createEl('button', { cls: 'dh-rest-close', text: 'X' }); closeBtn.onclick = () => this.close();
    const panel = contentEl.createDiv({ cls: 'dh-rest-actions' });
    const CHOICES = [
      { key: 'heal_all', label: 'Tend to All Wounds (Clear ALL HP)' },
      { key: 'stress_all', label: 'Clear All Stress' },
      { key: 'armor_all', label: 'Repair All Armor' },
      { key: 'prepare', label: 'Prepare (+1 Hope)' },
      { key: 'prepare_party', label: 'Prepare with Party (+2 Hope)' },
      { key: 'project', label: 'Work on a Project' },
    ] as const;
    const counts: Record<string, number> = Object.fromEntries(CHOICES.map(c=>[c.key,0]));
    const selected = () => Object.values(counts).reduce((a,b)=>a+b,0); const setPicks = () => picksEl.setText(`Selected: ${selected()}/2`);
    const labelWithCount = (label: string, count: number) => count===0?label:`${label} x${count}`;
    const btns: Record<string, HTMLButtonElement> = {};
    for (const c of CHOICES) { const b = panel.createEl('button', { text: c.label, cls: 'dh-rest-btn' }); btns[c.key]=b; const update=()=>{const ct=counts[c.key]; b.textContent=labelWithCount(c.label, ct); b.classList.toggle('on', ct>0);}; update(); b.onclick=()=>{ if(c.key==='prepare'&&counts['prepare_party']>0){counts['prepare_party']=0;btns['prepare_party'].textContent=CHOICES.find(x=>x.key==='prepare_party')!.label;btns['prepare_party'].classList.remove('on');} if(c.key==='prepare_party'&&counts['prepare']>0){counts['prepare']=0;btns['prepare'].textContent=CHOICES.find(x=>x.key==='prepare')!.label;btns['prepare'].classList.remove('on');} const cur=counts[c.key]; const next=(cur+1)%3; const delta=next-cur; if(delta>0&&selected()+delta>2){ new Notice('Select exactly two total moves.'); return; } counts[c.key]=next; update(); setPicks(); }; }
    setPicks();
    const applyRow = contentEl.createDiv({ cls: 'dh-rest-apply' }); const apply = applyRow.createEl('button', { text: 'Apply Long Rest', cls: 'dh-event-btn' });
    apply.onclick = async () => {
      if (selected() !== 2) { new Notice('Select exactly two total moves.'); return; }
      let hpFilled=await readFilled(this.keys.hp); let stressFilled=await readFilled(this.keys.stress); let armorFilled=await readFilled(this.keys.armor); let hopeFilled=await readFilled(this.keys.hope);
      const lines: string[] = [];
      for(let i=0;i<counts['heal_all'];i++){ hpFilled=0; lines.push('Tend to All Wounds: HP fully restored.'); }
      for(let i=0;i<counts['stress_all'];i++){ stressFilled=0; lines.push('Clear All Stress: Stress fully cleared.'); }
      for(let i=0;i<counts['armor_all'];i++){ armorFilled=0; lines.push('Repair All Armor: Armor fully repaired.'); }
      for(let i=0;i<counts['prepare'];i++){ hopeFilled=clamp(hopeFilled+1,0,this.trackers.hope?.getMax()??999); lines.push('Prepare: +1 Hope.'); }
      for(let i=0;i<counts['prepare_party'];i++){ hopeFilled=clamp(hopeFilled+2,0,this.trackers.hope?.getMax()??999); lines.push('Prepare with Party: +2 Hope.'); }
      for(let i=0;i<counts['project'];i++){ lines.push('Work on a Project: progress recorded.'); }
      await writeFilled(this.keys.hp,hpFilled); await writeFilled(this.keys.stress,stressFilled); await writeFilled(this.keys.armor,armorFilled); await writeFilled(this.keys.hope,hopeFilled);
      // Broadcast only; let React rows update state and repaint themselves
      try{ window.dispatchEvent(new CustomEvent('dh:tracker:changed', { detail: { key: this.keys.hp, filled: hpFilled } })); }catch{}
      try{ window.dispatchEvent(new CustomEvent('dh:tracker:changed', { detail: { key: this.keys.stress, filled: stressFilled } })); }catch{}
      try{ window.dispatchEvent(new CustomEvent('dh:tracker:changed', { detail: { key: this.keys.armor, filled: armorFilled } })); }catch{}
      try{ window.dispatchEvent(new CustomEvent('dh:tracker:changed', { detail: { key: this.keys.hope, filled: hopeFilled } })); }catch{}
      new Notice(lines.join(' | '), 8000); this.close();
    };
  }
}
