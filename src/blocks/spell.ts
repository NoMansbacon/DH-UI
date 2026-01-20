// src/blocks/spell.ts
import type DaggerheartPlugin from "../main";
import type { MarkdownPostProcessorContext, TFile, App, Vault, TAbstractFile } from "obsidian";
import { parseYamlSafe } from "../utils/yaml";
import { processTemplate, createTemplateContext } from "../utils/template";
import { registerLiveCodeBlock } from "../utils/liveBlock";

function getFM(app: App, ctx: MarkdownPostProcessorContext): Record<string, any> {
  try {
    const file = app.vault.getFileByPath(ctx.sourcePath) as TFile | null;
    return (file ? (app.metadataCache.getFileCache(file)?.frontmatter ?? {}) : {}) as Record<string, any>;
  } catch {
    return {} as Record<string, any>;
  }
}

function getTitle(app: App, ctx: MarkdownPostProcessorContext, fm: Record<string, any>): string {
  try {
    const file = app.vault.getFileByPath(ctx.sourcePath) as TFile | null;
    return String(fm.title ?? (file ? file.basename : ""));
  } catch {
    return String(fm.title ?? "");
  }
}

function resolveText(
  key: string,
  raw: any,
  fm: Record<string, any>,
  el: HTMLElement,
  app: App,
  ctx: MarkdownPostProcessorContext
): string | undefined {
  const v = (raw?.[key] ?? fm?.[key]);
  if (v == null) return undefined;
  if (typeof v === "string") {
    try { return processTemplate(v, createTemplateContext(el, app, ctx)); } catch { return String(v); }
  }
  return String(v);
}

function resolveNumber(
  key: string,
  raw: any,
  fm: Record<string, any>,
  el: HTMLElement,
  app: App,
  ctx: MarkdownPostProcessorContext
): number | undefined {
  const s = resolveText(key, raw, fm, el, app, ctx);
  if (s == null) return undefined;
  const n = Number(String(s).trim());
  return Number.isFinite(n) ? n : undefined;
}

function resourceFor(app: App, path: string | undefined): string | undefined {
  if (!path) return undefined;
  try {
    const abs = app.vault.getAbstractFileByPath(path) as TAbstractFile | null;
    if (abs && "extension" in abs) {
      const tf = abs as unknown as TFile;
      // Vault#getResourcePath exists on desktop; guard with any
      const rp = (app.vault as any).getResourcePath?.(tf);
      return typeof rp === "string" ? rp : undefined;
    }
  } catch {}
  return undefined;
}

