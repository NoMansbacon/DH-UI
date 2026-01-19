# State Storage

DH-UI uses a persistent state storage system to remember the current state of your trackers and other values between Obsidian sessions.

This page explains how **state keys** work and how to choose them.

## What is stored

The plugin stores things like:

- HP / Stress / Armor / Hope tracker fill counts.  
- Uses remaining on `consumables` rows.  
- Toggle states on traits cards.  
- Token counts and other per-card values in pickers.

All of this is keyed by a **state key** string.

## State keys

### Basic idea

A state key is a string that identifies a particular resource (a tracker row, a consumable, etc.).

Examples:

```yaml
# Consumables
state_key: "din_hp_pots"

# Vitals (defaults)
hp_key: "din_health::Character/Dree"
stress_key: "din_stress::Character/Dree"
armor_key: "din_armor::Character/Dree"
hope_key: "din_hope::Character/Dree"
```

When you click on a tracker or spend a consumable, DH-UI writes the new filled value to its state key so it can be restored later.

### Uniqueness

State keys should be **stable** and **non-ambiguous**:

- If two components use the **same** key, they will **share** the same state.  
- If you want separate resources, give them different keys.  

Good patterns:

- Prefix keys with a namespace like `din_` to avoid collisions with other plugins.  
- Include the character or file name when you want per-character pools.

Examples:

- ❌ `domain_tokens`
- ✅ `din_domain_tokens::Character/Dree`

## Defaults for trackers

The `vitals` block and related single-track blocks use note-scoped defaults based on the current file path:

```yaml
# Implicit defaults if you omit keys
hp_key:    "din_health::NOTE_PATH"
stress_key:"din_stress::NOTE_PATH"
armor_key: "din_armor::NOTE_PATH"
hope_key:  "din_hope::NOTE_PATH"
```

Where `NOTE_PATH` is your Obsidian note path (for example, `Characters/Elira`).

This means:

- Each character note gets its own HP / Stress / Armor / Hope pools by default.  
- To share a pool across multiple notes, you can set a **custom key** like `din_health::Party` in all of them.

## Sharing vs. isolating state

### Independent per-note trackers

For most character sheets you want **per-note** trackers:

````yaml
```vitals
hp: 10
stress: 6

# Let DH-UI pick defaults (note-scoped keys)
# hp_key / stress_key omitted
```
````

Each file gets its own HP/stress values, and rest/damage automatically target the correct trackers in that file.

### Shared pools

If you want a shared HP pool visible in multiple notes, set the same `hp_key` explicitly:

````yaml
```vitals
hp: 10
hp_key: "din_health::Party"
```
````

Any `vitals`, `hp`, `rest`, or `damage` blocks that use `hp_key: "din_health::Party"` will read and write the same HP value.

## Where it is stored

Internally, the plugin stores these values in its own state file (configured in settings) using a JSON-like key/value structure. Keys look like:

- `tracker:din_health::Characters/Dree`  
- `tracker:din_hp_pots`  

You normally never need to edit this file by hand; just choose good state keys and let the plugin manage the rest.

## Best practices

- Use **note-scoped defaults** for most cases; only override keys when you have a reason.  
- Use clear prefixes like `din_` for your own keys.  
- Avoid short, generic keys that might collide with other resources.  
- When debugging, check that your vitals, rest, and damage blocks are all pointing at the same `hp_key` if they are meant to work together.