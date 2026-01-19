# Rest – Short & Long Rest

The rest block provides player‑facing controls for Short Rest and Long Rest, wired into your HP / Stress / Armor / Hope trackers.

> For a full index of all available blocks, see the [Code Block Reference](/blocks).

It:

•  Finds the relevant trackers in the current note.  
•  Opens a combined rest modal that shows both Short and Long rest options.  
•  Lets players pick a limited number of rest moves per rest (default 2).  

You can place it directly under your vitals block so it can automatically discover the right trackers.

How it finds trackers

The block looks for tracker rows in the current note’s preview:

•  HP tracker: .dh-tracker .dh-track-hp  
•  Stress: .dh-tracker .dh-track-stress  
•  Armor: .dh-tracker .dh-track-armor  
•  Hope: .dh-tracker .dh-track-hope  

For each one, it reads the data-dh-key attribute (the state key) and uses that when applying rest effects.

If it can’t find a tracker of a given type, it falls back to simple note‑scoped defaults:

•  HP: `din_health::NOTE_PATH`  
•  Stress: `din_stress::NOTE_PATH`  
•  Armor: `din_armor::NOTE_PATH`  
•  Hope: `din_hope::NOTE_PATH`

Here `NOTE_PATH` represents the current Obsidian note path (for example, `Characters/Elira`).

You can override these keys in YAML if you need unusual setups.

Short vs Long Rest

When you click:

•  Short Rest  
◦  Opens the combined rest modal focused on the Short Rest column.  
◦  Lets you choose up to max_picks rest moves (default 2).  
◦  Applies Short Rest healing and other Short Rest effects to your trackers.
•  Long Rest  
◦  Opens the same modal focused on the Long Rest column.  
◦  Lets you choose rest moves and then applies full Long Rest recovery (according to your rules).  

When both Short and Long are shown, a combined Rest button appears that opens the modal with Short Rest selected by default:

•  Keyboard shortcuts when focused:  
◦  S – focus Short Rest.  
◦  L – focus Long Rest.  
◦  Enter – activate Rest (or Short Rest).

# Example – Standard Short/Long Rest controls

![Rest buttons example](../images/example_rest_buttons.webp)

````yaml
```rest
styleClass: 

# Button labels
rest_label: "Rest"
short_label: "Short Rest"
long_label: "Long Rest"

# Only show Short / Long rest controls
show_short: true
show_long: true
show_levelup: false
show_full_heal: false
show_reset_all: false

# Optional: override which trackers to use (normally auto-detected)
hp_key: "din_health"
stress_key: "din_stress::Character/Dree"
armor_key: "din_armor::Character/Dree"
hope_key: "din_hope::Character/Dree"

# How many rest moves can be chosen in the rest modal
max_picks: 2
```
````
## Configuration – Short/Long Rest

Relevant `rest` options for Short/Long rest:

| Property      | Type    | Default                    | Description                                                   |
| ------------- | ------- | -------------------------- | ------------------------------------------------------------- |
| `styleClass`  | String  | _none_                     | CSS class for styling the rest control row.                   |
| `rest_label`  | String  | `"Rest"`                   | Label for the combined Rest button (when both are visible).   |
| `short_label` | String  | `"Short Rest"`             | Label for the Short Rest button.                              |
| `long_label`  | String  | `"Long Rest"`              | Label for the Long Rest button.                               |
| `show_short`  | Boolean | `true`                     | Whether to show Short Rest.                                   |
| `show_long`   | Boolean | `true`                     | Whether to show Long Rest.                                    |
| `hp_key`      | String  | auto / note‑scoped default | HP tracker key.                                               |
| `stress_key`  | String  | auto / note‑scoped default | Stress tracker key.                                           |
| `armor_key`   | String  | auto / note‑scoped default | Armor tracker key.                                            |
| `hope_key`    | String  | auto / note‑scoped default | Hope tracker key.                                             |
| `max_picks`   | Number  | `2`                        | Max rest moves a player can select per rest.                  |

