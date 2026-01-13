# Code Block Reference

This page lists all DH-UI fenced code blocks and the important options each one supports, with copy‑pasteable examples.

You use these blocks in Markdown like:

```markdown
```traits
# YAML options here
```
```

---

## Traits / Abilities (`traits`, `ability`, `dh-ability`, `dh-traits`)

The traits/abilities block renders the six Daggerheart abilities as cards, optionally with per‑ability bonuses and notes.

### Basic traits block

```markdown
```traits
# usually no YAML needed – reads from frontmatter + your traits config
```
```

By default, traits are built from your character frontmatter and internal helpers.

### Traits with explicit bonuses and notes

```markdown
```traits
bonuses:
  Agility: 1
  Strength: 2

notes:
  Agility: "From Emberborn ancestry"
  Strength: "From Warrior class"

show_markers: true   # default true; gold checkmarks on each card
layout: row          # or "grid" in some themes
class: my-traits     # optional custom CSS class
```
```

**Key options:**

- `bonuses.<Ability>` – numeric bonus applied to that ability.
- `notes.<Ability>` – small note text under that ability.
- `show_markers` – show/hide the gold marker toggles.
- `layout` – layout hint (implementation may vary by theme).
- `class` – first CSS class added to the outer container.

Aliases `ability` / `dh-ability` / `dh-traits` can be used if `traits` is taken by another plugin.

---

## Vitals Grid (`vitals` / `vital-trackers`)

The `vitals` block shows HP, Stress, Armor, and Hope in a 2×2 tracker grid with persistent state.

```markdown
```vitals
hp: "{{ frontmatter.hp }}"        # or a literal number
stress: "{{ frontmatter.stress }}"
armor: "{{ frontmatter.armor }}"
hope: 6                            # defaults to 6 if omitted

hp_label: HP
stress_label: Stress
armor_label: Armor
hope_label: Hope

# Optional storage keys (for cross‑note sharing)
hp_key: din_health
stress_key: din_stress::{{ file.path }}
armor_key: din_armor::{{ file.path }}
hope_key: din_hope::{{ file.path }}

# Optional hope footer / feature rows
hope_feature:
  - label: "Hope Feature"
    value: "{{ frontmatter.hope_feature }}"

class: my-vitals
```
```

**Key options:**

- `hp`, `stress`, `armor`, `hope` – number of boxes per tracker (literal or template).
- `<type>_label` – label to show for that row.
- `<type>_key` – state keys used by the shared store so other blocks (rest, damage, etc.) can find and update these trackers.
- `hope_feature` – list of extra rows under Hope.
- `class` – custom CSS class.

---

## Individual Trackers (`hp`, `stress`, `armor`, `hope`)

Use these when you just need one tracker row instead of the full grid.

```markdown
```hp
label: HP
state_key: din_health
uses: "{{ frontmatter.hp }}"   # or hp: 8
class: my-hp
```

```stress
label: Stress
state_key: din_stress::{{ file.path }}
uses: "{{ frontmatter.stress }}"
```
```

**Key options (per tracker type):**

- `label` – label for the row.
- `state_key` – key in the state store (e.g. `tracker:din_health`).
- `uses` – number of boxes (or type‑specific key like `hp`, `stress`, `armor`, `hope`).
- `class` – optional CSS class.

`hope` trackers default to 6 boxes if `uses` is omitted.

---

## Rest Controls (`rest`)

The `rest` block provides a Rest row with buttons and a combined **Rest modal** for short/long rests plus Level Up and reset actions.

### Basic rest row

```markdown
```rest
rest_label: "Rest"
levelup_label: "Level Up"
full_heal_label: "Full Heal"
reset_all_label: "Reset All"

# Auto‑detects trackers from visible vitals/trackers in the note by default
# but you can override with explicit keys:
# hp_key: din_health
# stress_key: din_stress::{{ file.path }}
# armor_key: din_armor::{{ file.path }}
# hope_key: din_hope::{{ file.path }}

show_short: true
show_long: true
show_levelup: true
show_full_heal: true
show_reset_all: true

max_picks: 2        # max actions allowed per rest in the modal
class: my-rest-row
```
```

**Buttons:**

- **Rest** – opens the combined rest modal.
- **Short / Long rest** – shortcuts into the relevant column of the same modal.
- **Level Up** – opens the Level Up chooser modal.
- **Full Heal** – scans visible HP trackers and fills them.
- **Reset All** – resets HP/Stress/Armor/Hope trackers.

**Key options:**

- Labels: `rest_label`, `levelup_label`, `full_heal_label`, `reset_all_label`.
- Visibility: `show_short`, `show_long`, `show_levelup`, `show_full_heal`, `show_reset_all`.
- Tracker keys: `hp_key`, `stress_key`, `armor_key`, `hope_key`.
- `max_picks` – how many rest moves can be selected per rest (default 2).
- `class` – custom CSS class on the row.

Legacy `short-rest` / `long-rest` fenced blocks have been removed; always use `rest`.

---

## Damage Calculator (`damage`)

The `damage` block is an inline calculator that applies damage to HP/Armor trackers and highlights major/severe thresholds.

```markdown
```damage
title: "Damage"

# Tracker keys
hp_key: din_health
armor_key: din_armor::{{ file.path }}

# thresholds – can be literals or templates/frontmatter driven
major_threshold: "{{ frontmatter.major_threshold }}"
severe_threshold: "{{ frontmatter.severe_threshold }}"

base_major: 3
base_severe: 6
level: "{{ frontmatter.level }}"

class: my-damage
```
```

**Threshold resolution rules (in order):**

