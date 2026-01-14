# Traits & Abilities

The traits block shows your six core abilities as cards with totals and a proficiency toggle for each:

•  Agility  
•  Strength  
•  Finesse  
•  Instinct  
•  Presence  
•  Knowledge  

It:

•  Combines base ability scores with trait bonuses from YAML.  
•  Renders one card per ability with a short label (AGI, STR, etc.) and the final modifier.  
•  Lets you toggle proficiency on/off per ability; the toggle state is saved via localStorage.  
•  Feeds the abilities.* template context (used in badges/features/etc.).

The block is registered under:

•  traits – primary name.  
•  ability – alias.

## YAML structure

The traits block expects a small YAML document with:

•  abilities – base scores.  
•  bonuses – trait bonuses (preferred key).  
•  trait – legacy alias for trait bonuses (still supported).

All three accept maps keyed by ability name, and bonuses can also be arrays of maps that get summed.

## Example – Base abilities + one bonuses map
```yaml
```traits
abilities:
  Agility: 1
  Strength: 0
  Finesse: 0
  Instinct: 0
  Presence: 0
  Knowledge: 0

bonuses:
  Agility: 1       # from a trait
  Presence: 2      # from ancestry or class
```
```

### Rendered cards will show:

- **AGI**: base 1 + bonus 1 = `+2`  
- **PRE**: base 0 + bonus 2 = `+2`  
- Others use `0` as default if omitted.

## Example – Multiple trait sources

You can provide bonuses as a **list** if you want to keep sources separate in YAML:

```yaml
```traits
abilities:
  Agility: 1
  Strength: 0
  Finesse: 0
  Instinct: 0
  Presence: 0
  Knowledge: 0

bonuses:
  - Agility: 1         # from ancestry
    Finesse: 1
  - Presence: 1        # from class
  - Presence: 1        # from background
```
```

### Internally, all bonus maps are summed:

- Agility: `1 (base) + 1 = 2`  
- Finesse: `0 (base) + 1 = 1`  
- Presence: `0 (base) + 1 + 1 = 2`  

You can also still use the older `trait:` key instead of `bonuses:`, but new notes should prefer `bonuses:`.

## Proficiency toggles

Each ability card has a small **toggle pill**:

- Clicking the toggle marks that ability as “on” (proficient) or “off”.  
- The state is stored in `localStorage` under a per‑ability key like:  
  `dh:traitToggle:<filePath>:<AbilityName>`  
- When the note is reloaded, the block reads those keys and restores the toggles.

Advanced integrations can fire the `dh:ability:refresh` event if they change toggles programmatically; the traits view listens for that and re‑reads `localStorage`.

## Templates integration (`abilities.*`)

The nearest ```traits block in a section is used by the template engine to power `abilities.*`:

- After parsing your `traits` YAML, the plugin computes final totals (`base + bonuses`) for each ability.
- Those totals are exposed in templates as `abilities.<name>`, for example:
  - `{{ abilities.agility }}`
  - `{{ abilities.strength }}`
  - `{{ abilities.knowledge }}`

Names are matched **case‑insensitively**, so `abilities.Agility` and `abilities.agility` both work.

You can then use these in other blocks, e.g.:

```yaml
```badges
items:
  - label: "Agility"
    value: "{{ abilities.agility }}"
  - label: "Presence"
    value: "{{ abilities.presence }}"
```
```

or combined with helpers:

```yaml 
```badges
items:
  - label: "Defense"
    value: "{{ add abilities.agility abilities.instinct }}"
```
```

## Configuration summary – `traits` block

Top‑level options:

| Property    | Type                         | Description                                                                 |
| ----------- | ---------------------------- | --------------------------------------------------------------------------- |
| `abilities` | Map `AbilityName -> Number`  | Base scores for the six abilities. Missing ones default to 0.              |
| `bonuses`   | Map or Array of Maps         | Trait/feature bonuses; all maps are summed by ability.                     |
| `trait`     | Map or Array of Maps         | Legacy alias for `bonuses` (still supported but not recommended for new notes). |
