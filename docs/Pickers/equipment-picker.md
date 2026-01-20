# Equipment Picker

The equipment picker is a management UI for weapons, armor, and other gear. It lets you move items between two lists on a character note:

- **Inventory** – everything your character owns.  
- **Equipped** – what they are currently carrying/using.

It integrates with:

- Your **equipment notes** (weapons, armor, etc.), discovered via tags, folders, or plugin settings.  
- Your **character note frontmatter** (`tier`, `inventory`, `equipped`).  
- The **Dataview** plugin.

> The Equipment Picker requires Dataview. If Dataview is missing, the block shows a message instead of rendering.

## Character frontmatter it uses

On the character note (the one containing the `equipmentpicker` block), the picker reads:

- `tier` / `Tier` – character tier, used to optionally hide items above that tier.  
- `inventory` / `Inventory` – list of equipment notes (as `[[links]]`).  
- `equipped` / `Equipped` – list of currently equipped items (as `[[links]]`).  

`inventory` and `equipped` are automatically updated when you click **Add / Remove / → Inventory / → Equipped** in the UI.

## Equipment notes it expects

Each equipment item is just a note in your vault. The picker finds them by:

- Block‑level `folder` / `folders` values, and/or  
- An Obsidian tag you specify (`tag` / `tags`) or the plugin‑wide **Equipment tag** setting, or  
- As a fallback, any note detected as equipment via tags/fields.

An equipment note is considered a candidate when:

- `category` / `Category` / `type` / `Type` contains "weapon", "armor", or "equipment", **or**  
- The note has tags like `#equipment`, `#weapon`, `#armor`, **or**  
- It has obvious combat fields like `damage`, `thresholds`, `base_score`, `tier`, etc.

From each item it reads fields such as:

- `tags` / `Tags` – high‑level category (often "Weapon" or "Armor").  
- `type` / `Type` – primary or secondary.  
- `damage` / `Damage` – damage string.  
- `thresholds` / `Thresholds` – armor/threshold info.  
- `base_score` / `base` / `Base` – base score.  
- `tier` / `Tier` – item tier.  
- `trait` / `Trait`, `range` / `Range`, `burden` / `Burden`, `feature` / `Feature`.  

These are shown in the Inventory/Equipped tables and in the Add Equipment modal.

## Basic usage

````yaml
```equipmentpicker
# optional per-block overrides
folders:
  - "DH_Compendium/equipment"
enforce_tier: true   # default: use character tier to hide too-high-tier items
view: table          # or "card" for card-style tiles
```
````

### Example – Tag-based discovery

You can also use tags instead of (or in addition to) folders:

````yaml
```equipmentpicker
# Only consider notes tagged as equipment (leading # is optional)
tag: "weapon"

# Or multiple tags:
# tags:
#   - "#weapon"
#   - "#armor"
```
````

If you set **Equipment tag** in the plugin settings (for example `#equipment`), you can omit `tag`/`tags` in the block and the picker will use that tag automatically.

### Example – Weapon and armor notes

Each equipment item can be a simple note that matches the SRD’s weapon and armor lists. For example:

```yaml
---
title: "Shortsword"
tags: "Weapon"
type: "secondary"
damage: "d8 phy"
tier: 1
trait: "agility"
range: "melee"
burden: "one-handed"
feature: "+2 to primary weapon damage to targets within Melee range"
---
```

```yaml
---
title: "Chainmail Armor"
tags: "Armor"
thresholds: "7/15"
base_score: 4
tier: 1
feature: "-1 to Evasion"
---
```

The equipment picker will discover notes like these and show their fields in the Weapons and Armor sections, letting you move them between **Inventory** and **Equipped**.

## UI overview

![Equipment Picker UI example](../images/example_equipmentpicker.webp)

### Main toolbar

- **Equipped / Inventory** buttons – toggle which list you’re looking at.  
- **Add equipment** – opens the Add Equipment modal.

### Inventory / Equipped tables

For the active list, the picker shows:

- Separate sections for **Weapons**, **Armor**, and **Other** (based on category/tags).  
- Tables with columns like Name, Type, Damage, Thresholds, Base, Tier, Trait, Range, Burden, Feature.  
- Per‑row **Actions**:  
  - `→ inventory` / `→ equipped` – move items between lists.  
  - **Remove** – remove an item from that list.

### Add Equipment modal

The modal lets you search and add equipment to Inventory or Equipped. It supports:

- **Category filter** – Weapon / Armor / Other.  
- **Tier filter** – Any or exact tier.  
- **Search** – text search over name and properties/tags.  
- Two view modes:  
  - `card` – grid of cards with art and summary lines.  
  - `table` – compact table with all core fields.

From here you can add items directly to:

- **Inventory** – appends a link to the character’s `inventory` list.  
- **Equipped** – appends a link to `equipped` (and ensures the same item isn’t in both lists).

## Configuration

Top‑level `equipmentpicker` block options:

|| Property        | Type                  | Default          | Description                                                                      |
|| --------------- | --------------------- | ---------------- | -------------------------------------------------------------------------------- |
|| `folder`        | String / String array | _none_           | Limit search to a folder or list of folders. Uses forward slashes.              |
|| `folders`       | String / String array | _none_           | Alias for `folder`; if both are present, `folders` wins.                         |
|| `tag` / `tags`  | String / String array | plugin setting / auto | Obsidian tag(s) to restrict candidate equipment notes (e.g. `#equipment`). |
|| `enforce_tier`  | Boolean               | plugin setting   | When true, hide items with `tier` above the character’s tier.                   |
|| `view`          | `"card"` \| `"table"`  | `"card"`        | View type for the Add Equipment modal.                                          |

Behavior notes:

- If `folder`/`folders` is set, only equipment under those folders is considered, optionally further filtered by `tag`/`tags` when provided.  
- If no folders are configured, the plugin falls back to the global Equipment folder, then to a tag‑filtered or vault‑wide search depending on whether an Equipment tag is configured.  
- When `enforce_tier` is enabled, items with `tier` higher than the character’s `tier` are hidden in the Add Equipment modal.  
- The picker keeps `inventory` and `equipped` mutually exclusive for each item (moving to one removes it from the other).

This makes the Equipment Picker a handy way to keep your character’s gear organized without editing frontmatter arrays by hand.