1. If `major_threshold` / `severe_threshold` are provided in the block (and templates resolve to numbers), those are used.
2. Otherwise, frontmatter aliases like `majorthreshold` / `severethreshold` (or `major_threshold` / `severe_threshold`) are used.
3. Otherwise, `base_major` / `base_severe` in the block are used.
4. In all cases, your `level` is added on top.

**Key options:**

- `title` – heading text above the calculator.
- `hp_key`, `armor_key` – tracker state keys to update.
- `major_threshold`, `severe_threshold` – explicit values or templates.
- `base_major`, `base_severe` – fallback base thresholds.
- `level` – used to increase thresholds.
- `class` – custom CSS class.

---

## Consumables (`consumables`)

Renders rows of consumable boxes with per‑item persistent state.

```markdown
```consumables
items:
  - label: "Health Potion"
    state_key: hero_hp_pots
    uses: 3
  - label: "Rage"
    state_key: hero_rage
    uses: "{{ frontmatter.rage_uses }}"
class: my-consumables
```
```

Alternative shapes:

```markdown
```consumables
label: "Health Potion"
state_key: hero_hp_pots
uses: 3
```
```

```markdown
```consumables
items:
  health_potion:
    label: "Health Potion"
    state_key: hero_hp_pots
    uses: 3
  rage:
    label: "Rage"
    state_key: hero_rage
    uses: "{{ frontmatter.rage_uses }}"
```
```

**Key options:**

- `items` – list or map of items.
- `items[].label` – item label.
- `items[].state_key` – unique state key (stored as `dh:consumable:<state_key>` in local storage).
- `items[].uses` – number of boxes (can be a template).
- `label` / `state_key` / `uses` at root – shorthand for a single item.
- `class` – CSS class.

---

## Badges (`badges`)

Simple label–value badges, often used for level, ancestry, class, etc.

```markdown
```badges
class: my-badges
items:
  - label: "Level"
    value: "{{ frontmatter.level }}"
  - label: "Ancestry"
    value: "{{ frontmatter.ancestry }}"
  - label: "Class"
    value: "{{ frontmatter.class }}"
```
```

**Key options:**

- `items[].label` – badge label.
- `items[].value` – text/value (literal or template).
- `class` – optional CSS class.

---

## Features (`features`)

Displays ancestry, class, subclass, and community features in either list or grid layouts.

```markdown
```features
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
```

Grid layout variant:

```markdown
```features
layout: grid
ancestry:
  - label: "Emberborn"
    value: "Fire‑aligned ancestry from the Ashen Realms."
# ...
```
```

**Key options:**

- `ancestry`, `class`, `subclass`, `community` – each a list of `{ label, value }` entries.
- `layout` – `list` (default) or `grid`.

---

## Experiences (`experiences`)

Story experiences that can be invoked at the table for Hope and bonuses.

```markdown
```experiences
items:
  - name: "Saved by the Stranger"
    note: "You owe a favor to the mysterious stranger who pulled you from the river."
  - name: "Haunted by the Flames"
    note: "You survived a village fire that still stalks your dreams."
```
```

Single‑experience shorthand:

```markdown
```experiences
name: "Marked by the Old Gods"
note: "You bear a strange symbol that reacts to ancient magic."
```
```

**Key options:**

- `items[].name` / `name` – name of the experience.
- `items[].note` / `note` – description text.

---

## Domain Picker (`domainpicker`)

Manages which domain cards are in a character's **Vault** vs **Loadout**.

```markdown
```domainpicker
# most behavior is configured via plugin settings and frontmatter
# optional per‑block overrides may be added in future versions
```
```

**Behavior:**

- Reads character note frontmatter, including `level` and `domains`.
- Uses the Dataview plugin to find candidate domain card notes.
- Shows **Vault** and **Loadout** tables of cards.
- Lets you move cards between Vault and Loadout and adjust token counts.

Folder/scoping, maximum loadout size, and other defaults are configured in the plugin settings.

---

## Equipment Picker (`equipmentpicker`)

Helps manage weapons/armor/other gear between **Inventory** and **Equipped**.

```markdown
```equipmentpicker
# optional per-block overrides
# folders:
#   - "Cards/Equipment"
# enforce_tier: true   # use character tier to hide too‑high‑tier items
# view: table          # or "card" for card-style tiles
```
```

**Key options:**

- `folder` / `folders` – limit search to one or more folders.
- `enforce_tier` – when true, hide items above the character's `tier`.
- `view` – `table` (default) or `card`.

Behavior in summary:

- Reads character frontmatter, especially `tier`.
- Uses Dataview to discover equipment notes from folders or global settings.
- Groups items into Weapons, Armor, Other.
- Lets you move items between Inventory and Equipped.

---

## Template & Event Surface

Anywhere you can provide a string in block YAML, you can usually use templates like `{{ frontmatter.hp }}`.

**Common template paths:**

- `frontmatter.*` – note frontmatter, e.g. `{{ frontmatter.level }}`.
- `abilities.*` – totals from the nearest ```traits block, e.g. `{{ abilities.Agility }}`.
- `skills.*` – from a `skills` map in frontmatter.
- `character.*` – derived summary, e.g. `{{ character.level }}`, `{{ character.hp }}`.

**Basic helpers:**

- `{{ add 2 frontmatter.level }}`
- `{{ subtract frontmatter.hp 2 }}`
- `{{ multiply 2 frontmatter.level }}`
- `{{ floor divide frontmatter.hp 2 }}`

**Events fired by the plugin (for advanced users / other plugins):**

- `dh:tracker:changed` – `{ key, filled }` when a tracker changes.
- `dh:kv:changed` – `{ key, val }` when a key in the state store changes.
- `dh:rest:short` / `dh:rest:long` – rest events.

Future advanced blocks should prefer helpers from `src/utils/events.ts` rather than calling `window.dispatchEvent` directly.
