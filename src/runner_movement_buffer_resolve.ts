import { Tickable } from './tickable';
import { GameContext } from './game_context';
import { StickRunner } from './stick_runner';

/**
 * Sole responsibility: apply the horizontal movement buffer to the runner,
 * then zero the buffer.
 *
 * Must run *after* the StickRunnerController (state machine) every fixed update.
 */
export class RunnerMovementBufferResolve implements Tickable {
  constructor(
    private readonly runner: StickRunner,
    private readonly gameCtx: GameContext
  ) {}

  fixedUpdate(_dt: number): void {
    const runnerCtx = this.gameCtx.runner_ctx;

    // apply
    this.runner.pos.x += runnerCtx.horizontal_move_buffer;

    // zero after resolve
    runnerCtx.horizontal_move_buffer = 0;
  }

  register(): void {
    this.gameCtx.register(this);
  }

  unregister(): void {
    this.gameCtx.unregister(this);
  }
}
