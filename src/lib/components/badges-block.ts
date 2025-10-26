// src/lib/components/badges-block.ts
import type DaggerheartPlugin from "../../main";
import { MarkdownPostProcessorContext, TFile } from "obsidian";
import React from "react";
import { createRoot, Root } from "react-dom/client";
import { BadgesView, type BadgeRow } from "./badges-view";
import { parseYamlSafe } from "../utils/yaml";
import { processTemplate, createTemplateContext } from "../utils/template";
import { registerLiveCodeBlock } from "../liveBlock";
const roots = new WeakMap<HTMLElement, Root>();

/**
 * YAML shape:
 * ```badges
 * items:
 *   - label: Race
 *     value: 'Half-Orc'
 *   - label: Level
 *     value: '{{ frontmatter.level }}'
 *   - label: Evasion
 *     value: '{{ frontmatter.evasion }}'
 *   - label: Armor
 *     value: '{{ frontmatter.armor }}'
 * ```
 */

type BadgeItem = {
  label?: string;
  value?: string | number | boolean | null;
};

type Doc = {
  items?: BadgeItem[];
  class?: string;
};

function parseDoc(src: string): { items: BadgeItem[]; klass?: string } {
  try {
    const d = (parseYamlSafe<Doc>(src)) ?? {};
    const items = Array.isArray(d.items) ? d.items : [];
    const klass = (d.class || '').trim().split(/\s+/).filter(Boolean)[0];
    return { items, klass };
  } catch (e) {
    console.error("[DH-UI] badges YAML error:", e);
    return { items: [], klass: undefined };
  }
}

export function registerBadgesBlock(plugin: DaggerheartPlugin) {
  registerLiveCodeBlock(plugin, "badges", (el: HTMLElement, src: string, ctx: MarkdownPostProcessorContext) => {

    const { items, klass } = parseDoc(src);
    if (!items.length) {
      el.createEl("pre", {
        text:
          "No 'items:' found in ```badges block.\nExample:\nitems:\n  - label: Level\n    value: '{{ frontmatter.level }}'",
      });
      return;
    }

    const app = plugin.app;
    // Apply optional user classes to the outer container
    el.addClass('dh-badges-block');
    if (klass) el.addClass(klass);
    const computeRows = (): BadgeRow[] => {
      const tctx = createTemplateContext(el, app, ctx);
      const renderValue = (raw: BadgeItem["value"]): string => {
        if (raw === null || raw === undefined) return "";
        if (typeof raw === "number" || typeof raw === "boolean") return String(raw);
        if (typeof raw === "string") {
          try { return processTemplate(raw, tctx); } catch { return raw; }
        }
        return "";
      };
      return items.map((it) => ({ label: String(it?.label ?? ""), value: renderValue(it?.value) }));
    };
    const render = () => {
      const rows = computeRows();
      let root = roots.get(el);
      if (!root) { root = createRoot(el); roots.set(el, root); }
      root.render(React.createElement(BadgesView, { items: rows }));
    };
    render();
  });
}
