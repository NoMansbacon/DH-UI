import { App, Modal, Notice, TFile } from 'obsidian';
import type DaggerheartPlugin from '../main';

// Limits for Tier 2 (Levels 2–4)
const T2_LIMITS = {
  opt1: 3, // +1 to two unmarked traits
  opt2: 2, // +1 HP slot
  opt3: 2, // +1 Stress slot
  opt4: 1, // +1 to two experiences (stub)
  // Additional domain card: single use per tier
  opt5: 1,
  opt6: 1, // +1 Evasion
} as const;

// Limits for Tier 3 (Levels 5–7)
const T3_LIMITS = {
  opt1: 3,
  opt2: 2,
  opt3: 2,
  opt4: 1,
  // Additional domain card: single use per tier
  opt5: 1, // domain card up to level 7
  opt6: 1,
  // Proficiency and multiclass are single-use options in this tier
  opt7: 1, // +1 proficiency (costs both level-up points)
  opt8: 1, // multiclass (costs both level-up points)
} as const;

// Limits for Tier 4 (Levels 8–10)
const T4_LIMITS = {
  opt1: 3,
  opt2: 2,
  opt3: 2,
  opt4: 1,
  // Additional domain card: single use per tier
  opt5: 1,
  opt6: 1,
  // Proficiency and multiclass are single-use options in this tier
  opt7: 1, // +1 proficiency (costs both level-up points)
  opt8: 1, // multiclass / upgraded subclass tradeoff (costs both level-up points)
} as const;

export class LevelUpModal extends Modal {
  constructor(
    app: App,
    private plugin: DaggerheartPlugin,
    private file: TFile,
  ) { super(app); }

