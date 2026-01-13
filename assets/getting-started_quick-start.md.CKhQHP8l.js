import{_ as a,c as i,o as n,ag as t}from"./chunks/framework.BpVvFBTM.js";const c=JSON.parse('{"title":"Quick Start","description":"","frontmatter":{},"headers":[],"relativePath":"getting-started/quick-start.md","filePath":"getting-started/quick-start.md"}'),e={name:"getting-started/quick-start.md"};function l(p,s,h,r,k,E){return n(),i("div",null,[...s[0]||(s[0]=[t(`<h1 id="quick-start" tabindex="-1">Quick Start <a class="header-anchor" href="#quick-start" aria-label="Permalink to &quot;Quick Start&quot;">​</a></h1><div class="warning custom-block"><p class="custom-block-title">Development Status</p><p>This plugin is in early development. Things may be broken or change between versions.</p></div><h2 id="installation" tabindex="-1">Installation <a class="header-anchor" href="#installation" aria-label="Permalink to &quot;Installation&quot;">​</a></h2><div class="warning custom-block"><p class="custom-block-title">BRAT Required</p><p>We haven&#39;t published to the Obsidian Community Plugin store yet. You need to use the <a href="https://github.com/TfTHacker/obsidian42-brat" target="_blank" rel="noreferrer">BRAT</a> plugin to install from the GitHub repository.</p></div><ol><li>Install the <a href="https://github.com/TfTHacker/obsidian42-brat" target="_blank" rel="noreferrer">BRAT plugin</a> in Obsidian</li><li>Open BRAT settings and add a new plugin</li><li>Enter the repository URL: <code>hay-kot/obsidian-dnd-ui-toolkit</code></li><li>If you have issues, try pinning to the latest release version</li></ol><h2 id="your-first-character-sheet" tabindex="-1">Your First Character Sheet <a class="header-anchor" href="#your-first-character-sheet" aria-label="Permalink to &quot;Your First Character Sheet&quot;">​</a></h2><p>Create a new note and add these components to get started:</p><div class="language-md vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">md</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">---</span></span>
<span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">level</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">1</span></span>
<span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">proficiency_bonus</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">2</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">---</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">\`\`\`event-btns</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">items:</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">  - name: Short Rest</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    value: short-rest</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">  - name: Long Rest</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    value: long-rest</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">\`\`\`</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">\`\`\`healthpoints</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">state_key: my_character_hp</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">health: 28</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">hitdice:</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">  dice: d8</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">  value: 3</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">\`\`\`</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">\`\`\`ability</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">abilities:</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">  strength: 14</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">  dexterity: 16</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">  constitution: 13</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">  intelligence: 12</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">  wisdom: 10</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">  charisma: 8</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">proficiencies:</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">  - dexterity</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">  - intelligence</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">\`\`\`</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">\`\`\`skills</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">proficiencies:</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">  - stealth</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">  - investigation</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">  - perception</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">expertise:</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">  - stealth</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">\`\`\`</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">\`\`\`consumable</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">items:</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">  - label: &quot;Level 1 Spells&quot;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    state_key: my_character_spells_1</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    uses: 3</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    reset_on: &quot;long-rest&quot;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">  - label: &quot;Sneak Attack&quot;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    state_key: my_character_sneak_attack</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    uses: 1</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    reset_on: [&quot;short-rest&quot;, &quot;long-rest&quot;]</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">\`\`\`</span></span></code></pre></div><h2 id="what-you-get" tabindex="-1">What You Get <a class="header-anchor" href="#what-you-get" aria-label="Permalink to &quot;What You Get&quot;">​</a></h2><p>This basic setup gives you:</p><ul><li><strong>Ability Scores</strong>: Interactive ability score display with saving throws</li><li><strong>Skills</strong>: Automatically calculated skill modifiers</li><li><strong>Health Tracking</strong>: Persistent HP tracking with hit dice</li><li><strong>Resource Management</strong>: Spell slots and abilities that reset with rests</li><li><strong>Rest System</strong>: Buttons to trigger rest events</li></ul><h2 id="important-concepts" tabindex="-1">Important Concepts <a class="header-anchor" href="#important-concepts" aria-label="Permalink to &quot;Important Concepts&quot;">​</a></h2><h3 id="state-keys" tabindex="-1">State Keys <a class="header-anchor" href="#state-keys" aria-label="Permalink to &quot;State Keys&quot;">​</a></h3><p>Every component that tracks data needs a unique <code>state_key</code> across your vault. A good rule of thumb is to prefix whatever keys you have with your character&#39;s name</p><ul><li>❌ <code>level_1_spells</code></li><li>✅ <code>din_level_1_spells</code></li></ul><h3 id="file-scope" tabindex="-1">File Scope <a class="header-anchor" href="#file-scope" aria-label="Permalink to &quot;File Scope&quot;">​</a></h3><p>Events (like rest buttons) only affect components in the same file. This means each character sheet can have its own rest system without interfering with others.</p>`,17)])])}const d=a(e,[["render",l]]);export{c as __pageData,d as default};
