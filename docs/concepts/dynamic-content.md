# Dynamic Content

::: v-pre
Dynamic content lets you calculate values from your Daggerheart character data using `{{ }}` templates inside block YAML.
:::

Anywhere you can provide a string in a DH-UI block, you can usually use templates like `{{ frontmatter.hp }}` or `{{ add 2 traits.agility }}`.

This page focuses on how to read values; see **State Storage** for how those values are persisted.

## Template paths

These are the main paths available inside `{{ ... }}`:

### `frontmatter.*`

Access raw fields from the current note's YAML frontmatter.

```yaml
---
name: Thalia
level: 3
tier: 2
hp_max: 10
stress_max: 6
---
```

You can reference them as:

```yaml
value: "{{ frontmatter.level }}"      # → 3
value: "{{ frontmatter.hp_max }}"    # → 10
value: "{{ frontmatter.name }}"      # → "Thalia"
```

### `traits.*`

DH-UI exposes the six core Daggerheart traits from the nearest ```traits block in the same section.

After parsing your `traits` YAML, the plugin computes final totals (`base + bonuses`) for:

- Agility
- Strength
- Finesse
- Instinct
- Presence
- Knowledge

These totals are available as:

```yaml
value: "{{ traits.agility }}"
value: "{{ traits.presence }}"
value: "{{ traits.knowledge }}"
```

Names are matched case-insensitively, so `traits.Agility` and `traits.agility` both work.

### `skills.*`

If your frontmatter defines a `skills` map or list, you can access it through `skills.*`.

Map form:

```yaml
skills:
  attack: 2
  sneak: 3
```

List form:

```yaml
skills:
  - name: attack
    value: 2
  - name: sneak
    value: 3
```

In both cases you can write:

```yaml
value: "{{ skills.attack }}"   # → 2
value: "{{ skills.sneak }}"    # → 3
```

### `character.*`

DH-UI builds a small summary object from frontmatter for convenience:

- `character.name` – from `name` or `title`
- `character.level` – from `level` or `tier`
- `character.tier` – from `tier` or `level`
- `character.hp` – from `hp` / `health` / `din_health`
- `character.stress` – from `stress` / `din_stress`
- `character.armor` – from `armor` / `din_armor`
- `character.hope` – from `hope` / `din_hope`

Example:

```yaml
value: "{{ character.level }}"   # → 3
value: "{{ character.hp }}"      # → 10
```

## Helper functions

You can use simple helpers for arithmetic:

```yaml
value: "{{ add 2 frontmatter.level }}"          # 2 + level
value: "{{ subtract frontmatter.hp 2 }}"       # hp - 2
value: "{{ multiply 2 traits.agility }}"       # 2 × agility
value: "{{ divide frontmatter.hp_max 2 }}"     # hp_max / 2
value: "{{ floor divide frontmatter.hp 2 }}"   # floor(hp / 2)
```

Supported helpers:

- `add a b c ...` – sum of all arguments.  
- `subtract a b c ...` – a - b - c - ....  
- `multiply a b c ...` – product of all arguments.  
- `divide a b c ...` – a / b / c / ... (division by zero → NaN → treated as 0 when a number is needed).  
- `floor x` – round down.  
- `ceil x` – round up.  
- `round x` – nearest integer.  
- `modifier x` – pass-through numeric value (mainly for readability).

Arguments can be:

- Plain numbers: `2`, `3.5`, `-1`.  
- Template paths: `frontmatter.level`, `traits.agility`, `skills.attack`, `character.hp`.

If a token cannot be parsed as a number, it is treated as 0 for numeric helpers.

## Common use cases

### Trait-based badges

```badges
items:
  - label: "Agility"
    value: "{{ traits.agility }}"
  - label: "Defense"
    value: "{{ add traits.agility traits.instinct }}"
```

### Frontmatter-driven vitals

```yaml
---
hp_max: 12
stress_max: 6
armor_slots: 3
hope_max: 6
---

```vitals
hp: frontmatter.hp_max
stress: "{{ frontmatter.stress_max }}"
armor: "{{ frontmatter.armor_slots }}"
hope: "{{ frontmatter.hope_max }}"
```
