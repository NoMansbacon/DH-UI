# Daggerheart Tooltips (DH-UI)

An Obsidian plugin that turns fenced code blocks into rich, live-updating UI for Daggerheart campaigns.

Use this site as the primary documentation for installing, configuring, and using the plugin. The GitHub README can stay short and just link here.

---

## What this plugin does

- Renders traits, vitals, trackers, rest controls, damage calculators, badges, and more.
- Uses simple fenced code blocks (e.g. ```vitals, ```traits, ```rest, ```damage).
- Reads values from your note frontmatter and YAML to drive the UI.
- Persists tracker / consumable state so multiple views stay in sync.

For detailed, example-driven usage (character frontmatter, blocks, Level Up, domain picker, multiclass examples, etc.), see the **Usage Guide** below.

---

## Quick start

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

1. Install MkDocs with the Material theme (once per machine):

   ```bash
   pip install mkdocs-material
   ```

2. From the root of this repository, run:

   ```bash
   mkdocs serve
   ```

3. Open the printed `http://127.0.0.1:8000/` URL in your browser.

When you're happy with the docs, push your changes and let GitHub Pages host them.
