# Daggerheart Tooltips (DH-UI) – User Guide

This document is the main reference for how to use the Daggerheart Tooltips plugin, with copy‑pasteable examples.

For a high‑level overview and installation instructions, see the root `README.md`.

---

## Quick start

### Install via BRAT

1. In Obsidian, install and enable the **BRAT** plugin.
2. In BRAT settings, add this repository as a beta plugin:
   `https://github.com/NoMansbacon/DH-UI`
3. Let BRAT install/update the plugin.
4. Enable **Daggerheart Tooltips (DH-UI)** in *Settings → Community plugins*.

### First character note

1. Add frontmatter to your character note (at the top of the file between `---` lines).
2. Insert fenced code blocks (```traits, ```vitals, ```rest, etc.) in the body of the note.
3. Switch to Preview mode to see the interactive UI.

Minimal working example in a character note:

````markdown
---
name: Thalia
level: 1
tier: 1
hp: 6
stress: 4
armor: 2
hope: 6
---

```traits
# no YAML needed – reads from frontmatter and your abilities config
```

```vitals
hp: "{{ frontmatter.hp }}"
stress: "{{ frontmatter.stress }}"
armor: "{{ frontmatter.armor }}"
hope: 6
```

```rest
show_levelup: true
show_full_heal: true
show_reset_all: true
```
````

---

## Character frontmatter

Most blocks read data from your note frontmatter using the template engine. A simple single‑class frontmatter might look like this:

```yaml
---
name: Thalia
level: 3
tier: 2

hp: 8
stress: 6
armor: 2
hope: 6

ancestry: Emberborn
class: Warrior
subclass: Sentinel
community: Free City Guard

domains: "valor | shadow"
---
```

A multiclass character can be represented by adding more information to the same fields, for example:

```yaml
---
name: Azureus
level: 5
tier: 3

hp: 10
stress: 7
armor: 3
hope: 6

ancestry: Void‑touched
class: "Warrior / Invoker"
subclass: "Sentinel / Starcaller"
community: "Order of the Lantern"

domains: "valor | light | shadow"
---
```

The plugin does not try to enforce whether this is a legal build; it just uses these values for display and filtering.

---

## Core blocks with examples

This section gives short examples for the most common blocks. See the README for more detailed field lists.

### Traits / Abilities

````markdown
```traits
# usually no YAML needed – reads from frontmatter + your traits config
```
````

### Vitals grid

````markdown
```vitals
styleClass: dh-vitals--sheet

hp: "{{ frontmatter.hp }}"
stress: "{{ frontmatter.stress }}"
armor: "{{ frontmatter.armor }}"
hope: 6

hp_key: din_health
stress_key: din_stress::{{ file.path }}
armor_key: din_armor::{{ file.path }}
hope_key: din_hope::{{ file.path }}
```
````

### Individual trackers

````markdown
```hp
styleClass: dh-tracker--hp
label: HP
state_key: din_health
uses: "{{ frontmatter.hp }}"
```

```stress
styleClass: dh-tracker--stress
label: Stress
state_key: din_stress::{{ file.path }}
uses: "{{ frontmatter.stress }}"
```
````

### Rest controls + Level Up

````markdown
```rest
styleClass: dh-rest--sheet

rest_label: "Rest"
levelup_label: "Level Up"
full_heal_label: "Full Heal"
reset_all_label: "Reset All"

show_short: true
show_long: true
show_levelup: true
show_full_heal: true
show_reset_all: true
```
````

- **Rest**: opens the rest-actions modal.
- **Level Up**: opens the level‑up chooser modal tied to this note.
- **Full Heal / Reset All**: update all matching trackers in the current note.

### Damage

````markdown
```damage
styleClass: dh-damage--inline
title: "Damage"

hp_key: din_health
armor_key: din_armor::{{ file.path }}

major_threshold: "{{ frontmatter.major_threshold }}"
severe_threshold: "{{ frontmatter.severe_threshold }}"
base_major: 3
base_severe: 6
level: "{{ frontmatter.level }}"
```
````

### Consumables

````markdown
```consumables
styleClass: dh-consumables--sheet
items:
  - label: "Health Potion"
    state_key: hero_hp_pots
    uses: 3
  - label: "Rage"
    state_key: hero_rage
    uses: "{{ frontmatter.rage_uses }}"
```
````

### Badges

````markdown
```badges
styleClass: dh-badges--sheet
items:
  - label: "Level"
    value: "{{ frontmatter.level }}"
  - label: "Ancestry"
    value: "{{ frontmatter.ancestry }}"
  - label: "Class"
    value: "{{ frontmatter.class }}"
```
````

### Features (ancestry / class / subclass / community)

````markdown
```features
styleClass: dh-features--sheet
ancestry:
  - label: "Emberborn"
    value: "Fire‑aligned ancestry from the Ashen Realms."
class:
  - label: "Warrior"
    value: "Front‑line defender focused on armor and control."
subclass:
  - label: "Sentinel"
    value: "Specializes in protecting allies with reactions."
community:
  - label: "Free City Guard"
    value: "Sworn to protect the city of Vyr."
```
````

To use a grid layout instead of a simple list:

````markdown
```features
styleClass: dh-features--grid
layout: grid
ancestry:
  - label: "Emberborn"
    value: "Fire‑aligned ancestry from the Ashen Realms."
# ...
```
````

---

## Domain Picker

The `domainpicker` block helps manage which domain cards are in a character's **Vault** vs **Loadout**.

Basic usage in a character note:

```markdown
```domainpicker
```
```

How it works:

- Reads your character note's frontmatter, including `level` and `domains`.
- Uses the Dataview plugin to find candidate domain card notes.
- Shows two tables: **Vault** and **Loadout**, each as a list of note links.
- Lets you move cards between Vault and Loadout and adjust token counts.

You can configure where domain card notes live via plugin settings (e.g. a specific folder).

---

## Equipment Picker

Use the `equipmentpicker` block to manage your character's weapons, armor, and other gear between **Inventory** and **Equipped** lists.

Basic usage in a character note:

```markdown
```equipmentpicker
# optional per-block overrides
# folders:
#   - "Cards/Equipment"
# enforce_tier: true   # default: use character tier to hide too-high-tier items
# view: table          # or "card" for card-style tiles
```
```

How it works:

- Reads your character note's frontmatter, including `tier`.
- Uses the Dataview plugin to discover equipment notes, either:
  - from per-block `folder` / `folders` in the YAML, or
  - from the global **Equipment folder** setting, or
  - from the whole vault when no folder is configured.
- Detects likely **weapons** and **armor** from tags/frontmatter and groups them into separate tables (Weapons, Armor, Other).
- Lets you move items between **Inventory** and **Equipped** and remove them from both lists.

You can configure where equipment notes live and whether the picker should hide items above the character's tier via plugin settings.

---

## Level Up & multiclassing

The plugin ships with a Level Up modal that walks through the official options for Tiers 2–4.

### Using the Level Up modal

1. Add a `rest` block with `show_levelup: true` in your character note.
2. Click **Level Up** in Preview.
3. The Level Up modal shows:
   - Tier 2, 3, and 4 columns.
   - Available options per tier, with checkboxes.
   - Usage boxes that track how many times each option has been taken.
4. Select **exactly two** options and click **Apply Level Up**.

What happens when you apply:

- `level` is incremented in frontmatter, and `tier` is updated when you cross key thresholds.
- `hp`, `stress`, `evasion`, and `proficiency` are incremented according to the options chosen.
- `dh_levelup.t2/t3/t4` objects in frontmatter track how many times each option (opt1..opt8) has been taken.
- For trait‑boosting options, the plugin also updates the `traits` block's YAML (the `bonuses` section) where possible.
- A `dh:domainpicker:open` event is fired so the Domain Picker can prompt you to add domain cards for your new level.

### Multiclassing behavior

The Level Up modal includes multiclass options in higher tiers (for example, certain `opt8` entries in Tier 3/4). The plugin handles these in a deliberately light way:

- **It records that you picked the multiclass option** by incrementing `dh_levelup.t3.opt8` / `dh_levelup.t4.opt8`.
- It **does not automatically rewrite** your `class`, `subclass`, or `domains` frontmatter – you should update those yourself.
- It opens the Domain Picker so you can add the appropriate new class/domain cards, but
- It **does not check legality** of which cards you add (number of classes, domain combinations, etc.).

This keeps the plugin on the UI/state side of things while leaving rules decisions to you and your table.

---

## Experiences

Use the `experiences` block to list your character's key experiences. These are story hooks you and your GM can reference during play.

```markdown
```experiences
items:
  - name: "Saved by the Stranger"
    note: "You owe a favor to the mysterious stranger who pulled you from the river."
  - name: "Haunted by the Flames"
    note: "You survived a village fire that still stalks your dreams."
```
```

How to use in play (rules reminder): when you and your GM agree an experience is relevant, you can **spend 1 Hope** to **add +2** to a roll that fits that experience. This plugin just helps you track the text; you apply the +2 modifier yourself when you roll.

You can also write a single experience without `items:`:

```markdown
```experiences
name: "Marked by the Old Gods"
note: "You bear a strange symbol that reacts to ancient magic."
```
```

---

## Template engine quick reference

Anywhere you can write a string in block YAML, you can usually use template expressions like <span v-pre>`{{ frontmatter.hp }}`</span>.

Supported paths include:

- `frontmatter.*` – note frontmatter, e.g. <span v-pre>`{{ frontmatter.level }}`</span>.
- `abilities.*` – totals from the nearest ```traits block, e.g. <span v-pre>`{{ abilities.Agility }}`</span>.
- `skills.*` – from a `skills` map in frontmatter.
- `character.*` – a derived summary, e.g. <span v-pre>`{{ character.level }}`</span>, <span v-pre>`{{ character.hp }}`</span>.

Basic helpers:

- <span v-pre>`{{ add 2 frontmatter.level }}`</span> – numeric addition.
- <span v-pre>`{{ subtract frontmatter.hp 2 }}`</span> – subtraction.
- <span v-pre>`{{ multiply 2 frontmatter.level }}`</span> – multiplication.
- <span v-pre>`{{ floor divide frontmatter.hp 2 }}`</span> – integer division.

If a template expression fails, it resolves to an empty string instead of throwing.

---

## Scope & rules disclaimer

- The plugin does **not** enforce Daggerheart rules (including multiclass rules, card limits, or build legality).
- It focuses on **rendering UI** and **persisting state** for things like trackers, cards, and level‑up choices.
- Your frontmatter, YAML, and in‑world decisions remain the source of truth for what is actually allowed at the table.
