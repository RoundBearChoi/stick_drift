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
 * also writes to vertical_move_buffer.
 * does not change states — individual states (Idle, Run, etc.) read the flag and decide.
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

    // temporary constant gravity while airborne
    // add more complex gravity formula later
    if (!ctx.is_grounded) {
      ctx.vertical_move_buffer += 2;
    }
  }

  register(): void {
    this.gameCtx.registerTickable(this);
  }

  unregister(): void {
    this.gameCtx.unregisterTickable(this);
  }
}
