/**
 * Equipment Picker block processor
 * Renders a UI for managing equipment (weapons, armor, etc.) in Inventory and Equipped lists
 * Discovers equipment via tags (equipment/weapon/armor) or frontmatter type
 */

import { MarkdownPostProcessorContext, MarkdownRenderChild, TFile } from "obsidian";
import type DaggerheartPlugin from "../main";
import { parseYamlSafe } from "../utils/yaml";

type EquipmentPickerBlockYaml = {
  folder?: string | string[];
  folders?: string | string[];
  enforce_tier?: boolean;
  // Optional per-block view override for the Add Equipment modal: 'card' | 'table'
  view?: "card" | "table";
  // Optional tag(s) to select equipment notes by Obsidian tag
  tag?: string | string[];
  tags?: string | string[];
  // Preferred CSS class hook for styling the outer equipmentpicker block
  styleClass?: string;
  // Legacy CSS class alias (still honored for backwards compatibility)
  class?: string;
};

export function registerEquipmentPickerBlock(plugin: DaggerheartPlugin) {
  plugin.registerMarkdownCodeBlockProcessor(
    "equipmentpicker",
    async (src: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
      try {
        await renderEquipmentPicker(el, plugin, ctx, src);
      } catch (e) {
        console.error("[DH-UI] Equipment picker render error:", e);
        el.setText("Error rendering equipment picker. See console for details.");
      }
    }
  );
}

