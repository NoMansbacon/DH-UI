// src/lib/views/abilityscoreview.tsx
import React from "react";
import { Root } from "react-dom/client";
import { getOrCreateRoot } from "../utils/reactRoot";
import type { App, MarkdownPostProcessorContext } from "obsidian";

import { AbilityView } from "./traits";
import { buildCards } from "../core/abilities";
import { createTemplateContext, applyFrontmatterToTraitsYaml } from "../utils/template"

/**
 * Renders the Daggerheart trait cards:
 * - The six core traits (Agility, Strength, Finesse, Instinct, Presence, Knowledge)
 * - Shows TOTAL (base + trait bonuses)
 * - Per-card toggle (persisted via localStorage)
 */
export class AbilityScoreView {
  private app: App;
  private roots = new WeakMap<HTMLElement, Root>();

  constructor(app: App) {
    this.app = app;
  }

  public render(src: string, el: HTMLElement, ctx: MarkdownPostProcessorContext, filePathOverride?: string): void {
    const filePath = (filePathOverride ?? ctx.sourcePath) || "unknown";

// Resolve any {{ frontmatter.* }} references in the traits YAML before building cards
    let effectiveSrc = src;
    try {
      const tctx = createTemplateContext(el, this.app as App, ctx);
      effectiveSrc = applyFrontmatterToTraitsYaml(src, tctx.frontmatter);
    } catch {
      effectiveSrc = src;
    }

    const cards = buildCards(filePath, effectiveSrc);

    // Mount React into this codeblock’s container using shared helper
    const root = getOrCreateRoot(this.roots, el);
    root.render(<AbilityView data={cards} />);
  }
}
