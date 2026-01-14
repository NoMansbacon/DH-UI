import{_ as a,c as s,o as n,ag as p}from"./chunks/framework.BpVvFBTM.js";const d=JSON.parse('{"title":"Level Up","description":"","frontmatter":{},"headers":[],"relativePath":"events/levelup.md","filePath":"events/levelup.md"}'),l={name:"events/levelup.md"};function t(o,e,i,r,c,h){return n(),s("div",null,[...e[0]||(e[0]=[p(`<h1 id="level-up" tabindex="-1">Level Up <a class="header-anchor" href="#level-up" aria-label="Permalink to &quot;Level Up&quot;">​</a></h1><p>The Level Up feature gives you a dedicated UI for advancing a character. It can be launched in two ways:</p><ol><li>From the Level Up button in a rest block.</li><li>From a standalone levelup code block.</li></ol><p>Both open the same Level Up modal, tied to the current character note.</p><blockquote><p>For an overview of all blocks, including rest and vitals, see the <a href="/DH-UI/blocks.html">Code Block Reference</a>.</p></blockquote><p>What the Level Up modal does (conceptually)</p><p>The Level Up modal is responsible for:</p><p>• Reading the current character’s note (frontmatter, level, domains, etc.).<br> • Walking you through your level‑up steps (per your house rules).<br> • Triggering Domain card selection via the Domain Picker when appropriate<br> (e.g. “Add 1 new Domain card at this level”).</p><p>The exact sequence inside the modal is configurable in plugin settings, but from the note’s perspective you just need a way to open it.</p><p>Level Up via rest block</p><p>You can add a Level Up button into your rest controls row. When clicked, it:</p><p>• Resolves the current note file.<br> • Opens the Level Up modal for that character.<br> • Shows a notice if it can’t resolve a file (very rare in normal use).</p><h2 id="example-–-rest-bar-with-level-up" tabindex="-1">Example – Rest bar with Level Up <a class="header-anchor" href="#example-–-rest-bar-with-level-up" aria-label="Permalink to &quot;Example – Rest bar with Level Up&quot;">​</a></h2><div class="language-rest vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">rest</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>styleClass: </span></span>
<span class="line"><span></span></span>
<span class="line"><span># Rest buttons</span></span>
<span class="line"><span>show_short: true</span></span>
<span class="line"><span>show_long: true</span></span>
<span class="line"><span></span></span>
<span class="line"><span># Turn on the Level Up button</span></span>
<span class="line"><span>show_levelup: true</span></span>
<span class="line"><span>levelup_label: &quot;Level Up&quot;</span></span>
<span class="line"><span></span></span>
<span class="line"><span># Optional: other controls off</span></span>
<span class="line"><span>show_full_heal: false</span></span>
<span class="line"><span>show_reset_all: false</span></span></code></pre></div><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span></span></span>
<span class="line"><span>This adds a **“Level Up”** button alongside your Short / Long Rest buttons.</span></span>
<span class="line"><span></span></span>
<span class="line"><span>### Relevant \`rest\` options for Level Up</span></span>
<span class="line"><span></span></span>
<span class="line"><span>| Property        | Type    | Default     | Description                                      |</span></span>
<span class="line"><span>| --------------- | ------- | ----------- | ------------------------------------------------ |</span></span>
<span class="line"><span>| \`show_levelup\`  | Boolean | \`false\`     | Whether to show the Level Up button.            |</span></span>
<span class="line"><span>| \`levelup_label\` | String  | \`&quot;Level Up&quot;\`| Label text for the Level Up button.             |</span></span>
<span class="line"><span>| \`styleClass\`    | String  | _none_      | Styling hook for the whole rest control row.    |</span></span>
<span class="line"><span></span></span>
<span class="line"><span>&gt; The Level Up handler in \`rest\` always targets the **current note** (the one containing the block).</span></span>
<span class="line"><span></span></span>
<span class="line"><span>---</span></span>
<span class="line"><span></span></span>
<span class="line"><span>## Standalone \`levelup\` block</span></span>
<span class="line"><span></span></span>
<span class="line"><span>If you want a dedicated Level Up area, you can also use the \`levelup\` code block. It doesn’t accept YAML options; it simply renders a button that opens the same Level Up modal.</span></span>
<span class="line"><span></span></span>
<span class="line"><span>### Example – Inline Level Up button</span></span>
<span class="line"><span></span></span>
<span class="line"><span>\`\`\`level\`\`\`levelup</span></span></code></pre></div>`,15)])])}const v=a(l,[["render",t]]);export{d as __pageData,v as default};
