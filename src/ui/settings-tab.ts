// src/ui/settings-tab.ts
import { App, PluginSettingTab, Setting } from "obsidian";
import type DaggerheartPlugin from "../main";
// No grid/layout settings UI; simplified settings tab

export class DaggerheartSettingTab extends PluginSettingTab {
  private plugin: DaggerheartPlugin;

  constructor(app: App, plugin: DaggerheartPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "Daggerheart UI Settings" });

    new Setting(containerEl)
      .setName("State file path")
      .setDesc(
        "Vault-relative path to the JSON file used for plugin state (e.g., trackers)."
      )
      .addText((text) => {
        text
          .setPlaceholder(".obsidian/plugins/dh_state.json")
          .setValue(this.plugin.settings.stateFilePath || "")
          .onChange(async (value) => {
            this.plugin.settings.stateFilePath = value.trim() || ".obsidian/plugins/dh_state.json";
            await this.plugin.saveSettings();
            // Reinitialize state store with new path
            try {
              await this.plugin.initializeStore();
            } catch (e) {
              console.error("[DH-UI] Failed to reinitialize state store:", e);
            }
          });
      });

    new Setting(containerEl)
      .setName("Domain cards folder")
      .setDesc(
        "Vault folder where domain cards are stored (leave empty to search entire vault by domain field)."
      )
      .addText((text) => {
        text
          .setPlaceholder("Cards/Domains")
          .setValue(this.plugin.settings.domainCardsFolder || "")
          .onChange(async (value) => {
            this.plugin.settings.domainCardsFolder = value.trim();
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Equipment folder")
      .setDesc("Vault folder where equipment (weapons/armor) notes are stored. Leave empty to search entire vault.")
      .addText((text) => {
        text
          .setPlaceholder("Items")
          .setValue(this.plugin.settings.equipmentFolder || "")
          .onChange(async (value) => {
            this.plugin.settings.equipmentFolder = value.trim();
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Max domain cards in loadout")
      .setDesc(
        "Maximum number of domain cards allowed in a character's loadout. Leave blank for no limit."
      )
      .addText((text) => {
        text
          .setPlaceholder("5")
          .setValue(
            this.plugin.settings.maxDomainLoadout != null && Number.isFinite(this.plugin.settings.maxDomainLoadout)
              ? String(this.plugin.settings.maxDomainLoadout)
              : ""
          )
          .onChange(async (value) => {
            const trimmed = value.trim();
            if (!trimmed) {
              this.plugin.settings.maxDomainLoadout = null;
            } else {
              const n = Number(trimmed);
              this.plugin.settings.maxDomainLoadout = Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
            }
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Restrict domain picker to character level & domains")
      .setDesc("When enabled, Add Domain Cards defaults to cards at or below the character's level and matching their domains.")
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.domainPickerUseCharacterFilters !== false)
          .onChange(async (value) => {
            this.plugin.settings.domainPickerUseCharacterFilters = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Restrict equipment picker to character tier")
      .setDesc("When enabled, Add Equipment hides items above the character's tier.")
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.equipmentPickerEnforceTier !== false)
          .onChange(async (value) => {
            this.plugin.settings.equipmentPickerEnforceTier = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Auto-open Domain Picker after Level Up")
      .setDesc("When enabled, applying a Level Up automatically opens the Domain Picker so you can add domain cards.")
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.autoOpenDomainPickerAfterLevelUp !== false)
          .onChange(async (value) => {
            this.plugin.settings.autoOpenDomainPickerAfterLevelUp = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Domain picker view")
      .setDesc("Choose between card grid or table view (no art) for the Add Domain Cards modal.")
      .addDropdown((dd) => {
        dd.addOption('card', 'Card grid');
        dd.addOption('table', 'Table (no art)');
        dd.setValue(this.plugin.settings.domainPickerView || 'card');
        dd.onChange(async (v: 'card' | 'table') => {
          this.plugin.settings.domainPickerView = v;
          await this.plugin.saveSettings();
        });
      });

    // Grid/layout customization removed by request; CSS drives layout via container queries
  }
}
