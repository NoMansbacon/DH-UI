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

    containerEl.createEl("h3", { text: "Domain Picker Table Columns" });
    const columns: (keyof typeof this.plugin.settings.domainPickerColumns)[] = [
      "name",
      "type",
      "domain",
      "level",
      "stress",
      "feature",
      "tokens",
    ];
    columns.forEach((col) => {
      new Setting(containerEl)
        .setName(`Show ${col.charAt(0).toUpperCase() + col.slice(1)} column`)
        .addToggle((toggle) => {
          toggle
            .setValue(this.plugin.settings.domainPickerColumns[col])
            .onChange(async (value) => {
              this.plugin.settings.domainPickerColumns[col] = value;
              await this.plugin.saveSettings();
            });
        });
    });



    // Template preview
    containerEl.createEl("h3", { text: "Template Preview" });
    const previewWrap = containerEl.createDiv({ cls: 'dh-template-preview' });
    const input = new (Setting as any)(previewWrap).settingEl.createEl('textarea', { cls: 'dh-template-input', attr: { rows: '3', placeholder: "Enter a template, e.g. {{ frontmatter.level }}" } }) as HTMLTextAreaElement;
    const out = previewWrap.createDiv({ cls: 'dh-template-output' });
    const render = () => {
      try {
        const app = this.app;
        const file = app.workspace.getActiveFile();
        const fm = file ? (app.metadataCache.getFileCache(file)?.frontmatter ?? {}) : {};
        // create a minimal mdctx so createTemplateContext can build a context
        const mdctx: any = { sourcePath: file?.path || '', getSectionInfo: (_: any)=> undefined };
        const ctx = (require('../utils/template') as any).createTemplateContext(document.body, app, mdctx, fm);
        const text = String(input.value || '');
        const outStr = (require('../utils/template') as any).processTemplate(text, ctx);
        out.setText(outStr);
      } catch (e) { out.setText(''); }
    };
    input.addEventListener('input', render);
    render();

    // Grid/layout customization removed by request; CSS drives layout via container queries
  }
}
