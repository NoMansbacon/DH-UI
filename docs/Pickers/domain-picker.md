# Domain Picker

The domain picker is a management UI for Domain cards on a character sheet. It reads frontmatter from the current note and lets you move cards between:

•  Vault – all the domain cards your character owns.  
•  Loadout – the subset of cards they currently have equipped.  

It integrates with:

•  Your Domain card notes (found via tags, folders, or plugin settings).  
•  Your character note frontmatter (level, domains, vault/loadout lists).  
•  The Dataview plugin for fast querying and filtering.

> The Domain Picker requires the Dataview plugin. If Dataview is missing, the block shows a helpful message instead of rendering.

Character frontmatter it uses

On the character note (the note that contains the domainpicker block), the picker reads:

•  level / Level – character level, used for level filters.  
•  domains / Domains – one or more domains your character belongs to (array or string).  
•  vault / Vault – list of Domain cards in the character’s vault (as [[links]]).  
•  loadout / Loadout – list of Domain cards currently equipped (as [[links]]).  

vault and loadout are automatically updated when you click Add / Remove / → Loadout / → Vault inside the UI.

Domain card notes it expects

Each Domain card is just a note in your vault. The picker finds them by:

•  Folder(s) you specify in the block (folder / folders), or  
•  The plugin’s Domain cards folder setting, or  
•  As a fallback, any note tagged #domain / #domains or with a domain/Domain frontmatter field.

From each card it looks at:

•  domains / domain / Domains – which domain(s) this card belongs to.  
•  level / Level – card level.  
•  type / Type – flavor/category (e.g. “Strife”, “Boon”).  
•  stress / Stress – short stress note if relevant.  
•  feature / Feature – short description text.  
•  tokens / Tokens – optional max tokens, used for token tracking.  
•  art / Art – optional art path/filename for card view images.  

These fields are shown in the Vault/Loadout tables and the Add‑cards modal.

### Example – Domain card note (Blade domain)

A single Domain card can be stored as a note like this:

```yaml
---
title: "Glancing Blow"
domains: [Blade]
level: 7
type: "Ability"
stress: "When an attack goes wide, you still mark a lesser wound."
feature: "A near miss becomes a smaller strike, turning failure into a glancing blow."
tokens: 0
---
```

The picker will read this note as a Blade Domain card named **Glancing Blow** at level 7, with its type, stress note, feature text, and any token tracking available for filters and displays.

The block will:

- Show a toolbar with **Loadout / Vault** toggle and an **“Add cards”** button.  
- Render a table for whichever list is selected (Vault or Loadout).  
- Enforce the global **max domain loadout** setting when you move cards into Loadout.  

## Example – Explicit folders and table view

You can point the picker at specific folders, and change the Add‑cards modal to table view:

```domainpicker
# Only look for Domain cards under these folders:
folders:
  - Daggerheart/Domains/Blade
  - Daggerheart/Domains/Arcana

# Modal view for picking cards: 'card' or 'table'
view: table

# Per-block override for max equipped Domain cards
max_loadout: 5

# Use the character's level and domains frontmatter for default filters
use_character_filters: true
```
## UI overview

![Domain Picker UI example](../images/example_domainpicker.webp)

### Main toolbar

At the top of the block:

- **Loadout / Vault** buttons – toggle which list you’re inspecting.  
- **Add cards** – opens a full‑screen modal for searching and adding Domain cards.  
- **Domain loadout counter** – e.g. `Domain loadout: 2/3`.  
  - If you exceed the configured limit, it shows “over recommended limit” and a warning style.

### Vault / Loadout tables

For the active list (Loadout or Vault), the picker shows:

- A **table** with columns:  
  - **Name** – link to the card note.  
  - **Type** – card type from frontmatter.  
  - **Domain** – domains this card belongs to.  
  - **Level** – card level.  
  - **Stress** – stress text if present.  
  - **Feature** – a short description.  
  - **Tokens** – visual dots for the current token count (if any).  
- **Actions** per row:  
  - `→ Loadout` / `→ Vault` – move between lists.  
  - **Remove** – remove the card from that list.  
  - **+ token / – token** – increment or decrement token count for that card.

