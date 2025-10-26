// src/settings.ts
export interface DaggerheartSettings {
  stateFilePath: string;
}

export const DEFAULT_SETTINGS: DaggerheartSettings = {
  stateFilePath: ".obsidian/plugins/dh_state.json",
};
