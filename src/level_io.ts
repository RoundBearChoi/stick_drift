import { LevelContext } from './level_context';
import { BrickType, BRICK_TYPES } from './brick_type';
import { SpikeFacing, SpikeType, SPIKE_TYPES } from './spike_type';

export const LEVEL_FILE_FORMAT = 'stick_drift_level';
export const LEVEL_FILE_VERSION = 1;

const LEVEL_FILE_TYPES = [
  {
    description: 'Stick Drift level',
    accept: { 'application/json': ['.json'] },
  },
];

const FACING_NAMES = ['up', 'right', 'down', 'left'] as const;

export interface LevelFileBrick {
  x: number;
  y: number;
  type: BrickType;
}

export interface LevelFileSpike {
  x: number;
  y: number;
  type: SpikeType;
  facing: SpikeFacing;
}

export interface LevelFile {
  format: typeof LEVEL_FILE_FORMAT;
  version: typeof LEVEL_FILE_VERSION;
  width_cells: number;
  height_cells: number;
  bricks: LevelFileBrick[];
  spikes: LevelFileSpike[];
}

interface LevelFilePickerType {
  description: string;
  accept: Record<string, string[]>;
}

interface LevelWritable {
  write(data: string): Promise<void>;
  close(): Promise<void>;
}

interface LevelSaveHandle {
  createWritable(): Promise<LevelWritable>;
}

interface LevelOpenHandle {
  getFile(): Promise<File>;
}

interface LevelFilePickerWindow {
  showSaveFilePicker?: (options: {
    suggestedName?: string;
    types?: LevelFilePickerType[];
  }) => Promise<LevelSaveHandle>;
  showOpenFilePicker?: (options: {
    multiple?: boolean;
    types?: LevelFilePickerType[];
  }) => Promise<LevelOpenHandle[]>;
}

/**
 * plain level data. no actors, no runtime ids.
 * gameplay can load this same file later and ignore anything editor-only.
 */
export function toLevelFile(level: LevelContext): LevelFile {
  return {
    format: LEVEL_FILE_FORMAT,
    version: LEVEL_FILE_VERSION,
    width_cells: level.width_cells,
    height_cells: level.height_cells,
    bricks: level.bricks.map((b) => ({
      x: b.x,
      y: b.y,
      type: b.type,
    })),
    spikes: level.spikes.map((s) => ({
      x: s.x,
      y: s.y,
      type: s.type,
      facing: s.facing,
    })),
  };
}

export function serializeLevel(level: LevelContext): string {
  const file = toLevelFile(level);
  const raw = {
    format: file.format,
    version: file.version,
    width_cells: file.width_cells,
    height_cells: file.height_cells,
    bricks: file.bricks,
    spikes: file.spikes.map((s) => ({
      x: s.x,
      y: s.y,
      type: s.type,
      facing: FACING_NAMES[s.facing],
    })),
  };
  return JSON.stringify(raw, null, 2) + '\n';
}

/** throws if the file is not a stick_drift_level we know how to read. */
export function parseLevelFile(text: string): LevelFile {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('level file is not valid JSON');
  }

  if (!isRecord(raw)) {
    throw new Error('level file must be a JSON object');
  }
  if (raw.format !== LEVEL_FILE_FORMAT) {
    throw new Error(`unsupported level format: ${String(raw.format)}`);
  }
  if (raw.version !== LEVEL_FILE_VERSION) {
    throw new Error(`unsupported level version: ${String(raw.version)}`);
  }

  const width_cells = expectPositiveInt(raw.width_cells, 'width_cells');
  const height_cells = expectPositiveInt(raw.height_cells, 'height_cells');
  const bricks = expectArray(raw.bricks, 'bricks').map((item, i) => parseBrick(item, i));
  const spikes = expectArray(raw.spikes, 'spikes').map((item, i) => parseSpike(item, i));

  return {
    format: LEVEL_FILE_FORMAT,
    version: LEVEL_FILE_VERSION,
    width_cells,
    height_cells,
    bricks,
    spikes,
  };
}

/**
 * open the browser save dialog and write the current level.
 * call this directly from a keydown handler. a later game-loop poll is not a user gesture,
 * and Chromium will refuse the picker.
 * returns false if the user cancels. Firefox has no save picker, so it downloads level.json.
 */
