import { Tickable } from './tickable';
import { GameContext } from './game_context';
import { StickRunner } from './stick_runner';
import { RunnerContext } from './runner_context';
import { SolidGrid, CELL_SIZE } from './solid_grid';
import { InputAction, InputInterpreter } from './input_interpreter';

/** how much of the 30px collider must overlap the adjacent wall column */
export const WALL_SLIDE_MIN_OVERLAP = 25;

/**
 * solid coverage along a 1px-wide vertical strip.
 * range is [top, bottom] = collider height (30).
 */
function solidOverlapInColumn(
  checkX: number,
  top: number,
  bottom: number,
  solidGrid: SolidGrid
): number {
  const col = Math.floor(checkX / CELL_SIZE);
  const rowStart = Math.floor(top / CELL_SIZE);
  const rowEnd = Math.floor((bottom - 1) / CELL_SIZE);

  let overlap = 0;
  for (let row = rowStart; row <= rowEnd; row++) {
    if (!solidGrid.isSolid(col, row)) continue;

    const cellTop = row * CELL_SIZE;
    const cellBottom = cellTop + CELL_SIZE;
    const amount = Math.min(bottom, cellBottom) - Math.max(top, cellTop);
    if (amount > 0) overlap += amount;
  }
  return overlap;
}

export function checkWallSlideContact(
  runnerX: number,
  runnerY: number,
  runnerCtx: RunnerContext,
  solidGrid: SolidGrid
): { left: boolean; right: boolean } {
  const halfW = runnerCtx.collider_width / 2;
  const left = runnerX - halfW;
  const right = runnerX + halfW;
  const top = runnerY - runnerCtx.collider_height;
  const bottom = runnerY;

  // horizontal resolve stops 1 integer before the brick,
  // so the first solid pixel is immediately outside the collider.
  const leftOverlap = solidOverlapInColumn(left - 1, top, bottom, solidGrid);
  const rightOverlap = solidOverlapInColumn(right + 1, top, bottom, solidGrid);

  return {
    left: leftOverlap >= WALL_SLIDE_MIN_OVERLAP,
    right: rightOverlap >= WALL_SLIDE_MIN_OVERLAP,
  };
}

/** held into a contacted wall. grounded is a separate gate. */
export function wallSlideInputSide(
  input: InputInterpreter,
  runnerCtx: RunnerContext
): 'left' | 'right' | null {
  const left = input.isHeld(InputAction.MOVE_LEFT);
  const right = input.isHeld(InputAction.MOVE_RIGHT);
  if (right === left) return null;
  if (right && runnerCtx.wall_contact_right) return 'right';
  if (left && runnerCtx.wall_contact_left) return 'left';
  return null;
}

export function canEnterWallSlide(
  input: InputInterpreter,
  runnerCtx: RunnerContext
): boolean {
  return !runnerCtx.is_grounded && wallSlideInputSide(input, runnerCtx) !== null;
}

/**
 * keeps wall_contact_left / wall_contact_right current every fixed update.
 * does not change states — jump / fall / wall-slide read the flags.
 */
export class RunnerWallSlideCheck implements Tickable {
  constructor(
    private readonly runner: StickRunner,
    private readonly gameCtx: GameContext,
    private readonly solidGrid: SolidGrid
  ) {}

  fixedUpdate(_dt: number): void {
    const ctx = this.gameCtx.runner_ctx;
    const contact = checkWallSlideContact(
      this.runner.pos.x,
      this.runner.pos.y,
      ctx,
      this.solidGrid
    );
    ctx.wall_contact_left = contact.left;
    ctx.wall_contact_right = contact.right;
  }

  register(): void {
    this.gameCtx.registerTickable(this);
  }

  unregister(): void {
    this.gameCtx.unregisterTickable(this);
  }
}
