import { STORAGE_KEYS } from './config.js';

export class StorageManager {
  /**
   * Save application state
   */
  static saveState(state) {
    localStorage.setItem(STORAGE_KEYS.STATE, JSON.stringify(state));
  }

  /**
   * Load application state
   */
  static loadState() {
    const saved = localStorage.getItem(STORAGE_KEYS.STATE);
    return saved ? JSON.parse(saved) : null;
  }

  /**
   * Save preset
   */
  static savePreset(name, preset) {
    const key = `${STORAGE_KEYS.PRESET_PREFIX}${name}`;
    localStorage.setItem(key, JSON.stringify(preset));
    return true;
  }

  /**
   * Load preset
   */
  static loadPreset(name) {
    const key = `${STORAGE_KEYS.PRESET_PREFIX}${name}`;
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : null;
  }

  /**
   * Delete preset
   */
  static deletePreset(name) {
    const key = `${STORAGE_KEYS.PRESET_PREFIX}${name}`;
    localStorage.removeItem(key);
  }

  /**
   * List all presets
   */
  static listPresets() {
    const presets = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(STORAGE_KEYS.PRESET_PREFIX)) {
        const name = key.replace(STORAGE_KEYS.PRESET_PREFIX, '');
        presets.push(name);
      }
    }
    return presets;
  }

  /**
   * Save theme preference
   */
  static saveTheme(isDark) {
    localStorage.setItem(STORAGE_KEYS.THEME, isDark ? 'dark' : 'light');
  }

  /**
   * Load theme preference
   */
  static loadTheme() {
    return localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';
  }

  /**
   * Clear all data
   */
  static clearAll() {
    localStorage.clear();
  }
}