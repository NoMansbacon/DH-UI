// src/settings.ts
/**
 * Plugin settings configuration
 * 
 * Defines all user-configurable settings for the Daggerheart plugin including:
 * - Art/image display settings (width, height, fit, alignment)
 * - State file path for persistent tracker data
 */

export interface DaggerheartSettings {
  stateFilePath: string;
  domainCardsFolder: string;
  equipmentFolder: string;
  // 'card' = modal card grid, 'table' = tabular rows (no art)
  domainPickerView: 'card' | 'table';
  domainPickerColumns: {
    name: boolean;
    type: boolean;
    domain: boolean;
    level: boolean;
    stress: boolean;
    feature: boolean;
    tokens: boolean;
  };
}

export const DEFAULT_SETTINGS: DaggerheartSettings = {
  stateFilePath: ".obsidian/plugins/dh_state.json",
  domainCardsFolder: "",
  equipmentFolder: "",
  domainPickerView: 'card',
  domainPickerColumns: {
    name: true,
    type: true,
    domain: true,
    level: true,
    stress: true,
    feature: true,
    tokens: true,
  },
};
