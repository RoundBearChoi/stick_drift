import { CELL_SIZE } from './solid_grid';
import {
  BrickType,
  DEFAULT_BRICK_TYPE,
  brickDef,
} from './brick_type';
import {
  SpikeType,
  DEFAULT_SPIKE_TYPE,
  spikeDef,
} from './spike_type';

/**
 * pure data for the current level.
 * owned by GameContext — scenes read / write this, but never store Actors here.
 */
export interface arrBrickPlacement {
  /** stable editor / scene handle. not a world position. */
  id: number;
  /** world-space top-left (matches brick pivot + SolidGrid.registerRect) */
  x: number;
  y: number;
  type: BrickType;
}

export interface arrSpikePlacement {
  /** stable editor / scene handle. not a world position. */
  id: number;
  /** world-space top-left (matches spike pivot + SolidGrid.registerRect) */
  x: number;
  y: number;
  type: SpikeType;
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

  /**
   * authoritative list of spikes for the current level.
   */
  spikes: arrSpikePlacement[] = [];

  private _nextId = 1;

  get width_px(): number {
    return this.width_cells * CELL_SIZE;
  }

  get height_px(): number {
    return this.height_cells * CELL_SIZE;
  }

  clear(): void {
    this.bricks.length = 0;
    this.spikes.length = 0;
  }

  addBrick(
    x: number,
    y: number,
    type: BrickType = DEFAULT_BRICK_TYPE
  ): arrBrickPlacement {
    const placed: arrBrickPlacement = {
      id: this._nextId++,
      x,
      y,
      type,
    };
    this.bricks.push(placed);
    return placed;
  }

  addSpike(
    x: number,
    y: number,
    type: SpikeType = DEFAULT_SPIKE_TYPE
  ): arrSpikePlacement {
    const placed: arrSpikePlacement = {
      id: this._nextId++,
      x,
      y,
      type,
    };
    this.spikes.push(placed);
    return placed;
  }

  /**
   * true if the snapped grid point itself is inside the level
   * (used by the green placement cursor).
   */
  isPointInside(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.width_px && y < this.height_px;
  }

  isRectFullyInside(x: number, y: number, width: number, height: number): boolean {
    return (
      x >= 0 &&
      y >= 0 &&
      x + width <= this.width_px &&
      y + height <= this.height_px
    );
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
    return this.isRectFullyInside(x, y, width, height);
  }

  isSpikeFullyInside(
    x: number,
    y: number,
    type: SpikeType = DEFAULT_SPIKE_TYPE
  ): boolean {
    const { width, height } = spikeDef(type);
    return this.isRectFullyInside(x, y, width, height);
  }

  wouldOverlapRect(
    x: number,
    y: number,
    width: number,
    height: number,
    ignoreIds?: ReadonlySet<number>
  ): boolean {
    const hitsBrick = this.bricks.some((b) => {
      if (ignoreIds?.has(b.id)) return false;
      const o = brickDef(b.type);
      return rectsOverlap(x, y, width, height, b.x, b.y, o.width, o.height);
    });
    if (hitsBrick) return true;

    return this.spikes.some((s) => {
      if (ignoreIds?.has(s.id)) return false;
      const o = spikeDef(s.type);
      return rectsOverlap(x, y, width, height, s.x, s.y, o.width, o.height);
    });
  }

  /**
   * true if a brick at (x, y) would overlap any existing solid
   * (axis-aligned, top-left origin, each object uses its own w/h).
   */
  wouldOverlap(
    x: number,
    y: number,
    type: BrickType = DEFAULT_BRICK_TYPE
  ): boolean {
    const a = brickDef(type);
    return this.wouldOverlapRect(x, y, a.width, a.height);
  }

  wouldOverlapSpike(
    x: number,
    y: number,
    type: SpikeType = DEFAULT_SPIKE_TYPE
  ): boolean {
    const a = spikeDef(type);
    return this.wouldOverlapRect(x, y, a.width, a.height);
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

  canPlaceSpike(
    x: number,
    y: number,
    type: SpikeType = DEFAULT_SPIKE_TYPE
  ): boolean {
    return this.isSpikeFullyInside(x, y, type) && !this.wouldOverlapSpike(x, y, type);
  }
}

function rectsOverlap(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}
