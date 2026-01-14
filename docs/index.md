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
