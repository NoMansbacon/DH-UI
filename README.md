# Daggerheart Tooltips (DH-UI)

Daggerheart Tooltips is an Obsidian plugin that turns fenced code blocks into rich, live-updating UI for Daggerheart campaigns.

It renders traits, vitals, trackers, rest controls, damage calculators, badges, and more – all driven by simple YAML and your note frontmatter.

---

## Installation

1. Copy this folder into your vault under `.obsidian/plugins/daggerheart-tooltips` (or use your preferred Obsidian plugin workflow).
2. Run `npm install` in the plugin folder.
3. Run `npm run dev` to build `main.js` from the TypeScript sources.
4. In Obsidian, enable **Daggerheart Tooltips** in *Settings → Community plugins*.

The plugin requires Obsidian `minAppVersion` as specified in `manifest.json`.

---

## Core Concepts

- **Frontmatter-aware** – most blocks can read values from your note frontmatter (e.g. `level`, `hp`, thresholds) via templates.
- **Persistent state** – tracker fills and consumable uses are persisted via a small key–value store so multiple views stay in sync.
- **Live blocks** – blocks automatically re-render when metadata/frontmatter changes, via a shared live-block registry.

All blocks are registered as Markdown fenced code blocks (e.g. ```` ```vitals ``` ````).

---

## Available Blocks

### Traits / Abilities

**Blocks:** `ability`, `traits` (aliases `dh-ability`, `dh-traits` if names are already used by another plugin)

Renders the six Daggerheart abilities as cards with a toggleable gold marker per ability.

```markdown
```traits
# no YAML needed – reads from frontmatter and your abilities config
```
```

The abilities data is built from `frontmatter` and internal helpers; each card stores its toggle state in `localStorage`.

---

### Vitals Grid

**Block:** `vitals` (alias: `vital-trackers`)

Displays four trackers in a grid: **HP**, **Stress**, **Armor**, **Hope**, with persistent state.

```markdown
```vitals
class: my-vitals
hp: "{{ frontmatter.hp }}"      # total boxes for HP
stress: 8                        # literal number
armor: "{{ frontmatter.armor }}"
hope: 6                          # defaults to 6 if omitted

hp_label: HP
stress_label: Stress
armor_label: Armor
hope_label: Hope

# Optional storage keys (for cross-note sharing)
hp_key: din_health
stress_key: din_stress::{{ file.path }}
armor_key: din_armor::{{ file.path }}
hope_key: din_hope::{{ file.path }}

# Optional hope footer / feature rows
hope_feature:
  - label: "Hope Feature"
    value: "{{ frontmatter.hope_feature }}"
```
```

Counts can be literals or simple templates. Tracker fills are stored in the state store under `tracker:<key>`.

---

### Individual Trackers

**Blocks:** `hp`, `stress`, `armor`, `hope`

Standalone tracker rows when you don’t need the full vitals grid.

```markdown
```hp
label: HP
state_key: din_health
uses: "{{ frontmatter.hp }}"   # or `hp:` / `stress:` / `armor:` / `hope:` depending on block
class: my-hp
```
```

- `uses` or the type-specific key (`hp`, `stress`, `armor`, `hope`) defines the number of boxes.
- `hope` defaults to 6 boxes if not provided.

---

### Rest Controls

**Block:** `rest`

Renders a single **Rest** row with:

- A **Rest** button that opens the combined rest-actions modal.
- Optional **Short Rest** / **Long Rest** buttons (keyboard-friendly shortcuts into the same modal).
- Optional **Level Up**, **Full Heal**, and **Reset All** buttons.

```markdown
```rest
rest_label: "Rest"
levelup_label: "Level Up"
full_heal_label: "Full Heal"
reset_all_label: "Reset All"

# Optional override keys; if omitted, the block auto-detects from visible trackers
hp_key: din_health
stress_key: din_stress::{{ file.path }}
armor_key: din_armor::{{ file.path }}
hope_key: din_hope::{{ file.path }}

show_short: true
show_long: true
show_levelup: true
show_full_heal: true
show_reset_all: true
```
```

**Rest modal behavior:**

- The **combined rest modal** has two columns:
  - **Short rest moves** (left): 1d4 + tier style heals/clears/repairs and small Hope bumps.
  - **Long rest moves** (right): full clears (HP/Stress/Armor), Hope bumps, and a "Work on a Project" note.
- By default you can select **up to 2 actions in total** per rest (configurable with `max_picks:` in the `rest` block). The plugin enforces this selection limit, but **your table/GM still decides which moves are legal**.
- The modal reads HP/Stress/Armor/Hope **tracker keys** from the `rest` block YAML when provided, or automatically from visible `vitals` / tracker rows in the same note.
- When you apply a rest, the plugin updates the matching tracker state (`tracker:<key>`) and repaints any visible tracker blocks.

**Other buttons:**

- **Short / Long rest** buttons in the row simply open the same modal focusing the relevant column.
- **Full Heal** scans the current note for HP trackers and clears them.
- **Reset All** resets HP/Stress/Armor/Hope trackers found in the current note.
- **Level Up** opens the Level Up chooser modal for this character note (see `docs/USAGE.md` → *Level Up & multiclassing*).