function renderCard(
  kind: "spell" | "action",
  plugin: DaggerheartPlugin,
  el: HTMLElement,
  src: string,
  ctx: MarkdownPostProcessorContext
) {
  const app = plugin.app;
  const fm = getFM(app, ctx);
  const raw = (parseYamlSafe<any>(src)) ?? {};

  const title = (resolveText("name", raw, fm, el, app, ctx) || getTitle(app, ctx, fm)).trim();
  const domain = resolveText("domain", raw, fm, el, app, ctx);
  const level = resolveNumber("level", raw, fm, el, app, ctx);
  const stress = resolveNumber("stress", raw, fm, el, app, ctx);
  const hope = resolveNumber("hope", raw, fm, el, app, ctx);
  const feature = resolveText("feature", raw, fm, el, app, ctx);
  const tokensMax = resolveNumber("tokens", raw, fm, el, app, ctx);
  const stateKeyFromYaml = resolveText("state_key", raw, fm, el, app, ctx);
  const tokenStateKey = String(stateKeyFromYaml || `${ctx.sourcePath}:${title || kind}:card`).trim();

  // Optional spell metadata for card layout (casting time, range, components, duration)
  const casting_time = resolveText("casting_time", raw, fm, el, app, ctx);
  const range = resolveText("range", raw, fm, el, app, ctx);
  const components = resolveText("components", raw, fm, el, app, ctx);
  const duration = resolveText("duration", raw, fm, el, app, ctx);

  const artPath = resolveText("art", raw, fm, el, app, ctx);
  const artUrl = resourceFor(app, artPath);

  // Host classes + minimal inline styling (works even if styles.css isn't loaded)
  const root = el;
  root.empty();
  root.addClass("dh-spell-card");
  if (kind === "action") root.addClass("dh-action-card");
  // Optional styleClass / class for custom styling
  const klass = String((raw as any).styleClass ?? (raw as any).class ?? '').trim();
  if (klass) {
    for (const c of klass.split(/\s+/).filter(Boolean)) root.addClass(c);
  }
  // Inline fallback styles
  root.setAttr(
    "style",
    [
      "position:relative",
      "border:1px dashed var(--background-modifier-border)",
      `border-left:6px solid ${kind === "action" ? "#26a69a" : "#8e75e3"}`,
      "border-radius:8px",
      "padding:10px 12px 10px 16px",
      "background:transparent",
      "max-width:min(760px, 100%)"
    ].join("; ")
  );

  // Art (optional)
  if (artUrl) {
    const art = root.createDiv({ cls: "dh-spell-art" });
    art.setAttr("style", "margin-bottom:8px");
    const img = document.createElement("img");
    img.src = artUrl; img.alt = String(title || "");
    img.style.display = "block";
    img.style.maxWidth = "100%";
    img.style.borderRadius = "10px";
    art.appendChild(img);
  }

  // Header
  const head = root.createDiv({ cls: "dh-spell-head" });
  head.setAttr("style", "display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:6px");
  const titleEl = head.createDiv({ cls: "title", text: title || (kind === "spell" ? "Spell" : "Action") });
  titleEl.setAttr("style", "font-weight:800; color:var(--text-normal)");
  const tags = head.createDiv({ cls: "tags" });
  tags.setAttr("style", "display:flex; gap:6px; flex-wrap:wrap");
  const mkPill = (text: string) => {
    const p = tags.createDiv({ cls: "pill", text });
    p.setAttr(
      "style",
      "display:inline-flex; align-items:center; padding:2px 8px; border-radius:999px; border:1px solid var(--background-modifier-border); background: linear-gradient(180deg, var(--background-secondary) 0%, color-mix(in oklab, var(--background-secondary), #000 10%) 100%); font-size:11px; color:var(--text-muted)"
    );
  };
  if (domain) mkPill(String(domain));
  if (typeof level === "number") mkPill(`Lv ${level}`);
  if (typeof stress === "number") mkPill(`Stress ${stress}`);
  if (typeof hope === "number") mkPill(`Hope ${hope}`);

  // Meta list (optional rows)
  const metaItems: Array<[string, string | undefined]> = [
    ["Casting Time", casting_time],
    ["Range", range],
    ["Components", components],
    ["Duration", duration],
  ];
  const hasMeta = metaItems.some(([, v]) => (v ?? "").trim().length > 0);
  if (hasMeta) {
    const meta = root.createDiv({ cls: "dh-spell-meta" });
    meta.setAttr("style", "display:grid; grid-template-columns:max-content 1fr; gap:6px 10px; margin:6px 0");
    for (const [label, val] of metaItems) {
      if (!val) continue;
      const row = meta.createDiv({ cls: "row" });
      row.setAttr("style", "display:contents");
      const l = row.createDiv({ cls: "label", text: label });
      l.setAttr("style", "font-size:11px; color:var(--text-faint)");
      const v = row.createDiv({ cls: "value", text: String(val) });
      v.setAttr("style", "font-size:12px; color:var(--text-normal)");
    }
  }

  // Feature text
  if (feature && feature.trim()) {
    const body = root.createDiv({ cls: "dh-spell-text" });
    body.setAttr("style", "white-space:pre-wrap; margin-top:4px; font-size:13px");
    body.setText(feature);
  }

  // Tokens strip (optional)
  if (typeof tokensMax === 'number' && tokensMax > 0) {
    const tokWrap = root.createDiv({ cls: 'dh-spell-tokens' });
    tokWrap.setAttr('style', 'display:flex; align-items:center; gap:8px; margin-top:6px');
    const label = tokWrap.createDiv({ text: 'Tokens' });
    label.setAttr('style', 'font-size:11px; color:var(--text-faint)');
    const dots = tokWrap.createDiv();
    dots.setAttr('style', 'display:inline-flex; gap:6px; align-items:center');
    let filled = readTokenState(tokenStateKey, tokensMax);
    const refresh = () => {
      dots.empty();
      for (let i = 0; i < (tokensMax as number); i++) {
        const d = document.createElement('div');
        const on = i < filled;
        d.setAttribute('style', [
          'width:14px;height:14px;border-radius:999px;cursor:pointer;',
          'border:1px solid var(--background-modifier-border);',
          on ? 'background:linear-gradient(180deg,#e2b64c,#b88418);box-shadow:0 0 0 1px rgba(0,0,0,.25) inset,0 0 8px rgba(255,199,66,.45)'
             : 'background:linear-gradient(180deg,var(--background-secondary) 0%,color-mix(in oklab,var(--background-secondary), #000 12%) 100%);box-shadow:var(--shadow-s)'
        ].join(''));
        d.onclick = () => {
          const next = (i + 1 === filled) ? 0 : (i + 1);
          filled = Math.max(0, Math.min(tokensMax as number, next));
          writeTokenState(tokenStateKey, filled);
          refresh();
        };
        dots.appendChild(d);
      }
    };
    refresh();
  }

  // Small footer hint
  const foot = root.createDiv({ cls: "dh-spell-foot" });
  foot.setAttr("style", "margin-top:6px; font-size:11px; color:var(--text-faint)");
  foot.setText(kind === "spell" ? "Spell" : "Action");
}

