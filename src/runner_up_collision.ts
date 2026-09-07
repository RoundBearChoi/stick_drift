import { CELL_SIZE, SolidGrid } from './solid_grid';
import { RunnerContext } from './runner_context';

/**
 * stops the runner with top on the solid's exclusive bottom (flush, no gap).
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

  const colStart = Math.floor(left / CELL_SIZE);
  const colEnd = Math.floor((right - 1) / CELL_SIZE);

  // rows the top edge will cross while moving upward
  const startRow = Math.floor(top / CELL_SIZE);
  const endRow = Math.floor((top - up) / CELL_SIZE);

  let clampedUp = up;

  for (let row = startRow; row >= endRow; row--) {
    for (let col = colStart; col <= colEnd; col++) {
      if (!solidGrid.isSolid(col, row)) continue;

      const solidBottom = (row + 1) * CELL_SIZE;
      // first occupied pixel sits on the first pixel below the solid
      const minTop = solidBottom;
      const allowedUp = top - minTop;

      if (allowedUp < clampedUp) {
        clampedUp = Math.max(0, allowedUp);
      }
    }
  }

  return clampedUp;
}
