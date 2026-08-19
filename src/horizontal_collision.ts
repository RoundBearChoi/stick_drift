import { CELL_SIZE, SolidGrid } from './solid_grid';
import { RunnerContext } from './runner_context';

/**
 * pure horizontal collision against 8×8 blocks.
 * this script's sole responsibility is to get current pos + intended dx and return the largest safe dx that does not let the runner collider overlap a solid cell.
 */
export function resolveHorizontalCollision(
  runnerX: number,
  runnerY: number,
  runnerCtx: RunnerContext,
  dx: number,
  solidGrid: SolidGrid
): number {
  if (dx === 0) return 0;

  const halfW = runnerCtx.collider_width / 2;
  const left = runnerX - halfW;
  const right = runnerX + halfW;
  const top = runnerY - runnerCtx.collider_height;
  const bottom = runnerY;

  // Rows the collider occupies for side checks.
  // Shrink the bottom by 2px so a solid only blocks horizontally when there
  // is at least 2px of vertical overlap. Exact edge contact (and 1px overlap)
  // with a floor does not make the floor tiles act as walls.
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
          const maxRight = solidLeft - 1; // 1 integer before the brick
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
        const minLeft = solidRight + 1; // 1 integer after the brick
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
