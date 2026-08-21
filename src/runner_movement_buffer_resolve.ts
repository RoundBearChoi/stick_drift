import { Tickable } from './tickable';
import { GameContext } from './game_context';
import { StickRunner } from './stick_runner';
import { SolidGrid } from './solid_grid';
import { resolveHorizontalCollision } from './runner_horizontal_collision';
import { resolveVerticalCollision } from './runner_vertical_collision';

/**
 * sole responsibility: apply movement buffers (horizontal then vertical) after collision resolution,
 * then zero both buffers.
 */
export class RunnerMovementBufferResolve implements Tickable {
  constructor(
    private readonly runner: StickRunner,
    private readonly gameCtx: GameContext,
    private readonly solidGrid: SolidGrid
  ) {}

  fixedUpdate(_dt: number): void {
    const ctx = this.gameCtx.runner_ctx;

    // 1. horizontal first
    const safeDx = resolveHorizontalCollision(
      this.runner.pos.x,
      this.runner.pos.y,
      ctx,
      this.solidGrid
    );
    this.runner.pos.x += safeDx;
    ctx.horizontal_move_buffer = 0;

    // 2. vertical after (uses the updated x so we can land on platforms we just moved onto)
    const safeDy = resolveVerticalCollision(
      this.runner.pos.x,
      this.runner.pos.y,
      ctx,
      this.solidGrid
    );
    this.runner.pos.y += safeDy;
    ctx.vertical_move_buffer = 0;
  }

  register(): void {
    this.gameCtx.registerTickable(this);
  }

  unregister(): void {
    this.gameCtx.unregisterTickable(this);
  }
}
