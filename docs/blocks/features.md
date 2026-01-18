# Features

The features component is used to display ancestry, class, subclass, and community features in a structured, readable layout. It supports multiclass and multi‑subclass setups, grouping features by their source (e.g. class name) and tier.

You can use it for:

•  Ancestry traits  
•  Class features  
•  Subclass tiers (Foundation / Specialization / Mastery)  
•  Community / background features  

## Dynamic Content

Feature values support dynamic content using template variables with <span v-pre>`{{ }}`</span> style templates. This lets you pull in values from frontmatter or calculated values, for example:

•  Show a damage bonus that depends on level.  
•  Reference a trait or ancestry name stored in frontmatter.  
•  Inject small Markdown snippets (bold, lists, etc.) into feature text.  

Templates are processed the same way as in other blocks (badges, vitals, damage, etc.).

See the Templates & Events page for more information on using templates.

## Example – Single‑class

![Features block rendering example](../images/example_features.webp)

```features
styleClass: dh-features--character-sheet
layout: grid
ancestry:
  - label: "Infernis"
    value: "An ancestry touched by planar fire; your magic often burns bright and hot."
class:
  - from: "Warrior"
    label: "Second Wind"
    value: "Once per rest, you catch your breath and recover a small amount of HP."
community:
  - label: "Loreborne"
    value: "Scholars and storytellers who keep your people’s history alive."
```

## Example - Multiclass with tiers

```features
styleClass: dh-features--multiclass
layout: grid
ancestry:
  - from: "Human"
    label: "Versatile Origins"
    value: "Your ancestry is known for adapting quickly to new challenges."
  - from: "Ribbet"
    label: "Marsh‑born"
    value: "Growing up among the wetlands left you sure‑footed in difficult terrain."
class:
  - from: "Warrior"
    label: "Battle Training"
    value: "You are comfortable in armor and with a wide range of weapons."
  - from: "Wizard"
    label: "Arcane Study"
    value: "Years of study have taught you the fundamentals of spellcasting."
community:
  - from: "Highborne"
    label: "Noble Upbringing"
    value: "You were raised among Highborne traditions and expectations."
  - from: "Wanderborne"
    label: "Road‑Tested"
    value: "Life on the road has made you resilient and quick to read a crowd."
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