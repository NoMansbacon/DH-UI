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
  // Maximum active domain cards allowed in loadout; null/undefined/<=0 means no limit
  maxDomainLoadout: number | null;
  // Whether the domain picker should default to using the character's level and domains as filters
  domainPickerUseCharacterFilters: boolean;
  // Whether the equipment picker should hide items above the character's tier
  equipmentPickerEnforceTier: boolean;
  // Whether to automatically open the Domain Picker after applying a Level Up
  autoOpenDomainPickerAfterLevelUp: boolean;
  // 'card' = modal card grid, 'table' = tabular rows (no art)
  domainPickerView: 'card' | 'table';
}

export const DEFAULT_SETTINGS: DaggerheartSettings = {
  stateFilePath: ".obsidian/plugins/dh_state.json",
  domainCardsFolder: "",
  equipmentFolder: "",
  maxDomainLoadout: 5,
  domainPickerUseCharacterFilters: true,
  equipmentPickerEnforceTier: true,
  autoOpenDomainPickerAfterLevelUp: true,
  domainPickerView: 'card',
};
