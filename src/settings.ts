/**
 * live visual-debug toggles.
 * owned by GameContext. not cleared by any reset.
 * initial values may be overridden once by apply() from res/settings.json.
 */
export class Settings {
  show_collider_debug = true;
  show_jump_debug = true;
  show_fall_debug = true;

  /**
   * seed known boolean keys from a settings file.
   * missing or non-boolean keys keep the hard-coded defaults.
   */
  apply(file: SettingsFile): void {
    if (typeof file.show_collider_debug === 'boolean') {
      this.show_collider_debug = file.show_collider_debug;
    }
    if (typeof file.show_jump_debug === 'boolean') {
      this.show_jump_debug = file.show_jump_debug;
    }
    if (typeof file.show_fall_debug === 'boolean') {
      this.show_fall_debug = file.show_fall_debug;
    }
  }
}

/** partial shape of res/settings.json */
export interface SettingsFile {
  show_collider_debug?: boolean;
  show_jump_debug?: boolean;
  show_fall_debug?: boolean;
}

/**
 * fetch res/settings.json.
 * returns {} on any failure so callers can safely apply partial/missing data.
 */
export async function loadSettings(): Promise<SettingsFile> {
  try {
    const response = await fetch('./res/settings.json');
    if (!response.ok) {
      console.warn(
        `settings.json not found or failed (${response.status}), using defaults`
      );
      return {};
    }
    const text = await response.text();
    const parsed: unknown = JSON.parse(text);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      console.warn('settings.json is not an object, using defaults');
      return {};
    }
    return parsed as SettingsFile;
  } catch (err) {
    console.warn('failed to load settings.json, using defaults', err);
    return {};
  }
}
