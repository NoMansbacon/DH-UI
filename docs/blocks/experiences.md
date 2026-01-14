# Experiences

The experiences component is used to list personal experiences that players can invoke for bonuses. Each experience is a short story hook plus an optional modifier (like +2) that players can apply when it meaningfully impacts a roll.

You can use it for:

•  Character backstory moments that grant bonuses.  
•  Session‑earned experiences and scars.  
•  GM‑granted flags that invite specific kinds of play.  

Each experience row shows:

•  A name (or short title).  
•  A note describing what happened or how it matters.  
•  A bonus value (like +2) to apply when used.  
•  A helper line reminding players how to use experiences at the table.

> The block intentionally does not encode which rolls an experience applies to; that stays a conversation between player and GM.

## Example – Experiences list

```yaml
```experiences
styleClass: 
items:
  - name: "Saved by the Stranger"
    note: "You owe a favor to the mysterious stranger who pulled you from the river."
    bonus: +2

  - name: "Haunted by the Flames"
    note: "You survived a village fire that still stalks your dreams."
    bonus: +2

  - name: "Sworn to the Lantern"
    note: "You have sworn to hunt down planar breaches in the name of the Order."
    bonus: +2
```
```

## When rendered:

- Each entry becomes a row with the name, note, and a `+2` (or similar) badge.  
- A helper text at the bottom explains: spend **1 Hope** and add the listed bonus when you and the GM agree an experience is relevant.

## Example – Single experience at root

For a quick one‑off experience, you can omit `items` and define a single item at the root:

```yaml
```experiences
styleClass:

name: "Marked by the Storm"
note: "The storm left a crackling mark along your arm; you sometimes hear distant thunder when danger approaches."
bonus: +2
```
```

## Example – Map style `items`

You can also define experiences as a map instead of a list:

```yaml
```experiences
styleClass: dh-experiences--sidebar
items:
  river:
    name: "Friend of the Riverfolk"
    note: "You grew up among the Riverfolk and know their customs and secrets."
    bonus: +1

  void:
    name: "Glimpse of the Void"
    note: "You once looked beyond the veil. The memory is terrifying but useful."
    bonus: +2
```
```

Functionally this is the same as the list version; the keys (`river`, `void`) are just for organizing your YAML.

## Configuration

Top‑level `experiences` block options:

| Property     | Type                    | Default | Description                                                                 |
| ------------ | ----------------------- | ------- | --------------------------------------------------------------------------- |
| `styleClass` | String                  | _none_  | Optional CSS class applied to the entire experiences block container.       |
| `items`      | Array or Object (map)  | `[]`    | List or map of experience items.                                            |
| `name`       | String (root single)   | `"Experience"` | Name/title when defining a single experience at the root.            |
| `note`       | String (root single)   | `""`    | Description text for a single root experience.                              |
| `bonus`      | Number / String        | `+2`    | Default block‑level bonus when defined at the top; per‑item `bonus` overrides this. |


### Experience Item

Each entry under `items` (in either array or map form) is an object:

| Property | Type             | Description                                                                 |
| -------- | ---------------- | --------------------------------------------------------------------------- |
| `name`   | String           | Main title for the experience (e.g. `"Saved by the Stranger"`).           |
| `title`  | String           | Alias for `name`; used if `name` is not provided.                          |
| `label`  | String           | Another alias for `name`; useful when migrating older notes.              |
| `note`   | String           | Description text of what happened or how this experience matters.         |
| `description` / `summary` | String | Aliases for `note`; first non‑empty value is used.                      |
| `bonus`  | Number / String  | Modifier value for this specific experience (e.g. `+2` or `-1`). Overrides the block default. |

Behavior details:

- `bonus` is parsed from either a number (`2`, `-1`) or a string (`"+2"`, `"3"`).  
- If an item has no `bonus`, it uses the block‑level default (which is `+2` unless overridden).  
- Text fields (`name`, `note`, etc.) are rendered as plain text, not Markdown, to keep the layout simple and consistent.  

At the table, this gives players a clear, compact list of experiences and exactly what they’re worth when invoked, while keeping the role‑play and negotiation about when they apply front and center.