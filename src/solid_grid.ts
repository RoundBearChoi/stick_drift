/**
 * fixed-size occupancy grid for collision detection.
 * cell size is 8px. smallest brick must be 8x8.
 * IMPORTANT: top-left origin for both world and cell coordinates. brick pivot must be top-left.
 */
export const CELL_SIZE = 8;

/**
 * pixels of [top, bottom] that sit inside row `row`.
 * cell range is [row * CELL_SIZE, (row + 1) * CELL_SIZE).
 */
export function verticalOverlapWithCell(top: number, bottom: number, row: number): number {
  const cellTop = row * CELL_SIZE;
  const cellBottom = cellTop + CELL_SIZE;
  return Math.min(bottom, cellBottom) - Math.max(top, cellTop);
}

export class SolidGrid {
  readonly widthCells: number;
  readonly heightCells: number;

  /**
   * one giant array that contains all 8x8 cells in the level.
   * uint8 is the smallest native unit in js (8 bits 00000000 0~255).
   * manually packing 1 bit per cell wouldn't be worth it.
   */
  private readonly _arr_level_width_height: Uint8Array;

  /**
   * @param widthCells  level width in cells (from GameContext.level_width_cells)
   * @param heightCells level height in cells (from GameContext.level_height_cells)
   */
  constructor(widthCells: number, heightCells: number) {
    this.widthCells = widthCells;
    this.heightCells = heightCells;
    this._arr_level_width_height = new Uint8Array(widthCells * heightCells);
  }

  /** register world-space axis-aligned rectangle as a solid object. this function expects top-left origin. */
  registerRect(worldX: number, worldY: number, width: number, height: number): void {
    const x0 = Math.floor(worldX / CELL_SIZE);
    const y0 = Math.floor(worldY / CELL_SIZE);
    const x1 = Math.ceil((worldX + width) / CELL_SIZE);
    const y1 = Math.ceil((worldY + height) / CELL_SIZE);

    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        this.setCell(x, y, 1);
      }
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
    return this._arr_level_width_height[cellY * this.widthCells + cellX] === 1;
  }

  /** check world-space point for solid */
  isSolidAtWorld(worldX: number, worldY: number): boolean {
    const cellX = Math.floor(worldX / CELL_SIZE);
    const cellY = Math.floor(worldY / CELL_SIZE);
    return this.isSolid(cellX, cellY);
  }

  clearSolidData(): void {
    this._arr_level_width_height.fill(0);
  }

  private setCell(cellX: number, cellY: number, value: number): void {
    if (
      cellX < 0 ||
      cellX >= this.widthCells ||
      cellY < 0 ||
      cellY >= this.heightCells
    ) {
      return;
    }
    this._arr_level_width_height[cellY * this.widthCells + cellX] = value;
  }
}