function asInt(v: any): number { const n = Math.floor(Number(v)); return Number.isFinite(n) ? Math.max(0, n) : 0; }
function readUsesState(key: string, max: number): number {
  try { const raw = localStorage.getItem(`dh:active:${key}`); const n = Number(raw); return Number.isFinite(n) ? Math.min(max, Math.max(0, n)) : 0; } catch { return 0; }
}
function writeUsesState(key: string, v: number) { try { localStorage.setItem(`dh:active:${key}`, String(Math.max(0, v))); } catch {} }

function readTokenState(key: string, max: number): number {
  try { const raw = localStorage.getItem(`dh:token:${key}`); const n = Number(raw); return Number.isFinite(n) ? Math.min(max, Math.max(0, n)) : 0; } catch { return 0; }
}
function writeTokenState(key: string, v: number) { try { localStorage.setItem(`dh:token:${key}`, String(Math.max(0, v))); } catch {} }

type ActiveItem = {
  label: string;
  kind: "Spell" | "Action";
  level: number;
  stress: number;
  feature: string;
  uses: number;
  stateKey: string;
  // Tokens for modifiers/features (per Daggerheart rule)
  tokensMax: number;
  tokenKey: string;
  // Daggerheart-specific card classification and vault state (loadout vs vault)
  card: "domain" | "subclass" | "ancestry" | "community";
  vaultDefault: boolean;         // default from YAML/frontmatter (true => in vault)
  permanentVault: boolean;       // cannot be moved back to loadout
};

function toKind(val: any): "Spell" | "Action" {
  return String(val ?? "spell").toLowerCase() === "action" ? "Action" : "Spell";
}

