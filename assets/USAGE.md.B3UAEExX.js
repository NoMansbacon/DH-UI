import{_ as a,c as n,o as p,ag as e}from"./chunks/framework.BpVvFBTM.js";const u=JSON.parse('{"title":"Daggerheart Tooltips (DH-UI) – User Guide","description":"","frontmatter":{},"headers":[],"relativePath":"USAGE.md","filePath":"USAGE.md"}'),l={name:"USAGE.md"};function i(t,s,o,c,r,h){return p(),n("div",null,[...s[0]||(s[0]=[e(`<h1 id="daggerheart-tooltips-dh-ui-–-user-guide" tabindex="-1">Daggerheart Tooltips (DH-UI) – User Guide <a class="header-anchor" href="#daggerheart-tooltips-dh-ui-–-user-guide" aria-label="Permalink to &quot;Daggerheart Tooltips (DH-UI) – User Guide&quot;">​</a></h1><p>This document is the main reference for how to use the Daggerheart Tooltips plugin, with copy‑pasteable examples.</p><p>For a high‑level overview and installation instructions, see the root <code>README.md</code>.</p><hr><h2 id="quick-start" tabindex="-1">Quick start <a class="header-anchor" href="#quick-start" aria-label="Permalink to &quot;Quick start&quot;">​</a></h2><h3 id="install-via-brat" tabindex="-1">Install via BRAT <a class="header-anchor" href="#install-via-brat" aria-label="Permalink to &quot;Install via BRAT&quot;">​</a></h3><ol><li>In Obsidian, install and enable the <strong>BRAT</strong> plugin.</li><li>In BRAT settings, add this repository as a beta plugin: <code>https://github.com/NoMansbacon/DH-UI</code></li><li>Let BRAT install/update the plugin.</li><li>Enable <strong>Daggerheart Tooltips (DH-UI)</strong> in <em>Settings → Community plugins</em>.</li></ol><h3 id="first-character-note" tabindex="-1">First character note <a class="header-anchor" href="#first-character-note" aria-label="Permalink to &quot;First character note&quot;">​</a></h3><ol><li>Add frontmatter to your character note (at the top of the file between <code>---</code> lines).</li><li>Insert fenced code blocks (<code>traits, </code>vitals, \`\`\`rest, etc.) in the body of the note.</li><li>Switch to Preview mode to see the interactive UI.</li></ol><p>Minimal working example in a character note:</p><div class="language-markdown vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">markdown</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#005CC5;--shiki-light-font-weight:bold;--shiki-dark:#79B8FF;--shiki-dark-font-weight:bold;">---</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">name: Thalia</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">level: 1</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">tier: 1</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">hp: 6</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">stress: 4</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">armor: 2</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">hope: 6</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-light-font-weight:bold;--shiki-dark:#79B8FF;--shiki-dark-font-weight:bold;">---</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">\`\`\`traits</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"># no YAML needed – reads from frontmatter and your abilities config</span></span></code></pre></div><div class="language-vitals vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">vitals</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>hp: &quot;{{ frontmatter.hp }}&quot;</span></span>
<span class="line"><span>stress: &quot;{{ frontmatter.stress }}&quot;</span></span>
<span class="line"><span>armor: &quot;{{ frontmatter.armor }}&quot;</span></span>
<span class="line"><span>hope: 6</span></span></code></pre></div><div class="language-rest vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">rest</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>show_levelup: true</span></span>
<span class="line"><span>show_full_heal: true</span></span>
<span class="line"><span>show_reset_all: true</span></span></code></pre></div><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span></span></span>
<span class="line"><span>---</span></span>
<span class="line"><span></span></span>
<span class="line"><span>## Character frontmatter</span></span>
<span class="line"><span></span></span>
<span class="line"><span>Most blocks read data from your note frontmatter using the template engine. A simple single‑class frontmatter might look like this:</span></span>
<span class="line"><span></span></span>
<span class="line"><span>\`\`\`yaml</span></span>
<span class="line"><span>---</span></span>
<span class="line"><span>name: Thalia</span></span>
<span class="line"><span>level: 3</span></span>
<span class="line"><span>tier: 2</span></span>
<span class="line"><span></span></span>
<span class="line"><span>hp: 8</span></span>
<span class="line"><span>stress: 6</span></span>
<span class="line"><span>armor: 2</span></span>
<span class="line"><span>hope: 6</span></span>
<span class="line"><span></span></span>
<span class="line"><span>ancestry: Emberborn</span></span>
<span class="line"><span>class: Warrior</span></span>
<span class="line"><span>subclass: Sentinel</span></span>
<span class="line"><span>community: Free City Guard</span></span>
<span class="line"><span></span></span>
<span class="line"><span>domains: &quot;valor | shadow&quot;</span></span>
<span class="line"><span>---</span></span></code></pre></div><p>A multiclass character can be represented by adding more information to the same fields, for example:</p><div class="language-yaml vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">yaml</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">---</span></span>
<span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">name</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">Azureus</span></span>
<span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">level</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">5</span></span>
<span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">tier</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">3</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">hp</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">10</span></span>
<span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">stress</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">7</span></span>
<span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">armor</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">3</span></span>
<span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">hope</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">6</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">ancestry</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">Void‑touched</span></span>
<span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">class</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&quot;Warrior / Invoker&quot;</span></span>
<span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">subclass</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&quot;Sentinel / Starcaller&quot;</span></span>
<span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">community</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&quot;Order of the Lantern&quot;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">domains</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&quot;valor | light | shadow&quot;</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">---</span></span></code></pre></div><p>The plugin does not try to enforce whether this is a legal build; it just uses these values for display and filtering.</p><hr><h2 id="core-blocks-with-examples" tabindex="-1">Core blocks with examples <a class="header-anchor" href="#core-blocks-with-examples" aria-label="Permalink to &quot;Core blocks with examples&quot;">​</a></h2><p>This section gives short examples for the most common blocks. See the README for more detailed field lists.</p><h3 id="traits-abilities" tabindex="-1">Traits / Abilities <a class="header-anchor" href="#traits-abilities" aria-label="Permalink to &quot;Traits / Abilities&quot;">​</a></h3><div class="language-markdown vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">markdown</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">\`\`\`traits</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"># usually no YAML needed – reads from frontmatter + your traits config</span></span></code></pre></div><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span></span></span>
<span class="line"><span>### Vitals grid</span></span>
<span class="line"><span></span></span>
<span class="line"><span>\`\`\`markdown</span></span>
<span class="line"><span>\`\`\`vitals</span></span>
<span class="line"><span>hp: &quot;{{ frontmatter.hp }}&quot;</span></span>
<span class="line"><span>stress: &quot;{{ frontmatter.stress }}&quot;</span></span>
<span class="line"><span>armor: &quot;{{ frontmatter.armor }}&quot;</span></span>
<span class="line"><span>hope: 6</span></span>
<span class="line"><span></span></span>
<span class="line"><span>hp_key: din_health</span></span>
<span class="line"><span>stress_key: din_stress::{{ file.path }}</span></span>
<span class="line"><span>armor_key: din_armor::{{ file.path }}</span></span>
<span class="line"><span>hope_key: din_hope::{{ file.path }}</span></span></code></pre></div><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span></span></span>
<span class="line"><span>### Individual trackers</span></span>
<span class="line"><span></span></span>
<span class="line"><span>\`\`\`markdown</span></span>
<span class="line"><span>\`\`\`hp</span></span>
<span class="line"><span>label: HP</span></span>
<span class="line"><span>state_key: din_health</span></span>
<span class="line"><span>uses: &quot;{{ frontmatter.hp }}&quot;</span></span></code></pre></div><div class="language-stress vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">stress</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>label: Stress</span></span>
<span class="line"><span>state_key: din_stress::{{ file.path }}</span></span>
<span class="line"><span>uses: &quot;{{ frontmatter.stress }}&quot;</span></span></code></pre></div><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span></span></span>
<span class="line"><span>### Rest controls + Level Up</span></span>
<span class="line"><span></span></span>
<span class="line"><span>\`\`\`markdown</span></span>
<span class="line"><span>\`\`\`rest</span></span>
<span class="line"><span>rest_label: &quot;Rest&quot;</span></span>
<span class="line"><span>levelup_label: &quot;Level Up&quot;</span></span>
<span class="line"><span>full_heal_label: &quot;Full Heal&quot;</span></span>
<span class="line"><span>reset_all_label: &quot;Reset All&quot;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>show_short: true</span></span>
<span class="line"><span>show_long: true</span></span>
<span class="line"><span>show_levelup: true</span></span>
<span class="line"><span>show_full_heal: true</span></span>
<span class="line"><span>show_reset_all: true</span></span></code></pre></div><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span></span></span>
<span class="line"><span>- **Rest**: opens the rest-actions modal.</span></span>
<span class="line"><span>- **Level Up**: opens the level‑up chooser modal tied to this note.</span></span>
<span class="line"><span>- **Full Heal / Reset All**: update all matching trackers in the current note.</span></span>
<span class="line"><span></span></span>
<span class="line"><span>### Damage</span></span>
<span class="line"><span></span></span>
<span class="line"><span>\`\`\`markdown</span></span>
<span class="line"><span>\`\`\`damage</span></span>
<span class="line"><span>title: &quot;Damage&quot;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>hp_key: din_health</span></span>
<span class="line"><span>armor_key: din_armor::{{ file.path }}</span></span>
<span class="line"><span></span></span>
<span class="line"><span>major_threshold: &quot;{{ frontmatter.major_threshold }}&quot;</span></span>
<span class="line"><span>severe_threshold: &quot;{{ frontmatter.severe_threshold }}&quot;</span></span>
<span class="line"><span>base_major: 3</span></span>
<span class="line"><span>base_severe: 6</span></span>
<span class="line"><span>level: &quot;{{ frontmatter.level }}&quot;</span></span></code></pre></div><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span></span></span>
<span class="line"><span>### Consumables</span></span>
<span class="line"><span></span></span>
<span class="line"><span>\`\`\`markdown</span></span>
<span class="line"><span>\`\`\`consumables</span></span>
<span class="line"><span>items:</span></span>
<span class="line"><span>  - label: &quot;Health Potion&quot;</span></span>
<span class="line"><span>    state_key: hero_hp_pots</span></span>
<span class="line"><span>    uses: 3</span></span>
<span class="line"><span>  - label: &quot;Rage&quot;</span></span>
<span class="line"><span>    state_key: hero_rage</span></span>
<span class="line"><span>    uses: &quot;{{ frontmatter.rage_uses }}&quot;</span></span></code></pre></div><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span></span></span>
<span class="line"><span>### Badges</span></span>
<span class="line"><span></span></span>
<span class="line"><span>\`\`\`markdown</span></span>
<span class="line"><span>\`\`\`badges</span></span>
<span class="line"><span>items:</span></span>
<span class="line"><span>  - label: &quot;Level&quot;</span></span>
<span class="line"><span>    value: &quot;{{ frontmatter.level }}&quot;</span></span>
<span class="line"><span>  - label: &quot;Ancestry&quot;</span></span>
<span class="line"><span>    value: &quot;{{ frontmatter.ancestry }}&quot;</span></span>
<span class="line"><span>  - label: &quot;Class&quot;</span></span>
<span class="line"><span>    value: &quot;{{ frontmatter.class }}&quot;</span></span></code></pre></div><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span></span></span>
<span class="line"><span>### Features (ancestry / class / subclass / community)</span></span>
<span class="line"><span></span></span>
<span class="line"><span>\`\`\`markdown</span></span>
<span class="line"><span>\`\`\`features</span></span>
<span class="line"><span>ancestry:</span></span>
<span class="line"><span>  - label: &quot;Emberborn&quot;</span></span>
<span class="line"><span>    value: &quot;Fire‑aligned ancestry from the Ashen Realms.&quot;</span></span>
<span class="line"><span>class:</span></span>
<span class="line"><span>  - label: &quot;Warrior&quot;</span></span>
<span class="line"><span>    value: &quot;Front‑line defender focused on armor and control.&quot;</span></span>
<span class="line"><span>subclass:</span></span>
<span class="line"><span>  - label: &quot;Sentinel&quot;</span></span>
<span class="line"><span>    value: &quot;Specializes in protecting allies with reactions.&quot;</span></span>
<span class="line"><span>community:</span></span>
<span class="line"><span>  - label: &quot;Free City Guard&quot;</span></span>
<span class="line"><span>    value: &quot;Sworn to protect the city of Vyr.&quot;</span></span></code></pre></div><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span></span></span>
<span class="line"><span>To use a grid layout instead of a simple list:</span></span>
<span class="line"><span></span></span>
<span class="line"><span>\`\`\`markdown</span></span>
<span class="line"><span>\`\`\`features</span></span>
<span class="line"><span>layout: grid</span></span>
<span class="line"><span>ancestry:</span></span>
<span class="line"><span>  - label: &quot;Emberborn&quot;</span></span>
<span class="line"><span>    value: &quot;Fire‑aligned ancestry from the Ashen Realms.&quot;</span></span>
<span class="line"><span># ...</span></span></code></pre></div><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span></span></span>
<span class="line"><span>---</span></span>
<span class="line"><span></span></span>
<span class="line"><span>## Domain Picker</span></span>
<span class="line"><span></span></span>
<span class="line"><span>The \`domainpicker\` block helps manage which domain cards are in a character&#39;s **Vault** vs **Loadout**.</span></span>
<span class="line"><span></span></span>
<span class="line"><span>Basic usage in a character note:</span></span>
<span class="line"><span></span></span>
<span class="line"><span>\`\`\`markdown</span></span>
<span class="line"><span>\`\`\`domainpicker</span></span></code></pre></div><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span></span></span>
<span class="line"><span>How it works:</span></span>
<span class="line"><span></span></span>
<span class="line"><span>- Reads your character note&#39;s frontmatter, including \`level\` and \`domains\`.</span></span>
<span class="line"><span>- Uses the Dataview plugin to find candidate domain card notes.</span></span>
<span class="line"><span>- Shows two tables: **Vault** and **Loadout**, each as a list of note links.</span></span>
<span class="line"><span>- Lets you move cards between Vault and Loadout and adjust token counts.</span></span>
<span class="line"><span></span></span>
<span class="line"><span>You can configure where domain card notes live via plugin settings (e.g. a specific folder).</span></span>
<span class="line"><span></span></span>
<span class="line"><span>---</span></span>
<span class="line"><span></span></span>
<span class="line"><span>## Equipment Picker</span></span>
<span class="line"><span></span></span>
<span class="line"><span>Use the \`equipmentpicker\` block to manage your character&#39;s weapons, armor, and other gear between **Inventory** and **Equipped** lists.</span></span>
<span class="line"><span></span></span>
<span class="line"><span>Basic usage in a character note:</span></span>
<span class="line"><span></span></span>
<span class="line"><span>\`\`\`markdown</span></span>
<span class="line"><span>\`\`\`equipmentpicker</span></span>
<span class="line"><span># optional per-block overrides</span></span>
<span class="line"><span># folders:</span></span>
<span class="line"><span>#   - &quot;Cards/Equipment&quot;</span></span>
<span class="line"><span># enforce_tier: true   # default: use character tier to hide too-high-tier items</span></span>
<span class="line"><span># view: table          # or &quot;card&quot; for card-style tiles</span></span></code></pre></div><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span></span></span>
<span class="line"><span>How it works:</span></span>
<span class="line"><span></span></span>
<span class="line"><span>- Reads your character note&#39;s frontmatter, including \`tier\`.</span></span>
<span class="line"><span>- Uses the Dataview plugin to discover equipment notes, either:</span></span>
<span class="line"><span>  - from per-block \`folder\` / \`folders\` in the YAML, or</span></span>
<span class="line"><span>  - from the global **Equipment folder** setting, or</span></span>
<span class="line"><span>  - from the whole vault when no folder is configured.</span></span>
<span class="line"><span>- Detects likely **weapons** and **armor** from tags/frontmatter and groups them into separate tables (Weapons, Armor, Other).</span></span>
<span class="line"><span>- Lets you move items between **Inventory** and **Equipped** and remove them from both lists.</span></span>
<span class="line"><span></span></span>
<span class="line"><span>You can configure where equipment notes live and whether the picker should hide items above the character&#39;s tier via plugin settings.</span></span>
<span class="line"><span></span></span>
<span class="line"><span>---</span></span>
<span class="line"><span></span></span>
<span class="line"><span>## Level Up &amp; multiclassing</span></span>
<span class="line"><span></span></span>
<span class="line"><span>The plugin ships with a Level Up modal that walks through the official options for Tiers 2–4.</span></span>
<span class="line"><span></span></span>
<span class="line"><span>### Using the Level Up modal</span></span>
<span class="line"><span></span></span>
<span class="line"><span>1. Add a \`rest\` block with \`show_levelup: true\` in your character note.</span></span>
<span class="line"><span>2. Click **Level Up** in Preview.</span></span>
<span class="line"><span>3. The Level Up modal shows:</span></span>
<span class="line"><span>   - Tier 2, 3, and 4 columns.</span></span>
<span class="line"><span>   - Available options per tier, with checkboxes.</span></span>
<span class="line"><span>   - Usage boxes that track how many times each option has been taken.</span></span>
<span class="line"><span>4. Select **exactly two** options and click **Apply Level Up**.</span></span>
<span class="line"><span></span></span>
<span class="line"><span>What happens when you apply:</span></span>
<span class="line"><span></span></span>
<span class="line"><span>- \`level\` is incremented in frontmatter, and \`tier\` is updated when you cross key thresholds.</span></span>
<span class="line"><span>- \`hp\`, \`stress\`, \`evasion\`, and \`proficiency\` are incremented according to the options chosen.</span></span>
<span class="line"><span>- \`dh_levelup.t2/t3/t4\` objects in frontmatter track how many times each option (opt1..opt8) has been taken.</span></span>
<span class="line"><span>- For trait‑boosting options, the plugin also updates the \`traits\` block&#39;s YAML (the \`bonuses\` section) where possible.</span></span>
<span class="line"><span>- A \`dh:domainpicker:open\` event is fired so the Domain Picker can prompt you to add domain cards for your new level.</span></span>
<span class="line"><span></span></span>
<span class="line"><span>### Multiclassing behavior</span></span>
<span class="line"><span></span></span>
<span class="line"><span>The Level Up modal includes multiclass options in higher tiers (for example, certain \`opt8\` entries in Tier 3/4). The plugin handles these in a deliberately light way:</span></span>
<span class="line"><span></span></span>
<span class="line"><span>- **It records that you picked the multiclass option** by incrementing \`dh_levelup.t3.opt8\` / \`dh_levelup.t4.opt8\`.</span></span>
<span class="line"><span>- It **does not automatically rewrite** your \`class\`, \`subclass\`, or \`domains\` frontmatter – you should update those yourself.</span></span>
<span class="line"><span>- It opens the Domain Picker so you can add the appropriate new class/domain cards, but</span></span>
<span class="line"><span>- It **does not check legality** of which cards you add (number of classes, domain combinations, etc.).</span></span>
<span class="line"><span></span></span>
<span class="line"><span>This keeps the plugin on the UI/state side of things while leaving rules decisions to you and your table.</span></span>
<span class="line"><span></span></span>
<span class="line"><span>---</span></span>
<span class="line"><span></span></span>
<span class="line"><span>## Experiences</span></span>
<span class="line"><span></span></span>
<span class="line"><span>Use the \`experiences\` block to list your character&#39;s key experiences. These are story hooks you and your GM can reference during play.</span></span>
<span class="line"><span></span></span>
<span class="line"><span>\`\`\`markdown</span></span>
<span class="line"><span>\`\`\`experiences</span></span>
<span class="line"><span>items:</span></span>
<span class="line"><span>  - name: &quot;Saved by the Stranger&quot;</span></span>
<span class="line"><span>    note: &quot;You owe a favor to the mysterious stranger who pulled you from the river.&quot;</span></span>
<span class="line"><span>  - name: &quot;Haunted by the Flames&quot;</span></span>
<span class="line"><span>    note: &quot;You survived a village fire that still stalks your dreams.&quot;</span></span></code></pre></div><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span></span></span>
<span class="line"><span>How to use in play (rules reminder): when you and your GM agree an experience is relevant, you can **spend 1 Hope** to **add +2** to a roll that fits that experience. This plugin just helps you track the text; you apply the +2 modifier yourself when you roll.</span></span>
<span class="line"><span></span></span>
<span class="line"><span>You can also write a single experience without \`items:\`:</span></span>
<span class="line"><span></span></span>
<span class="line"><span>\`\`\`markdown</span></span>
<span class="line"><span>\`\`\`experiences</span></span>
<span class="line"><span>name: &quot;Marked by the Old Gods&quot;</span></span>
<span class="line"><span>note: &quot;You bear a strange symbol that reacts to ancient magic.&quot;</span></span></code></pre></div><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span></span></span>
<span class="line"><span>---</span></span>
<span class="line"><span></span></span>
<span class="line"><span>## Template engine quick reference</span></span>
<span class="line"><span></span></span>
<span class="line"><span>Anywhere you can write a string in block YAML, you can usually use template expressions like \`{{ frontmatter.hp }}\`.</span></span>
<span class="line"><span></span></span>
<span class="line"><span>Supported paths include:</span></span>
<span class="line"><span></span></span>
<span class="line"><span>- \`frontmatter.*\` – note frontmatter, e.g. \`{{ frontmatter.level }}\`.</span></span>
<span class="line"><span>- \`abilities.*\` – totals from the nearest \`\`\`traits block, e.g. \`{{ abilities.Agility }}\`.</span></span>
<span class="line"><span>- \`skills.*\` – from a \`skills\` map in frontmatter.</span></span>
<span class="line"><span>- \`character.*\` – a derived summary, e.g. \`{{ character.level }}\`, \`{{ character.hp }}\`.</span></span>
<span class="line"><span></span></span>
<span class="line"><span>Basic helpers:</span></span>
<span class="line"><span></span></span>
<span class="line"><span>- \`{{ add 2 frontmatter.level }}\` – numeric addition.</span></span>
<span class="line"><span>- \`{{ subtract frontmatter.hp 2 }}\` – subtraction.</span></span>
<span class="line"><span>- \`{{ multiply 2 frontmatter.level }}\` – multiplication.</span></span>
<span class="line"><span>- \`{{ floor divide frontmatter.hp 2 }}\` – integer division.</span></span>
<span class="line"><span></span></span>
<span class="line"><span>If a template expression fails, it resolves to an empty string instead of throwing.</span></span>
<span class="line"><span></span></span>
<span class="line"><span>---</span></span>
<span class="line"><span></span></span>
<span class="line"><span>## Scope &amp; rules disclaimer</span></span>
<span class="line"><span></span></span>
<span class="line"><span>- The plugin does **not** enforce Daggerheart rules (including multiclass rules, card limits, or build legality).</span></span>
<span class="line"><span>- It focuses on **rendering UI** and **persisting state** for things like trackers, cards, and level‑up choices.</span></span>
<span class="line"><span>- Your frontmatter, YAML, and in‑world decisions remain the source of truth for what is actually allowed at the table.</span></span></code></pre></div>`,36)])])}const k=a(l,[["render",i]]);export{u as __pageData,k as default};
