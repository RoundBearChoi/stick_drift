/**
 * fixed-size occupancy grid for collision detection.
 * cell size is 8px. smallest brick must be 8x8.
 * IMPORTANT: top-left origin for both world and cell coordinates. brick pivot must be top-left.
 */
export const CELL_SIZE = 8;

/** level size = 2× native resolution (640×360 → 1280×720) so the camera has room to chase */
export const LEVEL_WIDTH_CELLS = 160;
export const LEVEL_HEIGHT_CELLS = 90;

export class SolidGrid {
  /**
   * one giant array that contains all 8x8 cells in the level.
   * uint8 is the smallest native unit in js (8 bits 00000000 0~255).
   * manually packing 1 bit per cell wouldn't be worth it.
   */
  private readonly _arr_level_width_height = new Uint8Array(LEVEL_WIDTH_CELLS * LEVEL_HEIGHT_CELLS);

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
    if (
      cellX < 0 ||
      cellX >= LEVEL_WIDTH_CELLS ||
      cellY < 0 ||
      cellY >= LEVEL_HEIGHT_CELLS
    ) {
      // treat out-of-bounds as solid for now
      return true;
    }
    return this._arr_level_width_height[cellY * LEVEL_WIDTH_CELLS + cellX] === 1;
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
      cellX >= LEVEL_WIDTH_CELLS ||
      cellY < 0 ||
      cellY >= LEVEL_HEIGHT_CELLS
    ) {
      return;
    }
    this._arr_level_width_height[cellY * LEVEL_WIDTH_CELLS + cellX] = value;
  }
}
