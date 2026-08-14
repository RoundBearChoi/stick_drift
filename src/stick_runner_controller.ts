import { Tickable } from './tickable';
import { GameContext } from './game_context';
import { StickRunner } from './stick_runner';

/**
 * Thin controller.
 * Only responsibility: feed the current input buffer to the runner's
 * active state every fixed update.
 *
 * All transition logic lives inside the state objects.
 * Later this controller can also modify / replace the input
 * (AI, cutscenes, networking, etc.).
 */
export class StickRunnerController implements Tickable {
  constructor(
    private readonly runner: StickRunner,
    private readonly gameCtx: GameContext
  ) {}

  fixedUpdate(_dt: number): void {
    // Controller gets the buffer and hands it to the current state.
    this.runner.state.update(this.runner, this.gameCtx.input);
  }

  register(): void {
    this.gameCtx.register(this);
  }

  unregister(): void {
    this.gameCtx.unregister(this);
  }
}
