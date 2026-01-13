import { App, Modal, Notice, TFile } from 'obsidian';
import * as store from "../lib/services/stateStore";
import { emitRestShort, emitRestLong } from "../utils/events";
import { asNum, clamp } from "../utils/number";

type RestKeys = { hp: string; stress: string; armor: string; hope: string };
type RestTrackers = {
  hp: { getMax(): number; repaint(): void } | null;
  stress: { getMax(): number; repaint(): void } | null;
  armor: { getMax(): number; repaint(): void } | null;
  hope: { getMax(): number; repaint(): void } | null;
};

export type RestType = 'short' | 'long';

function readFM(app: App, f: TFile) { return app.metadataCache.getFileCache(f)?.frontmatter ?? {}; }

function keyFor(k: string) { return `tracker:${k}`; }
async function readFilled(k: string): Promise<number> {
  const raw = await store.get<number>(keyFor(k), 0);
  return asNum(raw, 0);
}
async function writeFilled(k: string, v: number) { await store.set<number>(keyFor(k), asNum(v, 0)); }

// Combined Rest modal: exposes both short- and long-rest moves in one UI.
// This is intended as a UI/state helper and does not enforce rules limits.
export class CombinedRestModal extends Modal {
  private initialType: RestType;

  constructor(
    app: App,
    private file: TFile,
    private keys: RestKeys,
    private trackers: RestTrackers,
    private maxPicks: number,
    initialType: RestType
  ) {
    super(app);
    this.initialType = initialType;
  }