export async function renderEquipmentPicker(
  el: HTMLElement,
  plugin: DaggerheartPlugin,
  ctx: MarkdownPostProcessorContext,
  src: string
) {
  const root = el.createDiv();

  let blockCfg: EquipmentPickerBlockYaml = {};
  try {
    blockCfg = (parseYamlSafe<EquipmentPickerBlockYaml>(src)) ?? {};
  } catch {
    blockCfg = {};
  }

  // Apply optional styleClass / class to the outer container
  const klass = String((blockCfg as any).styleClass ?? (blockCfg as any).class ?? '').trim().split(/\s+/).filter(Boolean)[0];
  el.addClass('dh-equipmentpicker-block');
  if (klass) el.addClass(klass);

  const dataviewPlugin = (plugin.app as any).plugins?.plugins?.dataview;
  if (!dataviewPlugin) {
    root.setText("Dataview plugin not found. Equipment picker requires Dataview.");
    return;
  }
  const dv = dataviewPlugin.api;

  const file = plugin.app.workspace.getActiveFile();
  if (!file) {
    root.setText("No active file.");
    return;
  }

  // Read character lists
  const cur = dv.page(file.path);
  const charTier = toNumber(getField(cur, ["tier", "Tier"], 0));

  // Per-block override or global default for tier enforcement
  let enforceTier = plugin.settings.equipmentPickerEnforceTier !== false;
  if (typeof blockCfg.enforce_tier === "boolean") {
    enforceTier = blockCfg.enforce_tier;
  }

  const state = {
    inventory: toPaths(getField(cur, ["inventory", "Inventory"], [])),
    equipped: toPaths(getField(cur, ["equipped", "Equipped"], [])),
  };

  const ui = {
    header: root.createEl("div", { cls: "dvjs-toolbar" }),
    tables: root.createEl("div", { cls: "dvjs-tables" }),
    modal: null as HTMLElement | null,
    currentFilter: "equipped" as "inventory" | "equipped",
  };

  // Ensure any open modal is cleaned up when this block is unloaded (e.g., switching notes)
  const child = new MarkdownRenderChild(el);
  child.onunload = () => {
    try {
      if (ui.modal) {
        ui.modal.remove();
        ui.modal = null;
      }
    } catch {}
  };
  ctx.addChild(child);
  // Toolbar filter buttons
  const filterDiv = ui.header.createEl("div", { cls: "dvjs-filter-buttons" });
  const btnEquipped = filterDiv.createEl("button", { text: "Equipped" });
  btnEquipped.classList.add("active");
  btnEquipped.addEventListener("click", () => {
    ui.currentFilter = "equipped";
    btnEquipped.classList.add("active");
    btnInventory.classList.remove("active");
    renderTables();
  });
  const btnInventory = filterDiv.createEl("button", { text: "Inventory" });
  btnInventory.addEventListener("click", () => {
    ui.currentFilter = "inventory";
    btnInventory.classList.add("active");
    btnEquipped.classList.remove("active");
    renderTables();
  });

  const addBtn = ui.header.createEl("button", { text: "Add equipment" });
  addBtn.addEventListener("click", () => openModal());

  // Discover equipment notes, optionally scoped by per-block folders or settings.equipmentFolder
  const discoverEquipment = () => {
    // Block-level folder(s) take precedence when provided
    const folderValue = (blockCfg.folders ?? blockCfg.folder) as any;
    let folders: string[] = [];
    if (Array.isArray(folderValue)) {
      folders = folderValue.map((v) => String(v).trim()).filter(Boolean);
    } else if (typeof folderValue === "string" && folderValue.trim()) {
      folders = [folderValue.trim()];
    }

    const normalizePrefix = (raw: string) => {
      const folder = raw.replace(/\\/g, "/");
      const prefix = folder.endsWith("/") ? folder : folder + "/";
      return prefix.toLowerCase();
    };
    const normalizeTag = (raw: string) => String(raw).replace(/^#/, "").toLowerCase();

    // Block-level tags or plugin default tag
    const tagValue = (blockCfg.tags ?? blockCfg.tag) as any;
    let tags: string[] = [];
    if (Array.isArray(tagValue)) {
      tags = tagValue.map((v) => normalizeTag(String(v))).filter(Boolean);
    } else if (typeof tagValue === "string" && tagValue.trim()) {
      tags = [normalizeTag(tagValue)];
    }
    if (!tags.length && plugin.settings.equipmentTag) {
      tags = [normalizeTag(plugin.settings.equipmentTag)];
    }

    const hasAnyTag = (p: any): boolean => {
      if (!tags.length) return true;
      const fmTags = getField(p, ["tags", "Tags"], null);
      const collected: string[] = [];
      if (Array.isArray(p?.file?.tags)) collected.push(...p.file.tags.map(String));
      if (Array.isArray(p?.tags)) collected.push(...p.tags.map(String));
      if (Array.isArray(fmTags)) collected.push(...fmTags.map(String));
      else if (typeof fmTags === "string") collected.push(...fmTags.split(/[\s,]+/));
      const cleaned = collected
        .map((s) => s.replace(/^#/, ""))
        .map((s) => s.replace(/^\/+/, ""))
        .map((s) => s.toLowerCase())
        .filter(Boolean);
      return tags.some((t) => cleaned.some((v) => v === t || v.endsWith("/" + t)));
    };

    if (folders.length > 0) {
      const prefixes = folders.map(normalizePrefix);
      return dv
        .pages()
        .where((p: any) => {
          const path = String(p?.file?.path || "").toLowerCase();
          if (!path) return false;
          if (!prefixes.some((pre) => path.startsWith(pre))) return false;
          return isEquipment(p) && hasAnyTag(p);
        });
    }

    // Fallback to plugin setting when no per-block folders provided
    const raw = plugin.settings.equipmentFolder?.trim();
    if (raw && raw.length > 0) {
      const prefixLC = normalizePrefix(raw);
      return dv
        .pages()
        .where((p: any) => typeof p?.file?.path === 'string'
          && p.file.path.toLowerCase().startsWith(prefixLC)
          && isEquipment(p)
          && hasAnyTag(p));
    }

    // If explicit tags (block or setting) are configured, search whole vault by those tags plus equipment heuristics
    if (tags.length > 0) {
      return dv.pages().where((p: any) => isEquipment(p) && hasAnyTag(p));
    }

    // Fallback: vault-wide equipment detection via fields/tags
    return dv.pages().where((p: any) => isEquipment(p));
  };
  const allEq = discoverEquipment().array();

  renderTables();

  function getVisibleColumns() {
    // Base superset of columns, used to derive per-section subsets
    return [
      "Name",
      "Category",
      "Type",
      "Damage",
      "Thresholds",
      "Base",
      "Tier",
      "Trait",
      "Range",
      "Burden",
      "Feature",
    ] as const;
  }

  type EqSectionKind = "weapon" | "armor" | "other";

  function getVisibleColumnsFor(kind: EqSectionKind) {
    if (kind === "weapon") {
      // Weapons: show just name + the combat-relevant fields
      return [
        "Name",
        "Type",
        "Damage",
        "Trait",
        "Range",
        "Burden",
        "Feature",
      ] as const;
    }
    if (kind === "armor") {
      // Armor: show just name + tier, base score, thresholds, and feature
      return [
        "Name",
        "Tier",
        "Base",
        "Thresholds",
        "Feature",
      ] as const;
    }
    // Other: keep full superset
    return Array.from(getVisibleColumns());
  }

  function renderTables() {
    ui.tables.empty();
    const listName: "inventory" | "equipped" = ui.currentFilter === "inventory" ? "inventory" : "equipped";
    const list = listName === "inventory" ? state.inventory : state.equipped;
    const baseTitle = listName === "inventory" ? "Inventory" : "Equipped";

    const rows = list.map((path) => pathToRow(path));
    const weapons = rows.filter((r) => r.category === "Weapon");
    const armor = rows.filter((r) => r.category === "Armor");
    const other = rows.filter((r) => r.category !== "Weapon" && r.category !== "Armor");

    if (weapons.length) ui.tables.appendChild(buildSectionFromRows(listName, "weapon", `${baseTitle} – Weapons`, weapons));
    if (armor.length) ui.tables.appendChild(buildSectionFromRows(listName, "armor", `${baseTitle} – Armor`, armor));
    if (other.length) ui.tables.appendChild(buildSectionFromRows(listName, "other", `${baseTitle} – Other`, other));

    // If there are no items at all, still show separate empty tables for Weapons and Armor
    if (!weapons.length && !armor.length && !other.length) {
      ui.tables.appendChild(buildSectionFromRows(listName, "weapon", `${baseTitle} – Weapons`, []));
      ui.tables.appendChild(buildSectionFromRows(listName, "armor", `${baseTitle} – Armor`, []));
    }
  }

  function buildSectionFromRows(listName: "inventory" | "equipped", kind: EqSectionKind, title: string, rows: any[]) {
    const section = createDiv({ cls: "dvjs-section" });
    section.createEl("h3", { text: title });

    const visibleCols = getVisibleColumnsFor(kind);

    const table = section.createEl("table", { cls: "dvjs-table" });
    const thead = table.createEl("thead");
    const trh = thead.createEl("tr");
    visibleCols.forEach((c) => trh.createEl("th", { text: c }));
    trh.createEl("th", { text: "Actions" });

    const tbody = table.createEl("tbody");

    if (rows.length === 0) {
      const tr = tbody.createEl("tr");
      const td = tr.createEl("td", {
        text: "Empty",
        attr: { colspan: String(visibleCols.length + 1) },
      });
      (td as HTMLElement).style.opacity = "0.7";
    } else {
      rows.forEach((r) => {
        const tr = tbody.createEl("tr");
        visibleCols.forEach((col) => {
          const td = tr.createEl("td");
          if (col === "Name") {
            renderFileLink(td, r.path, r.name);
          } else if (col === "Category") {
            td.innerText = r.category || "";
          } else if (col === "Type") {
            td.innerText = r.type || "";
          } else if (col === "Damage") {
            td.innerText = r.damage || "";
          } else if (col === "Thresholds") {
            td.innerText = r.thresholds || "";
          } else if (col === "Base") {
            td.innerText = r.base || "";
          } else if (col === "Tier") {
            td.innerText = r.tier || "";
          } else if (col === "Trait") {
            td.innerText = r.trait || "";
          } else if (col === "Range") {
            td.innerText = r.range || "";
          } else if (col === "Burden") {
            td.innerText = r.burden || "";
          } else if (col === "Feature") {
            td.innerText = r.feature || "";
          }
        });

        const tdActions = tr.createEl("td");
        const otherListName: "inventory" | "equipped" = listName === "equipped" ? "inventory" : "equipped";
        const btnSwitch = tdActions.createEl("button", {
          text: `→ ${otherListName}`,
        });
        btnSwitch.addEventListener("click", async () => {
          await removeFromList(listName, r.path);
          await addToList(otherListName, r.path);
        });

        const btnRemove = tdActions.createEl("button", { text: "Remove" });
        (btnRemove as HTMLElement).style.color = "var(--text-error)";
        btnRemove.addEventListener("click", async () => {
          await removeFromList(listName, r.path);
        });
      });
    }

    return section;
  }

  function pathToRow(path: string) {
    let p = dv.page(path);
    if (!p) {
      const base = basenameNoExt(path).toLowerCase();
      p = allEq.find((x: any) => basenameNoExt(x.file?.path || "").toLowerCase() === base);
    }
    const name = p?.file?.name || basenameNoExt(path);
    const category = detectCategory(p) || normalizeCategory(getField(p, ["category", "Category"], ""));
    const type = String(getField(p, ["type", "Type"], ""));
    const damage = String(getField(p, ["damage", "Damage"], ""));
    const thresholds = String(getField(p, ["thresholds", "Thresholds"], ""));
    const base = String(getField(p, ["base_score", "base", "Base", "Base_Score"], ""));
    const tier = String(getField(p, ["tier", "Tier"], ""));
    const trait = String(getField(p, ["trait", "Trait"], ""));
    const range = String(getField(p, ["range", "Range"], ""));
    const burden = String(getField(p, ["burden", "Burden"], ""));
    const feature = String(getField(p, ["feature", "Feature"], ""));
    return { path: p?.file?.path || path, name, category, type, damage, thresholds, base, tier, trait, range, burden, feature };
  }

  function closeModal() {
    if (ui.modal) {
      ui.modal.remove();
      ui.modal = null;
    }
  }

  function openModal() {
    closeModal();
    ui.modal = document.body.createDiv({ cls: "dvjs-modal-backdrop" });
    ui.modal.addEventListener("click", (ev) => {
      if (ev.target === ui.modal) {
        closeModal();
      }
    });
    const modal = ui.modal.createDiv({ cls: "dvjs-modal" });

    const header = modal.createDiv({ cls: "dvjs-modal-header" });
    header.createEl("h3", { text: "Add Equipment" });
    const closeBtn = header.createEl("button", { text: "✕", cls: "dvjs-close" });
    closeBtn.addEventListener("click", () => closeModal());
    // Ensure card styles present (shared with Domain Picker look-and-feel)
    ensureCardStyles();

    const filters = modal.createDiv({ cls: "dvjs-filters" });
 
     // Category filter
     let selCat: string | null = null;
     const catWrap = filters.createDiv({ cls: "filter" });
     catWrap.createEl("label", { text: "Category" });
     const catSel = catWrap.createEl("select", { cls: "dropdown" });
     const categories = getCategoryOptions();
     catSel.appendChild(new Option("Any", ""));
     categories.forEach((c) => catSel.appendChild(new Option(c, c)));
     catSel.addEventListener("change", () => { selCat = catSel.value || null; renderCards(); });
 
     // Type filter (Primary / Secondary)
     let selTypeKind: string | null = null;
     const typeWrap = filters.createDiv({ cls: "filter" });
     typeWrap.createEl("label", { text: "Type" });
     const typeSel = typeWrap.createEl("select", { cls: "dropdown" });
     typeSel.appendChild(new Option("Any", ""));
     typeSel.appendChild(new Option("Primary", "primary"));
     typeSel.appendChild(new Option("Secondary", "secondary"));
     typeSel.addEventListener("change", () => {
       selTypeKind = typeSel.value || null;
       renderCards();
     });
 
     // Tier filter
     let selTier: number | null = null;
     const tierWrap = filters.createDiv({ cls: "filter" });
     tierWrap.createEl("label", { text: "Tier" });
     const tierSel = tierWrap.createEl("select", { cls: "dropdown" });
     tierSel.appendChild(new Option("Any", ""));
     for (let i = 1; i <= 4; i++) tierSel.appendChild(new Option(String(i), String(i)));
     tierSel.addEventListener("change", () => {
       selTier = tierSel.value ? Number(tierSel.value) : null;
       renderCards();
     });
 
     // Search filter
     let q = "";
    const searchWrap = filters.createDiv({ cls: "filter" });
    searchWrap.createEl("label", { text: "Search" });
    const search = searchWrap.createEl("input", { type: "text" });
    search.placeholder = "Name or property";
    search.addEventListener("input", () => { q = search.value.toLowerCase(); renderCards(); });

    const listRoot = modal.createDiv({ cls: "dvjs-modal-list" });

    function renderCards() {
      listRoot.empty();
      const base = allEq;

      const curNow = dv.page(file.path);
      const charTierNow = enforceTier ? toNumber(getField(curNow, ["tier", "Tier"], charTier)) : 0;

      const candidates = base
         .filter((c: any) => {
           const cat = detectCategory(c) || normalizeCategory(getField(c, ["category", "Category"], ""));
           const name = String(c.file?.name || "");
           const props = toList(getField(c, ["properties", "Properties", "tags", "Tags"], []));
           const cTierNum = toNumber(getField(c, ["tier", "Tier"], 0));
           const cTypeKind = String(getField(c, ["type", "Type"], "")).toLowerCase();
 
           const catOK = selCat ? cat === selCat : true;
           const typeOK = selTypeKind ? cTypeKind === selTypeKind : true;
           const qOK = q
             ? name.toLowerCase().includes(q) || props.some((p: string) => p.toLowerCase().includes(q))
             : true;
           const tierOK = charTierNow > 0 ? cTierNum <= charTierNow : true;
           const tierFilterOK = selTier != null ? cTierNum === selTier : true;
           return catOK && typeOK && qOK && tierOK && tierFilterOK;
         })
        .sort((a: any, b: any) => (a.file?.name || "").localeCompare(b.file?.name || ""));

      if (candidates.length === 0) {
        const empty = listRoot.createDiv({ cls: "dvjs-empty", text: "No matching equipment" });
        (empty as HTMLElement).style.opacity = "0.7";
        return;
      }

      // Determine view: block-level override; default to 'card'
      let view: "card" | "table" = "card";
      if (blockCfg.view === "card" || blockCfg.view === "table") {
        view = blockCfg.view;
      }

      if (view === "table") {
        const visibleCols = getVisibleColumns();
        const table = listRoot.createEl("table", { cls: "dvjs-table" });
        const thead = table.createEl("thead");
        const trh = thead.createEl("tr");
        visibleCols.forEach((h) => {
          const th = trh.createEl("th", { text: h });
          if (h === "Feature") th.addClass("dvjs-col-feature");
        });
        const thActions = trh.createEl("th", { text: "Actions" });
        thActions.addClass("dvjs-col-actions");
        const tbody = table.createEl("tbody");

        candidates.forEach((c: any) => {
          const cPath = c.file?.path;
        const cName = c.file?.name || basenameNoExt(cPath || "");
        const cCat = detectCategory(c) || normalizeCategory(getField(c, ["category", "Category"], ""));
          const cType = String(getField(c, ["type", "Type"], ""));
          const cDmg = String(getField(c, ["damage", "Damage"], ""));
          const cThr = String(getField(c, ["thresholds", "Thresholds"], ""));
          const cBase = String(getField(c, ["base_score", "base", "Base", "Base_Score"], ""));
          const cTier = String(getField(c, ["tier", "Tier"], ""));
          const cTrait = String(getField(c, ["trait", "Trait"], ""));
          const cRange = String(getField(c, ["range", "Range"], ""));
          const cBurden = String(getField(c, ["burden", "Burden"], ""));
          const cFeature = String(getField(c, ["feature", "Feature"], ""));

          const tr = tbody.createEl("tr");
          visibleCols.forEach((col) => {
            const td = tr.createEl("td");
            if (col === "Feature") td.addClass("dvjs-col-feature");

            if (col === "Name") {
              renderFileLink(td, cPath, cName);
            } else if (col === "Category") {
              td.innerText = cCat || "";
            } else if (col === "Type") {
              td.innerText = cType || "";
            } else if (col === "Damage") {
              td.innerText = cDmg || "";
            } else if (col === "Thresholds") {
              td.innerText = cThr || "";
            } else if (col === "Base") {
              td.innerText = cBase || "";
            } else if (col === "Tier") {
              td.innerText = cTier || "";
            } else if (col === "Trait") {
              td.innerText = cTrait || "";
            } else if (col === "Range") {
              td.innerText = cRange || "";
            } else if (col === "Burden") {
              td.innerText = cBurden || "";
            } else if (col === "Feature") {
              td.innerText = cFeature || "";
            }
          });

          const tdActions = tr.createEl("td");
          tdActions.addClass("dvjs-col-actions");
          const inInv = added("inventory", cPath);
          const inEqp = added("equipped", cPath);
          const btnInv = tdActions.createEl("button", { text: "Add to Inventory" });
          const btnEqp = tdActions.createEl("button", { text: "Add to Equipped" });
          btnInv.disabled = inInv;
          btnEqp.disabled = inEqp;
          btnInv.addEventListener("click", async () => { await addToList("inventory", cPath); renderCards(); });
          btnEqp.addEventListener("click", async () => { await addToList("equipped", cPath); renderCards(); });
        });

        return;
      }

      const grid = listRoot.createDiv({ cls: "dvjs-card-grid" });
      candidates.forEach((c: any) => {
        const cPath = c.file?.path;
        const cName = c.file?.name || basenameNoExt(cPath || "");
        const cCat = detectCategory(c) || normalizeCategory(getField(c, ["category", "Category"], ""));
        const cType = String(getField(c, ["type", "Type"], ""));
        const cDmg = String(getField(c, ["damage", "Damage"], ""));
        const cThr = String(getField(c, ["thresholds", "Thresholds"], ""));
        const cBase = String(getField(c, ["base_score", "base", "Base", "Base_Score"], ""));
        const cTier = String(getField(c, ["tier", "Tier"], ""));
        const cTrait = String(getField(c, ["trait", "Trait"], ""));
        const cRange = String(getField(c, ["range", "Range"], ""));
        const cBurden = String(getField(c, ["burden", "Burden"], ""));
        const cFeature = String(getField(c, ["feature", "Feature"], ""));
        const cArt = String(getField(c, ["art", "Art"], ""));

        const card = grid.createDiv({ cls: 'dvjs-card' });
        const artSrc = resolveArtSrc(plugin, c, cArt);
        if (artSrc) {
          const img = card.createEl('img', { attr: { src: artSrc, alt: cName } });
          const artHeight = plugin.settings.equipmentCardArtHeight || 160;
          img.style.width = '100%';
          img.style.height = `${artHeight}px`;
          img.style.objectFit = 'cover';
        }
        const body = card.createDiv({ cls: 'card-body' });
        const title = body.createEl('div', { cls: 'title' });
        renderFileLink(title, cPath, cName);
        const metaBits = [cCat || '—', cType || '—'].filter(Boolean);
        body.createEl('div', { cls: 'meta', text: metaBits.join(' • ') });

        const lines: string[] = [];
        if (cDmg) lines.push(`Damage: ${cDmg}`);
        if (cThr || cBase) lines.push(`Thresholds/Base: ${(cThr || '—')} / ${(cBase || '—')}`);
        if (cTier) lines.push(`Tier: ${cTier}`);
        if (cTrait || cRange || cBurden) lines.push(`Props: ${[cTrait && `trait ${cTrait}`, cRange && `range ${cRange}`, cBurden && cBurden].filter(Boolean).join(', ')}`);
        if (lines.length) body.createEl('div', { cls: 'feature', text: lines.join('  |  ') });
        if (cFeature) body.createEl('div', { cls: 'feature', text: cFeature });

        const actions = body.createDiv({ cls: 'actions' });
        const inInv = added('inventory', cPath);
        const inEqp = added('equipped', cPath);
        const btnInv = actions.createEl('button', { text: 'Add to Inventory' });
        const btnEqp = actions.createEl('button', { text: 'Add to Equipped' });
        btnInv.disabled = inInv;
        btnEqp.disabled = inEqp;
        btnInv.addEventListener('click', async () => { await addToList('inventory', cPath); renderCards(); });
        btnEqp.addEventListener('click', async () => { await addToList('equipped', cPath); renderCards(); });
      });
    }

    renderCards();
  }

  function added(listName: string, path: string) {
    const arr = state[listName as "inventory" | "equipped"] || [];
    return arr.some((p) => eqPath(p, path));
  }

  async function addToList(listName: "inventory" | "equipped", path: string) {
    const link = `[[${path}]]`;
    const other = listName === "inventory" ? "equipped" : "inventory";
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
    state[other as "inventory" | "equipped"] = state[other as "inventory" | "equipped"].filter((p) => !eqPath(p, path));
    if (!state[listName].some((p) => eqPath(p, path))) {
      state[listName].push(path);
    }
    renderTables();
  }

  async function removeFromList(listName: string, path: string) {
    await plugin.app.fileManager.processFrontMatter(file, (fm) => {
      if (Array.isArray(fm[listName])) {
        fm[listName] = fm[listName].filter((link: string) => !eqPath(linkToPath(link), path));
      }
    });
    state[listName as "inventory" | "equipped"] = state[listName as "inventory" | "equipped"].filter((p) => !eqPath(p, path));
    renderTables();
  }

  // Helpers
  function isEquipment(p: any) {
    const type = String(getField(p, ["category", "Category", "type", "Type"], "")).toLowerCase();
    if (/(^|\b)(weapon|armor|equipment)(\b|$)/i.test(type)) return true;
    if (hasTag(p, "equipment") || hasTag(p, "weapon") || hasTag(p, "armor")) return true;
    // Also consider notes with obvious fields from your schema
    const hasObvious = !!(p?.damage || p?.Damage || p?.thresholds || p?.Thresholds || p?.base_score || p?.Base || p?.tier || p?.Tier);
    return hasObvious;
  }

  function getCategoryOptions(): string[] {
    const cats = new Set<string>();
    for (const c of allEq) {
      const v = normalizeCategory(getField(c, ["category", "Category"], ""));
      if (v) cats.add(v);
      // Also respect tags: notes tagged #weapon or #armor should show up as categories
      const tagCat = detectCategory(c);
      if (tagCat) cats.add(tagCat);
    }
    // Ensure common ones exist
    ["Weapon", "Armor"].forEach((x) => cats.add(x));
    return Array.from(cats).sort();
  }

  // Slot information is still read from frontmatter when present, but we no longer
  // expose a dedicated Slot filter in the Add Equipment modal to keep the UI simple.

  function normalizeCategory(v: any): string {
    const s = String(v || "").trim();
    if (!s) return "";
    if (/weapon/i.test(s)) return "Weapon";
    if (/armor/i.test(s)) return "Armor";
    // Treat anything else as a free-form category (e.g., "Shield"), but do not
    // collapse type/slot values like "primary" / "secondary" into categories.
    return s;
  }

  function detectCategory(p: any): string {
    if (hasTag(p, 'weapon')) return 'Weapon';
    if (hasTag(p, 'armor')) return 'Armor';
    return '';
  }

  function toList(v: any): string[] {
    if (!v) return [];
    if (Array.isArray(v)) return v.map(String).map((s) => s.trim()).filter(Boolean);
    return String(v)
      .split(/[|,;/]/)
      .map((s) => s.trim())
      .filter(Boolean);
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

  function renderFileLink(parent: HTMLElement, path: string, name: string) {
    const a = parent.createEl("a", { text: name || basenameNoExt(path || ""), href: "#" });
    a.addEventListener("click", (e) => {
      e.preventDefault();
      plugin.app.workspace.openLinkText(path, "", true);
      // If the equipment picker modal is open, close it after navigation
      try { closeModal(); } catch {}
    });
  }

  function ensureCardStyles() {
    if (document.getElementById("dhui-domain-card-styles")) return; // reuse if already injected by Domain Picker
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

  function resolveArtSrc(plugin: DaggerheartPlugin, c: any, artVal: any): string | null {
    if (!artVal) return null;
    let s = linkToPath(String(artVal)).trim();
    if (!s) return null;
    if (/^(app|https?):/i.test(s)) return s;
    s = s.replace(/^\/+/, "");
    const candidates: string[] = [];
    candidates.push(s);
    const noteDir = ((c?.file?.path || "").split("/").slice(0, -1).join("/")) || "";
    if (noteDir) candidates.push(`${noteDir}/${s}`);
    for (const p of Array.from(new Set(candidates))) {
      const af: any = plugin.app.vault.getAbstractFileByPath(p);
      if (af && (af as TFile).extension) {
        try { return plugin.app.vault.getResourcePath(af as TFile); } catch {}
      }
    }
    const found = plugin.app.vault.getFiles().find((f: TFile) => f.name.toLowerCase() === s.toLowerCase());
    if (found) { try { return plugin.app.vault.getResourcePath(found);} catch {} }
    return `app://obsidian.md/vault/${encodeURI(s)}`;
  }
}
