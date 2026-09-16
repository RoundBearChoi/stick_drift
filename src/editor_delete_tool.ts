import { Engine, Keys } from 'excalibur';
import { GameContext } from './game_context';
import { SelectableSolid } from './editor_select_tool';

export class EditorDeleteTool {
  constructor(
    private readonly gameCtx: GameContext,
    private readonly getSelected: () => SelectableSolid[],
    private readonly onDeleted: (ids: number[]) => void
  ) {}

  handle(engine: Engine): void {
    if (!engine.input.keyboard.wasPressed(Keys.Delete)) return;
    this.tryDelete();
  }

  private tryDelete(): void {
    const selected = this.getSelected();
    if (selected.length === 0) return;

    const ids = selected.map((s) => s.item.id);
    const removed = this.gameCtx.level_ctx.removeSolidsByIds(ids);

    if (removed === 0) return;

    console.log(
      `deleted ${removed} object(s) -- bricks ${this.gameCtx.level_ctx.bricks.length}, spikes ${this.gameCtx.level_ctx.spikes.length}`
    );
    this.onDeleted(ids);
  }
}
