import { CELL_SIZE } from './solid_grid';
import {
  BrickType,
  DEFAULT_BRICK_TYPE,
  brickDef,
} from './brick_type';

/**
 * pure data for the current level.
 * owned by GameContext — scenes read / write this, but never store Actors here.
 */
export interface arrBrickPlacement {
  /** world-space top-left (matches brick pivot + SolidGrid.registerRect) */
  x: number;
  y: number;
  type: BrickType;
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
   * objects such as Uint8Array, Float32Array, etc do have a fixed length that cannot be changed after creation. plain array is dynamic.
   */
  bricks: arrBrickPlacement[] = [];

  get width_px(): number {
    return this.width_cells * CELL_SIZE;
  }

  get height_px(): number {
    return this.height_cells * CELL_SIZE;
  }

  clear(): void {
    this.bricks.length = 0;
  }

  addBrick(
    x: number,
    y: number,
    type: BrickType = DEFAULT_BRICK_TYPE
  ): void {
    this.bricks.push({ x, y, type });
  }

  /**
   * true if the snapped grid point itself is inside the level
   * (used by the green placement cursor).
   */
  isPointInside(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.width_px && y < this.height_px;
  }

  /**
   * true if a brick of `type` with top-left at (x, y)
   * lies fully inside the level bounds.
   */
  isBrickFullyInside(
    x: number,
    y: number,
    type: BrickType = DEFAULT_BRICK_TYPE
  ): boolean {
    const { width, height } = brickDef(type);
    return (
      x >= 0 &&
      y >= 0 &&
      x + width <= this.width_px &&
      y + height <= this.height_px
    );
  }

  /**
   * true if a brick at (x, y) would overlap any existing brick
   * (axis-aligned, top-left origin, each brick uses its own w/h).
   */
  wouldOverlap(
    x: number,
    y: number,
    type: BrickType = DEFAULT_BRICK_TYPE
  ): boolean {
    const a = brickDef(type);
    return this.bricks.some((b) => {
      const o = brickDef(b.type);
      return (
        x < b.x + o.width &&
        x + a.width > b.x &&
        y < b.y + o.height &&
        y + a.height > b.y
      );
    });
  }

  /**
   * full placement gate: point-level checks are caller's job for the cursor;
   * this is the commit-time validation for a brick.
   */
  canPlaceBrick(
    x: number,
    y: number,
    type: BrickType = DEFAULT_BRICK_TYPE
  ): boolean {
    return this.isBrickFullyInside(x, y, type) && !this.wouldOverlap(x, y, type);
  }
}
