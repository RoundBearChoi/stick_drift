import {
  CELL_SIZE,
  MIN_VERTICAL_CONTACT_OVERLAP_PX,
  SolidGrid,
  horizontalOverlapWithCell,
} from './solid_grid';
import { RunnerContext } from './runner_context';

/**
 * stops the runner 1 integer pixel above the solid's top, matching horizontal "1 before solid" rule.
 * when bottom collision clamps movement, clear residual vertical energy.
 */
export function resolveDownCollision(
  runnerX: number,
  runnerY: number,
  runnerCtx: RunnerContext,
  solidGrid: SolidGrid
): number {
  const dy = runnerCtx.move_down_buffer;

  if (dy === 0) return 0;

  // only resolve downward movement
  if (dy < 0) return dy;

  const halfW = runnerCtx.collider_width / 2;
  const left = runnerX - halfW;
  const right = runnerX + halfW;
  const bottom = runnerY;

  // candidate columns the collider covers. a cell only counts when at least 2px
  // sit inside it — same test as checkIsGrounded, so a 1px scrape on either side is ignored.
  const colStart = Math.floor(left / CELL_SIZE);
  const colEnd = Math.floor((right - 1) / CELL_SIZE);

  // rows the bottom edge will cross while falling
  const startRow = Math.floor(bottom / CELL_SIZE);
  const endRow = Math.floor((bottom + dy) / CELL_SIZE);

  let clampedDy = dy;

  for (let row = startRow; row <= endRow; row++) {
    for (let col = colStart; col <= colEnd; col++) {
      if (!solidGrid.isSolid(col, row)) continue;
      if (horizontalOverlapWithCell(left, right, col) < MIN_VERTICAL_CONTACT_OVERLAP_PX) continue;

      const solidTop = row * CELL_SIZE;
      // IMPORTANT: 1 integer before the solid (same rule as horizontal)
      const maxBottom = solidTop - 1;
      const allowedDy = maxBottom - bottom;

      if (allowedDy < clampedDy) {
        clampedDy = Math.max(0, allowedDy);
      }
    }
  }

  // bottom collision detected → clear residual vertical energy
  if (clampedDy < dy) {
    runnerCtx.current_air_up_vector = 0;
    runnerCtx.move_up_buffer = 0;
    runnerCtx.current_fall_accel = 0;
    runnerCtx.current_wall_slide_down_accel = 0;
  }

  return clampedDy;
}
