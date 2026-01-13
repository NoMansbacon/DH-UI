/**
 * Main plugin entry point
 * 
 * Responsibilities:
 * - Initialize plugin on load
 * - Register all code block processors (badges, consumables, trackers, rest, damage, etc.)
 * - Load and save plugin settings
 * - Initialize state store for tracker persistence
 */
import { Plugin, App, MarkdownPostProcessorContext } from "obsidian";
import { DEFAULT_SETTINGS, DaggerheartSettings } from "./settings";
import { initializeStateStore } from "./lib/services/stateStore";
import { DaggerheartSettingTab } from "./ui/settings-tab";

// React ability/traits renderer
import { AbilityScoreView } from "./components/abilityscoreview";

// Block registrations
import { registerBadgesBlock } from "./blocks/badges";
import { registerConsumablesBlock } from "./blocks/consumables-block";
import { registerTrackersBlocks } from "./blocks/trackers-block";
import { registerDamage } from "./blocks/damage-vault";
import { registerRest } from "./blocks/rest";
import { registerVitals } from "./blocks/vitals";
import { registerLevelUp } from "./blocks/level-up";
import { registerDomainPickerBlock } from "./blocks/domain-picker";
import { registerFeaturesBlock } from "./blocks/features";
import { registerEquipmentPickerBlock } from "./blocks/equipment-picker";
import { registerExperiencesBlock } from "./blocks/experiences";

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

    // Register code fences; if another plugin already claimed these generic names,
    // fall back to namespaced aliases to avoid crashing the whole plugin.
    try {
      this.registerMarkdownCodeBlockProcessor('ability', renderAbilities);
    } catch (e) {
      console.warn('[DH-UI] "ability" code block already registered by another plugin; using alias "dh-ability" instead.', e);
      try { this.registerMarkdownCodeBlockProcessor('dh-ability', renderAbilities); } catch {}
    }
    try {
      this.registerMarkdownCodeBlockProcessor('traits', renderAbilities);
    } catch (e) {
      console.warn('[DH-UI] "traits" code block already registered by another plugin; using alias "dh-traits" instead.', e);
      try { this.registerMarkdownCodeBlockProcessor('dh-traits', renderAbilities); } catch {}
    }

    // Other processors
    try { registerBadgesBlock(this); }       catch (e) { console.error('[DH-UI] badges load error', e); }
    try { registerConsumablesBlock(this); }  catch (e) { console.error('[DH-UI] consumables load error', e); }
    try { registerTrackersBlocks(this); }    catch (e) { console.error('[DH-UI] trackers load error', e); }
    // Legacy standalone rest blocks removed; use ```rest instead.
    try { registerDamage(this); }            catch (e) { console.error('[DH-UI] damage load error', e); }

    // NEW: unified rest block
    try { registerRest(this); }         catch (e) { console.error('[DH-UI] rest load error', e); }
    try { registerVitals(this); }       catch (e) { console.error('[DH-UI] vitals load error', e); }
    try { registerLevelUp(this); }      catch (e) { console.error('[DH-UI] level-up load error', e); }
    try { registerDomainPickerBlock(this); } catch (e) { console.error('[DH-UI] domain-picker load error', e); }
    try { registerEquipmentPickerBlock(this); } catch (e) { console.error('[DH-UI] equipment-picker load error', e); }
    try { registerFeaturesBlock(this); } catch (e) { console.error('[DH-UI] features load error', e); }
    try { registerExperiencesBlock(this); } catch (e) { console.error('[DH-UI] experiences load error', e); }

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
