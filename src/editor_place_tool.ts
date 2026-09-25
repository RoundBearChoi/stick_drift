import { Engine, PointerButton } from 'excalibur';
import { GameContext } from './game_context';
import { BrickType, DEFAULT_BRICK_TYPE } from './brick_type';
import {
  SpikeType,
  SpikeFacing,
  DEFAULT_SPIKE_TYPE,
  DEFAULT_SPIKE_FACING,
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

export class EditorPlaceTool {
  activeCategory: ObjectCategory = ObjectCategory.Bricks;
  activeBrickType: BrickType = DEFAULT_BRICK_TYPE;
  activeSpikeType: SpikeType = DEFAULT_SPIKE_TYPE;
  activeSpikeFacing: SpikeFacing = DEFAULT_SPIKE_FACING;

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
    for (const evt of engine.input.pointers.currentFrameUp) { //currentFrameDown vs currentFrameUP press vs release
      if (evt.button === PointerButton.Left) {
        this.tryPlacingObject();
        break;
      }
    }
  }

  private tryPlacingObject(): void {
    const cursor = this.getCursor();
    if (!cursor) return;
    if (!cursor.isInsideLevel) return;

    const x = cursor.pos.x;
    const y = cursor.pos.y;
    const level = this.gameCtx.level_ctx;

    if (this.activeCategory === ObjectCategory.Spikes) {
      const type = this.activeSpikeType;
      if (!level.canPlaceSpike(x, y, type)) return;

      const placed = level.addSpike(x, y, type, this.activeSpikeFacing);
      this.onPlaced({ category: ObjectCategory.Spikes, array: placed });

      console.log(
        `placed spike ${type} facing=${placed.facing} id=${placed.id} at (${x}, ${y}) -- total ${level.spikes.length}`
      );
      return;
    }

    const type = this.activeBrickType;
    if (!level.canPlaceBrick(x, y, type)) return;

    const placed = level.addBrick(x, y, type);
    this.onPlaced({ category: ObjectCategory.Bricks, array: placed });

    console.log(
      `placed ${type} id=${placed.id} at (${x}, ${y}) -- total ${level.bricks.length}`
    );
  }
}
