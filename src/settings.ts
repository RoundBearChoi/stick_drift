/**
 * initial visual-debug flags.
 * loaded once at startup; missing keys keep the hard-coded defaults on RunnerContext.
 */
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
