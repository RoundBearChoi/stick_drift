import { InputAction, InputInterpreter } from './input_interpreter';
import { RunnerContext } from './runner_context';

/**
 * sole responsibility: signed horizontal momentum while airborne.
 * opposite input brakes at 2x that amount and does not cross 0 in that step.
 */

export function seedJumpRunMomentumFromRunAccel(runnerCtx: RunnerContext): void {
  const dir = runnerCtx.is_facing_right_side ? 1 : -1;
  runnerCtx.current_air_run_accel =
    dir * Math.min(runnerCtx.current_run_accel, runnerCtx.max_run_speed);
}

export function seedJumpRunMomentumFromStandstill(runnerCtx: RunnerContext): void {
  runnerCtx.current_air_run_accel = 0;
}

function shouldApplyAirRunStep(runnerCtx: RunnerContext): boolean {
  const interval = Math.max(1, runnerCtx.jump_run_accel_interval);
  if (interval <= 1) return true;
  // count is checked before increment so a fresh airborne period (count = 0) applies immediately
  return runnerCtx.air_run_update_count % interval === 0;
}

function steerJumpRunMomentum(
  runnerCtx: RunnerContext,
  target: number,
  step: number
): void {
  const max = runnerCtx.max_run_speed;
  const clampedTarget = Math.max(-max, Math.min(max, target));

  if (runnerCtx.current_air_run_accel < clampedTarget) {
    runnerCtx.current_air_run_accel = Math.min(
      clampedTarget,
      runnerCtx.current_air_run_accel + step
    );
  } else if (runnerCtx.current_air_run_accel > clampedTarget) {
    runnerCtx.current_air_run_accel = Math.max(
      clampedTarget,
      runnerCtx.current_air_run_accel - step
    );
  }
}

function decayJumpRunMomentum(runnerCtx: RunnerContext, step: number): void {
  if (runnerCtx.current_air_run_accel > 0) {
    runnerCtx.current_air_run_accel = Math.max(
      0,
      runnerCtx.current_air_run_accel - step
    );
  } else if (runnerCtx.current_air_run_accel < 0) {
    runnerCtx.current_air_run_accel = Math.min(
      0,
      runnerCtx.current_air_run_accel + step
    );
  }
}

function isOpposingCurrentMomentum(
  runnerCtx: RunnerContext,
  desiredDir: number
): boolean {
  return runnerCtx.current_air_run_accel * desiredDir < 0;
}

/**
 * call once per airborne fixed update after vertical / hang logic.
 * facing flips on input immediately.
 * left/right steers toward ±max_run_speed.
 * opposite input brakes toward 0 at 2x, then accel the new way on a later interval.
 * no left/right input decays toward 0 at 1x.
 * always writes horizontal_move_buffer from current_jump_run_accel.
 */
export function applyAirRun(
  input: InputInterpreter,
  runnerCtx: RunnerContext
): void {
  const left = input.isHeld(InputAction.MOVE_LEFT);
  const right = input.isHeld(InputAction.MOVE_RIGHT);
  const applyStep = shouldApplyAirRunStep(runnerCtx);
  runnerCtx.air_run_update_count++;

  const base = runnerCtx.jump_run_accel_amount;
  const brake = base * 2;

  if (right && !left) {
    runnerCtx.is_facing_right_side = true;
    if (applyStep) {
      if (isOpposingCurrentMomentum(runnerCtx, 1)) {
        decayJumpRunMomentum(runnerCtx, brake);
      } else {
        steerJumpRunMomentum(runnerCtx, runnerCtx.max_run_speed, base);
      }
    }
  } else if (left && !right) {
    runnerCtx.is_facing_right_side = false;
    if (applyStep) {
      if (isOpposingCurrentMomentum(runnerCtx, -1)) {
        decayJumpRunMomentum(runnerCtx, brake);
      } else {
        steerJumpRunMomentum(runnerCtx, -runnerCtx.max_run_speed, base);
      }
    }
  } else if (applyStep) {
    decayJumpRunMomentum(runnerCtx, base);
  }

  runnerCtx.horizontal_move_buffer = runnerCtx.current_air_run_accel;
}
