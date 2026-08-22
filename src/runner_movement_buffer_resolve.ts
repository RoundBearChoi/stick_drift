import { Tickable } from './tickable';
import { GameContext } from './game_context';
import { StickRunner } from './stick_runner';
import { SolidGrid } from './solid_grid';
import { resolveHorizontalCollision } from './runner_horizontal_collision';
import { resolveDownCollision } from './runner_down_collision';
import { resolveUpCollision } from './runner_up_collision';

/**
 * sole responsibility: apply movement buffers (horizontal then vertical) after collision resolution. then zero the buffers.
 * ascent (jump_buffer) has priority over fall.
 */
export class RunnerMovementBufferResolve implements Tickable {
  constructor(
    private readonly runner: StickRunner,
    private readonly gameCtx: GameContext,
    private readonly solidGrid: SolidGrid
  ) {}

  fixedUpdate(_dt: number): void {
    const ctx = this.gameCtx.runner_ctx;

    // 1. feed jump from momentum (states only write upward_momentum)
    // decrease upward_momentum by 1 every fixed update while it remains
    if (ctx.upward_momentum > 0) {
      ctx.jump_buffer = ctx.upward_momentum;
      ctx.upward_momentum = Math.max(0, ctx.upward_momentum - 1);
    }

    // 2. horizontal first
    const safeDx = resolveHorizontalCollision(
      this.runner.pos.x,
      this.runner.pos.y,
      ctx,
      this.solidGrid
    );
    this.runner.pos.x += safeDx;
    ctx.horizontal_move_buffer = 0;

    // 3. vertical after (uses the updated x so we can land on platforms we just moved onto)
    // ascent has priority — we only fall after all upward_momentum and jump_buffer are depleted
    if (ctx.jump_buffer > 0) {
      const safeUp = resolveUpCollision(
        this.runner.pos.x,
        this.runner.pos.y,
        ctx,
        this.solidGrid
      );
      this.runner.pos.y -= safeUp;

      // hit a ceiling → kill remaining upward push so we start falling next frames
      if (safeUp < ctx.jump_buffer) {
        ctx.upward_momentum = 0;
      }

      ctx.jump_buffer = 0;
    } else {
      const safeDy = resolveDownCollision(
        this.runner.pos.x,
        this.runner.pos.y,
        ctx,
        this.solidGrid
      );
      this.runner.pos.y += safeDy;
      ctx.fall_buffer = 0;
    }
  }

  register(): void {
    this.gameCtx.registerTickable(this);
  }

  unregister(): void {
    this.gameCtx.unregisterTickable(this);
  }
}
