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

  const rowStart = Math.floor(top / CELL_SIZE);
  const rowEnd = Math.floor((bottom - 1) / CELL_SIZE);

  if (dx > 0) {
    // leading edge is the right side. look at cells the right edge will enter.
    const startCol = Math.floor(right / CELL_SIZE);
    const endCol = Math.floor((right + dx) / CELL_SIZE);

    let clampedDx = dx;

    for (let col = startCol; col <= endCol; col++) {
      for (let row = rowStart; row <= rowEnd; row++) {
        if (!solidGrid.isSolid(col, row)) continue;

        const solidLeft = col * CELL_SIZE;
        const maxRight = solidLeft - 1; // 1px before the first solid pixel
        const allowedDx = maxRight - right;
        if (allowedDx < clampedDx) {
          clampedDx = Math.max(0, allowedDx);
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
      if (!solidGrid.isSolid(col, row)) continue;

      const solidRight = (col + 1) * CELL_SIZE; // exclusive end; last solid pixel is solidRight - 1
      const minLeft = solidRight; // 1px after the last solid pixel (mirrors maxRight = solidLeft - 1)
      const allowedDx = minLeft - left;
      if (allowedDx > clampedDx) {
        // allowedDx is less negative (or zero) → more restrictive
        clampedDx = Math.min(0, allowedDx);
      }
    }
  }
  return clampedDx;
}
