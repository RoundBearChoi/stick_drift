import { Engine, PointerButton } from 'excalibur';
import { GameContext } from './game_context';
import { BrickType, DEFAULT_BRICK_TYPE } from './brick_type';
import { SpikeType, DEFAULT_SPIKE_TYPE } from './spike_type';
import { ObjectCategory } from './editor_mode_overlay';
import { arrBrickPlacement, arrSpikePlacement } from './level_context';
import { NearestMouseToGrid } from './nearest_mouse_to_grid';

export type EditorPlacedObject =
  | { category: ObjectCategory.Bricks; placed: arrBrickPlacement }
  | { category: ObjectCategory.Spikes; placed: arrSpikePlacement };

export class EditorPlaceTool {
  activeCategory: ObjectCategory = ObjectCategory.Bricks;
  activeBrickType: BrickType = DEFAULT_BRICK_TYPE;
  activeSpikeType: SpikeType = DEFAULT_SPIKE_TYPE;

  constructor(
    private readonly gameCtx: GameContext,
    private readonly getCursor: () => NearestMouseToGrid | undefined,
    private readonly onPlaced: (placed: EditorPlacedObject) => void
  ) {}

  handle(engine: Engine): void {
    for (const evt of engine.input.pointers.currentFrameDown) {
      if (evt.button === PointerButton.Left) {
        this.tryPlace();
        break;
      }
    }
  }

  private tryPlace(): void {
    const cursor = this.getCursor();
    if (!cursor) return;
    if (!cursor.isInsideLevel) return;

    const x = cursor.pos.x;
    const y = cursor.pos.y;
    const level = this.gameCtx.level_ctx;

    if (this.activeCategory === ObjectCategory.Spikes) {
      const type = this.activeSpikeType;
      if (!level.canPlaceSpike(x, y, type)) return;

      const placed = level.addSpike(x, y, type);
      this.onPlaced({ category: ObjectCategory.Spikes, placed });

      console.log(
        `placed spike ${type} id=${placed.id} at (${x}, ${y}) -- total ${level.spikes.length}`
      );
      return;
    }

    const type = this.activeBrickType;
    if (!level.canPlaceBrick(x, y, type)) return;

    const placed = level.addBrick(x, y, type);
    this.onPlaced({ category: ObjectCategory.Bricks, placed });

    console.log(
      `placed ${type} id=${placed.id} at (${x}, ${y}) -- total ${level.bricks.length}`
    );
  }
}
