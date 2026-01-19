# Vitals

The vitals block renders a 4‑slot tracker grid for a character’s core resources:

•  HP – rectangular boxes.  
•  Stress – rectangular boxes.  
•  Armor – rectangular boxes.  
•  Hope – diamond‑shaped boxes.  

It supports:

•  Custom labels (e.g. “Wounds” instead of “HP”).  
•  Numeric or template‑driven max values (e.g. from frontmatter).  
•  Persistent state per tracker using stable keys, shared with rest, damage, and the single‑tracker blocks (hp, stress, armor, hope).  
•  Optional Hope Feature rows under the Hope track for “once per rest” abilities or notes.

The block is registered under two names:

•  vitals – primary name.  
•  vital-trackers – alias, for readability.

How the trackers work

Each of the four trackers draws a row of boxes:

•  Click a box to fill or unfill it.  
•  Filled boxes are saved using a state key (like `din_health`, `din_stress::Characters/Elira`).  
•  When you reopen the note, the filled counts are restored from the state store.  

These same keys are what rest and damage use to apply healing and damage.

Default keys and overrides

By default (per‑note defaults based on the current file path):

•  hp_key: "din_health::NOTE_PATH"  
•  stress_key: "din_stress::NOTE_PATH"  
•  armor_key: "din_armor::NOTE_PATH"  
•  hope_key: "din_hope::NOTE_PATH"  

Where `NOTE_PATH` is your Obsidian note path (for example, `Characters/Elira`).

You can override any of these in the vitals YAML if you want to share a pool across notes or separate multiple characters in one file.

Dynamic max values

Each tracker’s hp, stress, armor, and hope field can be:

•  A number:
```yaml
  hp: 10
  stress: 6
```
•  A simple frontmatter reference:
```yaml
  hp: frontmatter.hp_max
  stress: "{{ frontmatter.stress_max }}"
```
•  Any template string that resolves to a number:  
```yaml
  hp: "{{ add 2 frontmatter.tier }}"
```

Under the hood:

•  If the value is like `frontmatter.hp_max` or <span v-pre>`{{ frontmatter.hp_max }}`</span>, it reads that field directly and parses it as a number.  
•  Otherwise it runs the template through the shared template engine and parses the result as a number.  
•  Non‑numeric or missing values fall back to 0 (except hope, which defaults to 6 if it would otherwise be 0).

## Example – Standard vitals grid

![Vitals trackers example](../images/example_vitals.webp)

````yaml
```vitals
styleClass: 

# Labels
hp_label: "HP"
stress_label: "Stress"
armor_label: "Armor"
hope_label: "Hope"

# Maximum boxes (numbers or templates)
hp: 10
stress: 6
armor: "{{ frontmatter.armor_slots }}"
hope: 6  # if omitted or 0, defaults to 6

# Optional: override state keys (normally you can omit these)
hp_key: "din_health::Character/Dree"
stress_key: "din_stress::Character/Dree"
armor_key: "din_armor::Character/Dree"
hope_key: "din_hope::Character/Dree"

# Optional: extra info under the Hope track
hope_feature:
  - label: "Hope Refresh"
    value: "Recover all Hope when you complete a major quest."
  - label: "Despair"
    value: "If you ever run out of Hope, mark a Scar."
```
````

## This renders:

- A 2×2 grid of trackers (HP, Stress, Armor, Hope).  
- Each tracker shows the configured label and number of boxes.  
- A small “Hope Feature” section under the Hope row with labeled notes.

> `hope_feature` also accepts a single object or a plain string:  
> 
> ```yaml
> hope_feature:
>   - "When you share a heartfelt story, everyone regains 1 Hope."
> ```

## Example – Using frontmatter values

```yaml
---
hp_max: 12
stress_max: 6
armor_slots: 3
hope_max: 6
---

```vitals
styleClass:

hp_label: "HP"
hp: frontmatter.hp_max

stress_label: "Stress"
stress: "{{ frontmatter.stress_max }}"

armor_label: "Armor"
armor: "frontmatter.armor_slots"

