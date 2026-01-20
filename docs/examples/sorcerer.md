---
name: Marlowe Fairwind
class: Sorcerer
subclass: Primal Origin
ancestry: Elf
heritage: Loreborne
level: 1
tier: 1
hp_max: 6
stress_max: 6
armor_slots: 3
hope_max: 6
domains:
  - arcana
  - midnight
vault:
loadout:
  - "[[DH_Compendium/abilities/Arcana/Unleash Chaos.md]]"
  - "[[DH_Compendium/abilities/Midnight/Rain of Blades.md]]"
evasion: 10
spellcast_trait: Instinct
equipped:
  - "[[DH_Compendium/equipment/weapons/Tier 1/Dualstaff.md]]"
  - "[[DH_Compendium/equipment/armor/Tier 1/Leather Armor.md]]"
---

# Marlowe Fairwind

```badges
styleClass:
items:
  - label: Character
    value: "{{ frontmatter.name }}"
  - label: Class
    value: "{{ frontmatter.class }}"
  - label: Subclass
    value: "{{ frontmatter.subclass }}"
  - label: Heritage
    value: "{{ frontmatter.ancestry }} ({{ frontmatter.heritage }})"
  - label: Level
    value: "{{ frontmatter.level }}"
  - label: Evasion
    value: "{{ frontmatter.evasion }}"
  - label: Spellcast Trait
    value: "{{ frontmatter.spellcast_trait }}"
```

---

## Traits

```traits
styleClass:
abilities:
  Agility: 0
  Strength: -1
  Finesse: 1
  Instinct: 2
  Presence: 1
  Knowledge: 0

bonuses:

```

These values are just an example; assign trait points per the SRD and adjust the YAML above to match your build.

---

## Vitals

```vitals
styleClass:
hp_label: "HP"
stress_label: "Stress"
armor_label: "Armor"
hope_label: "Hope"

hp: "{{ frontmatter.hp_max }}"
stress: "{{ frontmatter.stress_max }}"
armor: "{{ frontmatter.armor_slots }}"
hope: "{{ frontmatter.hope_max }}"

hp_key: "din_health::Characters/Marlowe"
stress_key: "din_stress::Characters/Marlowe"
armor_key: "din_armor::Characters/Marlowe"
hope_key: "din_hope::Characters/Marlowe"

hope_feature:
  - label: "Volatile Magic:"
    value: "Spend 3 Hope to reroll any number of your damage dice on an attack that deals magic damage."
```

This block renders HP, Stress, Armor, and Hope trackers that other blocks (rest, damage, etc.) will interact with using the same keys.

---
## Damage

```damage
styleClass:
title: "Damage"

hp_key: din_health
armor_key: din_armor::{{ file.path }}

# thresholds – these override base_major/base_severe when present
major_threshold: "{{ frontmatter.major_threshold }}"
severe_threshold: "{{ frontmatter.severe_threshold }}"

# fallback base thresholds if frontmatter is missing
base_major: 3
base_severe: 6

# add level on top of thresholds
level: "{{ frontmatter.level }}"

class: test-damage
```

This block lets you enter a damage amount (and Armor used) and then applies the resulting tiered damage directly to your existing HP and Armor trackers, using the same state keys as your vitals block.

---

## Rest & Level Up controls

```rest
styleClass:
rest_label: "Rest"
short_label: "Short Rest"
long_label: "Long Rest"
levelup_label: "Level Up"

show_short: true
show_long: true
show_levelup: true
show_full_heal: true
show_reset_all: true

hp_key: "din_health::Characters/Marlowe"
stress_key: "din_stress::Characters/Marlowe"
armor_key: "din_armor::Characters/Marlowe"
hope_key: "din_hope::Characters/Marlowe"

max_picks: 2
```

Place this block under your `vitals` block so it can auto-detect the trackers. The Level Up button will open DH-UI's Level Up modal for this note.

---

## Features (heritage, class, subclass)

