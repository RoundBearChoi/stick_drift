import { CELL_SIZE, SolidGrid } from './solid_grid';
import { RunnerContext } from './runner_context';

/**
 * stops the runner with exclusive bottom on the solid's top (flush, no gap).
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

  /**
   * IMPORTANT:
   * left  = first pixel the collider occupies
   * right = first pixel it does NOT occupy
   *
   * left      = first pixel inside
   * right     = first pixel outside
   * right - 1 = last pixel inside
   */

  const colStart = Math.floor(left / CELL_SIZE);
  const colEnd = Math.floor((right - 1) / CELL_SIZE);

  // rows the bottom edge will cross while falling
  const startRow = Math.floor(bottom / CELL_SIZE);
  const endRow = Math.floor((bottom + dy) / CELL_SIZE);

  let clampedDy = dy;

  for (let row = startRow; row <= endRow; row++) {
    for (let col = colStart; col <= colEnd; col++) {
      if (!solidGrid.isSolid(col, row)) continue;

      const solidTop = row * CELL_SIZE;
      // exclusive bottom sits on the first solid pixel — last occupied pixel is solidTop - 1
      const maxBottom = solidTop;
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
