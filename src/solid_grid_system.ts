import { SpikeFacing } from './spike_type';

/**
 * IMPORTANT: top-left origin for both world and cell coordinates. brick pivot must be top-left.
 */
export const CELL_SIZE = 8;

export const CELL_SOLID = 1;
export const CELL_SPIKE_UP = 2;
export const CELL_SPIKE_RIGHT = 4;
export const CELL_SPIKE_DOWN = 8;
export const CELL_SPIKE_LEFT = 16;

export function verticalOverlapWithCell(top: number, bottom: number, row: number): number {
  const cellTop = row * CELL_SIZE;
  const cellBottom = cellTop + CELL_SIZE;
  return Math.min(bottom, cellBottom) - Math.max(top, cellTop);
}

export function spikeFacingFlag(facing: SpikeFacing): number {
  switch (facing) {
    case SpikeFacing.Up:
      return CELL_SPIKE_UP;
    case SpikeFacing.Right:
      return CELL_SPIKE_RIGHT;
    case SpikeFacing.Down:
      return CELL_SPIKE_DOWN;
    case SpikeFacing.Left:
      return CELL_SPIKE_LEFT;
  }
}

export class SolidGridSystem {
  readonly widthCells: number;
  readonly heightCells: number;

  /*
   one giant array that contains all 8x8 cells in the level.
   uint8 is the smallest native unit in js (8 bits 00000000 0~255).
   manually packing 1 bit per cell wouldn't be worth it.

   bitfield grid
   bit 0  00000001  CELL_SOLID        = 1     yes / no
   bit 1  00000010  CELL_SPIKE_UP     = 2     yes / no
   bit 2  00000100  CELL_SPIKE_RIGHT  = 4     yes / no
   bit 3  00001000  CELL_SPIKE_DOWN   = 8     yes / no
   bit 4  00010000  CELL_SPIKE_LEFT   = 16    yes / no
   */
  private readonly _arr_level_width_height: Uint8Array;

  constructor(widthCells: number, heightCells: number) {
    this.widthCells = widthCells;
    this.heightCells = heightCells;
    this._arr_level_width_height = new Uint8Array(widthCells * heightCells);
  }

  /**
   * whether a brick (or a solid) is 16x16 or 8x8 or whatever, we simply fill up corresponding 8x8 CELLS.
   * right now cellSize = 8
   */
  registerRect(worldX: number, worldY: number, width: number, height: number): void {
    const x0 = Math.floor(worldX / CELL_SIZE);
    const y0 = Math.floor(worldY / CELL_SIZE);
    const x1 = Math.ceil((worldX + width) / CELL_SIZE);
    const y1 = Math.ceil((worldY + height) / CELL_SIZE);

/*
x0 x1 y0 y1 are grid indexes (based on 8x8)

column x →  0        1        2              widthCells-1
row y
↓
0           [0,0]    [1,0]    [2,0]   ...    [width-1, 0]
1           [0,1]    [1,1]    [2,1]   ...    [width-1, 1]
2           [0,2]    [1,2]    [2,2]   ...    ...
...         ...      ...      ...     ...    ...
height-1                                     [width-1, height-1]

cell (0, 0) is the top-left of the level. Indexes increase right and down, ending at the bottom-right.

*/

    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        this.orCell(x, y, CELL_SOLID);
      }
    }
  }

  /**
   * mark only the pointed edge of a spike. full rect is already be registered as solid.
   * ie. 16x16 CELL_SPIKE_UP marks top two 8x8 cells.
   */
  registerSpikeFace(
    worldX: number,
    worldY: number,
    width: number,
    height: number,
    facing: SpikeFacing
  ): void {
    const x0 = Math.floor(worldX / CELL_SIZE);
    const y0 = Math.floor(worldY / CELL_SIZE);
    const x1 = Math.ceil((worldX + width) / CELL_SIZE);
    const y1 = Math.ceil((worldY + height) / CELL_SIZE);
    const flag = spikeFacingFlag(facing);

    if (x1 <= x0 || y1 <= y0) return;

    if (facing === SpikeFacing.Up) {
      for (let x = x0; x < x1; x++) {
        this.orCell(x, y0, flag);
      }
      return;
    }

    if (facing === SpikeFacing.Down) {
      for (let x = x0; x < x1; x++) {
        this.orCell(x, y1 - 1, flag);
      }
      return;
    }

    if (facing === SpikeFacing.Left) {
      for (let y = y0; y < y1; y++) {
        this.orCell(x0, y, flag);
      }
      return;
    }

    for (let y = y0; y < y1; y++) {
      this.orCell(x1 - 1, y, flag);
    }
  }

  isSolid(cellX: number, cellY: number): boolean {
    // treating out-of-bounds as solid for now
    if (
      cellX < 0 ||
      cellX >= this.widthCells || // right of the level (top edge)
      cellY < 0 || // above the level
      cellY >= this.heightCells // below the level (bottom edge)
    ) {
      return true;
    }
    return (this._arr_level_width_height[cellY * this.widthCells + cellX] & CELL_SOLID) !== 0;
  }

  isSolidAtWorldSpace(worldX: number, worldY: number): boolean {
    const cellX = Math.floor(worldX / CELL_SIZE);
    const cellY = Math.floor(worldY / CELL_SIZE);
    return this.isSolid(cellX, cellY);
  }

  /**
   * out-of-bounds is solid, but never a spike.
   */
  hasFlag(cellX: number, cellY: number, flag: number): boolean {
    if (
      cellX < 0 ||
      cellX >= this.widthCells ||
      cellY < 0 ||
      cellY >= this.heightCells
    ) {
      return false;
    }
    return (this._arr_level_width_height[cellY * this.widthCells + cellX] & flag) !== 0;
  }

  hasFlagAtWorldSpace(worldX: number, worldY: number, flag: number): boolean {
    const cellX = Math.floor(worldX / CELL_SIZE);
    const cellY = Math.floor(worldY / CELL_SIZE);
    return this.hasFlag(cellX, cellY, flag);
  }

  clearSolidData(): void {
    this._arr_level_width_height.fill(0);
  }

  private orCell(cellX: number, cellY: number, flag: number): void {
    if (
      cellX < 0 ||
      cellX >= this.widthCells ||
      cellY < 0 ||
      cellY >= this.heightCells
    ) {
      return;
    }
    const i = cellY * this.widthCells + cellX;
    this._arr_level_width_height[i] = this._arr_level_width_height[i] | flag;
  }
}
