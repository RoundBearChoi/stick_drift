import { Tickable } from './tickable';
import { GameContext } from './game_context';
import { StickRunner } from './stick_runner';
import { RunnerContext } from './runner_context';
import {
  SolidGridSystem,
  CELL_SIZE,
  verticalOverlapWithCell,
} from './solid_grid_system';
import { InputAction, InputInterpreter } from './input_interpreter';

function solidOverlapInColumn(
  checkX: number,
  top: number,
  bottom: number,
  solidGrid: SolidGridSystem
): number {
  const col = Math.floor(checkX / CELL_SIZE);
  const rowStart = Math.floor(top / CELL_SIZE);
  const rowEnd = Math.floor((bottom - 1) / CELL_SIZE);

  let overlap = 0;
  for (let row = rowStart; row <= rowEnd; row++) {
    if (!solidGrid.isSolid(col, row)) continue;
    overlap += verticalOverlapWithCell(top, bottom, row);
  }
  return overlap;
}

export function checkWallSlideContact(
  runnerX: number,
  runnerY: number,
  runnerCtx: RunnerContext,
  solidGrid: SolidGridSystem
): { left: boolean; right: boolean } {
  const halfW = runnerCtx.collider_width / 2;
  const left = runnerX - halfW;
  const right = runnerX + halfW;
  const top = runnerY - runnerCtx.collider_height;
  const bottom = runnerY;

  // flush contact: last solid pixel on the left is left-1, first solid pixel on the right is right.
  const leftOverlap = solidOverlapInColumn(left - 1, top, bottom, solidGrid);
  const rightOverlap = solidOverlapInColumn(right, top, bottom, solidGrid);

  return {
    left: leftOverlap >= runnerCtx.wall_slide_min_overlap,
    right: rightOverlap >= runnerCtx.wall_slide_min_overlap,
  };
}

/** exclusive hold away from a single contacted wall. grounded is a separate gate. */
export function isPressingAwayFromWall(
  input: InputInterpreter,
  runnerCtx: RunnerContext
): boolean {
  const left = input.isHeld(InputAction.MOVE_LEFT);
  const right = input.isHeld(InputAction.MOVE_RIGHT);
  if (right === left) return false;

  if (runnerCtx.wall_contact_right && !runnerCtx.wall_contact_left) {
    return left && !right;
  }
  if (runnerCtx.wall_contact_left && !runnerCtx.wall_contact_right) {
    return right && !left;
  }
  return false;
}

export function canEnterWallSlide(
  input: InputInterpreter,
  runnerCtx: RunnerContext
): boolean {
  if (runnerCtx.is_grounded) return false;
  if (!runnerCtx.wall_contact_left && !runnerCtx.wall_contact_right) return false;
  return !isPressingAwayFromWall(input, runnerCtx);
}

/**
 * keeps wall_contact_left / wall_contact_right current every fixed update.
 * does not change states — jump / fall / wall-slide read the flags.
 */
export class RunnerWallSlideCheck implements Tickable {
  constructor(
    private readonly runner: StickRunner,
    private readonly gameCtx: GameContext,
    private readonly solidGrid: SolidGridSystem
  ) {}

  fixedUpdate(_dt: number): void {
    const ctx = this.gameCtx.runner_ctx;
    if (ctx.is_dead) return;

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
