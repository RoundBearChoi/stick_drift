import { Tickable } from './tickable';
import { GameContext } from './game_context';
import { StickRunner } from './stick_runner';
import { SolidGrid } from './solid_grid';
import { resolveHorizontalCollision } from './horizontal_collision';

/** this script's sole responsibility is to apply horizontal movement buffer to the runner and then zero the buffer. */
export class RunnerMovementBufferResolve implements Tickable {
  constructor(
    private readonly runner: StickRunner,
    private readonly gameCtx: GameContext,
    private readonly solidGrid: SolidGrid
  ) {}

  fixedUpdate(_dt: number): void {
    const runnerCtx = this.gameCtx.runner_ctx;
    const dx = runnerCtx.horizontal_move_buffer;

    // collision owns the clamping logic
    const safeDx = resolveHorizontalCollision(
      this.runner.pos.x,
      this.runner.pos.y,
      runnerCtx,
      dx,
      this.solidGrid
    );

    // apply movement
    this.runner.pos.x += safeDx;

    // zero after resolve
    runnerCtx.horizontal_move_buffer = 0;
  }

  register(): void {
    this.gameCtx.registerTickable(this);
  }

  unregister(): void {
    this.gameCtx.unregisterTickable(this);
  }
}
