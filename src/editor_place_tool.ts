import { Engine, PointerButton } from 'excalibur';
import { GameContext } from './game_context';
import { BrickType, DEFAULT_BRICK_TYPE } from './brick_type';
import { arrBrickPlacement } from './level_context';
import { NearestMouseToGrid } from './nearest_mouse_to_grid';

export class EditorPlaceTool {
  activeType: BrickType = DEFAULT_BRICK_TYPE;

  constructor(
    private readonly gameCtx: GameContext,
    private readonly getCursor: () => NearestMouseToGrid | undefined,
    private readonly onPlaced: (placed: arrBrickPlacement) => void
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
    const type = this.activeType;

    if (!level.canPlaceBrick(x, y, type)) return;

    const placed = level.addBrick(x, y, type);
    this.onPlaced(placed);

    console.log(
      `placed ${type} id=${placed.id} at (${x}, ${y}) -- total ${level.bricks.length}`
    );
  }
}
