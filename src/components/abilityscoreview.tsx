// src/lib/views/abilityscoreview.tsx
import React from "react";
import { Root } from "react-dom/client";
import { getOrCreateRoot } from "../utils/reactRoot";
import type { App, MarkdownPostProcessorContext } from "obsidian";

import { AbilityView } from "./traits";
import { buildCards } from "../core/abilities";

/**
 * Renders the Daggerheart traits/abilities:
 * - Fixed six stats (Agility, Strength, Finesse, Instinct, Presence, Knowledge)
 * - Only shows TOTAL (base + trait)
 * - Per-card gold toggle (persisted via localStorage)
 */
export class AbilityScoreView {
  private app: App;
  private roots = new WeakMap<HTMLElement, Root>();

  constructor(app: App) {
    this.app = app;
  }

  public render(src: string, el: HTMLElement, ctx: MarkdownPostProcessorContext, filePathOverride?: string): void {
    const filePath = (filePathOverride ?? ctx.sourcePath) || "unknown";
    const cards = buildCards(filePath, src);

    // Mount React into this codeblock’s container using shared helper
    const root = getOrCreateRoot(this.roots, el);
    root.render(<AbilityView data={cards} />);
  }
}