  onOpen(): void {
    this.modalEl.addClass('dh-rest-modal-root');

    // Close when clicking anywhere on the overlay outside the card (mobile-friendly)
    this.modalEl.onclick = (ev: MouseEvent) => {
      if (!this.contentEl.contains(ev.target as Node)) this.close();
    };

    const fm = readFM(this.app, this.file);
    const tier = asNum(fm.tier ?? fm.level ?? 1, 1);

    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('dh-rest-chooser');

    const head = contentEl.createDiv({ cls: 'dh-rest-headerbar' });

    const titleWrap = head.createDiv({ cls: 'dh-rest-titlewrap' });
    titleWrap.createDiv({ cls: 'dh-rest-title', text: 'Rest actions' });
    titleWrap.createDiv({
      cls: 'dh-rest-sub',
      text: `Pick up to ${this.maxPicks} actions in total. Your table still decides what is allowed.`,
    });

    const meta = head.createDiv({ cls: 'dh-rest-party' });
    meta.createSpan({ text: `Tier ${tier}` });

    const picksEl = head.createDiv({ cls: 'dh-rest-picks' });

    const headerActions = head.createDiv({ cls: 'dh-rest-header-actions' });
    const resetBtn = headerActions.createEl('button', { cls: 'dh-rest-reset', text: 'Reset' });
    const closeBtn = headerActions.createEl('button', { cls: 'dh-rest-close', text: 'X' });
    closeBtn.onclick = () => this.close();

    const grid = contentEl.createDiv({ cls: 'dh-rest-grid' });
    const shortCol = grid.createDiv({ cls: 'dh-rest-col dh-rest-col-short' });
    shortCol.createDiv({ cls: 'dh-rest-col-title', text: 'Short rest moves' });
    const longCol = grid.createDiv({ cls: 'dh-rest-col dh-rest-col-long' });
    longCol.createDiv({ cls: 'dh-rest-col-title', text: 'Long rest moves' });

    type ShortChoiceKey = 'heal' | 'stress' | 'armor' | 'prepare' | 'prepare_party';
    type LongChoiceKey = 'heal_all' | 'stress_all' | 'armor_all' | 'prepare_long' | 'prepare_party_long' | 'project';

    const SHORT_CHOICES: { key: ShortChoiceKey; label: string }[] = [
      { key: 'heal', label: 'Tend to Wounds (1d4 + tier HP)' },
      { key: 'stress', label: 'Clear Stress (1d4 + tier)' },
      { key: 'armor', label: 'Repair Armor (1d4 + tier)' },
      { key: 'prepare', label: 'Prepare (+1 Hope)' },
      { key: 'prepare_party', label: 'Prepare with Party (+2 Hope)' },
    ];

    const LONG_CHOICES: { key: LongChoiceKey; label: string }[] = [
      { key: 'heal_all', label: 'Tend to All Wounds (Clear ALL HP)' },
      { key: 'stress_all', label: 'Clear All Stress' },
      { key: 'armor_all', label: 'Repair All Armor' },
      { key: 'prepare_long', label: 'Prepare (+1 Hope)' },
      { key: 'prepare_party_long', label: 'Prepare with Party (+2 Hope)' },
      { key: 'project', label: 'Work on a Project' },
    ];

    type AnyKey = ShortChoiceKey | LongChoiceKey;
    const counts: Record<AnyKey, number> = Object.fromEntries(
      [...SHORT_CHOICES, ...LONG_CHOICES].map((c) => [c.key, 0])
    ) as any;

    const selectedShort = () => SHORT_CHOICES.reduce((acc, c) => acc + (counts[c.key] || 0), 0);
    const selectedLong = () => LONG_CHOICES.reduce((acc, c) => acc + (counts[c.key] || 0), 0);
    const totalSelected = () => selectedShort() + selectedLong();

    const updateCountsInfo = () => {
      picksEl.setText(`Selected — short: ${selectedShort()} • long: ${selectedLong()} (max ${this.maxPicks})`);
    };

    const labelWithCount = (label: string, count: number) =>
      count === 0 ? label : `${label} ×${count}`;

    const updaters: Array<() => void> = [];
    const updateByKey: Record<string, () => void> = {};

    const makeButtonGroup = <K extends AnyKey>(
      col: HTMLElement,
      defs: { key: K; label: string }[],
      group: 'short' | 'long'
    ) => {
      const wrap = col.createDiv({ cls: 'dh-rest-actions' });
      const btns: Record<string, HTMLButtonElement> = {};

      for (const c of defs) {
        const b = wrap.createEl('button', { text: c.label, cls: 'dh-rest-btn' });
        btns[c.key] = b;

        const update = () => {
          const ct = counts[c.key] || 0;
          b.textContent = labelWithCount(c.label, ct);
          b.classList.toggle('on', ct > 0);
        };
        updateByKey[c.key] = update;
        updaters.push(update);
        update();

        b.onclick = () => {
          // Mutual exclusion within each group between prepare and prepare_party variants.
          if (group === 'short') {
            if (c.key === 'prepare' && counts['prepare_party'] > 0) {
              counts['prepare_party'] = 0;
              updateByKey['prepare_party']?.();
            }
            if (c.key === 'prepare_party' && counts['prepare'] > 0) {
              counts['prepare'] = 0;
              updateByKey['prepare']?.();
            }
          } else {
            if (c.key === 'prepare_long' && counts['prepare_party_long'] > 0) {
              counts['prepare_party_long'] = 0;
              updateByKey['prepare_party_long']?.();
            }
            if (c.key === 'prepare_party_long' && counts['prepare_long'] > 0) {
              counts['prepare_long'] = 0;
              updateByKey['prepare_long']?.();
            }
          }

          const cur = counts[c.key] || 0;
          const nextRaw = (cur + 1) % 3; // 0 → 1 → 2 → 0
          const delta = nextRaw - cur;

          // Enforce global max picks: allow decreases, but block increases that would exceed maxPicks.
          if (delta > 0 && totalSelected() + delta > this.maxPicks) {
            return;
          }

          counts[c.key] = nextRaw;
          update();
          updateCountsInfo();
        };
      }

      // Return first button so we can focus it
      return wrap.querySelector('button') as HTMLButtonElement | null;
    };

    const firstShortBtn = makeButtonGroup(shortCol, SHORT_CHOICES, 'short');
    const firstLongBtn = makeButtonGroup(longCol, LONG_CHOICES, 'long');
    updateCountsInfo();

    // Reset clears all selections.
    resetBtn.onclick = () => {
      (Object.keys(counts) as AnyKey[]).forEach((k) => (counts[k] = 0));
      updaters.forEach((u) => u());
      updateCountsInfo();
    };

    // Focus the relevant column when opened.
    setTimeout(() => {
      const target = this.initialType === 'short' ? firstShortBtn : firstLongBtn;
      target?.focus();
    }, 0);

    const applyRow = contentEl.createDiv({ cls: 'dh-rest-apply' });
    const applyBtn = applyRow.createEl('button', { text: 'Apply', cls: 'dh-event-btn' });

    applyBtn.onclick = async () => {
      const roll1d4 = () => 1 + Math.floor(Math.random() * 4);

      let hpFilled = await readFilled(this.keys.hp);
      let stressFilled = await readFilled(this.keys.stress);
      let armorFilled = await readFilled(this.keys.armor);
      let hopeFilled = await readFilled(this.keys.hope);

      const hpMax = this.trackers.hp?.getMax() ?? 0;
      const stressMax = this.trackers.stress?.getMax() ?? 0;
      const armorMax = this.trackers.armor?.getMax() ?? 0;
      const hopeMax = this.trackers.hope?.getMax() ?? 0;

      const lines: string[] = [];

      // Short rest-style moves (1d4 + tier rolls)
      for (let i = 0; i < (counts['heal'] || 0); i++) {
        const r = roll1d4() + tier;
        const before = hpFilled;
        hpFilled = clamp(hpFilled - r, 0, hpMax || 999);
        lines.push(`Tend to Wounds: heal ${r}; HP ${before} → ${hpFilled}`);
      }
      for (let i = 0; i < (counts['stress'] || 0); i++) {
        const r = roll1d4() + tier;
        const before = stressFilled;
        stressFilled = clamp(stressFilled - r, 0, stressMax || 999);
        lines.push(`Clear Stress: ${r}; Stress ${before} → ${stressFilled}`);
      }
      for (let i = 0; i < (counts['armor'] || 0); i++) {
        const r = roll1d4() + tier;
        const before = armorFilled;
        armorFilled = clamp(armorFilled - r, 0, armorMax || 999);
        lines.push(`Repair Armor: ${r}; Armor ${before} → ${armorFilled}`);
      }
      for (let i = 0; i < (counts['prepare'] || 0); i++) {
        const before = hopeFilled;
        hopeFilled = clamp(hopeFilled + 1, 0, hopeMax || 999);
        lines.push(`Prepare: Hope ${before} → ${hopeFilled}`);
      }
      for (let i = 0; i < (counts['prepare_party'] || 0); i++) {
        const before = hopeFilled;
        hopeFilled = clamp(hopeFilled + 2, 0, hopeMax || 999);
        lines.push(`Prepare w/ Party: Hope ${before} → ${hopeFilled}`);
      }

      // Long rest-style moves (full clears + hope + project)
      for (let i = 0; i < (counts['heal_all'] || 0); i++) {
        hpFilled = 0;
        lines.push('Tend to All Wounds: HP fully restored.');
      }
      for (let i = 0; i < (counts['stress_all'] || 0); i++) {
        stressFilled = 0;
        lines.push('Clear All Stress: Stress fully cleared.');
      }
      for (let i = 0; i < (counts['armor_all'] || 0); i++) {
        armorFilled = 0;
        lines.push('Repair All Armor: Armor fully repaired.');
      }
      for (let i = 0; i < (counts['prepare_long'] || 0); i++) {
        const before = hopeFilled;
        hopeFilled = clamp(hopeFilled + 1, 0, hopeMax || 999);
        lines.push(`Prepare: Hope ${before} → ${hopeFilled}`);
      }
      for (let i = 0; i < (counts['prepare_party_long'] || 0); i++) {
        const before = hopeFilled;
        hopeFilled = clamp(hopeFilled + 2, 0, hopeMax || 999);
        lines.push(`Prepare w/ Party: Hope ${before} → ${hopeFilled}`);
      }
      for (let i = 0; i < (counts['project'] || 0); i++) {
        lines.push('Work on a Project: progress recorded.');
      }

      await writeFilled(this.keys.hp, hpFilled);
      await writeFilled(this.keys.stress, stressFilled);
      await writeFilled(this.keys.armor, armorFilled);
      await writeFilled(this.keys.hope, hopeFilled);

      this.trackers.hp?.repaint();
      this.trackers.stress?.repaint();
      this.trackers.armor?.repaint();
      this.trackers.hope?.repaint();

      // Decide which rest event(s) to emit based on what was actually chosen.
      const usedShort =
        (counts['heal'] || 0) > 0 ||
        (counts['stress'] || 0) > 0 ||
        (counts['armor'] || 0) > 0 ||
        (counts['prepare'] || 0) > 0 ||
        (counts['prepare_party'] || 0) > 0;

      const usedLong =
        (counts['heal_all'] || 0) > 0 ||
        (counts['stress_all'] || 0) > 0 ||
        (counts['armor_all'] || 0) > 0 ||
        (counts['prepare_long'] || 0) > 0 ||
        (counts['prepare_party_long'] || 0) > 0 ||
        (counts['project'] || 0) > 0;

      if (usedShort) {
        emitRestShort({
          filePath: this.file.path,
          hpKey: this.keys.hp,
          stressKey: this.keys.stress,
          armorKey: this.keys.armor,
          hopeKey: this.keys.hope,
        });
      }

      if (usedLong) {
        emitRestLong({
          filePath: this.file.path,
          hpKey: this.keys.hp,
          stressKey: this.keys.stress,
          armorKey: this.keys.armor,
          hopeKey: this.keys.hope,
        });
      }

      new Notice(lines.length ? `Rest: ${lines.join(' | ')}` : 'Rest: no changes applied.', 8000);
      this.close();
    };
  }
}
