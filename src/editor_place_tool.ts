import { Engine, PointerButton } from 'excalibur';
import { GameContext } from './game_context';
import { BrickType, DEFAULT_BRICK_TYPE, brickDef } from './brick_type';
import {
  SpikeType,
  SpikeFacing,
  DEFAULT_SPIKE_TYPE,
  DEFAULT_SPIKE_FACING,
  spikeDef,
} from './spike_type';
import { ObjectCategory } from './editor_mode_overlay';
import { arrBrickPlacement, arrSpikePlacement } from './level_context';
import { NearestMouseToGrid } from './nearest_mouse_to_grid';

/**
 * TypeScript discriminated union (also called tagged union)
 * you can't put spike data on a brick object, or brick data on a spike object
 */
export type EditorPlacedObject =
  | { category: ObjectCategory.Bricks; array: arrBrickPlacement }
  | { category: ObjectCategory.Spikes; array: arrSpikePlacement };

type SnapCell = { x: number; y: number };

export class EditorPlaceTool {
  activeCategory: ObjectCategory = ObjectCategory.Bricks;
  activeBrickType: BrickType = DEFAULT_BRICK_TYPE;
  activeSpikeType: SpikeType = DEFAULT_SPIKE_TYPE;
  activeSpikeFacing: SpikeFacing = DEFAULT_SPIKE_FACING;

  private holding = false;
  private start: SnapCell | null = null;

  // palette frozen at press so mid-drag [1]/[2]/facing changes don't retarget the line
  private dragCategory = this.activeCategory;
  private dragBrickType = this.activeBrickType;
  private dragSpikeType = this.activeSpikeType;
  private dragSpikeFacing = this.activeSpikeFacing;

  /**
   * body is empty because private / readonly already means
    1. declare a class field
    2. assign the argument to that field
   */
  constructor(
    private readonly gameCtx: GameContext, // readonly locks the pointer. value can still change
    /*
    must pass a function that returns a NearestMouseToGrid object, or undefined (return nothing).
      passing an object: store this instance.
      passing a function: store this function and we can call it later. we don't care who owns that function.
    */
    private readonly getCursor: () => NearestMouseToGrid | undefined,
    private readonly onPlaced: (placed: EditorPlacedObject) => void
  ) {}

  handle(engine: Engine): void {
    for (const evt of engine.input.pointers.currentFrameDown) {
      if (evt.button === PointerButton.Left) {
        this.beginPress();
        break;
      }
    }

    for (const evt of engine.input.pointers.currentFrameUp) {
      if (evt.button === PointerButton.Left) {
        this.endPress();
        break;
      }
    }
  }

  /** call when leaving Place mode or deactivating the editor scene */
  cancelDrag(): void {
    this.holding = false;
    this.start = null;
  }

  private beginPress(): void {
    const cell = this.currentSnap();
    if (!cell) {
      this.cancelDrag();
      return;
    }

    this.holding = true;
    this.start = cell;
    this.dragCategory = this.activeCategory;
    this.dragBrickType = this.activeBrickType;
    this.dragSpikeType = this.activeSpikeType;
    this.dragSpikeFacing = this.activeSpikeFacing;
  }

  private endPress(): void {
    if (!this.holding || !this.start) {
      this.cancelDrag();
      return;
    }

    const end = this.currentSnap() ?? this.start;
    const horizontal = Math.abs(end.x - this.start.x) >= Math.abs(end.y - this.start.y);
    const cells = axisLockedCells(this.start, end, this.stepAlong(horizontal));

    let placedCount = 0;
    for (const cell of cells) {
      if (!this.canPlaceAt(cell.x, cell.y)) break;
      this.placeAt(cell.x, cell.y);
      placedCount++;
    }

    if (placedCount > 0) {
      const level = this.gameCtx.level_ctx;
      const kind =
        this.dragCategory === ObjectCategory.Spikes
          ? `spike ${this.dragSpikeType}`
          : this.dragBrickType;
      const total =
        this.dragCategory === ObjectCategory.Spikes
          ? level.spikes.length
          : level.bricks.length;
      console.log(
        `placed ${placedCount} ${kind} along line -- total ${total}`
      );
    }

    this.cancelDrag();
  }

  private currentSnap(): SnapCell | null {
    const cursor = this.getCursor();
    if (!cursor || !cursor.isInsideLevel) return null;
    return { x: cursor.pos.x, y: cursor.pos.y };
  }

  private stepAlong(horizontal: boolean): number {
    const size =
      this.dragCategory === ObjectCategory.Spikes
        ? spikeDef(this.dragSpikeType)
        : brickDef(this.dragBrickType);
    return horizontal ? size.width : size.height;
  }

  private canPlaceAt(x: number, y: number): boolean {
    const level = this.gameCtx.level_ctx;
    if (this.dragCategory === ObjectCategory.Spikes) {
      return level.canPlaceSpike(x, y, this.dragSpikeType);
    }
    return level.canPlaceBrick(x, y, this.dragBrickType);
  }

  private placeAt(x: number, y: number): void {
    const level = this.gameCtx.level_ctx;

    if (this.dragCategory === ObjectCategory.Spikes) {
      const placed = level.addSpike(
        x,
        y,
        this.dragSpikeType,
        this.dragSpikeFacing
      );
      this.onPlaced({ category: ObjectCategory.Spikes, array: placed });
      return;
    }

    const placed = level.addBrick(x, y, this.dragBrickType);
    this.onPlaced({ category: ObjectCategory.Bricks, array: placed });
  }
}

/**
 * snap-cell line from start toward end.
 * same cell → one point (old click-to-place).
 * otherwise lock to the dominant axis and step by the object size.
 */
function axisLockedCells(
  start: SnapCell,
  end: SnapCell,
  step: number
): SnapCell[] {
  const dx = end.x - start.x;
  const dy = end.y - start.y;

  if (dx === 0 && dy === 0) return [start];

  const cells: SnapCell[] = [];
  const horizontal = Math.abs(dx) >= Math.abs(dy);

  if (horizontal) {
    const dir = Math.sign(dx) || 1;
    for (let x = start.x; dir > 0 ? x <= end.x : x >= end.x; x += dir * step) {
      cells.push({ x, y: start.y });
    }
  } else {
    const dir = Math.sign(dy) || 1;
    for (let y = start.y; dir > 0 ? y <= end.y : y >= end.y; y += dir * step) {
      cells.push({ x: start.x, y });
    }
  }

  return cells;
}