hope_label: "Hope"
hope: "{{ frontmatter.hope_max }}"
```

## The block will:

- Read `hp_max`, `stress_max`, `armor_slots`, and `hope_max` from the note’s frontmatter.  
- Build the correct number of boxes for each tracker.  
- Use its default `*_key` values unless you override them.

## Working with `rest` and `damage`

Because the `vitals` block uses stable keys:

- `rest` can auto‑detect the HP/Stress/Armor/Hope trackers in the same note and apply Short/Long Rest and resets.  
- `damage` can use `hp_key` / `armor_key` to apply tiered damage directly to the same HP/Armor pools.

For most character sheets:

1. Put your frontmatter at the top (with `hp_max`, `stress`, `armor`, etc.).  
2. Add a `vitals` block.  
3. Add a `rest` block under it (for Short/Long rest & resets).  
4. Add a `damage` block wherever you want a compact damage input.

## Configuration – `vitals` block

Top‑level options:

|| Property       | Type              | Default                        | Description                                                                 |
|| -------------- | ----------------- | ------------------------------ | --------------------------------------------------------------------------- |
|| `styleClass`   | String            | _none_                         | CSS class applied to the whole vitals grid.                                |
|| `hp_label`     | String            | `"HP"`                         | Label for the HP tracker.                                                  |
|| `stress_label` | String            | `"Stress"`                     | Label for the Stress tracker.                                              |
|| `armor_label`  | String            | `"Armor"`                      | Label for the Armor tracker.                                               |
||| `hope_label`   | String            | `"Hope"`                       | Label for the Hope tracker.                                               |
||| `hp`           | Number / String   | `0`                            | Number of HP boxes; supports templates and `frontmatter.*` shorthand.      |
||| `stress`       | Number / String   | `0`                            | Number of Stress boxes; templates allowed.                                 |
||| `armor`        | Number / String   | `0`                            | Number of Armor boxes; templates allowed.                                  |
||| `hope`         | Number / String   | `6` if missing/0               | Number of Hope diamonds; templates allowed (defaults to 6 if falsy).       |
|||| `hp_key`       | String            | `"din_health::NOTE_PATH"`              | State key for HP tracker (defaults to the current note path).              |
|||| `stress_key`   | String            | `"din_stress::NOTE_PATH"`              | State key for Stress tracker.                                              |
|||| `armor_key`    | String            | `"din_armor::NOTE_PATH"`               | State key for Armor tracker.                                               |
|||| `hope_key`     | String            | `"din_hope::NOTE_PATH"`                | State key for Hope tracker.                                                |
||| `hope_feature` | String / Object / Array | _none_                 | Optional text or list of `{label, value}` rows under the Hope tracker.     |
|| `footer`       | (alias)           | _none_                         | Alias for `hope_feature` (for backwards compatibility).                     |

## Single trackers (`hp`, `stress`, `armor`, `hope`)

In addition to the 4‑slot `vitals` grid, DH‑UI provides standalone tracker blocks:

- ```hp
- ```stress
- ```armor
- ```hope

These are useful when you want to place individual trackers in different parts of the layout (for example, Hope near Experiences, or Armor next to your equipment).

Each standalone tracker supports:

| Property                         | Type            | Default                          | Description                                                                 |
| -------------------------------- | --------------- | -------------------------------- | --------------------------------------------------------------------------- |
| `label`                          | String          | Block name in uppercase (e.g. `"HP"`) | Text label shown to the left of the boxes.                          |
| `state_key`                      | String          | _none_                           | Storage key for this tracker; required if you want it to persist.          |
| `uses`                           | Number / String | `0` (or `6` for `hope` if missing) | Number of boxes. Supports templates and `frontmatter.*` shorthand.    |
| `hp` / `stress` / `armor` / `hope` | Number / String | _none_                           | Optional aliases for `uses`; the field matching the block name takes priority when present. |
| `styleClass`                     | String          | _none_                           | CSS class applied to the outer tracker container, for custom styling.      |

Behavior notes:

- If both `uses` and a type‑specific field are provided (e.g. `hp:` in an `hp` block), the type‑specific field wins.
- `hope` trackers default to 6 boxes when `uses`/`hope` are omitted or resolve to 0.
- Like `vitals`, filled boxes are stored under `tracker:<state_key>` and participate in `dh:tracker:changed` events.

### Example – Standalone HP tracker

````yaml
```hp
label: "HP"
state_key: "din_health::Character/Dree"
uses: "{{ frontmatter.hp_max }}"
styleClass: 
```
````

### Example – Standalone Hope tracker

````yaml
```hope
label: "Hope"
state_key: "din_hope::Character/Dree"
# uses omitted → defaults to 6 diamonds
styleClass: 
```
````

## See also

|- [Rest – Short & Long](/events/rest) – uses these trackers to apply rest moves.
|- [Full Heal & Reset All](/events/heal-reset) – utilities to clear HP or all trackers in a note.
|- [Damage](/vitals%20and%20damage/damage) – tiered damage application that updates HP/Armor.
|- [State Storage](/concepts/state-storage) – how `hp_key`, `stress_key`, etc. are stored.
|- [Dynamic Content](/concepts/dynamic-content) – using templates to compute tracker sizes.
