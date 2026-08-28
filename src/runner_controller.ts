import { Tickable } from './tickable';
import { GameContext } from './game_context';
import { StickRunner } from './stick_runner';
import { InputAction } from './input_interpreter';

/**
 * only responsibility: feed the current input buffer to the runner's active state every fixed update.
 * all transition logic lives inside the state objects.
 * this controller does not swap states — states queue, RunnerStateSwitcher commits.
 * later this controller can also modify / replace the input (AI, cutscenes, networking, etc.).
 */
export class RunnerController implements Tickable {
  constructor(
    private readonly runner: StickRunner,
    private readonly gameCtx: GameContext
  ) {}

  fixedUpdate(_dt: number): void {
    // controller gets the buffer and hands it + runner tuning to the current state.
    this.runner.state.onFixedUpdate(
      this.runner,
      this.gameCtx.input,
      this.gameCtx.runner_ctx
    );

    this.runner.syncFacing(this.gameCtx.runner_ctx);
  }

  register(): void {
    this.gameCtx.registerTickable(this);
  }

  unregister(): void {
    this.gameCtx.unregisterTickable(this);
  }
}
