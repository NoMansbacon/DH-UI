# Features

The features component is used to display ancestry, class, subclass, and community features in a structured, readable layout. It supports multiclass and multi‑subclass setups, grouping features by their source (e.g. class name) and tier.

You can use it for:

•  Ancestry traits  
•  Class features  
•  Subclass tiers (Foundation / Specialization / Mastery)  
•  Community / background abilities  

## Dynamic Content

Feature values support dynamic content using template variables with <span v-pre>`{{ }}`</span> style templates. This lets you pull in values from frontmatter or calculated values, for example:

•  Show a damage bonus that depends on level.  
•  Reference a trait or ancestry name stored in frontmatter.  
•  Inject small Markdown snippets (bold, lists, etc.) into feature text.  

Templates are processed the same way as in other blocks (badges, vitals, damage, etc.).

See the Templates & Events page for more information on using templates.

## Example – Single‑class

<!-- Example image intentionally omitted to avoid broken link in docs build -->

## Example – Single‑class
styleClass: dh-features--character-sheet
layout: grid
ancestry:
  - label: "Emberborn"
    value: "Fire‑aligned ancestry from the Ashen Realms."
class:
  - from: "Warrior"
    label: "Second Wind"
    value: "Once per rest, you may recover a burst of HP."
subclass:
  - from: "Sentinel"
    tier: "Foundation"
    label: "Hold the Line"
    value: "Enemies have trouble pushing past you when you defend a space."
community:
  - label: "Free City Guard"
    value: "Sworn to protect the city of Vyr."
```

## Example - Multiclass with tiers

```features
styleClass: dh-features--multiclass
layout: grid
ancestry:
  - from: "Emberborn"
    label: "Flameborn"
    value: "You survived the Ashen Realms; fire and smoke no longer faze you."
  - from: "Void‑touched"
    label: "Starlit Eyes"
    value: "Your eyes glow faintly in the dark; you can see into the edges of the Void."
class:
  - from: "Warrior"
    label: "Battle Training"
    value: "Comfortable in heavy armor and with martial weapons."
  - from: "Invoker"
    label: "Channel Starlight"
    value: "Call down distant starlight to guide or harm."
subclass:
  - from: "Sentinel"
    tier: "Foundation"
    label: "Hold the Line"
    value: "When you defend a space, enemies struggle to move past you."
  - from: "Sentinel"
    tier: "Specialization"
    label: "Shield Wall"
    value: "You can extend your protection to adjacent allies."
  - from: "Starcaller"
    tier: "Foundation"
    label: "Guiding Star"
    value: "Once per scene, add +2 to an ally’s roll by invoking a guiding star."
community:
  - from: "Order of the Lantern"
    label: "Oath of Vigilance"
    value: "You watch for signs of planar breach and take responsibility for closing them."
```

The block will:

- Group **Ancestry**, **Class**, and **Community** entries by `from` (source name), with headings like “Class – Warrior”.  
- Group **Subclass** entries by `from` and then by `tier` (`Foundation`, `Specialization`, `Mastery`, or `Other`).  

### Configuration

Top‑level `features` block options:

| Property     | Type    | Default | Description                                                                                 |
| ------------ | ------- | ------- | ------------------------------------------------------------------------------------------- |
| `styleClass` | String  | _none_  | Optional CSS class name applied to the features container (preferred styling hook).        |
| `layout`     | String  | `list`  | Overall layout: `list` (stacked) or `grid` / `masonry`.                                    |
| `cols`       | Number  | _none_  | Optional preferred number of columns for grid/masonry layouts (used via a CSS variable).   |
| `ancestry`   | Array   | `[]`    | Ancestry features.                                                                          |
| `class`      | Array   | `[]`    | Class features (see notes below about the `class` key).                                    |
| `subclass`   | Array   | `[]`    | Subclass features (supports `from` + `tier` grouping).                                     |
| `community`  | Array   | `[]`    | Community / background features.                                                            |

### Feature Item

Each entry under `ancestry`, `class`, `subclass`, or `community` is an object:

| Property | Type                     | Description                                                                                 |
| -------- | ------------------------ | ------------------------------------------------------------------------------------------- |
| `label`  | String                   | Short label/title for the feature (optional but recommended).                              |
| `value`  | String / Number / Bool   | Description text or Markdown content (templates allowed).                                   |
| `from`   | String                   | Source name (e.g. `"Warrior"`, `"Invoker"`, `"Sentinel"`). Used for grouping.              |
| `tier`   | String                   | Tier or slot label (e.g. `"Foundation"`, `"Specialization"`, `"Mastery"`). Used to bucket subclass features. |

- `from` and `tier` are optional, but they unlock the smarter grouping:
  - For `ancestry`, `class`, `community`: cards are grouped by `from` (source) with headings.  
  - For `subclass`: cards are grouped by `from` (subclass name), then by `tier` (Foundation / Specialization / Mastery / Other).  

This gives you a flexible way to mirror Daggerheart’s ancestry/class/subclass/community structure while keeping the YAML close to the rules text.