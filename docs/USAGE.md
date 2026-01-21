# Quick Start

::: warning Development Status
DaggerHeart-UI is still under active development. Names, options, and visuals may change between versions.
:::

## Installation

::: warning BRAT Required
DaggerHeart-UI is not published to the Obsidian Community Plugin store yet. Install it using the [BRAT](https://github.com/TfTHacker/obsidian42-brat) plugin.
:::

1. In Obsidian, install and enable the **BRAT** plugin.
2. In BRAT settings, add this repository as a beta plugin:
   `https://github.com/NoMansbacon/Daggerheart-UI`
3. Let BRAT install/update the plugin.
4. Enable **DaggerHeart-UI Character Sheets** in *Settings → Community plugins*.

## Your first character sheet

Create a new note and start with minimal Daggerheart frontmatter plus a few core blocks.

````markdown
---
name: Marlowe
level: 1
hp: 6
stress: 4
armor: 2
hope: 6
---

```traits
abilities:
  Agility: 0
  Strength: 0
  Finesse: 0
  Instinct: 0
  Presence: 0
  Knowledge: 0
bonuses:
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

Many blocks (vitals, hp/stress/armor/hope trackers, consumables, damage, etc.) store their state using a stable key.

By default, vitals and trackers use keys that include the full path of the current note (for example `din_health::Characters/Marlowe`), so each note’s pools are independent.
You can override these keys (for example setting `hp_key: "din_health"` or `state_key: "din_rage"`) when you want multiple blocks or notes to share the same resource.

Use stable, unique keys per resource. Reusing the same key in two blocks makes them share the same pool.

### File scope

Most effects (rest, damage, some events) only operate within the **current note preview**:

- A `rest` block looks for vitals/trackers in the same note.
- Damage uses the keys configured in the same note.

This lets each character sheet have its own trackers and rest controls without interfering with others.

### Templates & dynamic values

Anywhere you can provide a string in YAML, you can usually use templates like <span v-pre>`{{ frontmatter.hp }}`</span> or helpers like <span v-pre>`{{ add 2 frontmatter.level }}`</span>.

See **Dynamic Content** for the full list of paths (`frontmatter.*`, `traits.*`, `skills.*`, `character.*`) and helpers (`add`, `subtract`, `multiply`, `divide`, `floor`, `ceil`, `round`, `modifier`).

### Multiple blocks and layout

Most DH-UI blocks are independent: you can use the same block type more than once in a note to control layout.

- For example, you can have one `features` block that only shows ancestry and community features, and a second `features` block that only shows class and subclass features, placing them in different columns.
- Similarly, you can use several smaller `badges`, `consumables`, or `experiences` blocks instead of one large block when it makes your character sheet easier to read.

State-based blocks (like `vitals`, `consumables`, and pickers) stay in sync as long as you reuse the same state keys (`hp_key`, `state_key`, `vault` / `loadout` lists, etc.).

## Next steps

- Read the **[Code Block Reference](/blocks)** for links to every block.
- Dive into specific block pages under **Character Sheet**, **Resources & Inventory**, and **Display & Story** in the sidebar.
- Check **[Dynamic Content](/concepts/dynamic-content)** and **[Events](/concepts/events)** for advanced template usage and how internal events tie blocks together.

---

### Legal

This plugin is an unofficial fan work built for the Daggerheart roleplaying game. It uses Public Game Content from the Daggerheart System Reference Document 1.0 under the Darrington Press Community Gaming (DPCGL) License. Daggerheart and all related properties are © Critical Role, LLC. This project is not affiliated with, endorsed, or sponsored by Critical Role, Darrington Press, or their partners.
