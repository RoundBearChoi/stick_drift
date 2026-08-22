import { CELL_SIZE, SolidGrid } from './solid_grid';
import { RunnerContext } from './runner_context';

/**
 * this script's sole responsibility is to get current pos + intended upward distance and return the largest safe upward distance that does not let the runner collider overlap a solid cell.
 * this is only for upward movement (jump_buffer > 0).
 * stops the runner 1 integer pixel below the solid's bottom, matching the "1 before solid" rule used everywhere else.
 */
export function resolveUpCollision(
  runnerX: number,
  runnerY: number,
  runnerCtx: RunnerContext,
  solidGrid: SolidGrid
): number {
  const up = runnerCtx.jump_buffer;

  if (up <= 0) return 0;

  const halfW = runnerCtx.collider_width / 2;
  const left = runnerX - halfW;
  const right = runnerX + halfW;
  const top = runnerY - runnerCtx.collider_height;

  // shrink by 1px on each side so tiny edge contact does not count as hitting a ceiling.
  // (mirrors the down collision's side-shrink philosophy)
  const colStart = Math.floor((left + 1) / CELL_SIZE);
  const colEnd = Math.floor((right - 1) / CELL_SIZE);

  // rows the top edge will cross while moving upward
  const startRow = Math.floor(top / CELL_SIZE);
  const endRow = Math.floor((top - up) / CELL_SIZE);

  let clampedUp = up;

  for (let row = startRow; row >= endRow; row--) {
    for (let col = colStart; col <= colEnd; col++) {
      if (!solidGrid.isSolid(col, row)) continue;

      const solidBottom = (row + 1) * CELL_SIZE;
      // IMPORTANT: 1 integer below the solid (same rule as horizontal / down)
      const minTop = solidBottom + 1;
      const allowedUp = top - minTop;

      if (allowedUp < clampedUp) {
        clampedUp = Math.max(0, allowedUp);
      }
    }
  }

  return clampedUp;
}
