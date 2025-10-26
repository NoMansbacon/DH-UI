// src/main.ts
import { Plugin, Notice, App, MarkdownPostProcessorContext } from "obsidian";
import { DEFAULT_SETTINGS, DaggerheartSettings } from "./settings";
import { initializeStateStore } from "./lib/services/stateStore";
import { DaggerheartSettingTab } from "./ui/settings-tab";

// React ability/traits renderer
import { AbilityScoreView } from "./lib/views/abilityscoreview";

// Other blocks
import { registerBadgesBlock } from "./lib/components/badges-block";
import { registerConsumablesBlock } from "./lib/components/consumables-block";
import { registerTrackersBlocks } from "./lib/components/trackers-block";
import { registerShortRest } from "./lib/components/short-rest";
import { registerLongRest } from "./lib/components/long-rest";
import { registerDamage } from "./lib/components/damage-vault";
import { registerRest } from "./lib/components/rest";
import { registerDashboard } from "./lib/components/dashboard";
import { registerVitals } from "./lib/components/vitals";

export default class DaggerheartPlugin extends Plugin {
  settings: DaggerheartSettings;

  async onload() {
    // Load settings and initialize state store
    await this.loadSettings();
    await this.initializeStore();
    this.addSettingTab(new DaggerheartSettingTab(this.app as App, this));
    console.log('[DH-UI] loaded');

    // Ability / Traits (React)
    const renderAbilities = (src: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
      try {
        const view = new AbilityScoreView(this.app as App);
        el.empty();
        view.render(src, el, ctx);
      } catch (e) {
        console.error('[DH-UI] AbilityScoreView render error:', e);
        const pre = el.createEl('pre');
        pre.setText('Error rendering abilities/traits block. See console for details.');
      }
    };
    this.registerMarkdownCodeBlockProcessor('ability', renderAbilities);
    this.registerMarkdownCodeBlockProcessor('traits', renderAbilities);

    // Other processors
    try { registerBadgesBlock(this); }       catch (e) { console.error('[DH-UI] badges load error', e); }
    try { registerConsumablesBlock(this); }  catch (e) { console.error('[DH-UI] consumables load error', e); }
    try { registerTrackersBlocks(this); }    catch (e) { console.error('[DH-UI] trackers load error', e); }
    try { registerShortRest(this); }         catch (e) { console.error('[DH-UI] short-rest load error', e); }
    try { registerLongRest(this); }          catch (e) { console.error('[DH-UI] long-rest load error', e); }
    try { registerDamage(this); }            catch (e) { console.error('[DH-UI] damage load error', e); }

    // NEW: unified rest block
    try { registerRest(this); }         catch (e) { console.error('[DH-UI] rest load error', e); }
    try { registerDashboard(this); }    catch (e) { console.error('[DH-UI] dashboard load error', e); }
    try { registerVitals(this); }       catch (e) { console.error('[DH-UI] vitals load error', e); }

    // Grid/layout customization via settings removed; layout controlled by CSS only

    // Optional: quick reload command
    
  }

  onunload() {
    console.log('[DH-UI] unloaded');
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  async initializeStore() {
    const path = this.settings.stateFilePath || DEFAULT_SETTINGS.stateFilePath;
    initializeStateStore(this, path);
  }
}
