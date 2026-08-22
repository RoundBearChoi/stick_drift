import { CELL_SIZE, SolidGrid } from './solid_grid';
import { RunnerContext } from './runner_context';

/**
 * horizontal collision against 8×8 blocks.
 * this script's sole responsibility is to get current pos + intended dx and return the largest safe dx that does not let the runner collider overlap a solid cell.
 */
export function resolveHorizontalCollision(
  runnerX: number,
  runnerY: number,
  runnerCtx: RunnerContext,
  solidGrid: SolidGrid
): number {
  const dx = runnerCtx.horizontal_move_buffer;

  if (dx === 0) return 0;

  const halfW = runnerCtx.collider_width / 2;
  const left = runnerX - halfW;
  const right = runnerX + halfW;
  const top = runnerY - runnerCtx.collider_height;
  const bottom = runnerY;

  // rows the collider must occupy for side checks.
  // shrink the bottom by 2px so a side wall can only block when there is at least 2px of vertical overlap.
  // this means exact edge contact (1px overlap) with the floor does not make the floor act as walls.
  const rowStart = Math.floor(top / CELL_SIZE);
  const rowEnd = Math.floor((bottom - 2) / CELL_SIZE);

  if (dx > 0) {
    // leading edge is the right side. look at cells the right edge will enter.
    const startCol = Math.floor(right / CELL_SIZE);
    const endCol = Math.floor((right + dx) / CELL_SIZE);

    let clampedDx = dx;

    for (let col = startCol; col <= endCol; col++) {
      for (let row = rowStart; row <= rowEnd; row++) {
        if (solidGrid.isSolid(col, row)) {
          const solidLeft = col * CELL_SIZE;
          const maxRight = solidLeft - 1; // IMPORTANT: 1 integer before the brick
          const allowedDx = maxRight - right;
          if (allowedDx < clampedDx) {
            clampedDx = Math.max(0, allowedDx);
          }
        }
      }
    }
    return clampedDx;
  }

  // dx < 0 — leading edge is the left side
  const startCol = Math.floor(left / CELL_SIZE);
  const endCol = Math.floor((left + dx) / CELL_SIZE);

  let clampedDx = dx;

  for (let col = startCol; col >= endCol; col--) {
    for (let row = rowStart; row <= rowEnd; row++) {
      if (solidGrid.isSolid(col, row)) {
        const solidRight = (col + 1) * CELL_SIZE;
        const minLeft = solidRight + 1; // IMPORTANT: 1 integer after the brick
        const allowedDx = minLeft - left;
        if (allowedDx > clampedDx) {
          // allowedDx is less negative (or zero) → more restrictive
          clampedDx = Math.min(0, allowedDx);
        }
      }
    }
  }
  return clampedDx;
}
