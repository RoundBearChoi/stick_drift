import { CELL_SIZE, SolidGrid } from './solid_grid';
import { RunnerContext } from './runner_context';

/**
 * this script's sole responsibility is to get current pos + intended dy and return the largest safe dy that does not let the runner collider overlap a solid cell.
 * currently only handles falling (dy > 0). jump can be added later.
 * stops the runner 1 integer pixel above the solid's top, matching horizontal "1 before solid" rule.
 */
export function resolveVerticalCollision(
  runnerX: number,
  runnerY: number,
  runnerCtx: RunnerContext,
  solidGrid: SolidGrid
): number {
  const dy = runnerCtx.vertical_move_buffer;

  if (dy === 0) return 0;

  // for now only resolve downward movement
  if (dy < 0) return dy;

  const halfW = runnerCtx.collider_width / 2;
  const left = runnerX - halfW;
  const right = runnerX + halfW;
  const bottom = runnerY;

  // shrink by 1px on each side so tiny edge contact does not count as landing on a platform.
  // (mirrors the horizontal collision's bottom-shrink of 2px philosophy)
  const colStart = Math.floor((left + 1) / CELL_SIZE);
  const colEnd = Math.floor((right - 1) / CELL_SIZE);

  // rows the bottom edge will cross while falling
  const startRow = Math.floor(bottom / CELL_SIZE);
  const endRow = Math.floor((bottom + dy) / CELL_SIZE);

  let clampedDy = dy;

  for (let row = startRow; row <= endRow; row++) {
    for (let col = colStart; col <= colEnd; col++) {
      if (!solidGrid.isSolid(col, row)) continue;

      const solidTop = row * CELL_SIZE;
      // IMPORTANT: 1 integer before the solid (same rule as horizontal)
      const maxBottom = solidTop - 1;
      const allowedDy = maxBottom - bottom;

      if (allowedDy < clampedDy) {
        clampedDy = Math.max(0, allowedDy);
      }
    }
  }

  return clampedDy;
}
