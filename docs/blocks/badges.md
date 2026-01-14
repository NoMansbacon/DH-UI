# Badges

The badges component can be used to display any generic Key/Value data in a more condensed view. Optionally, you can also omit they Key/Value and display only one.

![Render Example](../images/example-badges.webp)

## Dynamic Content

Badges support dynamic content using template variables with <span v-pre>`{{ }}`</span> style templates. This allows creating badges with data from the frontmatter or even calculations based off abilities or skills. This is great for things like

- Level
- Armor Score
- Evasion

Using dynamic content helps keep your character sheet updated as you level up.

See the [Templates & Events](../events/templates-events.md) page for more information on using templates.

## Example

```yaml
```badges
items:
  - label: Character
    value: "{{ frontmatter.name }}"
  - label: Level
    value: 1
  - label: Evasion
    value: "{{ frontmatter.evasion }}"
  - label: Armor
    value: "{{ frontmatter.armor }}"
  - label: Ancestry
    value: "{{ frontmatter.ancestry }}"
  - label: Class
    value: "{{ frontmatter.class }}"
  - label: Subclass
    value: "{{ frontmatter.subclass }}"
  - label: Spellcast Trait
    value: "{{ frontmatter.spellcast_trait }}"
  - label: Heritage
    value: "Slyborne"
```
```

### configuration

| Property   | Type     | Default      | Description                                                      |
| ---------- | -------- | ------------ | ---------------------------------------------------------------- |
| items    | Array    | Required | List of badge items to display                                   |
| styleClass    | String   | none       | Optional CSS class name applied to the outer badges container   |
| reverse  | Boolean  | false      | When true, render value before label instead of label → value |

### Item

| Property | Type                    | Description                      |
| -------- | ----------------------- | -------------------------------- |
| label  | String                  | Label text (optional)           |
| value  | String / Number / Bool | Value to display (optional)     |
