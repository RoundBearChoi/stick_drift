import { Vector } from 'excalibur';

/**
 * Fixed-size occupancy grid for solid collision.
 * Cell size is 8px to match the visual GridSystem and smallest brick.
 * Top-left origin for both world and cell coordinates.
 */
export const CELL_SIZE = 8;

/** Native resolution is 640x360 → 80x45 cells */
export const LEVEL_WIDTH_CELLS = 80;
export const LEVEL_HEIGHT_CELLS = 45;

export class SolidGrid {
  private readonly data = new Uint8Array(LEVEL_WIDTH_CELLS * LEVEL_HEIGHT_CELLS);

  /**
   * Register a world-space axis-aligned rectangle as solid.
   * Expects top-left origin (matches brick pivot).
   */
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

  /** Convenience for 16x16 bricks (current asset size). */
  registerBrick(worldX: number, worldY: number): void {
    this.registerRect(worldX, worldY, 16, 16);
  }

  isSolid(cellX: number, cellY: number): boolean {
    if (
      cellX < 0 ||
      cellX >= LEVEL_WIDTH_CELLS ||
      cellY < 0 ||
      cellY >= LEVEL_HEIGHT_CELLS
    ) {
      // Treat out-of-bounds as solid for now (keeps runner inside the level)
      return true;
    }
    return this.data[cellY * LEVEL_WIDTH_CELLS + cellX] === 1;
  }

  /** World-space point → solid? */
  isSolidAtWorld(worldX: number, worldY: number): boolean {
    const cellX = Math.floor(worldX / CELL_SIZE);
    const cellY = Math.floor(worldY / CELL_SIZE);
    return this.isSolid(cellX, cellY);
  }

  clear(): void {
    this.data.fill(0);
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
    this.data[cellY * LEVEL_WIDTH_CELLS + cellX] = value;
  }
}