```features
styleClass:
layout: grid

ancestry:
  - from: "Elf"
    label: "Quick Reactions"
    value: "Mark a Stress to gain advantage on a reaction roll."
  - from: "Elf"
    label: "Celestial Trance"
    value: "During a rest, you can drop into a trance to choose an additional downtime move."

community:
  - from: "Loreborne"
    label: "Well‑Read"
    value: "You have advantage on rolls that involve the history, culture, or politics of a prominent person or place."

class:
  - from: "Sorcerer"
    label: "Arcane Sence"
    value: "You can sense the presence of magical people and objects within Close range."
  - from: "Sorcerer"
    label: "Minor Illusion"
    value: "Make a Spellcast Roll (10). On a success, you create a minor visual illusion no larger than yourself within Close range. This illusion is convincing to anyone at Close range or farther."
  - from: "Sorcerer"
    label: "Channel Raw Power"
    value: |
      Once per long rest, you can place a domain card from your loadout into your vault and choose to either:
      - Gain Hope equal to the level of the card.
      - Enhance a spell that deals damage, gaining a bonus to your damage roll equal to twice the level of the card.

subclass:
  - from: "Primal Origin"
    tier: "Foundation"
    label: "Manipulate Magic"
    value: |
     Your primal origin allows you to modify the essence of magic itself. After you cast a spell or make an attack using a weapon that deals magic damage, you can mark a Stress to do one of the following:
      - Extend the spell or attack’s reach by one range
      - Gain a +2 bonus to the action roll’s result 
      - Double a damage die of your choice
      - Hit an additional target within range

  - from: "Primal Origin"
    tier: "Specialization"
    label: "Enchanted Aid"
    value: "You can enhance the magic of others with your essence. When you Help an Ally with a Spellcast Roll, you can roll a d8 as your advantage die. Once per long rest, after an ally has made a Spellcast Roll with your help, you can swap the results of their Duality Dice."
    
  - from: "Primal Origin"
    tier: "Mastery"
    label: "Arcane Charge"
    value: "You can gather magical energy to enhance your capabilities. When you take magic damage, you become Charged. Alternatively, you can spend 2 Hope to become Charged. When you successfully make an attack that deals magic damage while Charged, you can clear your Charge to either gain a +10 bonus to the damage roll or gain a +3 bonus to the Difficulty of a reaction roll the spell causes the target to make. You stop being Charged at your next long rest."
```

This block summarizes the ancestry, community, class, and subclass features that Marlowe has at level 1, matching the SRD Sorcerer (Primal Origin).

---

## Experiences

```experiences
styleClass:
items:
  - name: "Storm-Born"
    note: "You survived a violent storm as a child; since then, thunder and wind answer your emotions."
    bonus: +2

  - name: "Whispers of the Wild"
    note: "Spirits of stone, root, and river sometimes speak in the edge of your hearing, guiding your steps."
    bonus: +2
```

These are homebrew experiences, but they work with the SRD rule that Sorcerer can Utilize an Experience (and Primal Origin Adept feature modifies that move).

---

## Domain cards summary

```domainpicker
# Only look for Domain cards under these folders:
folders:
  - DH_Compendium/abilities/Arcana
  - DH_Compendium/abilities/Midnight
# Modal view for picking cards: 'card' or 'table (no art)'
view: table
# Per-block override for max equipped Domain cards
max_loadout: 5
# Use the character's level and domains frontmatter for default filters
use_character_filters: true
```

This badge block just summarizes the two domain cards Marlowe has chosen at level 1.
The actual card notes would live elsewhere in your vault and be managed with the Domain Picker.

---

## Consumables

You can add a `consumables` block if you want to track anything and the number of uses it has (like having 3 Minor Health Potions in your inventory) on the same sheet:

````yaml
```consumables
styleClass:
label: "Minor Health Potion (1d4)"
state_key: "din_minor_health_single"
uses: 3
```
````

---

````yaml
```equipmentpicker
# optional per-block overrides
folders:
  - "DH_Compendium/equipment"
enforce_tier: true   # default: use character tier to hide too-high-tier items
view: table          # or "card" for card-style tiles
```
````

These are to demonstrate how DH-UI can also track consumables and let you manage weapons/armor for a character.