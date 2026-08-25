import { CELL_SIZE } from './solid_grid';

/** world-space size of one brick (matches 16x16_brick.aseprite + SolidGrid registration) */
export const BRICK_SIZE = 16;

/**
 * pure data for the current level.
 * owned by GameContext — scenes read / write this, but never store Actors here.
 */
export interface BrickPlacement {
  /** world-space top-left (matches brick pivot + SolidGrid.registerRect) */
  x: number;
  y: number;
}

export class LevelContext {
  /**
   * level size in cells.
   * hard-coded for now (2× native resolution → 1280×720 so the camera has room to chase).
   * scenes / level loaders can overwrite these when starting a level.
   * IMPORTANT: change only at scene/level start — not mid-frame.
   */
  width_cells = 160;
  height_cells = 90;

  /**
   * authoritative list of bricks for the current level.
   * in js array size is fully dynamic.
   */
  bricks: BrickPlacement[] = [];

  get width_px(): number {
    return this.width_cells * CELL_SIZE;
  }

  get height_px(): number {
    return this.height_cells * CELL_SIZE;
  }

  clear(): void {
    this.bricks.length = 0;
  }

  addBrick(x: number, y: number): void {
    this.bricks.push({ x, y });
  }

  /**
   * true if the snapped grid point itself is inside the level
   * (used by the green placement cursor).
   */
  isPointInside(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.width_px && y < this.height_px;
  }

  /**
   * true if a BRICK_SIZE×BRICK_SIZE brick with top-left at (x, y)
   * lies fully inside the level bounds.
   */
  isBrickFullyInside(x: number, y: number, size = BRICK_SIZE): boolean {
    return (
      x >= 0 &&
      y >= 0 &&
      x + size <= this.width_px &&
      y + size <= this.height_px
    );
  }

  /**
   * true if a brick at (x, y) would overlap any existing brick
   * (axis-aligned, top-left origin).
   */
  wouldOverlap(x: number, y: number, size = BRICK_SIZE): boolean {
    return this.bricks.some(
      (b) =>
        x < b.x + size &&
        x + size > b.x &&
        y < b.y + size &&
        y + size > b.y
    );
  }

  /**
   * full placement gate: point-level checks are caller's job for the cursor;
   * this is the commit-time validation for a brick.
   */
  canPlaceBrick(x: number, y: number, size = BRICK_SIZE): boolean {
    return this.isBrickFullyInside(x, y, size) && !this.wouldOverlap(x, y, size);
  }
}
