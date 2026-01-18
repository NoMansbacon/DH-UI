# Dynamic Content (Templates & Events)

::: v-pre
Dynamic content lets you create templates that automatically calculate and display values based on your Daggerheart character data using `{{ }}` syntax.
:::

Anywhere you can provide a string in block YAML, you can usually use templates like <span v-pre>`{{ frontmatter.hp }}`</span>.  
Templates are evaluated against a shared template context and are supported in blocks such as badges, features, vitals, trackers, consumables, experiences, damage, and more.

If a template expression fails, it resolves to an empty string instead of throwing. When a number is expected and the result isn’t numeric, it is treated as 0.

## Template paths

These are the main paths you can use inside <span v-pre>`{{ ... }}`</span>:

•  frontmatter.* – raw note frontmatter.
◦  Examples:
▪  <span v-pre>`{{ frontmatter.level }}`</span>
▪  <span v-pre>`{{ frontmatter.hp_max }}`</span>
•  traits.* – final Daggerheart trait scores (Agility, Strength, Finesse, Instinct, Presence, Knowledge) derived from the nearest `traits` block in the same section.
◦  The plugin parses that block and computes final trait scores, then exposes them in a case‑insensitive map.
◦  Examples:
▪  <span v-pre>`{{ traits.agility }}`</span>
▪  <span v-pre>`{{ traits.knowledge }}`</span>
•  skills.* – numeric skills/moves from skills in frontmatter.
◦  Supports either:
▪  A map:  
      skills: { attack: 2, sneak: 3 }
•  Or a list:  
      skills: [ { name: "attack", value: 2 }, { name: "sneak", value: 3 } ]
•  Examples:
◦  <span v-pre>`{{ skills.attack }}`</span>
◦  <span v-pre>`{{ skills.sneak }}`</span>
•  character.* – derived summary from frontmatter.
◦  Fields include:
▪  character.name – typically from name or title.
▪  character.level – from level or tier (whichever is present).
▪  character.tier – from tier or level.
▪  character.hp, character.stress, character.armor, character.hope – from corresponding frontmatter (hp/health/din_health, etc.).
◦  Examples:
▪  <span v-pre>`{{ character.level }}`</span>
▪  <span v-pre>`{{ character.hp }}`</span>

You can also use bare numbers and these paths as arguments to helper functions (see next section).

## Helper functions

The template engine provides a few simple helpers for math and formatting. They work like:

•  <span v-pre>`{{ add 2 frontmatter.level }}`</span>  
•  <span v-pre>`{{ subtract frontmatter.hp 2 }}`</span>  
•  <span v-pre>`{{ multiply 2 frontmatter.level }}`</span>  
•  <span v-pre>`{{ divide frontmatter.hp 2 }}`</span>  
•  <span v-pre>`{{ floor divide frontmatter.hp 2 }}`</span>

Supported helpers:

•  add a b c ... – sum of all arguments.  
•  subtract a b c ... – a - b - c - ....  
•  multiply a b c ... – product of all arguments.  
•  divide a b c ... – a / b / c / ... (division by zero yields NaN → treated as 0 when a number is needed).  
•  floor x – Math.floor(x).  
•  ceil x – Math.ceil(x).  
•  round x – Math.round(x).  
•  modifier x – pass‑through numeric value (mainly for readability, e.g. <span v-pre>`{{ modifier traits.agility }}`</span>).

Arguments can be:

•  Plain numbers: 2, 3.5, -1.  
•  Template paths: frontmatter.level, traits.agility, skills.attack, character.hp.

If a token cannot be parsed as a number, it is treated as 0 for numeric helpers.


## Events

The plugin fires custom DOM events so different blocks and integrations can react to changes.

Core events:

•  dh:tracker:changed – emitted when a tracker row (HP/Stress/Armor/Hope/uses/etc.) changes.
◦  Detail: { key, filled }
▪  key: the tracker’s state key (e.g. din_health).
▪  filled: current number of filled boxes.
•  dh:kv:changed – emitted when a key in the KV/state store changes.
◦  Detail: { key, val }
▪  key: the KV key that changed.
▪  val: the new value.
•  dh:rest:short – emitted when a Short Rest is applied.
•  dh:rest:long – emitted when a Long Rest is applied.
◦  Detail for both rest events:  
    { filePath, hpKey, stressKey, armorKey, hopeKey }

These are primarily for advanced users writing custom JS snippets or other plugins.

If you’re extending DH‑UI in code, prefer using the helpers from src/utils/events.ts:

•  Emitters:
◦  emitTrackerChanged({ key, filled })
◦  emitKvChanged({ key, val })
◦  emitRestShort({ filePath, hpKey, stressKey, armorKey, hopeKey })
◦  emitRestLong({ filePath, hpKey, stressKey, armorKey, hopeKey })
•  Listeners (return an unsubscribe function):
◦  onTrackerChanged(handler)
◦  onKvChanged(handler)
◦  onRestShort(handler)
◦  onRestLong(handler)

Using these helpers keeps event names and payload shapes consistent across the plugin.