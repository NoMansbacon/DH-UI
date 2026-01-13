// src/blocks/features.ts
import type DaggerheartPlugin from "../main";
import { MarkdownRenderer, type MarkdownPostProcessorContext, type TFile, type App } from "obsidian";
import { parseYamlSafe } from "../utils/yaml";
import { processTemplate, createTemplateContext } from "../utils/template";
import { registerLiveCodeBlock } from "../utils/liveBlock";

type FeatureItem = {
  label?: string;
  value?: string | number | boolean | null;
  // Optional metadata for multiclass / tier tracking
  // e.g. from: "Warrior", tier: "Foundation" or "Specialization" / "Mastery"
  from?: string;
  tier?: string;
};

/**
 * YAML shape for the ```features block.
 *
 * Notes on the confusing "class" key:
 * - At the top level, most users write:
 *     class: [ { label, value, ... }, ... ]
 *   to describe class features.
 * - For CSS, some early drafts also supported:
 *     class: "my-css-class"
 *
 * To stay backwards compatible, we allow `class` to be either a list of
 * FeatureItems (class features) or a string (CSS class token). At runtime
 * we distinguish by checking Array.isArray / typeof === "string".
 */
type FeatureDoc = {
  ancestry?: FeatureItem[];
  class?: FeatureItem[] | string;
  subclass?: FeatureItem[];
  community?: FeatureItem[];
  layout?: "grid" | "masonry";
  cols?: number;
  // Optional CSS class alias – in addition to accepting a string `class:`
  // we also honor `className:` for clarity.
  className?: string;
};

function getFM(app: App, ctx: MarkdownPostProcessorContext): Record<string, any> {
  try {
    const file = app.vault.getFileByPath(ctx.sourcePath) as TFile | null;
    return (file ? (app.metadataCache.getFileCache(file)?.frontmatter ?? {}) : {}) as Record<string, any>;
  } catch {
    return {} as Record<string, any>;
  }
}

