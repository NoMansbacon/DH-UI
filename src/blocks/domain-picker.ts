/**
 * Domain Card Picker block processor
 * Renders a UI for managing domain cards in Vault and Loadout lists
 * Integrates with plugin settings for configurable card folder location
 */

import { MarkdownPostProcessorContext, MarkdownRenderChild, TFile } from "obsidian";
import type DaggerheartPlugin from "../main";

export function registerDomainPickerBlock(plugin: DaggerheartPlugin) {
  plugin.registerMarkdownCodeBlockProcessor(
    "domainpicker",
    async (src: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
      try {
        await renderDomainPicker(el, plugin, ctx);
      } catch (e) {
        console.error("[DH-UI] Domain picker render error:", e);
        el.setText("Error rendering domain picker. See console for details.");
      }
    }
  );
}

export async function renderDomainPicker(
  el: HTMLElement,
  plugin: DaggerheartPlugin,
  ctx: MarkdownPostProcessorContext
) {
  const root = el.createDiv();

  let levelOverride: number | null = null;

  const dataviewPlugin = (plugin.app as any).plugins?.plugins?.dataview;
  if (!dataviewPlugin) {
    root.setText("Dataview plugin not found. Domain picker requires Dataview.");
    return;
  }

  const dv = dataviewPlugin.api;

  const file = plugin.app.workspace.getActiveFile();
  if (!file) {
    root.setText("No active file.");
    return;
  }

  const cur = dv.page(file.path);
  const charLevel = toNumber(getField(cur, ["level", "Level"], 0));
  const charDomains = parseDomains(
    getField(cur, ["domains", "Domains"], [])
  ).map((s) => s.toLowerCase());

  // Discover cards based on plugin settings
  const discoverCards = () => {
    const raw = plugin.settings.domainCardsFolder?.trim();
    if (raw && raw.length > 0) {
      // Normalize to vault-relative, forward slashes; avoid Dataview query parser by filtering in JS
      const folder = raw.replace(/\\/g, "/");
      const prefix = folder.endsWith("/") ? folder : folder + "/";
      const prefixLC = prefix.toLowerCase();
      return dv
        .pages()
        .where(
          (p: any) =>
            typeof p?.file?.path === "string" &&
            p.file.path.toLowerCase().startsWith(prefixLC)
        );
    }
    // Search whole vault by tag when no folder specified
    return dv.pages().where((p: any) => hasTag(p, "domain") || hasTag(p, "domains") || getField(p, ["domain", "Domain"], null) != null);
  };

  const allCards = discoverCards().array();

  const state = {
    vault: toPaths(getField(cur, ["vault", "Vault"], [])),
    loadout: toPaths(getField(cur, ["loadout", "Loadout"], [])),
  };

  const ui = {
    header: root.createEl("div", { cls: "dvjs-toolbar" }),
    tables: root.createEl("div", { cls: "dvjs-tables" }),
    modal: null as HTMLElement | null,
    currentFilter: "loadout" as "vault" | "loadout",
  };

  // Toolbar with filter buttons
  const filterDiv = ui.header.createEl("div", { cls: "dvjs-filter-buttons" });

  const btnLoadout = filterDiv.createEl("button", { text: "Loadout" });
  btnLoadout.classList.add("active");
  btnLoadout.addEventListener("click", () => {
    ui.currentFilter = "loadout";
    btnLoadout.classList.add("active");
    btnVault.classList.remove("active");
    renderTables();
  });

  const btnVault = filterDiv.createEl("button", { text: "Vault" });
  btnVault.addEventListener("click", () => {
    ui.currentFilter = "vault";
    btnVault.classList.add("active");
    btnLoadout.classList.remove("active");
    renderTables();
  });

  const addBtn = ui.header.createEl("button", { text: "Add cards" });
  addBtn.addEventListener("click", () => openModal());

  // Listen for global open requests (e.g., after Level Up opt5)
  const child = new MarkdownRenderChild(el);
  const onOpen = (ev: Event) => {
    try {
      const ce = ev as CustomEvent;
      const fp = ce?.detail?.filePath;
      if (!fp || fp === ctx.sourcePath) {
        const lvl = Number(ce?.detail?.level);
        levelOverride = Number.isFinite(lvl) ? lvl : null;
        openModal();
      }
    } catch {}
  };
  window.addEventListener('dh:domainpicker:open' as any, onOpen as any);
  child.onunload = () => { try { window.removeEventListener('dh:domainpicker:open' as any, onOpen as any); } catch {} };
  ctx.addChild(child);

  renderTables();

  function getVisibleColumns() {
    const cols: string[] = [];
    const settings = plugin.settings.domainPickerColumns;
    if (settings.name) cols.push("Name");
    if (settings.type) cols.push("Type");
    if (settings.domain) cols.push("Domain");
    if (settings.level) cols.push("Level");
    if (settings.stress) cols.push("Stress");
    if (settings.feature) cols.push("Feature");
    if (settings.tokens) cols.push("Tokens");
    return cols;
  }

  function renderTables() {
    ui.tables.empty();
    const list =
      ui.currentFilter === "vault" ? state.vault : state.loadout;
    const title = ui.currentFilter === "vault" ? "Vault" : "Loadout";
    ui.tables.appendChild(buildSection(title, list));
  }

  function buildSection(title: string, list: string[]) {
    const section = createDiv({ cls: "dvjs-section" });
    section.createEl("h3", { text: title });

    const visibleCols = getVisibleColumns();

    const table = section.createEl("table", { cls: "dvjs-table" });
    const thead = table.createEl("thead");
    const trh = thead.createEl("tr");
    visibleCols.forEach((c) => {
      const th = trh.createEl("th", { text: c });
      if (c === "Tokens") th.addClass('dvjs-tokens-col');
    });
    trh.createEl("th", { text: "Actions" });

    const tbody = table.createEl("tbody");
    const rows = list.map((path) => pathToRow(path));

    if (rows.length === 0) {
      const tr = tbody.createEl("tr");
      const td = tr.createEl("td", {
        text: "Empty",
        attr: { colspan: String(visibleCols.length + 1) },
      });
      td.style.opacity = "0.7";
    } else {
      rows.forEach((r) => {
        const tr = tbody.createEl("tr");
        visibleCols.forEach((col) => {
          const td = tr.createEl("td");
          if (col === "Name") {
            renderFileLink(td, r.path, r.name);
          } else if (col === "Level") {
            td.innerText = String(r.level ?? "");
          } else if (col === "Domain") {
            td.innerText = (r.domains || []).join(", ");
          } else if (col === "Type") {
            td.innerText = r.type ?? "";
          } else if (col === "Stress") {
            td.innerText = r.stress ?? "";
          } else if (col === "Feature") {
            td.innerText = r.feature ?? "";
            td.style.maxWidth = "300px";
            td.style.whiteSpace = "normal";
            td.style.wordWrap = "break-word";
          } else if (col === "Tokens") {
            renderTokensCell(td, r.path, r.tokens);
          }
        });

        // Actions column
        const tdActions = tr.createEl("td");
        const otherListName = title === "Vault" ? "loadout" : "vault";

        const btnSwitch = tdActions.createEl("button", {
          text: `→ ${otherListName}`,
        });
        btnSwitch.addEventListener("click", async () => {
          await removeFromList(title.toLowerCase(), r.path);
          await addToList(otherListName, r.path);
        });

        const btnRemove = tdActions.createEl("button", { text: "Remove" });
        btnRemove.style.color = "var(--text-error)";
        btnRemove.addEventListener("click", async () => {
          await removeFromList(title.toLowerCase(), r.path);
        });
      });
    }

    return section;
  }

  function pathToRow(path: string) {
    let p = dv.page(path);
    if (!p) {
      const base = basenameNoExt(path).toLowerCase();
      p = allCards.find(
        (x: any) =>
          basenameNoExt(x.file?.path || "").toLowerCase() === base
      );
    }
    const domains = parseDomains(
      getField(p, ["domains", "domain", "Domains"], [])
    );
    const level = toNumber(getField(p, ["level", "Level"], ""));
    const name = p?.file?.name || basenameNoExt(path);
    const type = getField(p, ["type", "Type"], "");
    const stress = getField(p, ["stress", "Stress"], "");
    const feature = getField(p, ["feature", "Feature"], "");
    const tokens = toNumber(getField(p, ["tokens", "Tokens"], 0));
    const r = {
      path: p?.file?.path || path,
      name,
      level,
      domains,
      type,
      stress,
      feature,
      tokens,
    };
    return r;
  }

  function openModal() {
    if (ui.modal) ui.modal.remove();
    ui.modal = document.body.createDiv({ cls: "dvjs-modal-backdrop" });
    const modal = ui.modal.createDiv({ cls: "dvjs-modal" });

    const visibleCols = getVisibleColumns();

    const header = modal.createDiv({ cls: "dvjs-modal-header" });
    header.createEl("h3", { text: "Add Domain Cards" });
    const closeBtn = header.createEl("button", {
      text: "✕",
      cls: "dvjs-close",
    });
    closeBtn.addEventListener("click", () => ui.modal?.remove());

    const filterInfo = modal.createDiv({ cls: "dvjs-filter-info" });
    filterInfo.setText(
      `Filters: level ≤ ${charLevel} • domains: ${charDomains.join(", ") || "—"}`
    );

    // Filters UI
    ensureCardStyles();
    const filters = modal.createDiv({ cls: "dvjs-filters" });

    const allDomainsSet = new Set<string>();
    allCards.forEach((c: any) => {
      parseDomains(getField(c, ["domains", "domain", "Domains"], [])).forEach((d: string) => allDomainsSet.add(d.toLowerCase()));
    });
    const allDomains = Array.from(allDomainsSet).sort();
    const characterDomains = (charDomains || []).map((d) => d.toLowerCase());
    const domainOptions = characterDomains.length > 0 ? characterDomains : allDomains;

    // Compute type options constrained by selected domain or character domains
    function typesForDomainBaseline(): string[] {
      const base = allCards.array ? allCards.array() : allCards;
      const domainFilter = (selDomain && selDomain.length) ? [selDomain] : characterDomains;
      const types = new Set<string>();
      for (const c of base) {
        const cDomains = parseDomains(getField(c, ["domains", "domain", "Domains"], [])).map((s: string) => s.toLowerCase());
        const include = domainFilter.length ? cDomains.some((d: string) => domainFilter.includes(d)) : true;
        if (!include) continue;
        const t = String(getField(c, ["type", "Type"], "")).trim();
        if (t) types.add(t);
      }
      return Array.from(types).sort();
    }

    let selDomain: string | null = null;
    let selType: string | null = null;
    let selectedLevel: number | null = null;

    // Domain select (restricted to character domains if available)
    const domWrap = filters.createDiv({ cls: "filter" });
    domWrap.createEl("label", { text: "Domain" });
    const domSel = domWrap.createEl("select", { cls: "dropdown" });
    domSel.appendChild(new Option("Any", ""));
    domainOptions.forEach((d) => domSel.appendChild(new Option(d, d)));
    domSel.addEventListener("change", () => { selDomain = domSel.value || null; selType = null; populateTypeOptions(); renderCards(); });

    // Type select (options depend on selected/allowed domains)
    const typeWrap = filters.createDiv({ cls: "filter" });
    typeWrap.createEl("label", { text: "Type" });
    const typeSel = typeWrap.createEl("select", { cls: "dropdown" });
    const populateTypeOptions = () => {
      // clear
      while (typeSel.firstChild) typeSel.removeChild(typeSel.firstChild);
      typeSel.appendChild(new Option("Any", ""));
      typesForDomainBaseline().forEach((t) => typeSel.appendChild(new Option(t, t)));
      typeSel.value = "";
    };
    populateTypeOptions();
    typeSel.addEventListener("change", () => { selType = typeSel.value || null; renderCards(); });

    // Level filter (Any or exact 1–10)
    const lvlWrap = filters.createDiv({ cls: "filter" });
    lvlWrap.createEl("label", { text: "Level" });
    const lvlSel = lvlWrap.createEl("select", { cls: "dropdown" });
    lvlSel.appendChild(new Option("Any", ""));
    for (let i = 1; i <= 10; i++) lvlSel.appendChild(new Option(String(i), String(i)));
    lvlSel.value = "";
    lvlSel.addEventListener("change", () => {
      selectedLevel = lvlSel.value ? Number(lvlSel.value) : null;
      renderCards();
    });

    // Text search (by name, feature, type, domain)
    let q = "";
    const searchWrap = filters.createDiv({ cls: "filter" });
    searchWrap.createEl("label", { text: "Search" });
    const searchInput = searchWrap.createEl("input", { type: "text" });
    searchInput.placeholder = "Name, feature, type or domain";
    searchInput.addEventListener("input", () => { q = searchInput.value.toLowerCase(); renderCards(); });

    // Reset button
    const resetWrap = filters.createDiv({ cls: "filter" });
    resetWrap.createEl("label", { text: "\u00A0" });
    const resetBtn = resetWrap.createEl("button", { cls: "dh-rest-btn", text: "Reset" });
    resetBtn.addEventListener("click", () => {
      selDomain = null; domSel.value = "";
      selType = null; typeSel.value = "";
      lvlSel.value = ""; selectedLevel = null;
      q = ""; searchInput.value = "";
      renderCards();
    });

    // Scroll container root
    const listRoot = modal.createDiv({ cls: "dvjs-modal-list" });

    function renderCards() {
      listRoot.empty();
      const base = allCards.array ? allCards.array() : allCards; // support dataview array

      // Refresh current character fields so info stays accurate
      const curNow = dv.page(file.path);
      const charLevelNow = (levelOverride !== null ? levelOverride : toNumber(getField(curNow, ["level", "Level"], charLevel)));
      const charDomainsNow = parseDomains(getField(curNow, ["domains", "Domains"], charDomains)).map((s) => s.toLowerCase());

      // Update info line
      const levelInfo = selectedLevel !== null ? `= ${selectedLevel}` : (charLevelNow > 0 ? `≤ ${charLevelNow}` : "Any");
      const domInfo = selDomain ? selDomain : (charDomainsNow.join(", ") || "—");
      const typeInfo = selType || "Any";
      const searchInfo = q ? ` • search: ${q}` : "";
      filterInfo.setText(`Filters: level ${levelInfo} • domains: ${domInfo} • type: ${typeInfo}${searchInfo}`);

      let candidates = base
        .filter((c: any) => {
          const cLevel = toNumber(getField(c, ["level", "Level"], 0));
          const cDomains = parseDomains(getField(c, ["domains", "domain", "Domains"], [])).map((s) => s.toLowerCase());
          const hasDomainTag = hasTag(c, "domain") || hasTag(c, "domains");

          // Domain filter: prefer explicit selection; else default to character domains
          let domainOK = true;
          if (selDomain && selDomain.length > 0) {
            domainOK = cDomains.length > 0 ? cDomains.includes(selDomain) : hasDomainTag && selDomain === "domain";
          } else if (charDomainsNow.length > 0) {
            domainOK = cDomains.length > 0 ? cDomains.some((d) => charDomainsNow.includes(d)) : hasDomainTag;
          } else {
            domainOK = hasDomainTag || cDomains.length > 0;
          }

          // Type filter
          const t = String(getField(c, ["type", "Type"], ""));
          const typeOK = selType ? t === selType : true;

          // Level filter: exact if selected; otherwise cap to character level (if > 0)
          const levelOK = selectedLevel !== null ? cLevel === selectedLevel : (charLevelNow > 0 ? cLevel <= charLevelNow : true);

          // Text search: name, feature, type, domains
          const cName = String(c.file?.name || "");
          const cFeature = String(getField(c, ["feature", "Feature"], ""));
          const qOK = q
            ? [cName, cFeature, t, ...cDomains].some((s) => String(s).toLowerCase().includes(q))
            : true;

          return domainOK && typeOK && levelOK && qOK;
        })
        .sort((a: any, b: any) => {
          const la = toNumber(getField(a, ["level", "Level"], 0));
          const lb = toNumber(getField(b, ["level", "Level"], 0));
          if (la !== lb) return la - lb;
          return (a.file?.name || "").localeCompare(b.file?.name || "");
        });

      const view = plugin.settings.domainPickerView || 'card';

      if (candidates.length === 0) {
        const empty = listRoot.createDiv({ cls: "dvjs-empty", text: "No matching cards" });
        (empty as HTMLElement).style.opacity = "0.7";
        return;
      }

      if (view === 'table') {
        const table = listRoot.createEl('table', { cls: 'dvjs-table' });
        const thead = table.createEl('thead');
        const trh = thead.createEl('tr');
        visibleCols.forEach((h) => trh.createEl('th', { text: h }));
        trh.createEl('th', { text: 'Actions' });
        const tbody = table.createEl('tbody');

        candidates.forEach((c: any) => {
          const cPath = c.file?.path;
          const cName = c.file?.name || basenameNoExt(cPath || "");
          const cLevel = toNumber(getField(c, ["level", "Level"], ""));
          const cDomains = parseDomains(getField(c, ["domains", "domain", "Domains"], []));
          const cType = getField(c, ["type", "Type"], "");
          const cStress = getField(c, ["stress", "Stress"], "");
          const cFeature = getField(c, ["feature", "Feature"], "");

          const tr = tbody.createEl('tr');
          visibleCols.forEach((col) => {
            const td = tr.createEl('td');
            if (col === 'Name') {
              renderFileLink(td, cPath, cName);
            } else if (col === 'Level') {
              td.innerText = String(cLevel ?? '');
            } else if (col === 'Domain') {
              td.innerText = (cDomains || []).join(', ');
            } else if (col === 'Type') {
              td.innerText = cType ?? '';
            } else if (col === 'Stress') {
              td.innerText = String(cStress ?? '');
            } else if (col === 'Feature') {
              td.innerText = cFeature ?? '';
              td.style.maxWidth = '300px';
              td.style.whiteSpace = 'normal';
              td.style.wordWrap = 'break-word';
            }
          });
          const tdAct = tr.createEl('td');
          const btnVault = tdAct.createEl('button', { text: 'Add to Vault' });
          const btnLoad = tdAct.createEl('button', { text: 'Add to Loadout' });
          btnVault.disabled = added('vault', cPath);
          btnLoad.disabled = added('loadout', cPath);
          btnVault.addEventListener('click', async () => { await addToList('vault', cPath); renderCards(); });
          btnLoad.addEventListener('click', async () => { await addToList('loadout', cPath); renderCards(); });
        });
        return;
      }

      // Card view
      const grid = listRoot.createDiv({ cls: 'dvjs-card-grid' });
      candidates.forEach((c: any) => {
        const cPath = c.file?.path;
        const cName = c.file?.name || basenameNoExt(cPath || "");
        const cLevel = toNumber(getField(c, ["level", "Level"], ""));
        const cDomains = parseDomains(getField(c, ["domains", "domain", "Domains"], []));
        const cType = getField(c, ["type", "Type"], "");
        const cFeature = getField(c, ["feature", "Feature"], "");
        const cArt = getField(c, ["art", "Art"], "");

        const card = grid.createDiv({ cls: 'dvjs-card' });
        const artSrc = cArt ? resolveArtSrc(c, cArt) : null;
        if (artSrc) {
          const img = card.createEl('img', { attr: { src: artSrc, alt: cName } });
          img.style.width = '100%'; img.style.height = '160px'; img.style.objectFit = 'cover';
        }
        const body = card.createDiv({ cls: 'card-body' });
        const title = body.createEl('div', { cls: 'title' });
        renderFileLink(title, cPath, cName);
        body.createEl('div', { cls: 'meta', text: `Level ${cLevel || 0} • ${(cDomains || []).join(', ') || '—'} • ${cType || ''}` });
        body.createEl('div', { cls: 'feature', text: cFeature || '' });

        const actions = body.createDiv({ cls: 'actions' });
        const inVault = added('vault', cPath);
        const inLoad = added('loadout', cPath);
        const btnVault = actions.createEl('button', { text: 'Add to Vault' });
        const btnLoad = actions.createEl('button', { text: 'Add to Loadout' });
        btnVault.disabled = inVault;
        btnLoad.disabled = inLoad;
        btnVault.addEventListener('click', async () => { await addToList('vault', cPath); renderCards(); });
        btnLoad.addEventListener('click', async () => { await addToList('loadout', cPath); renderCards(); });
      });
    }

    renderCards();
  }

  function added(listName: string, path: string) {
    const arr = state[listName as "vault" | "loadout"] || [];
    return arr.some((p) => eqPath(p, path));
  }

  async function addToList(listName: "vault" | "loadout", path: string) {
    const link = `[[${path}]]`;
    const other = listName === "vault" ? "loadout" : "vault";
    await plugin.app.fileManager.processFrontMatter(file, (fm) => {
      // Ensure exclusivity: remove from the other list
      if (Array.isArray(fm[other])) {
        fm[other] = fm[other].filter((l: string) => !eqPath(linkToPath(l), path));
      }
      const curArr = Array.isArray(fm[listName]) ? fm[listName].slice() : [];
      if (!curArr.includes(link)) curArr.push(link);
      fm[listName] = curArr;
    });
    // Sync local state
    state[other as "vault" | "loadout"] = state[other as "vault" | "loadout"].filter((p) => !eqPath(p, path));
    if (!state[listName].some((p) => eqPath(p, path))) {
      state[listName].push(path);
    }
    renderTables();
  }

  async function removeFromList(listName: string, path: string) {
    await plugin.app.fileManager.processFrontMatter(file, (fm) => {
      if (Array.isArray(fm[listName])) {
        fm[listName] = fm[listName].filter(
          (link: string) => !eqPath(linkToPath(link), path)
        );
      }
    });
    state[listName as "vault" | "loadout"] = state[
      listName as "vault" | "loadout"
    ].filter((p) => !eqPath(p, path));
    renderTables();
  }

  function readTokenState(key: string, max: number): number {
    try { const raw = localStorage.getItem(`dh:token:${key}`); const n = Number(raw); return Number.isFinite(n) ? Math.min(max, Math.max(0, n)) : 0; } catch { return 0; }
  }
  function writeTokenState(key: string, v: number) { try { localStorage.setItem(`dh:token:${key}`, String(Math.max(0, v))); } catch {} }

  function renderTokensCell(td: HTMLTableCellElement, cardPath: string, maxTokens: number) {
    const max = Number(maxTokens || 0);
    if (!Number.isFinite(max) || max <= 0) return;
    td.classList.add('dvjs-tokens-col');
    const key = `${file.path}:${cardPath}`;
    const wrap = td.createDiv({ cls: 'dvjs-tokens-wrap' });
    let filled = readTokenState(key, max);
    const refresh = () => {
      wrap.empty();
      for (let i = 0; i < max; i++) {
        const d = document.createElement('div');
        d.className = 'dvjs-token-dot' + (i < filled ? ' on' : '');
        d.onclick = () => {
          const next = (i + 1 === filled) ? 0 : (i + 1);
          filled = Math.max(0, Math.min(max, next));
          writeTokenState(key, filled);
          refresh();
        };
        wrap.appendChild(d);
      }
    };
    refresh();
  }

  function ensureCardStyles() {
    if (document.getElementById("dhui-domain-card-styles")) return;
    const style = document.createElement("style");
    style.id = "dhui-domain-card-styles";
    style.textContent = `
    .dvjs-card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; }
    .dvjs-card { position: relative; border: 1px solid var(--background-modifier-border); background: var(--background-primary); border-radius: 6px; overflow: hidden; display: flex; flex-direction: column; }
    .dvjs-card .card-body { padding: 8px 10px; display: flex; flex-direction: column; gap: 6px; }
    .dvjs-card .title { font-weight: 600; }
    .dvjs-card .title a { text-decoration: none; }
    .dvjs-card .meta { font-size: 12px; opacity: 0.8; }
    .dvjs-card .feature { font-size: 12px; opacity: 0.95; white-space: normal; }
    .dvjs-card .actions { display: flex; gap: 8px; margin-top: 6px; flex-wrap: wrap; }
.dvjs-filters { display: flex; gap: 12px; align-items: end; margin: 8px 0; flex-wrap: wrap; }
    .dvjs-filters .filter { display: flex; flex-direction: column; gap: 4px; }
    `;
    document.head.appendChild(style);
  }

  // Resolve art path to a resource URL
  function resolveArtSrc(c: any, artVal: any): string | null {
    if (!artVal) return null;
    let s = linkToPath(String(artVal)).trim();
    if (!s) return null;

    // If already an absolute URL or obsidian app URL, return as-is
    if (/^(app|https?):/i.test(s)) return s;

    s = s.replace(/^\/+/, "");
    const candidates: string[] = [];
    candidates.push(s);

    // Common asset locations
    candidates.push(`z_assets/${s}`);
    const domains = parseDomains(getField(c, ["domains", "domain", "Domains"], []));
    const firstDomain = (domains[0] || "").toString();
    const domTitle = firstDomain
      ? firstDomain.charAt(0).toUpperCase() + firstDomain.slice(1).toLowerCase()
      : "";
    if (domTitle) {
      candidates.push(`z_assets/Domain Card Art/${domTitle}/${s}`);
      candidates.push(`z_assets/Domain Card Art/${s}`);
    }

    const rawFolder = plugin.settings.domainCardsFolder?.trim();
    if (rawFolder) {
      const folder = rawFolder.replace(/\\/g, "/").replace(/^\/+/, "");
      candidates.push(`${folder}/${s}`);
    }

    const noteDir = ((c?.file?.path || "").split("/").slice(0, -1).join("/")) || "";
    if (noteDir) candidates.push(`${noteDir}/${s}`);

    // Try to find a TFile for any candidate
    for (const p of Array.from(new Set(candidates))) {
      const af: any = plugin.app.vault.getAbstractFileByPath(p);
      if (af && (af as TFile).extension) {
        try {
          return plugin.app.vault.getResourcePath(af as TFile);
        } catch {}
      }
    }

    // Last-resort search by filename anywhere in the vault
    const found = plugin.app.vault.getFiles().find((f: TFile) => f.name.toLowerCase() === s.toLowerCase());
    if (found) {
      try { return plugin.app.vault.getResourcePath(found);} catch {}
    }

    // Fallback to app URL (may still 404 if not found)
    return `app://obsidian.md/vault/${encodeURI(s)}`;
  }

  // Helper functions
  function hasTag(p: any, tag: string) {
    const norm = String(tag).replace(/^#/, "").toLowerCase();

    const collected: any[] = [];
    if (Array.isArray(p?.file?.tags)) collected.push(...p.file.tags);
    if (Array.isArray(p?.tags)) collected.push(...p.tags);
    const fmTags = getField(p, ["tags", "Tags"], null);
    if (Array.isArray(fmTags)) collected.push(...fmTags);
    else if (typeof fmTags === "string") collected.push(...fmTags.split(/[\s,]+/));

    const cleaned = collected
      .map((t) => String(t))
      .map((s) => s.replace(/^#/, ""))
      .map((s) => s.replace(/^\/+/, ""))
      .map((s) => s.toLowerCase())
      .filter(Boolean);

    return cleaned.some((t: string) => t === norm || t.endsWith("/" + norm));
  }

  function getField(obj: any, keys: string[], dflt: any) {
    for (const k of keys) {
      if (obj && obj[k] !== undefined) return obj[k];
    }
    return dflt;
  }

  function toNumber(v: any) {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  function parseDomains(v: any) {
    if (!v) return [];
    if (Array.isArray(v))
      return v
        .map(String)
        .map((s) => s.trim())
        .filter(Boolean);
    return String(v)
      .split(/[|,;/]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function toPaths(v: any) {
    const arr = Array.isArray(v) ? v : [];
    return arr.map((x: any) => {
      if (typeof x === "string") return linkToPath(x);
      if (x?.path) return x.path;
      if (x?.file?.path) return x.file.path;
      return String(x);
    });
  }

  function linkToPath(s: string) {
    const m = String(s).match(/^\s*\[\[([^\]|]+)/);
    return m ? m[1] : String(s);
  }

  function basenameNoExt(p: string) {
    const b = (p || "").split("/").pop() || "";
    return b.replace(/\.[^/.]+$/, "");
  }

  function eqPath(a: string, b: string) {
    const na = linkToPath(a || "");
    const nb = linkToPath(b || "");
    return na.toLowerCase() === nb.toLowerCase();
  }

  function renderFileLink(
    parent: HTMLElement,
    path: string,
    name: string
  ) {
    const a = parent.createEl("a", {
      text: name || basenameNoExt(path || ""),
      href: "#",
    });
    a.addEventListener("click", (e) => {
      e.preventDefault();
      plugin.app.workspace.openLinkText(path, "", true);
    });
  }

}