export async function saveLevelFile(level: LevelContext): Promise<boolean> {
  const json = serializeLevel(level);
  const picker = filePickerWindow().showSaveFilePicker;
  if (!picker) {
    downloadLevelFile(json);
    return true;
  }

  try {
    const handle = await picker({
      suggestedName: 'level.json',
      types: LEVEL_FILE_TYPES,
    });
    const writable = await handle.createWritable();
    await writable.write(json);
    await writable.close();
    return true;
  } catch (err) {
    if (isUserCancel(err)) return false;
    throw err;
  }
}

/**
 * open the browser load dialog.
 * same gesture rule as save: call from the keydown handler, before any await.
 * returns null if the user cancels.
 */
export function loadLevelFile(): Promise<LevelFile | null> {
  const picker = filePickerWindow().showOpenFilePicker;
  if (picker) return loadWithPicker(picker);
  return loadWithInput();
}

async function loadWithPicker(
  picker: NonNullable<LevelFilePickerWindow['showOpenFilePicker']>
): Promise<LevelFile | null> {
  try {
    const [handle] = await picker({
      multiple: false,
      types: LEVEL_FILE_TYPES,
    });
    if (!handle) return null;
    const file = await handle.getFile();
    return parseLevelFile(await file.text());
  } catch (err) {
    if (isUserCancel(err)) return null;
    throw err;
  }
}

function loadWithInput(): Promise<LevelFile | null> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.style.position = 'fixed';
    input.style.left = '-1000px';
    let settled = false;

    const finish = (result: LevelFile | null) => {
      if (settled) return;
      settled = true;
      input.remove();
      resolve(result);
    };

    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (!file) {
        finish(null);
        return;
      }
      file.text().then((text) => finish(parseLevelFile(text))).catch(reject);
    });
    input.addEventListener('cancel', () => finish(null));
    window.addEventListener(
      'focus',
      () => {
        window.setTimeout(() => finish(null), 300);
      },
      { once: true }
    );

    document.body.appendChild(input);
    input.click();
  });
}

function downloadLevelFile(json: string): void {
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'level.json';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function filePickerWindow(): LevelFilePickerWindow {
  return window as LevelFilePickerWindow;
}

function parseBrick(item: unknown, index: number): LevelFileBrick {
  if (!isRecord(item)) {
    throw new Error(`bricks[${index}] must be an object`);
  }
  return {
    x: expectFinite(item.x, `bricks[${index}].x`),
    y: expectFinite(item.y, `bricks[${index}].y`),
    type: expectBrickType(item.type, `bricks[${index}].type`),
  };
}

function parseSpike(item: unknown, index: number): LevelFileSpike {
  if (!isRecord(item)) {
    throw new Error(`spikes[${index}] must be an object`);
  }
  return {
    x: expectFinite(item.x, `spikes[${index}].x`),
    y: expectFinite(item.y, `spikes[${index}].y`),
    type: expectSpikeType(item.type, `spikes[${index}].type`),
    facing: expectFacing(item.facing, `spikes[${index}].facing`),
  };
}

function expectBrickType(value: unknown, label: string): BrickType {
  if (typeof value === 'string' && (BRICK_TYPES as string[]).includes(value)) {
    return value as BrickType;
  }
  throw new Error(`${label} is not a brick type: ${String(value)}`);
}

function expectSpikeType(value: unknown, label: string): SpikeType {
  if (typeof value === 'string' && (SPIKE_TYPES as string[]).includes(value)) {
    return value as SpikeType;
  }
  throw new Error(`${label} is not a spike type: ${String(value)}`);
}

function expectFacing(value: unknown, label: string): SpikeFacing {
  if (typeof value === 'string') {
    const index = FACING_NAMES.indexOf(value as (typeof FACING_NAMES)[number]);
    if (index !== -1) return index as SpikeFacing;
  }
  if (value === 0 || value === 1 || value === 2 || value === 3) {
    return value as SpikeFacing;
  }
  throw new Error(`${label} is not a facing: ${String(value)}`);
}

function expectPositiveInt(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw new Error(`${label} must be a positive integer`);
  }
  return value;
}

function expectFinite(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number`);
  }
  return value;
}

function expectArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array`);
  }
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isUserCancel(err: unknown): boolean {
  return isRecord(err) && err.name === 'AbortError';
}
