import { Engine, Keys } from 'excalibur';
import { CELL_SIZE } from './solid_grid_system';
import { GameContext } from './game_context';
import { SelectableSolid } from './editor_select_tool';

export class EditorMoveTool {
  constructor(
    private readonly gameCtx: GameContext,
    private readonly getSelected: () => SelectableSolid[],
    private readonly onMoved: (id: number, x: number, y: number) => void
  ) {}

  handle(engine: Engine): void {
    const kb = engine.input.keyboard;

    let dx = 0;
    let dy = 0;
    if (kb.wasPressed(Keys.D)) dx = CELL_SIZE;
    else if (kb.wasPressed(Keys.A)) dx = -CELL_SIZE;
    else if (kb.wasPressed(Keys.S)) dy = CELL_SIZE;
    else if (kb.wasPressed(Keys.W)) dy = -CELL_SIZE;

    if (dx === 0 && dy === 0) return;
    this.tryMove(dx, dy);
  }

  /**
   * if any of the selected objects don't have room to move or path is blocked, we don't move
   */
  private tryMove(dx: number, dy: number): void {
    const selected = this.getSelected();
    if (selected.length === 0) return;

    const level = this.gameCtx.level_ctx;
    const ignoreIds = new Set(selected.map((s) => s.item.id));

    for (const s of selected) {
      const nx = s.item.x + dx;
      const ny = s.item.y + dy;
      if (!level.isRectFullyInside(nx, ny, s.width, s.height)) return;
      if (level.wouldOverlapRect(nx, ny, s.width, s.height, ignoreIds)) return;
    }

    for (const s of selected) {
      s.item.x += dx;
      s.item.y += dy;
      this.onMoved(s.item.id, s.item.x, s.item.y);
    }
  }
}
