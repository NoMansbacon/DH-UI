# Badges & Features

## Badges (`badges`)

Simple label–value badges, often used for level, ancestry, class, etc.

![Badges](/images/Badges.webp.png)

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

- `items[].label` – badge label.
- `items[].value` – text/value (literal or template).
- `class` – optional CSS class.

## Features (`features`)

Displays ancestry, class, subclass, and community features in either list or grid layouts.

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

Grid layout variant:

```features
layout: grid
ancestry:
  - label: "Emberborn"
    value: "Fire‑aligned ancestry from the Ashen Realms."
# ...
```
```

- `ancestry`, `class`, `subclass`, `community` – each a list of `{ label, value }` entries.
- `layout` – `list` (default) or `grid`.
