# Events

DH-UI uses events to coordinate changes between blocks that show resources (like HP, Stress, Armor, Hope) and tools that modify them (like rest and damage).

Most users only need to understand the **concepts** on this page. The low-level DOM event API for custom integrations is documented separately on the [Events (API)](/events/templates-events) page.

## File scope

Events in DH-UI are **file-scoped**:

- Rest and damage operate only on trackers in the **same note preview**.  
- Full Heal and Reset All only clear trackers that exist in the current note.  
- You can have multiple character sheets in different notes without them affecting each other.

This is why most defaults include the note path in their state keys (e.g. `din_health::<note-path>`).

## Built-in event flows

DH-UI wires several blocks together so that a single action can update multiple components.

### Rest → Vitals

When you use the `rest` block:

- It finds the HP / Stress / Armor / Hope trackers in the current note.  
- It uses their configured `hp_key`, `stress_key`, `armor_key`, and `hope_key`.  
- Short Rest / Long Rest / Full Heal / Reset All update the stored values for those keys.  
- Trackers listening to those keys redraw automatically.

Conceptually:

1. **Trackers** (from `vitals` or individual `hp` / `stress` / `armor` / `hope` blocks) expose state keys.  
2. **Rest** reads those keys and applies healing / resets.  
3. The state store is updated; trackers refresh from the new values.

### Damage → Vitals

Similarly, the `damage` block:

- Calculates the damage tier based on your thresholds and level.  
- Applies tiered damage to HP using its `hp_key`.  
- Optionally spends Armor slots using `armor_key`.  
- Trackers listening to those keys redraw to show the new HP / Armor state.

To keep things consistent, you normally want:

- The `vitals` block and the `damage` block to use the **same** `hp_key` / `armor_key`.  
- The `rest` block to auto-detect or explicitly use those same keys.

## State updates and redraws

Behind the scenes, DH-UI:

1. Writes new values into the state store (using keys like `tracker:din_health::Character/Dree`).  
2. Emits internal events so all tracker components bound to that key can update.  
3. React-based tracker views pick up the change and repaint.

You don't need to call any of these events yourself when using the built-in blocks; they are handled automatically when you click the UI.

## Advanced integrations

If you are writing custom JS snippets or extending DH-UI in code, you can hook into the low-level event API:

- `dh:tracker:changed` – fired when a tracker row changes.  
- `dh:kv:changed` – fired when a key in the KV/state store changes.  
- `dh:rest:short` / `dh:rest:long` – fired when rest actions are applied.

See the **Events (API)** page for full details on these DOM events and helper functions.

For most vault setups you can ignore the internals and rely on:

- `vitals` + `rest` + `damage` blocks,  
- Note-scoped state keys, and  
- The automatic redraw behavior described above.