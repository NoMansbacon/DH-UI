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

    // Grid/layout customization removed by request; CSS drives layout via container queries
  }
}


