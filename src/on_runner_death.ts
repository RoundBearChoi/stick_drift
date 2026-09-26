import { Tickable } from './tickable';
import { GameContext } from './game_context';

export class OnRunnerDeath implements Tickable {
  private _current_death_ticks = 0;
  private readonly _total_delay_ticks_on_death = 60; // 1s at 60 Hz

  constructor(
    private readonly gameCtx: GameContext,
    private readonly onReset: () => void
  ) {}

  fixedUpdate(_dt: number): void {
    if (!this.gameCtx.runner_ctx.is_dead) {
      this._current_death_ticks = 0;
      return;
    }

    this._current_death_ticks++;
    if (this._current_death_ticks < this._total_delay_ticks_on_death) return;

    this._current_death_ticks = 0;
    this.onReset();
  }

  register(): void {
    this.gameCtx.registerTickable(this);
  }

  unregister(): void {
    this.gameCtx.unregisterTickable(this);
  }
}
