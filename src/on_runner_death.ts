import { Tickable } from './tickable';
import { GameContext } from './game_context';

/**
 * scene-owned death delay.
 * spike contact (or later sources) only set is_dead.
 * this script waits one simulation second, then asks the scene to restart gameplay.
 */
export class OnRunnerDeath implements Tickable {
  private dead_ticks = 0;
  private readonly delay_ticks = 60; // 1s at 60 Hz

  constructor(
    private readonly gameCtx: GameContext,
    private readonly onReset: () => void
  ) {}

  fixedUpdate(_dt: number): void {
    if (!this.gameCtx.runner_ctx.is_dead) {
      this.dead_ticks = 0;
      return;
    }

    this.dead_ticks++;
    if (this.dead_ticks < this.delay_ticks) return;

    this.dead_ticks = 0;
    this.onReset();
  }

  register(): void {
    this.gameCtx.registerTickable(this);
  }

  unregister(): void {
    this.gameCtx.unregisterTickable(this);
  }
}
