import { Tickable } from './tickable';
import { GameContext } from './game_context';
import { StickRunner } from './stick_runner';
import { SolidGrid } from './solid_grid';
import { resolveHorizontalCollision } from './runner_horizontal_collision';
import { resolveDownCollision } from './runner_down_collision';
import { resolveUpCollision } from './runner_up_collision';

/**
 * sole responsibility: apply movement buffers (horizontal then vertical) after collision resolution. then zero the buffers.
 * ascent has priority over fall.
 */
export class RunnerMovementBufferResolve implements Tickable {
  constructor(
    private readonly runner: StickRunner,
    private readonly gameCtx: GameContext,
    private readonly solidGrid: SolidGrid
  ) {}

  fixedUpdate(_dt: number): void {
    const ctx = this.gameCtx.runner_ctx;

    // horizontal first
    const safeDx = resolveHorizontalCollision(
      this.runner.pos.x,
      this.runner.pos.y,
      ctx,
      this.solidGrid
    );
    this.runner.pos.x += safeDx;
    ctx.horizontal_move_buffer = 0;

    // apply remaining upward energy this tick, then decay
    if (ctx.current_up_vector > 0) {
      ctx.move_up_buffer = ctx.current_up_vector;

      ctx.jump_momentum_decay_counter++;
      if (ctx.jump_momentum_decay_counter >= ctx.jump_momentum_decay_interval) {
        ctx.jump_momentum_decay_counter = 0;
        ctx.current_up_vector = Math.max(
          0,
          ctx.current_up_vector - ctx.jump_momentum_decay
        );
      }
    }

    // any ascent cancels fall energy
    if (ctx.current_up_vector > 0 || ctx.move_up_buffer > 0) {
      ctx.current_fall_accel = 0;
      ctx.move_down_buffer = 0;
    }

    // vertical move comes after horizontal move
    // ascent has priority — we only fall when there is no upward intent this tick
    if (ctx.move_up_buffer > 0) {
      const safeUp = resolveUpCollision(
        this.runner.pos.x,
        this.runner.pos.y,
        ctx,
        this.solidGrid
      );
      this.runner.pos.y -= safeUp;

      // hit a ceiling → kill remaining upward push so we start falling next frames
      if (safeUp < ctx.move_up_buffer) {
        ctx.cancelUpwardMomentum();
      }

      ctx.move_up_buffer = 0;
      return;
    }

    if (ctx.current_fall_accel > 0) {
      ctx.move_down_buffer = ctx.current_fall_accel;
    }

    if (ctx.move_down_buffer > 0) {
      const safeDy = resolveDownCollision(
        this.runner.pos.x,
        this.runner.pos.y,
        ctx,
        this.solidGrid
      );
      this.runner.pos.y += safeDy;

      // landed → kill fall energy
      if (safeDy < ctx.move_down_buffer) {
        ctx.current_fall_accel = 0;
      }

      ctx.move_down_buffer = 0;
    }
  }

  register(): void {
    this.gameCtx.registerTickable(this);
  }

  unregister(): void {
    this.gameCtx.unregisterTickable(this);
  }
}
