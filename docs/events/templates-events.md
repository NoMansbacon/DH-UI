# Events (API)

This page documents the **low‑level API** for DH‑UI’s internal events and its template engine.

Most users will only need the higher‑level explanations on:

- [Dynamic Content](/concepts/dynamic-content) – how templates work in block YAML.
- [Events](/concepts/events) – how rest, damage, and trackers are wired together conceptually.

If you’re building custom integrations or JS snippets, this page shows how to hook into the same mechanisms DH‑UI uses internally.

---

## Template engine overview

Anywhere a block accepts a **string** in YAML (for example in `vitals`, `badges`, `damage`, `features`, `consumables`, etc.), you can use templates of the form:

```text
{{ path.to.value }}
{{ helper 2 frontmatter.level }}
```

### Common value paths

These are the main value sources the template engine exposes:

- `frontmatter.*` – fields from the note’s frontmatter (`frontmatter.level`, `frontmatter.ancestry`, etc.).
- `traits.*` – ability scores and bonuses defined in the `traits` block (`traits.Ability.Agility`, etc.).
- `skills.*` – any skill data your setup exposes.
- `character.*` – reserved for higher‑level character data; typically derived from frontmatter or traits.

### Helper functions

You can perform simple math and derived calculations directly in templates using helpers:

- <span v-pre>`{{ add A B }}`</span> – `A + B`.
- <span v-pre>`{{ subtract A B }}`</span> – `A - B`.
- <span v-pre>`{{ multiply A B }}`</span> – `A * B`.
- <span v-pre>`{{ divide A B }}`</span> – integer division.
- <span v-pre>`{{ floor value }}`</span>, <span v-pre>`{{ ceil value }}`</span>, <span v-pre>`{{ round value }}`</span> – rounding helpers.
- <span v-pre>`{{ modifier value }}`</span> – converts a score into a Daggerheart‑style modifier.

All helpers ultimately resolve to numbers or strings that can be rendered in your block.

For a full reference, examples, and edge‑case behavior, see [Dynamic Content](/concepts/dynamic-content).

---

## DOM events

DH‑UI emits DOM events so multiple blocks within the **same note preview** can stay in sync. You can listen for these events to react to changes or trigger additional logic.

### Tracker and key‑value events

When a tracked resource changes (HP, Stress, Armor, Hope, or any other key), DH‑UI fires:

- `dh:tracker:changed` – a tracker row changed (for example, a vitals pip was clicked).
- `dh:kv:changed` – a key in the internal key‑value store changed.

Handlers receive a `CustomEvent` whose `detail` typically includes:

- `key` – the storage key (for example `tracker:din_health::Character/Marlowe`).
- For `dh:tracker:changed`: `filled` – the new filled count for that tracker.
- For `dh:kv:changed`: `val` – the new value stored for that key.

#### Example – listen for tracker changes

```js
window.addEventListener("dh:tracker:changed", (event) => {
  const { key, filled } = (event as CustomEvent).detail ?? {};
  console.log("Tracker updated", key, filled);
});
```

> Note: In Obsidian, run this from a JS snippet, a developer console, or a custom plugin that loads alongside DH‑UI.

### Rest events

When you use the `rest` block, DH‑UI fires events so other components know which kind of rest occurred:

- `dh:rest:short`
- `dh:rest:long`

Each event’s `detail` includes the file path and the HP / Stress / Armor / Hope keys that were updated.

#### Example – react to a Long Rest

```js
window.addEventListener("dh:rest:long", (event) => {
  console.log("Long Rest applied", (event as CustomEvent).detail);
});
```

### Emitting your own events

You normally **do not need** to emit these events yourself; the built‑in blocks handle it.

If you are extending DH‑UI with custom UI, you can dispatch compatible events so that DH‑UI’s trackers stay in sync:

```js
const event = new CustomEvent("dh:kv:changed", {
  detail: {
    key: "tracker:din_custom_resource::Character/Marlowe",
    val: 3,
  },
});
window.dispatchEvent(event);
```

Use unique, stable keys (see [State Storage](/concepts/state-storage)) so your custom events play nicely with the built‑in state store.

---

## When to use this page

- Use **[Dynamic Content](/concepts/dynamic-content)** to learn how to write templates inside YAML.
- Use **[Events](/concepts/events)** to understand how rest, damage, and trackers interact at a rules level.
- Use **this page** only when you need to write custom JS that listens to or emits DH‑UI’s DOM events.
