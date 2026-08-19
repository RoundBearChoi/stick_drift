import { CELL_SIZE, SolidGrid } from './solid_grid';
import { RunnerContext } from './runner_context';

/**
 * Pure horizontal collision against the 8×8 solid grid.
 *
 * Sole responsibility: given current pose + intended dx, return the largest
 * safe dx that does not let the runner collider overlap any solid cell.
 *
 * Convention:
 *   moving right → stop so runner.right == solid.left - 1
 *   moving left  → stop so runner.left  == solid.right + 1
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

  // Rows the collider currently occupies.
  // bottom - epsilon so a foot sitting exactly on a cell boundary
  // does not count as overlapping the cell below (floor stays walkable).
  const rowStart = Math.floor(top / CELL_SIZE);
  const rowEnd = Math.floor((bottom - Number.EPSILON) / CELL_SIZE);

  if (dx > 0) {
    // Leading edge is the right side. Look at cells the right edge will enter.
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