function parseActiveItems(
  plugin: DaggerheartPlugin,
  el: HTMLElement,
  src: string,
  ctx: MarkdownPostProcessorContext
): ActiveItem[] {
  const app = plugin.app;
  const fm = getFM(app, ctx);
  const tctx = createTemplateContext(el, app, ctx);
  const raw = (parseYamlSafe<any>(src)) ?? {};

  const toItem = (node: any, idx: number): ActiveItem => {
    const labelRaw = node?.label ?? fm?.label ?? "";
    const label = typeof labelRaw === "string" ? processTemplate(labelRaw, tctx) : String(labelRaw ?? "");
    const kind = toKind(node?.type ?? fm?.type);
    const level = asInt(resolveNumber("level", node, fm, el, app, ctx));
    const stress = asInt(resolveNumber("stress", node, fm, el, app, ctx) ?? resolveNumber("stress_cost", node, fm, el, app, ctx));
    const featureRaw = node?.feature ?? fm?.feature ?? "";
    const feature = typeof featureRaw === "string" ? processTemplate(featureRaw, tctx) : String(featureRaw ?? "");

    let usesMax = 0;
    const rawUses = node?.uses ?? fm?.uses;
    if (typeof rawUses === "string") usesMax = asInt(processTemplate(rawUses, tctx)); else usesMax = asInt(rawUses);

    const defaultKey = `${ctx.sourcePath}:${label || kind}:${idx}`;
    const stateKey = String(node?.state_key ?? defaultKey).trim();

    // Tokens (optional)
    let tokensMax = 0;
    const rawTokens = node?.tokens ?? fm?.tokens;
    if (typeof rawTokens === "string") tokensMax = asInt(processTemplate(rawTokens, tctx)); else tokensMax = asInt(rawTokens);
    const tokenKey = stateKey; // store under dh:token:<stateKey>

    // Card classification and vault defaults
    const cardRaw = String((node?.card ?? fm?.card ?? "domain")).toLowerCase();
    const card: ActiveItem["card"] = (cardRaw === "subclass" || cardRaw === "ancestry" || cardRaw === "community") ? cardRaw : "domain";
    const vaultRaw = (node?.vault ?? fm?.vault);
    const permanentVault = String(vaultRaw).toLowerCase() === "permanent";
    const vaultDefault = permanentVault ? true : Boolean(vaultRaw === true);

    // If no explicit tokens are defined, domain cards get a default pool so players can add tokens ad-hoc
    if ((!tokensMax || tokensMax <= 0) && card === "domain") {
      tokensMax = 15; // soft cap from Daggerheart guidance; can be tweaked later if needed
    }

    return { label, kind, level, stress, feature, uses: usesMax, stateKey, tokensMax, tokenKey, card, vaultDefault, permanentVault };
  };

  // items list
  if (Array.isArray(raw?.items)) {
    return raw.items.map((n: any, i: number) => toItem(n, i));
  }
  if (raw?.items && typeof raw.items === "object") {
    return Object.values(raw.items).map((n: any, i: number) => toItem(n, i));
  }
  // single
  return [toItem(raw, 0)];
}

