# Quick Start

::: warning Development Status
DH-UI is still under active development. Names, options, and visuals may change between versions.
:::

## Installation

::: warning BRAT Required
DH-UI is not published to the Obsidian Community Plugin store yet. Install it using the [BRAT](https://github.com/TfTHacker/obsidian42-brat) plugin.
:::

1. In Obsidian, install and enable the **BRAT** plugin.
2. In BRAT settings, add this repository as a beta plugin:
   `https://github.com/NoMansbacon/DH-UI`
3. Let BRAT install/update the plugin.
4. Enable **Daggerheart Tooltips (DH-UI)** in *Settings → Community plugins*.

## Your first character sheet

Create a new note and start with minimal Daggerheart frontmatter plus a few core blocks.

````markdown
---
name: Thalia
level: 1
hp: 6
stress: 4
armor: 2
hope: 6
---

```traits
# usually no YAML needed – reads from frontmatter + your traits config
```

```vitals
hp: "{{ frontmatter.hp }}"
stress: "{{ frontmatter.stress }}"
armor: "{{ frontmatter.armor }}"
hope: 6
```

```rest
show_short: true
show_long: true
show_levelup: true
show_full_heal: true
show_reset_all: true
```
````

Switch to **Reading / Preview** mode in Obsidian to see the interactive UI.

## Important concepts

### State keys

Many blocks (vitals, hp/stress/armor/hope trackers, consumables, damage, etc.) store their state using a stable `state_key`.

- HP typically uses `din_health` so all sheets share the same HP pool for that character.
- Stress / Armor / Hope default to keys that include the note path (e.g. `din_stress::<note-path>`), so they are scoped per character sheet.

Use stable, unique keys per resource. Reusing the same key in two blocks makes them share the same pool.

### File scope

Most effects (rest, damage, some events) only operate within the **current note preview**:

- A `rest` block looks for vitals/trackers in the same note.
- Damage uses the keys configured in the same note.

This lets each character sheet have its own trackers and rest controls without interfering with others.

### Templates & dynamic values

Anywhere you can provide a string in YAML, you can usually use templates like <span v-pre>`{{ frontmatter.hp }}`</span> or helpers like <span v-pre>`{{ add 2 frontmatter.level }}`</span>.

See **Templates & Events** for the full list of paths (`frontmatter.*`, `abilities.*`, `skills.*`, `character.*`) and helpers (`add`, `subtract`, `multiply`, `divide`, `floor`, `ceil`, `round`, `modifier`).

## Next steps

- Read the **[Code Block Reference](/blocks)** for links to every block.
- Dive into specific block pages under **Character Sheet**, **Resources & Inventory**, and **Display & Story** in the sidebar.
- Check **[Templates & Events](/events/templates-events)** for advanced dynamic content and event integration.
