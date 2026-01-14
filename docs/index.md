---
# VitePress home layout
layout: home

hero:
  name: "Daggerheart Tooltips (DH-UI)"
  text: "An Obsidian Plugin for Daggerheart"
  tagline: Build rich markdown-driven character sheets with live UI blocks in Obsidian
  actions:
    - theme: brand
      text: Get Started
      link: /USAGE
    - theme: alt
      text: Code Block Reference
      link: /blocks

features:
  - title: Interactive character sheets
    details: Render traits, vitals, badges, consumables, and more as live components.
  - title: Resource tracking
    details: Track HP, Stress, Armor, Hope, and consumables with persistent state across notes.
  - title: Rest & level up workflow
    details: Use a single `rest` block for rests, full heals, resets, and a guided Level Up modal.
  - title: Damage & thresholds
    details: Inline damage calculators that update trackers and highlight major/severe thresholds.
  - title: Domain & equipment pickers
    details: Manage domain cards and equipment between vault/loadout and inventory/equipped.
  - title: Template-powered YAML
    details: Use `{{ frontmatter.* }}` and helpers to compute values from character data.
---

1. Copy this plugin folder into your vault under `.obsidian/plugins/daggerheart-tooltips` (or install it using your preferred Obsidian community plugin workflow).
2. In the plugin folder, run:

   ```bash
   npm install
   npm run dev
   ```

3. In Obsidian, open **Settings → Community plugins** and enable **Daggerheart Tooltips**.
4. Create a note and add one of the supported fenced code blocks, for example:

   ```markdown
   ```traits
   # no YAML needed – reads from frontmatter and your abilities config
   ```
   ```

5. Adjust your note's frontmatter (e.g. `level`, `hp`, `stress`, `domains`, etc.) and watch the UI update.

---

## Usage guide

The full usage documentation lives in the existing `docs/USAGE.md` file from the repository.

➡️ **[Open the full Usage Guide](USAGE.md)**

It covers:

- All available blocks (traits, vitals, trackers, rest, damage, consumables, badges, etc.).
- Template syntax and the shared character model.
- Level Up workflow and domain/equipment pickers.
- Settings and common troubleshooting tips.

---

## Local preview

If you want to preview this docs site locally before pushing to GitHub Pages:

1. From the root of this repository, install dependencies:

   ```bash
   npm install
   ```

2. Run the VitePress dev server:

   ```bash
   npm run docs:dev
   ```

3. Open the printed local URL in your browser.

When you're happy with the docs, push your changes and let GitHub Pages host them.
