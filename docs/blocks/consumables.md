# Consumables

The consumables component is used to track limited‑use resources as clickable pips (boxes). Each row represents a resource (like a potion, domain card token, or once‑per‑scene move) with a label and a row of uses you can spend and restore.

You can use it for:

•  Potions and elixirs  
•  Charges on magic items    
•  Session‑based or day‑based limited abilities 

Each consumable row:

•  Shows a label.  
•  Displays a row of uses as boxes.  
•  Stores current filled boxes in persistent state, so it survives Obsidian restarts.

## Dynamic Content

`uses` supports dynamic content using template variables with <span v-pre>`{{ }}`</span> style templates. This lets you compute the maximum number of uses from frontmatter or other values, for example:

•  Tie a potion’s uses to a frontmatter field like <span v-pre>`frontmatter.hp_potions`</span>.  
•  Compute uses from a formula like <span v-pre>`{{ add 1 frontmatter.slots }}`</span>.  

The uses field is processed with the same template engine as other blocks (badges, vitals, damage, features, etc.).

See the [Events (API)](/events/templates-events) page for more information on using templates.

## Example – Consumables

````markdown
```consumables
styleClass:
items:
  - label: "Minor Health Potion"
    state_key: "din_minor_health_potion"
    uses: 2  

  - label: "Stride Potion"
    state_key: "din_stride_potion"
    uses: 1 

```
````

- **Click** a box to toggle it on/off.  
- The current filled count is saved using `state_key`, so it stays in sync across note reloads.

## Example – Single consumable at root

For a quick one‑off consumable, you can omit `items` and define a single item at the root:

```consumables
styleClass:
label: "Minor Health Potion"
state_key: "din_minor_health_single"
uses: 3
```

## Example – Map style `items`

You can also define items as a map instead of a list:

```consumables
styleClass: 
items:
  hp:
    label: "Minor Health Potions"
    state_key: "din_minor_health_pots"
    uses: 3

  stride:
    label: "Stride Potions"
    state_key: "din_stride_potions"
    uses: "{{ frontmatter.stride_potions }}"
```

Functionally this is the same as the list version; the keys (`hp`, `sp`) are just for organization in YAML.

## Configuration

Top‑level `consumables` block options:

| Property     | Type                       | Default | Description                                                                 |
| ------------ | -------------------------- | ------- | --------------------------------------------------------------------------- |
| `styleClass` | String                     | _none_  | Optional CSS class name applied to the whole consumables block container.   |
| `items`      | Array or Object (map)     | `[]`    | List or map of consumable items.                                            |
| `label`      | String (root single item) | `"Consumable"` | Label for a single consumable when not using `items`.                       |
| `state_key`  | String (root single item) | `""`    | Storage key for a single consumable when not using `items`.                |
| `uses`       | Number / String (root)    | `0`     | Maximum uses for a single consumable when not using `items`. Templates allowed. |

### Consumable Item

Each entry under `items` (in either array or map form) is an object:

| Property    | Type                 | Description                                                                 |
| ----------- | -------------------- | --------------------------------------------------------------------------- |
| `label`     | String               | Display name for the consumable (e.g. `"Health Potions"`).                 |
| `state_key` | String               | Key used to store filled uses. Must be stable and unique per resource.     |
| `uses`      | Number / String      | Maximum number of uses (boxes). Strings are processed as templates.        |

Behavior details:

- `uses` is clamped to a non‑negative integer.  
- `state_key` is required for persistence; without it, the consumable will render but won’t save its state between reloads.  
- State is stored per key, so you can reuse a `state_key` across different notes to show the same consumable multiple places.  

This makes the `consumables` block ideal for tracking any limited‑use resource that should feel like a small pool of checkboxes on your character sheet.
