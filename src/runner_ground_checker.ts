import { Tickable } from './tickable';
import { GameContext } from './game_context';
import { StickRunner } from './stick_runner';
import { RunnerContext } from './runner_context';
import { SolidGrid, CELL_SIZE } from './solid_grid';

/**
 * this script's sole responsibility is to check if runner is grounded and add vertical move buffer.
 * returns true when at least 2 px of the runner's bottom edge sits 1 px above a solid cell.
 * (matches the horizontal collision "shrink by 2 px" philosophy so 1 px edge contact is ignored)
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
  const checkY = runnerY + 1; // 1 px below the bottom of the collider

  const cellY = Math.floor(checkY / CELL_SIZE);
  const startCol = Math.floor(left / CELL_SIZE);
  const endCol = Math.floor((right - 1) / CELL_SIZE);

  for (let col = startCol; col <= endCol; col++) {
    if (!solidGrid.isSolid(col, cellY)) continue;

    const cellLeft = col * CELL_SIZE;
    const cellRight = cellLeft + CELL_SIZE;
    const overlap = Math.min(right, cellRight) - Math.max(left, cellLeft);

    if (overlap >= 2) {
      return true;
    }
  }

  return false;
}

/**
 * shared component that keeps runner_ctx.is_grounded up to date every fixed update.
 * also writes to fall_buffer (only after upward energy is fully depleted).
 * does not change states — individual states (Idle, Run, etc.) read the flag and decide.
 *
 * residual upward energy (up_force / jump_buffer) is cleared on actual bottom collision
 * inside resolveDownCollision, not here.
 */
export class GroundChecker implements Tickable {
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

    // constant gravity while airborne.
    // only accumulate fall after all upward_momentum (and therefore jump_buffer) are depleted.
    if (!ctx.is_grounded && ctx.up_force <= 0) {
      ctx.fall_buffer += 3;
    }
  }

  register(): void {
    this.gameCtx.registerTickable(this);
  }

  unregister(): void {
    this.gameCtx.unregisterTickable(this);
  }
}
