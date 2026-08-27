import { Tickable } from './tickable';
import { GameContext } from './game_context';
import { StickRunner } from './stick_runner';

/**
 * commits a queued runner state after the current state's onFixedUpdate
 * has fully returned, and before movement buffers are resolved.
 *
 * states never swap themselves mid-update.
 * this object is the only place a queued transition becomes current.
 */
export class RunnerStateSwitcher implements Tickable {
  constructor(
    private readonly runner: StickRunner,
    private readonly gameCtx: GameContext
  ) {}

  fixedUpdate(_dt: number): void {
    this.runner.commitQueuedState(this.gameCtx.runner_ctx);
  }

  register(): void {
    this.gameCtx.registerTickable(this);
  }

  unregister(): void {
    this.gameCtx.unregisterTickable(this);
  }
}
