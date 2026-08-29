import { InputAction, InputInterpreter } from './input_interpreter';
import { RunnerContext } from './runner_context';

/**
 * sole responsibility: signed horizontal momentum while airborne.
 * states call this. this script does not swap states and does not touch position.
 * max magnitude equals max_run_speed.
 * acceleration per update equals run_accel_per_update.
 */

export function seedJumpRunMomentumFromRunAccel(runnerCtx: RunnerContext): void {
  const dir = runnerCtx.is_facing_right_side ? 1 : -1;
  runnerCtx.jump_run_momentum =
    dir * Math.min(runnerCtx.current_run_accel, runnerCtx.max_run_speed);
}

export function seedJumpRunMomentumFromMaxRunSpeed(runnerCtx: RunnerContext): void {
  const dir = runnerCtx.is_facing_right_side ? 1 : -1;
  runnerCtx.jump_run_momentum = dir * runnerCtx.max_run_speed;
}

export function seedJumpRunMomentumFromStandstill(runnerCtx: RunnerContext): void {
  runnerCtx.jump_run_momentum = 0;
}

function steerJumpRunMomentum(runnerCtx: RunnerContext, target: number): void {
  const max = runnerCtx.max_run_speed;
  const accel = runnerCtx.run_accel_per_update;
  const clampedTarget = Math.max(-max, Math.min(max, target));

  if (runnerCtx.jump_run_momentum < clampedTarget) {
    runnerCtx.jump_run_momentum = Math.min(
      clampedTarget,
      runnerCtx.jump_run_momentum + accel
    );
  } else if (runnerCtx.jump_run_momentum > clampedTarget) {
    runnerCtx.jump_run_momentum = Math.max(
      clampedTarget,
      runnerCtx.jump_run_momentum - accel
    );
  }
}

/**
 * call once per jump fixed update after vertical / hang logic.
 * facing flips on input immediately.
 * no left/right input keeps current jump_run_momentum.
 * always writes horizontal_move_buffer so releasing keys does not kill air speed.
 */
export function applyAirRun(
  input: InputInterpreter,
  runnerCtx: RunnerContext
): void {
  const left = input.isHeld(InputAction.MOVE_LEFT);
  const right = input.isHeld(InputAction.MOVE_RIGHT);

  if (right && !left) {
    runnerCtx.is_facing_right_side = true;
    steerJumpRunMomentum(runnerCtx, runnerCtx.max_run_speed);
  } else if (left && !right) {
    runnerCtx.is_facing_right_side = false;
    steerJumpRunMomentum(runnerCtx, -runnerCtx.max_run_speed);
  }

  runnerCtx.horizontal_move_buffer = runnerCtx.jump_run_momentum;
}