  onOpen(): void {
    // Reuse rest modal shell styling so it looks consistent
    this.modalEl.addClass('dh-levelup-modal-root');
    const { contentEl } = this; contentEl.empty(); contentEl.addClass('dh-levelup-chooser');

    // Close when clicking anywhere on the overlay outside the card,
    // matching the rest modal UX.
    this.modalEl.onclick = (ev: MouseEvent) => {
      if (!contentEl.contains(ev.target as Node)) this.close();
    };

    const fm = this.app.metadataCache.getFileCache(this.file)?.frontmatter ?? {};
    const curLevel = Number((fm as any).level ?? 1);
    const nextLevelPreview = curLevel + 1;
    // Tier after this level up (used to lock higher-tier options)
    const nextTierNum = nextLevelPreview >= 8 ? 4 : nextLevelPreview >= 5 ? 3 : nextLevelPreview >= 2 ? 2 : 1;

    const head = contentEl.createDiv({ cls: 'dh-levelup-headerbar' });
    const titleWrap = head.createDiv({ cls: 'dh-levelup-titlewrap' });
    titleWrap.createDiv({ cls: 'dh-levelup-title', text: 'Level Up' });
    titleWrap.createDiv({ cls: 'dh-levelup-sub', text: `Preparing level ${nextLevelPreview}. Choose exactly two options.` });
    head.createDiv({ cls: 'dh-levelup-picks' }).setText('Selected: 0/2');
    const closeBtn = head.createEl('button', { cls: 'dh-levelup-close', text: 'X' }); closeBtn.onclick = () => this.close();

    // Build the same grid UI as inline
    const host = contentEl.createDiv({ cls: 'dh-levelup' });
    const body = host.createDiv({ cls: 'dh-levelup-body' });
    const grid = body.createDiv({ cls: 'dh-levelup-grid' });

    const col2 = grid.createDiv({ cls: 'dh-levelup-col' });
    col2.createDiv({ cls: 'dh-levelup-title', text: 'TIER 2: LEVELS 2–4' });
    col2.createDiv({ cls: 'dh-levelup-note', text: 'At level 2, gain +1 Proficiency and Experience +2. Choose two options below.' });
    const list2 = col2.createDiv({ cls: 'dh-levelup-list' });

    const col3 = grid.createDiv({ cls: 'dh-levelup-col' });
    if (nextTierNum < 3) {
      col3.createDiv({
        cls: 'dh-levelup-tier-lock',
        text: 'Locked until Tier 3 (levels 5–7). Level up to 5+ to unlock these options.',
      });
    }
    col3.createDiv({ cls: 'dh-levelup-title', text: 'TIER 3: LEVELS 5–7' });
    col3.createDiv({ cls: 'dh-levelup-note', text: 'At level 5, gain +1 Proficiency. Clear all trait toggles. Choose two options below.' });
    const list3 = col3.createDiv({ cls: 'dh-levelup-list' });

    const col4 = grid.createDiv({ cls: 'dh-levelup-col' });
    if (nextTierNum < 4) {
      col4.createDiv({
        cls: 'dh-levelup-tier-lock',
        text: 'Locked until Tier 4 (levels 8–10). Level up to 8+ to unlock these options.',
      });
    }
    col4.createDiv({ cls: 'dh-levelup-title', text: 'TIER 4: LEVELS 8–10' });
    col4.createDiv({ cls: 'dh-levelup-note', text: 'At level 8, gain Experience +2 and clear all marks on traits, then +1 Proficiency. Choose two options below.' });
    const list4 = col4.createDiv({ cls: 'dh-levelup-list' });

    const used2 = (fm as any)?.dh_levelup?.t2 ?? {} as any; const used3 = (fm as any)?.dh_levelup?.t3 ?? {} as any; const used4 = (fm as any)?.dh_levelup?.t4 ?? {} as any;

    const boxes: Array<{el: HTMLInputElement; tier: 't2'|'t3'|'t4'; id: string}> = [];
    const picksByTier: Record<'t2'|'t3'|'t4', Set<string>> = { t2: new Set<string>(), t3: new Set<string>(), t4: new Set<string>() } as any;
    const markedT2: string[] = Array.isArray((fm as any)?.dh_marked_traits) ? (fm as any).dh_marked_traits : [];
    const markedT3: string[] = Array.isArray((fm as any)?.dh_levelup?.t3?.marked_traits) ? (fm as any).dh_levelup.t3.marked_traits : [];
    const markedT4: string[] = Array.isArray((fm as any)?.dh_levelup?.t4?.marked_traits) ? (fm as any).dh_levelup.t4.marked_traits : [];

    const mkTraitPicker = (parent: HTMLElement, tier: 't2'|'t3'|'t4', enabled: boolean) => {
      const marked = tier==='t2'? markedT2 : tier==='t3'? markedT3 : markedT4;
      const wrap = parent.createDiv({ cls: 'dh-levelup-subpanel' });
      const traits = ['Agility','Strength','Finesse','Instinct','Presence','Knowledge'];
      traits.forEach(name => {
        const lab = document.createElement('label');
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.dataset['trait'] = name;
        cb.disabled = marked.includes(name) || !enabled;
        cb.onchange = () => {
          if (cb.checked) {
            if (picksByTier[tier].size >= 2) { cb.checked = false; return; }
            picksByTier[tier].add(name);
          } else {
            picksByTier[tier].delete(name);
          }
        };
        if (marked.includes(name)) lab.classList.add('marked');
        lab.appendChild(cb); lab.appendChild(document.createTextNode(name + (marked.includes(name)? ' (marked)':'')));
        wrap.appendChild(lab);
      });
      parent.createDiv({ cls: 'dh-levelup-subnote', text: 'Pick exactly two traits for this option.' });
      return wrap;
    };

    const mkRow = (parent: HTMLElement, tier: 't2'|'t3'|'t4', id: string, label: string, totalLimit: number, usedCount: number, dupCount = 1) => {
      const tierNum = tier === 't2' ? 2 : tier === 't3' ? 3 : 4;
      const lockedByTier = tierNum > nextTierNum; // cannot pick options above post-level-up tier
      const exhausted = usedCount >= totalLimit;
      const available = !exhausted;             // for visuals only (strike-through when fully used)
      const interactable = !lockedByTier && !exhausted; // whether toggles can actually be changed
      const isTwoPoint = (tier === 't3' || tier === 't4') && (id === 'opt7' || id === 'opt8');
      const row = parent.createDiv({ cls: 'dh-levelup-row' + (available? '' : ' disabled') + (isTwoPoint ? ' dh-levelup-row-two-point' : '') });

      // Left side: usage boxes (how many times this option has been taken)
      const uses = row.createDiv({ cls: 'dh-lu-uses' + (isTwoPoint ? ' dh-lu-uses-two-point' : '') });
      for (let i=0;i<totalLimit;i++){
        const b = document.createElement('div');
        b.className = 'box' + (i<usedCount?' on':'') + (isTwoPoint ? ' two-point' : '');
        uses.appendChild(b);
      }

      const remain = Math.max(0, totalLimit - usedCount);
      const isLinkedTwoBox = isTwoPoint && dupCount === 2;
      let actives = interactable ? Math.min(dupCount, remain) : 0;
      if (isLinkedTwoBox && remain > 0 && interactable) actives = dupCount; // show two active boxes for the single remaining use

      // Middle: interactive checkboxes. For two-point options, wrap them in a framed container
      const cbHost: HTMLElement = isTwoPoint
        ? row.createDiv({ cls: 'dh-levelup-two-point-toggle-wrap' })
        : row;

      const rowStartIndex = boxes.length;
      for (let i=0;i<dupCount;i++){
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.disabled = !interactable || i >= actives;
        cb.dataset['opt'] = id + '/' + (i+1);
        cb.dataset['tier'] = tier;
        cbHost.appendChild(cb);
        boxes.push({ el: cb, tier, id: id + '/' + (i+1) });
      }
      const rowBoxes = boxes.slice(rowStartIndex, rowStartIndex + dupCount);
      if (isLinkedTwoBox) {
        // Link the two boxes so checking either consumes both "points" for this option
        rowBoxes.forEach(b => {
          b.el.addEventListener('change', () => {
            const checked = (b.el as HTMLInputElement).checked;
            rowBoxes.forEach(other => {
              if (other.el.disabled) return;
              if (other.el.checked !== checked) {
                (other.el as HTMLInputElement).checked = checked;
              }
            });
          });
        });
      }
      const span = document.createElement('span');
      span.className = 'label';
      span.textContent = label;
      row.appendChild(span);
      if (!available) { try { span.classList.add('disabled'); } catch {} }
      if (id==='opt1') {
        const picker = mkTraitPicker(parent, tier, interactable);
        const controller = boxes[boxes.length - dupCount];
        const setEnabled = (en:boolean)=>{
          const markedArr = tier==='t2'? markedT2 : tier==='t3'? markedT3 : markedT4;
          Array.from(picker.querySelectorAll('input[type="checkbox"]') as any).forEach((n:HTMLInputElement)=>{
            const trait = String(n.dataset['trait']||'');
            const isMarked = markedArr.includes(trait);
            n.disabled = isMarked || !en;
          });
        };
        controller.el.onchange = ()=> setEnabled((controller.el as HTMLInputElement).checked && !(controller.el as HTMLInputElement).disabled);
        setEnabled(false);
      }
    };

    // Build all rows
    mkRow(list2, 't2', 'opt1', 'Gain a +1 bonus to two unmarked character traits and mark them.', (T2_LIMITS as any).opt1, (used2 as any).opt1||0);
    mkRow(list2, 't2', 'opt2', 'Permanently gain one Hit Point slot.', (T2_LIMITS as any).opt2, (used2 as any).opt2||0, 2);
    mkRow(list2, 't2', 'opt3', 'Permanently gain one Stress slot.', (T2_LIMITS as any).opt3, (used2 as any).opt3||0, 2);
    mkRow(list2, 't2', 'opt4', 'Permanently gain a +1 bonus to two Experiences.', (T2_LIMITS as any).opt4, (used2 as any).opt4||0);
    mkRow(list2, 't2', 'opt5', 'Choose an additional domain card (up to level 4).', (T2_LIMITS as any).opt5||0, (used2 as any).opt5||0);
    mkRow(list2, 't2', 'opt6', 'Permanently gain a +1 bonus to your Evasion.', (T2_LIMITS as any).opt6, (used2 as any).opt6||0);

    mkRow(list3, 't3', 'opt1', 'Gain a +1 bonus to two unmarked character traits and mark them.', (T3_LIMITS as any).opt1, (used3 as any).opt1||0);
    mkRow(list3, 't3', 'opt2', 'Permanently gain one Hit Point slot.', (T3_LIMITS as any).opt2, (used3 as any).opt2||0, 2);
    mkRow(list3, 't3', 'opt3', 'Permanently gain one Stress slot.', (T3_LIMITS as any).opt3, (used3 as any).opt3||0, 2);
    mkRow(list3, 't3', 'opt4', 'Permanently gain a +1 bonus to two Experiences.', (T3_LIMITS as any).opt4, (used3 as any).opt4||0);
    mkRow(list3, 't3', 'opt5', 'Choose an additional domain card (up to level 7).', (T3_LIMITS as any).opt5, (used3 as any).opt5||0);
    mkRow(list3, 't3', 'opt6', 'Permanently gain a +1 bonus to your Evasion.', (T3_LIMITS as any).opt6, (used3 as any).opt6||0);
    mkRow(list3, 't3', 'opt7', 'Increase your proficiency by +1.', (T3_LIMITS as any).opt7, (used3 as any).opt7||0, 2);
    mkRow(list3, 't3', 'opt8', 'Multiclass (see sheet for details).', (T3_LIMITS as any).opt8, (used3 as any).opt8||0, 2);

    mkRow(list4, 't4', 'opt1', 'Gain a +1 bonus to two unmarked character traits and mark them.', (T4_LIMITS as any).opt1, (used4 as any).opt1||0);
    mkRow(list4, 't4', 'opt2', 'Permanently gain one Hit Point slot.', (T4_LIMITS as any).opt2, (used4 as any).opt2||0, 2);
    mkRow(list4, 't4', 'opt3', 'Permanently gain one Stress slot.', (T4_LIMITS as any).opt3, (used4 as any).opt3||0, 2);
    mkRow(list4, 't4', 'opt4', 'Permanently gain a +1 bonus to two Experiences.', (T4_LIMITS as any).opt4, (used4 as any).opt4||0);
    mkRow(list4, 't4', 'opt5', 'Choose an additional domain card (up to level 10).', (T4_LIMITS as any).opt5, (used4 as any).opt5||0);
    mkRow(list4, 't4', 'opt6', 'Permanently gain a +1 bonus to your Evasion.', (T4_LIMITS as any).opt6, (used4 as any).opt6||0);
    mkRow(list4, 't4', 'opt7', 'Increase your Proficiency by +1.', (T4_LIMITS as any).opt7, (used4 as any).opt7||0, 2);
    mkRow(list4, 't4', 'opt8', 'Multiclass or take an upgraded subclass card (cross out multiclass for this tier; see sheet for details).', (T4_LIMITS as any).opt8, (used4 as any).opt8||0, 2);

    const actions = body.createDiv({ cls: 'dh-levelup-actions' });
    const applyBtn = actions.createEl('button', { cls: 'dh-event-btn', text: 'Apply Level Up' });
    const msg = actions.createDiv({ cls: 'dh-levelup-msg' });

    const picksCounter = head.querySelector('.dh-levelup-picks') as HTMLElement | null;
    const updatePicks = () => {
      const selCount = boxes.filter(b => b.el.checked && !b.el.disabled).length;
      if (picksCounter) picksCounter.setText(`Selected: ${selCount}/2`);
    };
    body.addEventListener('change', updatePicks);

    applyBtn.onclick = async () => {
      const sel = boxes.filter(b => b.el.checked && !b.el.disabled);
      if (sel.length !== 2) { msg.setText('Select exactly two options.'); return; }

      const selected = sel.map(s=> s.id.split('/')[0]);

      // If entering Tier 3, clear trait toggles
      try {
        if (curLevel < 5 && nextLevelPreview >= 5) {
          const filePath = (this.file as TFile).path; const names = ['Agility','Strength','Finesse','Instinct','Presence','Knowledge'];
          for (const n of names) localStorage.removeItem(`dh:traitToggle:${filePath}:${n}`);
          try { window.dispatchEvent(new CustomEvent('dh:ability:refresh', { detail: { filePath } })); } catch {}
        }
      } catch {}

      // Collect per-tier trait picks for Opt1
      const pickedTraitsByTier: Record<'t2'|'t3'|'t4', string[]> = { t2: Array.from(picksByTier.t2), t3: Array.from(picksByTier.t3), t4: Array.from(picksByTier.t4) } as any;
      for (const s of sel) {
        const base = s.id.split('/')[0];
        if (base==='opt1'){
          if (pickedTraitsByTier[s.tier].length !== 2) { msg.setText('Option 1 requires selecting exactly two traits in its tier.'); return; }
        }
      }

      // Toggle chosen traits ON immediately
      try { const filePath = (this.file as TFile).path; ['t2','t3','t4'].forEach((t:any)=>{ for (const name of pickedTraitsByTier[t as 't2'|'t3'|'t4']) localStorage.setItem(`dh:traitToggle:${filePath}:${name}`,'1'); }); try { window.dispatchEvent(new CustomEvent('dh:ability:refresh', { detail: { filePath } })); } catch {} } catch{}

      // Warm file handle and then update frontmatter
      try { await this.plugin.app.fileManager.processFrontMatter(this.file as TFile, (_front)=>{}); } catch {}

      try {
        await this.plugin.app.fileManager.processFrontMatter(this.file as TFile, (front) => {
          const cont2 = (front as any).dh_levelup?.t2 ?? ((front as any).dh_levelup = { ...(front as any).dh_levelup, t2: {} }, (front as any).dh_levelup.t2);
          const cont3 = (front as any).dh_levelup?.t3 ?? ((front as any).dh_levelup = { ...(front as any).dh_levelup, t3: {} }, (front as any).dh_levelup.t3);
          const cont4 = (front as any).dh_levelup?.t4 ?? ((front as any).dh_levelup = { ...(front as any).dh_levelup, t4: {} }, (front as any).dh_levelup.t4);
          const markArr2 = (((front as any).dh_marked_traits = ((front as any).dh_marked_traits ?? [])), (front as any).dh_marked_traits);
          const markArr3 = (((front as any).dh_levelup.t3.marked_traits = ((front as any).dh_levelup.t3.marked_traits ?? [])), (front as any).dh_levelup.t3.marked_traits);
          const markArr4 = (((front as any).dh_levelup.t4.marked_traits = ((front as any).dh_levelup.t4.marked_traits ?? [])), (front as any).dh_levelup.t4.marked_traits);

          const cur = Number((front as any).level ?? 1); const nextLevel = cur + 1; (front as any).level = nextLevel;
          if (cur < 2 && nextLevel >= 2) (front as any).tier = Number((front as any).tier ?? 1) + 1;
          if (cur < 8 && nextLevel >= 8) { (front as any).dh_marked_traits = []; if ((front as any).dh_levelup?.t3) (front as any).dh_levelup.t3.marked_traits = []; }
          if (nextLevel === 2 || nextLevel === 5 || nextLevel === 8) (front as any).proficiency = Number((front as any).proficiency ?? 0) + 1;

          for (const s of sel){
            const base = s.id.split('/')[0];
            const tierC = s.tier==='t2'? cont2 : s.tier==='t3'? cont3 : cont4;
            const markArr = s.tier==='t2'? markArr2 : s.tier==='t3'? markArr3 : markArr4;
            const pickedTraits = pickedTraitsByTier[s.tier];
            switch(base){
              case 'opt1': (tierC as any).opt1 = Number((tierC as any).opt1||0)+1; for (const name of pickedTraits){ if (!markArr.includes(name)) markArr.push(name);} break;
              case 'opt2': (tierC as any).opt2 = Number((tierC as any).opt2||0)+1; (front as any).hp = Number((front as any).hp||0)+1; break;
              case 'opt3': (tierC as any).opt3 = Number((tierC as any).opt3||0)+1; (front as any).stress = Number((front as any).stress||0)+1; break;
              case 'opt4': (tierC as any).opt4 = Number((tierC as any).opt4||0)+1; break;
              case 'opt5': (tierC as any).opt5 = Number((tierC as any).opt5||0)+1; break;
              case 'opt6': (tierC as any).opt6 = Number((tierC as any).opt6||0)+1; (front as any).evasion = Number((front as any).evasion||0)+1; break;
              case 'opt7': (tierC as any).opt7 = Number((tierC as any).opt7||0)+1; (front as any).proficiency = Number((front as any).proficiency ?? 0) + 1; break;
              case 'opt8': (tierC as any).opt8 = Number((tierC as any).opt8||0)+1; break;
            }
          }
        });

        // Patch traits bonuses in code blocks if opt1 selected
        if (boxes.some(b => b.el.checked && b.id.startsWith('opt1'))){
          (async ()=>{
            const md = await this.plugin.app.vault.read(this.file as TFile);
            const esc=(s:string)=> s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
            const combined = Array.from(new Set([...(picksByTier.t2||new Set()).values(), ...(picksByTier.t3||new Set()).values(), ...(picksByTier.t4||new Set()).values()]));

            let outMd = md;
            let changed = false;

            // Try fenced ```traits block first
            try {
              const reTraits = /```[ \t]*traits[^\n]*\n([\s\S]*?)```/m;
              const m = outMd.match(reTraits);
              if (m) {
                let block = m[1];
                if (!/^\s*bonuses\s*:/m.test(block) && /^\s*trait\s*:/m.test(block)) block = block.replace(/^(\s*)trait\s*:\s*$/m,'$1bonuses:');
                if (!/^\s*bonuses\s*:/m.test(block)) block += `\nbonuses:\n`;
                const header = block.match(/^(\s*)bonuses\s*:\s*$/m);
                const headerIdx = header ? (header.index || 0) : -1;
                const headerLen = header ? header[0].length : 0;
                const baseIndent = header ? (header[1] || '') : '';
                const start = headerIdx >= 0 ? (headerIdx + headerLen) : block.length;
                const rest = block.slice(start);
                const nextTop = rest.search(new RegExp(`^${esc(baseIndent)}[^\s].*:\\s*$`, 'm'));
                const end = start + (nextTop >= 0 ? nextTop : rest.length);
                const before = block.slice(0, start);
                let middle = block.slice(start, end);
                const after = block.slice(end);
                for (const name of combined){
                  const indent2 = baseIndent + '  ';
                  const regList = new RegExp(`^${esc(indent2)}-\\s*${esc(name)}\\s*:\\s*(\\d+)?\\s*$`, 'm');
                  const regMap  = new RegExp(`^${esc(indent2)}${esc(name)}\\s*:\\s*(\\d+)?\\s*$`, 'm');
                  if (regList.test(middle)) { middle = middle.replace(regList, (_s,p1)=> `${indent2}- ${name}: ${Number(p1||0)+1}`); continue; }
                  if (regMap.test(middle))  { middle = middle.replace(regMap,  (_s,p1)=> `${indent2}${name}: ${Number(p1||0)+1}`); continue; }
                  const useList = new RegExp(`^${esc(indent2)}-\\s*\S+`, 'm').test(middle);
                  const ins = (useList ? `${indent2}- ${name}: 1` : `${indent2}${name}: 1`) + '\n';
                  middle = (middle.endsWith('\n') ? middle : middle + '\n') + ins;
                }
                const newBlock = before + middle + after;
                outMd = outMd.replace(reTraits, (all,_b)=> all.replace(m[1], newBlock));
                changed = true;
              }
            } catch {}

            // Try inside ```dashboard traits section
            if (!changed) {
              try {
                const reDash = /```[ \t]*dashboard[^\n]*\n([\s\S]*?)```/m;
                const dm = outMd.match(reDash);
                if (dm) {
                  let block = dm[1];
                  const tHead = block.match(/^\s*traits\s*:\s*$/m);
                  if (tHead) {
                    const tIdx = tHead.index || 0; const tLen = tHead[0].length;
                    const tStart = tIdx + tLen;
                    const trest = block.slice(tStart);
                    const nextTop = trest.search(/^\w[\w-]*\s*:/m);
                    const tEnd = tStart + (nextTop >= 0 ? nextTop : trest.length);
                    const tbefore = block.slice(0, tStart);
                    let tmiddle = block.slice(tStart, tEnd);
                    const tafter = block.slice(tEnd);
                    if (!/^\s*bonuses\s*:/m.test(tmiddle)) tmiddle = tmiddle.replace(/\s*$/,'') + `\n bonuses:\n`;
                    const bHead = tmiddle.match(/^\s*bonuses\s*:\s*$/m);
                    const bStart = (bHead ? ((bHead.index||0) + bHead[0].length) : tmiddle.length);
                    const bRest = tmiddle.slice(bStart);
                    const bNext = bRest.search(/^\s*\w[\w-]*\s*:/m);
                    const bEnd = bStart + (bNext >= 0 ? bNext : bRest.length);
                    const bbefore = tmiddle.slice(0, bStart);
                    let bmiddle = tmiddle.slice(bStart, bEnd);
                    const bafter = tmiddle.slice(bEnd);
                    const indent2 = '  ';
                    for (const name of combined){
                      const regMap = new RegExp(`^${indent2}${esc(name)}\\s*:\\s*(\\d+)?\\s*$`, 'm');
                      const regList = new RegExp(`^${indent2}-\\s*${esc(name)}\\s*:\\s*(\\d+)?\\s*$`, 'm');
                      if (regMap.test(bmiddle)) { bmiddle = bmiddle.replace(regMap, (_s,p1)=> `${indent2}${name}: ${Number(p1||0)+1}`); continue; }
                      if (regList.test(bmiddle)) { bmiddle = bmiddle.replace(regList, (_s,p1)=> `${indent2}- ${name}: ${Number(p1||0)+1}`); continue; }
                      const ins = `${indent2}${name}: 1\n`;
                      bmiddle = (bmiddle.endsWith('\n') ? bmiddle : bmiddle + '\n') + ins;
                    }
                    const newTraitsMid = bbefore + bmiddle + bafter;
                    const newBlock = tbefore + newTraitsMid + tafter;
                    outMd = outMd.replace(reDash, (all,_b)=> all.replace(dm[1], newBlock));
                    changed = true;
                  }
                }
              } catch {}
            }

            if (changed) await this.plugin.app.vault.modify(this.file as TFile, outMd);
          })();
        }

        new Notice('Level Up applied.', 4000);

        // Optionally open Domain Picker after a level up so the player can pick domain cards
        if (this.plugin.settings.autoOpenDomainPickerAfterLevelUp !== false) {
          try {
            const filePath = (this.file as TFile).path;
            const level = nextLevelPreview;
            const extraFromOpt5 = selected.includes('opt5') ? 1 : 0;
            const required = 1 + extraFromOpt5; // always at least 1 card per level; +1 if "additional domain card" option chosen
            window.dispatchEvent(
              new CustomEvent('dh:domainpicker:open', {
                detail: { filePath, level, required },
              }),
            );
          } catch {}
        }

        this.close();
      } catch (e) {
        msg.setText('Level Up failed: ' + (e as any)?.message);
      }
    };
  }
}