> Legacy `short-rest` / `long-rest` fenced blocks have been removed. Replace any old
> ```short-rest / ```long-rest fences in your notes with a single ```rest block.

---

### Damage Calculator

**Block:** `damage`

Inline damage calculator that applies HP/Armor changes to the appropriate trackers.

```markdown
```damage
title: "Damage"
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

The block reads frontmatter and/or YAML fields to compute final major/severe thresholds, then applies damage via the shared state store and broadcasts updates to tracker views.

Threshold resolution rules (in order):
- If `major_threshold` / `severe_threshold` are provided in the block (and templates resolve to numbers), those are used.
- Otherwise, frontmatter aliases like `majorthreshold` / `severethreshold` (or `major_threshold` / `severe_threshold`) are used.
- Otherwise, `base_major` / `base_severe` in the block are used.
- In all cases, your `level` (from YAML or frontmatter) is added on top.

---

### Consumables

**Block:** `consumables`

Renders rows of consumable boxes with per-item persistent state.

```markdown
```consumables
items:
  - label: "Health Potion"
    state_key: din_hp_pots
    uses: 3
  - label: "Rage"
    state_key: din_rage
    uses: "{{ frontmatter.rage_uses }}"
```
```

Alternative shapes:
- Single item at root (`label`, `state_key`, `uses` at top level).
- Map under `items:` instead of a list.

State is persisted in `localStorage` as `dh:consumable:<state_key>`.

---

### Badges

**Block:** `badges`

Simple label–value badges, often used for level, ancestry, class, etc.

```markdown
```badges
class: my-badges
items:
  - label: "Level"
    value: "{{ frontmatter.level }}"
  - label: "Ancestry"
    value: "{{ frontmatter.ancestry }}"
```
```

- `class` (optional): first CSS class token to add to the container.
- `items[].value` can be a literal or a template rendered against the note context.

---

---

## Template & event surface

Blocks can refer to a shared character model via the template engine:

- `{{ frontmatter.field }}` – raw frontmatter values.
- `{{ abilities.Agility }}` – derived ability totals from the nearest ```traits block.
- `{{ character.level }}`, `{{ character.hp }}`, etc. – high-level summary derived from frontmatter.

Common helpers:

- `{{ add 2 frontmatter.level }}`
- `{{ floor divide frontmatter.hp 2 }}`

Custom events are fired for cross-block reactivity:

- `dh:tracker:changed` – `{ key, filled }` when a tracker state changes.
- `dh:kv:changed` – `{ key, val }` when a key in the shared state store changes.
- `dh:rest:short` / `dh:rest:long` – optional rest events (see `utils/events.ts`).

Future/advanced blocks should prefer importing the helpers from `src/utils/events.ts` instead of calling `window.dispatchEvent` directly to keep payloads consistent.

---

## Settings

Open **Settings → Community plugins → Daggerheart Tooltips** to configure:

- **State file path** – where the shared tracker state JSON file is stored in your vault (used by vitals, trackers, rest, damage, etc.).
- **Domain cards folder** – optional vault folder where domain card notes live. Used by the `domainpicker` block when searching for cards.
- **Equipment folder** – optional vault folder where equipment notes live. Used by the `equipmentpicker` block when discovering weapons/armor.
- **Max domain cards in loadout** – optional recommended cap for domain cards in a character's loadout. Enforced by the Domain Picker when moving cards into loadout.
- **Restrict domain picker to character level & domains** – when enabled (default), Add Domain Cards prefers cards at or below the character's `level` and matching their `domains` frontmatter.
- **Restrict equipment picker to character tier** – when enabled (default), Add Equipment hides items above the character's `tier` frontmatter.
- **Auto-open Domain Picker after Level Up** – when enabled (default), applying a Level Up automatically opens the Domain Picker with a reminder to add domain cards for that level.
- **Domain picker view** – choose whether the Add Domain Cards modal uses a **card grid** (with art) or a compact **table** layout.

Other behavior (layout, colors) is controlled primarily via CSS and the Style Settings plugin.

---

## Documentation

For a longer, example‑driven guide (character frontmatter, blocks, Level Up, domain picker, and multiclass examples), see:

- [`docs/USAGE.md`](docs/USAGE.md)

---

## Scope & limitations

- This plugin **does not enforce Daggerheart rules** (including multiclass rules, card limits, or build legality). It only tracks the numbers and choices you record in frontmatter and YAML.
- The **Level Up** modal updates frontmatter fields like `level`, `tier`, `hp`, `stress`, `evasion`, `proficiency`, and `dh_levelup.*` counters. It does *not* automatically change your `class` / `subclass` / `domains` frontmatter; you should keep those in sync with your sheet.
- Taking the **multiclass** option in the Level Up modal simply records that choice and then opens the domain picker so you can add cards; the plugin does not decide which class/domain cards are legal.
- The **Domain Picker** relies on your frontmatter (`level`, `domains`, etc.) and the Dataview plugin to work correctly.

---

## Troubleshooting

- If a block doesn’t render, check the **Developer Tools console** for `[DH-UI]` error messages.
- Ensure your code fences are correctly spelled (e.g. ```vitals, ```rest, ```damage, etc.).
- If trackers look out of sync, trigger a rest button or interact with a tracker to force a refresh; all views listening on the same state keys should update.