Token counts are stored per **character note + card** in local storage, so they persist across reloads and are independent for each character.

### “Add cards” modal

The Add‑cards modal is where you search and add cards to Vault or Loadout.

## Features:

- **Domain filter** – defaults to your character’s domains if `use_character_filters` is on; otherwise shows all domains found.  
- **Type filter** – filtered by the currently selected domain baseline.  
- **Level filter** – “Any” or exact 1–10:  
  - If `use_character_filters` is on, cards are capped at your character’s level by default.  
- **Search** – text search across name, feature, type, domains.  
- **Reset** – clears all filters and search text.  
- **View mode**:  
  - `card` (default) – grid of domain cards with art, meta line, and Add buttons.  
  - `table` – compact table similar to the Vault/Loadout view.

In both views you can add cards directly:

- **Add to Vault** – adds the card to the character’s `vault` list.  
- **Add to Loadout** – adds the card to `loadout` (respecting loadout limits).  

If the **loadout limit** would be exceeded, the block:

- Shows a warning message inside the modal.  
- Pops an Obsidian `Notice` explaining that the loadout is full.  
- Does **not** add the card until you free up space.

## Level‑up integration

The domain picker can also respond to a custom event (used by your Level Up tools):

- When `dh:domainpicker:open` is dispatched with details like `filePath`, `level`, and `required`, the picker:  
  - Opens the Add‑cards modal.  
  - Shows a **Level Up** guidance line (e.g. “Add 1 more domain card for this level.”).  
  - Tracks how many cards you’ve added and automatically closes the modal once you’ve added the required number.

This lets your leveling flow guide players through adding the correct number of new Domain cards.

## Sample domain deck notes

Here is an example of a small deck of Domain card notes based on SRD domains and card names:

```yaml
---
title: "ARCANA-TOUCHED"
domains: [Arcana]
level: 5
type: "Ability"
feature: "You carry a lingering mark of strange magic wherever you go."
---

---
title: "BONE-TOUCHED"
domains: [Bone]
level: 7
type: "Ability"
feature: "Your dealings with mortality have left a visible mark on you."
---

---
title: "FANE OF THE WILDS"
domains: [Sage]
level: 9
type: "Ability"
feature: "A hidden wild sanctuary answers when you call upon it for aid."
---

---
title: "FULL SURGE"
domains: [Valor]
level: 8
type: "Ability"
feature: "In a crucial moment, you unleash a surge of courageous effort."
---
```

Each of these notes represents a single Domain card drawn from the SRD’s Domain Card Reference. The picker will treat them like any other card when building Vault and Loadout lists.

## Configuration

Top‑level `domainpicker` block options:

| Property               | Type                   | Default                         | Description                                                                                          |
| ---------------------- | ---------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `folder`               | String / String array  | _none_                          | Single folder or list of folders to search for Domain cards. Uses forward slashes.                 |
| `folders`              | String / String array  | _none_                          | Alias for `folder`; if both are present, `folders` wins.                                           |
| `view`                 | `"card"` \| `"table"` | `"card"` or plugin default      | View type for the Add‑cards modal (card grid or table).                                            |
| `use_character_filters` | Boolean              | plugin setting (`true` by default) | Whether to default filters based on the character’s level and domains.                         |
| `max_loadout`          | Number                 | plugin setting (`maxDomainLoadout`) or unlimited | Per‑block override for maximum Domain cards in Loadout.                           |

Behavior notes:

- If **`folder`/`folders`** is set, the picker only considers cards whose paths start with those folders (recursively).  
- If no folders are configured anywhere, it falls back to **tags/fields** (`#domain`, `#domains`, `domain`/`Domain` frontmatter).  
- When `use_character_filters` is `false`, the default filters won’t auto‑restrict to your character’s level/domains; you can still manually filter by Domain, Type, and Level in the modal.  
- Setting `max_loadout` to a positive number will enforce that limit; omitting it uses the global setting; if neither is a valid number, there is effectively no limit.  

This makes the Domain Picker a powerful “domain deck manager” for each character, while keeping the actual data in simple Markdown notes and frontmatter.