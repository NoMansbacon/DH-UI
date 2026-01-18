# Damage

The damage component is a compact inline calculator that helps you apply damage using Daggerheart’s tiered damage rules. It:

•  Shows Minor / Major / Severe thresholds.  
•  Lets you enter a raw damage amount and number of Armor slots used.  
•  Highlights the resulting damage tier after Armor reduction.  
•  Applies the result directly to your HP and Armor trackers, using shared state keys.

You can use it for:

•  Fast damage application during combat.  
•  Central “GM panel” that updates a character’s HP/Armor from one place.  
•  Player‑facing widgets in character sheets to quickly mark damage.  

> The damage block does not render HP/Armor trackers itself; it talks to existing trackers (from vitals or individual hp/armor blocks) using shared keys.

How thresholds and level work

The block needs Major and Severe thresholds to know when damage changes tiers.

Thresholds come from:

1. YAML options (damage block)  
◦  major_threshold  
◦  severe_threshold  
2. Frontmatter fields on the note (if the YAML options are omitted), such as major_threshold, severe_threshold, or similar aliases.  
3. Base values plus level  
◦  base_major and base_severe define raw thresholds.  
◦  level (from the block or frontmatter level / tier) is added to those thresholds.

The plugin automatically adds your level to the chosen source thresholds, so you don’t have to pre‑bake level into your numbers.

Dynamic thresholds with templates

major_threshold and severe_threshold support template values with <span v-pre>{{ }}</span>, processed like other blocks. This lets you base thresholds on frontmatter or other template expressions, for example:

•  Pull thresholds directly from frontmatter fields.  
•  Compute thresholds from a formula (e.g. “base + tier”).  

> level itself is read as a number from the block or from frontmatter (level / tier); it is not templated.

## Example – Simple damage panel

```damage
styleClass: 

# Optional: override which HP and Armor trackers this block affects.
# If omitted, HP uses the same key as your vitals block (typically a note-scoped
# key like "din_health::&lt;note-path&gt;"), and Armor is note-scoped by default.
hp_key: "din_health::character-sheet"
armor_key: "din_armor::character-sheet"

# Direct numeric thresholds (before level is added).
base_major: 4
base_severe: 8

# Level can come from frontmatter instead; this is optional.
level: 3
```
This will:

- Compute **Major** threshold as `4 + level` (here, 7).  
- Compute **Severe** threshold as `8 + level` (here, 11).  
- Let you enter a damage amount and how many Armor slots were used.  
- Highlight the final tier (Minor / Major / Severe) after Armor reduction.  
- When you click **Apply**, it updates HP and Armor via the given keys and shows a notice with the result.


The plugin will:

- Read `major_threshold` and `severe_threshold` from frontmatter.  
- Read `level` from frontmatter.  
- Add `level` to both thresholds and display the final values in the step diagram.  

## HP & Armor integration

The block updates trackers by writing to the same state keys that HP and Armor trackers use:

- **`hp_key`**  
  - Default: whatever HP key your trackers are using (usually a note‑scoped key like `"din_health::&lt;note-path&gt;"` from the `vitals` block).  
  - Set this explicitly if you want separate naming or shared HP pools across notes.  

- **`armor_key`**  
  - Default: a note‑scoped Armor key like `"din_armor::&lt;note-path&gt;"`.  
  - Set this if you want a shared Armor pool across multiple notes or characters.  

When you click **Apply**, the damage calculator:

- Determines the damage tier (Minor / Major / Severe).  
- Applies the appropriate HP marks and Armor usage via the configured keys.  
- Shows a short message indicating what changed.

## Configuration

Top‑level `damage` block options:

| Property            | Type              | Default                 | Description                                                                                         |
| ------------------- | ----------------- | ----------------------- | --------------------------------------------------------------------------------------------------- |
| `styleClass`        | String            | _none_                  | Optional CSS class applied to the damage block container (preferred styling hook).                 |
|| `hp_key`            | String            | _none_ (use tracker key) | State key for the HP tracker this damage block should update (defaults to the HP tracker’s key). |
| `armor_key`         | String            | `din_armor::(note)`     | State key for the Armor tracker this damage block should update (defaults to note‑scoped).         |
| `major_threshold`   | Number / String   | _from FM / base_*_      | Major damage threshold; can be a number or a template.                                             |
| `severe_threshold`  | Number / String   | _from FM / base_*_      | Severe damage threshold; can be a number or a template.                                            |
| `base_major`        | Number / String   | `0`                     | Base major threshold used when `major_threshold` / frontmatter values are not set.                 |
| `base_severe`       | Number / String   | `0`                     | Base severe threshold used when `severe_threshold` / frontmatter values are not set.               |
| `level`             | Number            | from FM `level` / `tier` or `0` | Level added to major and severe thresholds for final values.                                       |

This makes the `damage` block a fast, rules‑aware control center for applying damage that stays in sync with your existing HP and Armor trackers.