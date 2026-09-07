import { Tickable } from './tickable';
import { GameContext } from './game_context';
import { StickRunner } from './stick_runner';
import { RunnerContext } from './runner_context';
import { SolidGrid, CELL_SIZE } from './solid_grid';

/**
 * this script's sole responsibility is to check if runner is grounded.
 * returns true when the exclusive bottom edge sits on a solid pixel.
 */
export function checkIsGrounded(
  runnerX: number,
  runnerY: number,
  runnerCtx: RunnerContext,
  solidGrid: SolidGrid
): boolean {
  const halfW = runnerCtx.collider_width / 2;
  const left = runnerX - halfW;
  const right = runnerX + halfW;
  const checkY = runnerY; // exclusive bottom: first pixel not inside the collider

  const cellY = Math.floor(checkY / CELL_SIZE);
  const startCol = Math.floor(left / CELL_SIZE);
  const endCol = Math.floor((right - 1) / CELL_SIZE);

  for (let col = startCol; col <= endCol; col++) {
    if (solidGrid.isSolid(col, cellY)) return true;
  }

  return false;
}

/**
 * shared component that keeps runner_ctx.is_grounded up to date every fixed update.
 * also clears fall energy when grounded or when any upward push is present.
 * does not change states — individual states (Idle, Run, etc.) read the flag and decide.
 */
export class RunnerGroundChecker implements Tickable {
  constructor(
    private readonly runner: StickRunner,
    private readonly gameCtx: GameContext,
    private readonly solidGrid: SolidGrid
  ) {}

  fixedUpdate(_dt: number): void {
    const ctx = this.gameCtx.runner_ctx;
    ctx.is_grounded = checkIsGrounded(
      this.runner.pos.x,
      this.runner.pos.y,
      ctx,
      this.solidGrid
    );

    // up wins, ground cancels fall / wall-slide energy
    if (
      ctx.is_grounded ||
      ctx.current_air_up_vector > 0 ||
      ctx.move_up_buffer > 0
    ) {
      ctx.current_fall_accel = 0;
      ctx.current_wall_slide_down_accel = 0;
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
