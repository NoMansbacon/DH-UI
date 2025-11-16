// src/blocks/features.ts
import type DaggerheartPlugin from "../main";
import type { MarkdownPostProcessorContext, TFile, App } from "obsidian";
import { parseYamlSafe } from "../utils/yaml";
import { processTemplate, createTemplateContext } from "../utils/template";
import { registerLiveCodeBlock } from "../utils/liveBlock";

type FeatureItem = { label?: string; value?: string | number | boolean | null };
type FeatureDoc = {
  ancestry?: FeatureItem[];
  class?: FeatureItem[];
  subclass?: FeatureItem[];
  community?: FeatureItem[];
  layout?: "grid" | "masonry";
  cols?: number;
  class?: string;
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
  const renderValue = (raw: FeatureItem["value"]): string => {
    if (raw === null || raw === undefined) return "";
    if (typeof raw === "number" || typeof raw === "boolean") return String(raw);
    if (typeof raw === "string") {
      try { return processTemplate(raw, tctx); } catch { return raw; }
    }
    return "";
  };

  for (const section of sections) {
    const items = doc[section.key];
    if (!items || !Array.isArray(items) || items.length === 0) continue;

    const sectionEl = root.createDiv({ cls: `dh-features-section dh-features-${section.key}` });

    const heading = sectionEl.createDiv({ cls: "dh-features-heading", text: section.title });

    for (const item of items) {
      const label = String(item?.label ?? "");
      const value = renderValue(item?.value);

      const card = sectionEl.createDiv({ cls: "dh-feature-item" });

      if (label) {
        card.createDiv({ cls: "dh-feature-label", text: label });
      }

      if (value) {
        card.createDiv({ cls: "dh-feature-value", text: value });
      }
    }
  }
}

export function registerFeaturesBlock(plugin: DaggerheartPlugin) {
  registerLiveCodeBlock(plugin, "features", (el, src, ctx) => {
    renderFeaturesList(plugin, el, src, ctx);
  });
}
