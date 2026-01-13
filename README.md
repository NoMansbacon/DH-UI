# Daggerheart Tooltips (DH-UI)

An Obsidian plugin for **Daggerheart** that turns fenced code blocks into rich, live-updating character sheet UI.

Use simple Markdown + YAML to render traits, vitals, trackers, rest controls, damage calculators, badges, domain/equipment pickers, and more – all driven by your note frontmatter.

> **Warning**
> This plugin is under active development. Things may change or break between versions.

---

## 📖 Documentation

For complete documentation, examples, and guides, visit the docs site:

- 📚 **https://NoMansbacon.github.io/DH-UI/**

The docs include:

- **Quick Start / Usage Guide** – set up a character note and basic blocks in minutes.
- **Code Block Reference** – detailed options for every block (traits, vitals, rest, damage, consumables, badges, pickers, etc.).
- **Concepts & Guides** – state storage, template helpers, rest & level-up flow.
- **Examples** – full character note examples and recommended frontmatter.

---

## 🔧 Installation

### Via BRAT (recommended)

1. In Obsidian, install and enable **BRAT**.
2. In BRAT settings, add this repo as a beta plugin:
   `https://github.com/NoMansbacon/DH-UI`
3. Let BRAT install/update the plugin.
4. Enable **Daggerheart Tooltips (DH-UI)** in *Settings → Community plugins*.

### Manual (for developers)

1. Copy this folder into your vault under `.obsidian/plugins/daggerheart-tooltips`.
2. Run `npm install` in the plugin folder.
3. Run `npm run dev` to build `main.js`.
4. Enable **Daggerheart Tooltips** in *Settings → Community plugins*.

The plugin requires Obsidian `minAppVersion` as specified in `manifest.json`.
