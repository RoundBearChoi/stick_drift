import { Tickable } from './tickable';
import { GameContext } from './game_context';
import { StickRunner } from './stick_runner';

/** this script's sole responsibility is to apply horizontal movement buffer to the runner and then zero the buffer. */
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