function parseDoc(src: string): FeatureDoc {
  try {
    const parsed = parseYamlSafe<FeatureDoc>(src);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (e) {
    console.error("[DH-UI] features YAML error:", e);
    return {};
  }
}

function renderFeaturesList(
  plugin: DaggerheartPlugin,
  el: HTMLElement,
  src: string,
  ctx: MarkdownPostProcessorContext
) {
  const app = plugin.app;
  const fm = getFM(app, ctx);
  const doc = parseDoc(src);

  const sections = [
    { key: "ancestry" as const, title: "Ancestry", color: "#4caf50" },
    { key: "class" as const, title: "Class", color: "#2196f3" },
    { key: "subclass" as const, title: "Subclass", color: "#ff9800" },
    { key: "community" as const, title: "Community", color: "#9c27b0" }
  ];

  const hasAnyItems = sections.some(s => doc[s.key] && Array.isArray(doc[s.key]) && doc[s.key]!.length > 0);

  if (!hasAnyItems) {
    el.createEl("pre", {
      text: "No items found in ```features block.\nExample:\nancestry:\n  - label: Dread Visage\n    value: You have advantage on rolls to intimidate hostile creatures\nclass:\n  - label: Action Surge\n    value: Take an additional action on your turn",
    });
    return;
  }

  const root = el;
  root.empty();
  root.addClass("dh-features-list");
  // Default: standalone is a list. Opt-in to grid via layout: grid or class: grid
  const layoutStr = String(((doc as any).layout ?? '')).toLowerCase();
  // Accept CSS class overrides: `class: "grid"` or `className: "grid"`
  const rawCls = typeof (doc as any).class === 'string' ? (doc as any).class
               : typeof (doc as any).className === 'string' ? (doc as any).className
               : '';
  if (rawCls) {
    for (const c of rawCls.split(/\s+/).filter(Boolean)) root.addClass(c);
  }
  const isGrid = layoutStr === 'grid' || (/\bgrid\b/i.test(rawCls));
  if (layoutStr === 'masonry') root.addClass('dh-features--masonry');
  else if (isGrid) root.addClass('dh-features--grid');

  const colsNum = Number((doc as any).cols);
  if (Number.isFinite(colsNum) && colsNum > 0) root.style.setProperty('--dh-features-cols', String(Math.floor(colsNum)));

  const tctx = createTemplateContext(el, app, ctx);
  const isGroupedSection = (key: string) =>
    key === "ancestry" || key === "class" || key === "subclass" || key === "community";
  const renderValue = (raw: FeatureItem["value"]): string => {
    if (raw === null || raw === undefined) return "";
    if (typeof raw === "number" || typeof raw === "boolean") return String(raw);
    if (typeof raw === "string") {
      try { return processTemplate(raw, tctx); } catch { return raw; }
    }
    return "";
  };

  // Helper to render a single feature card into the given container
  const renderItemCard = (container: HTMLElement, item: FeatureItem, sectionKey: string) => {
    const label = String(item?.label ?? "");
    const value = renderValue(item?.value);

    // Optional metadata: where this feature comes from & which tier/slot
    const fromRaw = (item as any).from ?? (item as any).source ?? (item as any).origin;
    const tierRaw = (item as any).tier ?? (item as any).slot ?? (item as any).kind;
    const from = fromRaw ? renderValue(String(fromRaw)) : "";
    const tier = tierRaw ? renderValue(String(tierRaw)) : "";

    const card = container.createDiv({ cls: "dh-feature-item" });

    if (label) {
      card.createDiv({ cls: "dh-feature-label", text: label });
    }

    // For grouped sections (ancestry/class/subclass) we hide the faint meta
    // line under each feature; the grouping and headings provide that
    // context. Keep it for community or any future ungrouped sections.
    if (!isGroupedSection(sectionKey) && (from || tier)) {
      const meta = card.createDiv({ cls: "dh-feature-meta" });
      const bits: string[] = [];
      if (from) bits.push(from);
      if (tier) bits.push(tier);
      // Use a middle dot separator, e.g. "Stalwart · Foundation"
      meta.setText(bits.join(" \u00b7 "));
    }

    if (value) {
      // Render Markdown so lists, bold, etc. work inside feature values
      const valueEl = card.createDiv({ cls: "dh-feature-value" });
      try {
        MarkdownRenderer.render(app as any, value, valueEl, ctx.sourcePath, plugin);
      } catch {
        // Fallback: plain text if markdown render fails for some reason
        valueEl.setText(value);
      }
    }
  };

  for (const section of sections) {
    const items = doc[section.key];
    if (!items || !Array.isArray(items) || items.length === 0) continue;

    const sectionEl = root.createDiv({ cls: `dh-features-section dh-features-${section.key}` });

    // Only render the top-level section heading for ungrouped sections
    const showSectionHeading = !isGroupedSection(section.key);
    const heading = showSectionHeading
      ? sectionEl.createDiv({ cls: "dh-features-heading", text: section.title })
      : null;

    // Ancestry, Class, and Community: group by source name (from/origin),
    // single card per source with stacked features inside.
    if (section.key === "ancestry" || section.key === "class" || section.key === "community") {
      const bySource: Record<string, FeatureItem[]> = {};
      const sourceOrder: string[] = [];

      const getSourceName = (it: FeatureItem): string => {
        const raw = (it as any).from ?? (it as any).source ?? (it as any).origin;
        const fallback = section.title;
        const s = String(raw ?? fallback).trim();
        return s || fallback;
      };

      for (const it of items as FeatureItem[]) {
        const name = getSourceName(it);
        if (!bySource[name]) {
          bySource[name] = [];
          sourceOrder.push(name);
        }
        bySource[name].push(it);
      }

      for (const name of sourceOrder) {
        // e.g., "Ancestry - Drakona" or "Class - Guardian"
        sectionEl.createDiv({
          cls: "dh-features-lineage-heading",
          text: `${section.title} - ${name}`,
        });
        const group = sectionEl.createDiv({ cls: "dh-features-lineage-group" });
        for (const it of bySource[name]) {
          renderItemCard(group, it, section.key);
        }
      }

    // Subclass: group by subclass name, then by tier
    } else if (section.key === "subclass") {
      type TierKey = "foundation" | "specialization" | "mastery" | "other";

      const tierFor = (it: FeatureItem): TierKey => {
        const rawAny = (it as any).tier ?? (it as any).slot ?? (it as any).kind;
        if (!rawAny) return "other";
        const s = String(rawAny).toLowerCase();
        if (s.includes("foundation")) return "foundation";
        if (s.includes("special"))    return "specialization";
        if (s.includes("master"))     return "mastery";
        return "other";
      };

      // Map: subclass name -> { tier -> items[] }
      type TierBuckets = { [K in TierKey]: FeatureItem[] };
      const bySubclass: Record<string, TierBuckets> = {};
      const subclassOrder: string[] = [];

      const getSubclassName = (it: FeatureItem): string => {
        const raw = (it as any).from ?? (it as any).source ?? (it as any).origin;
        const s = String(raw ?? "Subclass").trim();
        return s || "Subclass";
      };

      for (const it of items as FeatureItem[]) {
        const subName = getSubclassName(it);
        if (!bySubclass[subName]) {
          bySubclass[subName] = {
            foundation: [],
            specialization: [],
            mastery: [],
            other: [],
          };
          subclassOrder.push(subName);
        }
        const bucketKey = tierFor(it);
        bySubclass[subName][bucketKey].push(it);
      }

      const order: Array<{ key: TierKey; label: string }> = [
        { key: "foundation",     label: "Foundation" },
        { key: "specialization", label: "Specialization" },
        { key: "mastery",        label: "Mastery" },
        { key: "other",          label: "Other" },
      ];

      for (const subName of subclassOrder) {
        const buckets = bySubclass[subName];
        // Subclass heading (e.g., "Subclass - Stalwart")
        sectionEl.createDiv({
          cls: "dh-features-subclass-heading",
          text: `${section.title} - ${subName}`,
        });

        for (const g of order) {
          const bucket = buckets[g.key];
          if (!bucket.length) continue;
          const group = sectionEl.createDiv({ cls: "dh-features-subtier-group" });
          group.createDiv({ cls: "dh-features-subtier-heading", text: g.label });
          for (const it of bucket) {
            renderItemCard(group, it, section.key);
          }
        }
      }
    } else {
      // Default: just render in order
      for (const item of items as FeatureItem[]) {
        renderItemCard(sectionEl, item, section.key);
      }
    }
  }
}

export function registerFeaturesBlock(plugin: DaggerheartPlugin) {
  registerLiveCodeBlock(plugin, "features", (el, src, ctx) => {
    renderFeaturesList(plugin, el, src, ctx);
  });
}