function renderActiveList(
  plugin: DaggerheartPlugin,
  el: HTMLElement,
  src: string,
  ctx: MarkdownPostProcessorContext
) {
  // Optional styleClass / class for the active-hand table wrapper
  const raw = (parseYamlSafe<any>(src)) ?? {};
  const klass = String((raw as any).styleClass ?? (raw as any).class ?? '').trim();
  el.addClass('dh-active-hand-block');
  if (klass) {
    for (const c of klass.split(/\s+/).filter(Boolean)) el.addClass(c);
  }

  const allItems = parseActiveItems(plugin, el, src, ctx);
  el.empty();
  const wrap = el.createDiv({ cls: 'dh-active-hand' });

  // Filters UI
  const filters = wrap.createDiv({ cls: 'dh-active-filters' });
  filters.setAttr('role', 'toolbar');
  filters.setAttr('aria-label', 'Active items filters');
  const qInput = document.createElement('input');
  qInput.type = 'search';
  qInput.placeholder = 'Search name or features';
  qInput.className = 'dh-af q';
  const typeSel = document.createElement('select');
  typeSel.className = 'dh-af type';
  for (const [val, label] of [["", "All Types"], ["Spell", "Spell"], ["Action", "Action"]] as const) {
    const opt = document.createElement('option'); opt.value = val; opt.textContent = label; typeSel.appendChild(opt);
  }
  const locationSel = document.createElement('select');
  locationSel.className = 'dh-af loc';
  for (const [val, label] of [["", "All Locations"], ["loadout", "Loadout"], ["vault", "Vault"]] as const) {
    const opt = document.createElement('option'); opt.value = val; opt.textContent = label; locationSel.appendChild(opt);
  }
  const lvMin = document.createElement('input'); lvMin.type = 'number'; lvMin.placeholder = 'Min Lv'; lvMin.className = 'dh-af lv-min'; lvMin.min = '0';
  const lvMax = document.createElement('input'); lvMax.type = 'number'; lvMax.placeholder = 'Max Lv'; lvMax.className = 'dh-af lv-max'; lvMax.min = '0';
  const stMin = document.createElement('input'); stMin.type = 'number'; stMin.placeholder = 'Min Stress'; stMin.className = 'dh-af st-min'; stMin.min = '0';
  const stMax = document.createElement('input'); stMax.type = 'number'; stMax.placeholder = 'Max Stress'; stMax.className = 'dh-af st-max'; stMax.min = '0';
  const counter = document.createElement('span'); counter.className = 'dh-af counter'; counter.style.marginLeft = 'auto';
  filters.appendChild(qInput);
  filters.appendChild(typeSel);
  filters.appendChild(locationSel);
  filters.appendChild(lvMin);
  filters.appendChild(lvMax);
  filters.appendChild(stMin);
  filters.appendChild(stMax);
  filters.appendChild(counter);

  // Table
  const table = document.createElement('table');
  table.className = 'dh-active-table';
  table.setAttribute('role', 'table');
  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  for (const h of ['Name', 'Card', 'Type', 'Level', 'Stress', 'Uses', 'Tokens', 'Location', 'Features', 'Actions']) {
    const th = document.createElement('th'); th.scope = 'col'; th.textContent = h; headRow.appendChild(th);
  }
  thead.appendChild(headRow);
  const tbody = document.createElement('tbody');
  table.appendChild(thead);
  table.appendChild(tbody);
  wrap.appendChild(table);

  // Utility: clear children (avoid relying on Obsidian's .empty on plain elements)
  const clear = (node: Element) => { while (node.firstChild) node.removeChild(node.firstChild); };

  const parseIntSafe = (el: HTMLInputElement): number | undefined => {
    const raw = el.value != null ? String(el.value).trim() : '';
    if (raw === '') return undefined;
    const n = Number(raw);
    return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : undefined;
  };

  // Vault state helpers
  const readLoc = (it: ActiveItem): 'loadout' | 'vault' => {
    if (it.permanentVault) return 'vault';
    try {
      const raw = localStorage.getItem(`dh:active:vault:${it.stateKey}`);
      if (raw === '1') return 'vault';
      if (raw === '0') return 'loadout';
    } catch {}
    return it.vaultDefault ? 'vault' : 'loadout';
  };
  const writeLoc = (it: ActiveItem, loc: 'loadout' | 'vault') => {
    if (it.permanentVault) return; // immutable
    try { localStorage.setItem(`dh:active:vault:${it.stateKey}`, loc === 'vault' ? '1' : '0'); } catch {}
  };
  const domainLoadoutCount = (): number => {
    let c = 0; for (const it of allItems) { if (it.card === 'domain' && readLoc(it) === 'loadout') c++; } return c;
  };

  const getDomainLimit = (): number | null => {
    try {
      const raw = (plugin.settings as any)?.maxDomainLoadout;
      const n = Number(raw);
      return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
    } catch {
      return null;
    }
  };

  const applyFilters = (items: ActiveItem[]): ActiveItem[] => {
    const q = qInput.value.trim().toLowerCase();
    const t = typeSel.value as '' | 'Spell' | 'Action';
    const lmin = parseIntSafe(lvMin);
    const lmax = parseIntSafe(lvMax);
    const smin = parseIntSafe(stMin);
    const smax = parseIntSafe(stMax);
    const locF = (locationSel.value as '' | 'loadout' | 'vault');
    return items.filter(it => {
      if (t && it.kind !== t) return false;
      if (lmin != null && (it.level ?? 0) < lmin) return false;
      if (lmax != null && (it.level ?? 0) > lmax) return false;
      if (smin != null && (it.stress ?? 0) < smin) return false;
      if (smax != null && (it.stress ?? 0) > smax) return false;
      if (locF && readLoc(it) !== locF) return false;
      if (q) {
        const hay = `${it.label ?? ''} ${it.feature ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  };

  const renderUses = (cell: HTMLTableCellElement, it: ActiveItem) => {
    const usesEl = document.createElement('div');
    usesEl.className = 'dh-active-uses';
    cell.appendChild(usesEl);
    let filled = it.stateKey ? readUsesState(it.stateKey, it.uses) : 0;
    const refresh = () => {
      clear(usesEl);
      for (let i = 0; i < it.uses; i++) {
        const b = document.createElement('div');
        b.className = 'dh-active-box' + (i < filled ? ' on' : '');
        b.onclick = () => {
          const next = (i < filled) ? i : i + 1;
          filled = Math.max(0, Math.min(it.uses, next));
          if (it.stateKey) writeUsesState(it.stateKey, filled);
          refresh();
        };
        usesEl.appendChild(b);
      }
    };
    if (it.uses > 0) refresh();
  };

  const renderTokens = (cell: HTMLTableCellElement, it: ActiveItem) => {
    if (!it.tokensMax || it.tokensMax <= 0) return;
    const wrap = document.createElement('div');
    wrap.style.display = 'inline-flex'; wrap.style.alignItems = 'center'; wrap.style.gap = '6px';
    const dots = document.createElement('div'); dots.style.display = 'inline-flex'; dots.style.gap = '6px'; dots.style.alignItems = 'center';
    wrap.appendChild(dots);
    cell.appendChild(wrap);
    let filled = it.stateKey ? readTokenState(it.tokenKey, it.tokensMax) : 0;
    const refresh = () => {
      dots.innerHTML = '';
      for (let i = 0; i < it.tokensMax; i++) {
        const d = document.createElement('div');
        const on = i < filled;
        d.setAttribute('style', [
          'width:14px;height:14px;border-radius:999px;cursor:pointer;',
          'border:1px solid var(--background-modifier-border);',
          on ? 'background:linear-gradient(180deg,#e2b64c,#b88418);box-shadow:0 0 0 1px rgba(0,0,0,.25) inset,0 0 8px rgba(255,199,66,.45)'
             : 'background:linear-gradient(180deg,var(--background-secondary) 0%,color-mix(in oklab,var(--background-secondary), #000 12%) 100%);box-shadow:var(--shadow-s)'
        ].join(''));
        d.onclick = () => {
          const next = (i + 1 === filled) ? 0 : (i + 1);
          filled = Math.max(0, Math.min(it.tokensMax, next));
          if (it.stateKey) writeTokenState(it.tokenKey, filled);
          refresh();
        };
        dots.appendChild(d);
      }
    };
    refresh();
  };

  const adjustTokens = (it: ActiveItem, delta: number) => {
    if (!it.tokensMax || it.tokensMax <= 0) return;
    const current = it.stateKey ? readTokenState(it.tokenKey, it.tokensMax) : 0;
    const next = Math.max(0, Math.min(it.tokensMax, current + delta));
    if (next === current) return;
    if (it.stateKey) writeTokenState(it.tokenKey, next);
    renderBody();
  };

  const updateCounter = () => {
    const limit = getDomainLimit();
    const count = domainLoadoutCount();
    if (limit != null) {
      counter.textContent = `Domain loadout: ${count}/${limit}`;
    } else {
      counter.textContent = `Domain loadout: ${count} (no limit)`;
    }
  };

  const renderBody = () => {
    clear(tbody);
    const items = applyFilters(allItems);
    for (const it of items) {
      const tr = document.createElement('tr');
      const tdName = document.createElement('td'); tdName.textContent = it.label || ''; tr.appendChild(tdName);
      const tdCard = document.createElement('td'); tdCard.textContent = it.card; tr.appendChild(tdCard);
      const tdType = document.createElement('td'); tdType.textContent = it.kind; tr.appendChild(tdType);
      const tdLv = document.createElement('td'); tdLv.textContent = it.level ? String(it.level) : ''; tr.appendChild(tdLv);
      const tdStress = document.createElement('td'); tdStress.textContent = it.stress ? String(it.stress) : ''; tr.appendChild(tdStress);
      const tdUses = document.createElement('td'); renderUses(tdUses, it); tr.appendChild(tdUses);
      const tdTokens = document.createElement('td'); renderTokens(tdTokens, it); tr.appendChild(tdTokens);
      const tdLoc = document.createElement('td');
      const loc = readLoc(it);
      if (it.permanentVault) {
        tdLoc.textContent = 'Vault (permanent)';
      } else {
        const btn = document.createElement('button');
        const toLoadout = () => {
          const limit = getDomainLimit();
          if (it.card === 'domain' && limit != null && domainLoadoutCount() >= limit) {
            const msgLimit = limit === 1
              ? 'You can have a maximum of one active domain card in your loadout.'
              : `You can have a maximum of ${limit} active domain cards in your loadout.`;
            window.alert(msgLimit);
            return;
          }
          writeLoc(it, 'loadout'); renderBody(); updateCounter();
        };
        const toVault = () => { writeLoc(it, 'vault'); renderBody(); updateCounter(); };
        if (loc === 'loadout') {
          btn.textContent = 'Store in Vault';
          btn.onclick = toVault;
        } else {
          btn.textContent = 'Equip to Loadout';
          btn.onclick = toLoadout;
          const limit = getDomainLimit();
          if (it.card === 'domain' && limit != null && domainLoadoutCount() >= limit) btn.disabled = true;
        }
        tdLoc.appendChild(btn);
      }
      tr.appendChild(tdLoc);
      const tdFeat = document.createElement('td'); tdFeat.textContent = it.feature || ''; tr.appendChild(tdFeat);

      const tdActions = document.createElement('td');
      tdActions.style.whiteSpace = 'nowrap';
      tdActions.style.gap = '6px';
      tdActions.style.alignItems = 'center';

      const addTokenBtn = document.createElement('button');
      addTokenBtn.textContent = 'Add token';
      addTokenBtn.onclick = () => adjustTokens(it, +1);

      const removeTokenBtn = document.createElement('button');
      removeTokenBtn.textContent = 'Remove token';
      removeTokenBtn.onclick = () => adjustTokens(it, -1);

      const hasTokens = !!(it.tokensMax && it.tokensMax > 0);
      addTokenBtn.disabled = !hasTokens;
      removeTokenBtn.disabled = !hasTokens;

      tdActions.appendChild(addTokenBtn);
      tdActions.appendChild(removeTokenBtn);
      tr.appendChild(tdActions);

      tbody.appendChild(tr);
    }
    updateCounter();
  };

  // Wire up filters
  qInput.addEventListener('input', renderBody);
  typeSel.addEventListener('change', renderBody);
  lvMin.addEventListener('input', renderBody);
  lvMax.addEventListener('input', renderBody);
  stMin.addEventListener('input', renderBody);
  stMax.addEventListener('input', renderBody);
  locationSel.addEventListener('change', renderBody);

  renderBody();
  updateCounter();
}

export function registerSpellBlocks(plugin: DaggerheartPlugin) {
  const specs = [
    { name: "active-hand", variant: "active" as const, kind: "spell" as const },
    { name: "spell-components", variant: "card" as const, kind: "spell" as const },
    { name: "action", variant: "card" as const, kind: "action" as const },
    { name: "dh-action", variant: "card" as const, kind: "action" as const },
  ];

  for (const spec of specs) {
    registerLiveCodeBlock(plugin, spec.name, (el, src, ctx) => {
      if (spec.variant === "active") return renderActiveList(plugin, el, src, ctx);
      return renderCard(spec.kind, plugin, el, src, ctx);
    });
  }
}
