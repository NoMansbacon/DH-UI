# Events

DH-UI fires custom DOM events so different blocks and integrations can react to changes.

Most users will not need these directly. For everyday usage, see **Dynamic Content** and **State Storage** under the Concepts section.

## Tracker & state change events

The plugin emits events when tracker or key/value state changes:

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