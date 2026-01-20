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
  // Optional tag (e.g. "#domain-card") to restrict Domain Picker discovery.
  // Stored without the leading '#' internally.
  domainCardsTag: string;
  equipmentFolder: string;
  // Optional tag (e.g. "#equipment") to restrict Equipment Picker discovery.
  // Stored without the leading '#' internally.
  equipmentTag: string;
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
  // Default art height (in px) for domain cards in the Add Domain Cards modal
  domainCardArtHeight: number;
  // Default art height (in px) for equipment cards in the Add Equipment modal
  equipmentCardArtHeight: number;
}

export const DEFAULT_SETTINGS: DaggerheartSettings = {
  stateFilePath: ".obsidian/plugins/dh_state.json",
  domainCardsFolder: "",
  domainCardsTag: "",
  equipmentFolder: "",
  equipmentTag: "",
  maxDomainLoadout: 5,
  domainPickerUseCharacterFilters: true,
  equipmentPickerEnforceTier: true,
  autoOpenDomainPickerAfterLevelUp: true,
  domainPickerView: 'card',
  domainCardArtHeight: 160,
  equipmentCardArtHeight: 160,
};
