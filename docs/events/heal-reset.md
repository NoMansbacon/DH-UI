# Rest – Full Heal & Reset All

In addition to Short/Long Rest, the rest block can render two powerful utility buttons:

•  Full Heal – clear all HP damage in the current note.  
•  Reset All – clear HP, Stress, Armor, and Hope trackers in the current note.

These are great for:

> For an overview of related blocks (rest, vitals, damage, etc.), see the [Code Block Reference](/blocks/).

•  Starting a new session with everyone at full health.  
•  Quickly resetting a test or one‑shot character sheet.  
•  Handling “total reset” events (e.g. after a long downtime).

How they find trackers

Both actions operate only within the current note’s preview:

•  They look for .dh-tracker elements (from vitals, hp, stress, armor, hope blocks).  
•  Each tracker has a data-dh-key attribute (the state key used by the underlying store).  
•  The reset actions read those keys and set the stored value to 0, then emit an update so the visual trackers redraw.

If no matching trackers are found in the note, the button shows a notice like “No HP tracker found in this note.” or “No trackers found in this note.”

> Because they operate on the current preview, you don’t need to configure any keys for them—they auto‑discover trackers. Use hp_key / stress_key / armor_key / hope_key only if you have very custom setups for Short/Long rest.

## Full Heal

The Full Heal button:

•  Finds all HP trackers in the current note (any .dh-tracker that contains .dh-track-hp).  
•  Sets their filled boxes to 0 (no damage marked).  
•  Triggers a visual refresh of those trackers.  
•  Shows a notice:  
◦  “HP fully restored for this note.” if any HP trackers were found.  
◦  “No HP tracker found in this note.” if none were found.

Use this when a character (or the whole party) is meant to be fully healed, without touching Stress, Armor, or Hope.

## Example – Adding a Full Heal button

```yaml
```rest
styleClass: dh-rest--tools

show_short: false
show_long: false
show_levelup: false

# Enable full heal only
show_full_heal: true
full_heal_label: "Full Heal HP"

# Optional: you can still define keys for rest, but
# Full Heal itself just scans the note for HP trackers.
hp_key: "din_health"
```
```

## Reset All

The **Reset All** button:

- Finds all **HP, Stress, Armor, and Hope** trackers in the current note.  
- Sets each of their filled values to `0`.  
- Triggers a visual refresh for each tracker.  
- Shows a notice:  
  - “All trackers in this note reset.” if any were found.  
  - “No trackers found in this note.” if none were found.

Use this sparingly—it completely clears all damage/stress/armor/hope marks for that character sheet.

### Example – Adding a Reset All button

```yaml
```rest
styleClass: 

show_short: false
show_long: false
show_levelup: false
show_full_heal: false

# Enable only the global reset
show_reset_all: true
reset_all_label: "Reset All Tracks"
```
```

## Example – Rest bar with all utilities

You can mix these with Short/Long Rest and Level Up as needed:

```yaml
```rest
styleClass: dh-rest--full

rest_label: "Rest"
short_label: "Short"
long_label: "Long"
levelup_label: "Level Up"
full_heal_label: "Full Heal HP"
reset_all_label: "Wipe All"

show_short: true
show_long: true
show_levelup: true
show_full_heal: true
show_reset_all: true

# Optional: rest integration with specific trackers
hp_key: "din_health"
stress_key: "din_stress::Character/Dree"
armor_key: "din_armor::Character/Dree"
hope_key: "din_hope::Character/Dree"

max_picks: 2
```
```

## Configuration – Heal/Reset options

Relevant `rest` options for these features:

| Property           | Type    | Default       | Description                                                   |
| ------------------ | ------- | ------------- | ------------------------------------------------------------- |
| `styleClass`       | String  | _none_        | CSS class for styling the rest control row.                   |
| `show_full_heal`   | Boolean | `false`       | Show the Full Heal button (HP only).                          |
| `full_heal_label`  | String  | `"Full Heal"` | Label for the Full Heal button.                               |
| `show_reset_all`   | Boolean | `false`       | Show the Reset All button (HP + Stress + Armor + Hope).       |
| `reset_all_label`  | String  | `"Reset All"` | Label for the Reset All button.                               |
