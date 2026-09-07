import {
  CELL_SIZE,
  MIN_VERTICAL_CONTACT_OVERLAP_PX,
  SolidGrid,
  horizontalOverlapWithCell,
} from './solid_grid';
import { RunnerContext } from './runner_context';

/**
 * stops the runner 1 integer pixel below the solid's bottom, matching the "1 before solid" rule used everywhere else.
 */
export function resolveUpCollision(
  runnerX: number,
  runnerY: number,
  runnerCtx: RunnerContext,
  solidGrid: SolidGrid
): number {
  const up = runnerCtx.move_up_buffer;

  if (up <= 0) return 0;

  const halfW = runnerCtx.collider_width / 2;
  const left = runnerX - halfW;
  const right = runnerX + halfW;
  const top = runnerY - runnerCtx.collider_height;

  // candidate columns the collider covers. a cell only counts when at least 2px
  // sit inside it — same test as checkIsGrounded / down collision, so a 1px scrape on either side is ignored.
  const colStart = Math.floor(left / CELL_SIZE);
  const colEnd = Math.floor((right - 1) / CELL_SIZE);

  // rows the top edge will cross while moving upward
  const startRow = Math.floor(top / CELL_SIZE);
  const endRow = Math.floor((top - up) / CELL_SIZE);

  let clampedUp = up;

  for (let row = startRow; row >= endRow; row--) {
    for (let col = colStart; col <= colEnd; col++) {
      if (!solidGrid.isSolid(col, row)) continue;
      if (horizontalOverlapWithCell(left, right, col) < MIN_VERTICAL_CONTACT_OVERLAP_PX) continue;

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
