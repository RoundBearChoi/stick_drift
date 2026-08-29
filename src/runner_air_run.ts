import { InputAction, InputInterpreter } from './input_interpreter';
import { RunnerContext } from './runner_context';

/**
 * sole responsibility: signed horizontal momentum while airborne.
 * opposite input brakes at 2x that amount and does not cross 0 in that step.
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

function shouldApplyAirRunStep(runnerCtx: RunnerContext): boolean {
  const interval = runnerCtx.jump_run_accel_amount;
  if (interval <= 1) return true;
  return runnerCtx.air_run_update_count % interval === 0;
}

function steerJumpRunMomentum(
  runnerCtx: RunnerContext,
  target: number,
  step: number
): void {
  const max = runnerCtx.max_run_speed;
  const clampedTarget = Math.max(-max, Math.min(max, target));

  if (runnerCtx.jump_run_momentum < clampedTarget) {
    runnerCtx.jump_run_momentum = Math.min(
      clampedTarget,
      runnerCtx.jump_run_momentum + step
    );
  } else if (runnerCtx.jump_run_momentum > clampedTarget) {
    runnerCtx.jump_run_momentum = Math.max(
      clampedTarget,
      runnerCtx.jump_run_momentum - step
    );
  }
}

function decayJumpRunMomentum(runnerCtx: RunnerContext, step: number): void {
  if (runnerCtx.jump_run_momentum > 0) {
    runnerCtx.jump_run_momentum = Math.max(
      0,
      runnerCtx.jump_run_momentum - step
    );
  } else if (runnerCtx.jump_run_momentum < 0) {
    runnerCtx.jump_run_momentum = Math.min(
      0,
      runnerCtx.jump_run_momentum + step
    );
  }
}

function isOpposingCurrentMomentum(
  runnerCtx: RunnerContext,
  desiredDir: number
): boolean {
  return runnerCtx.jump_run_momentum * desiredDir < 0;
}

/**
 * call once per airborne fixed update after vertical / hang logic.
 * facing flips on input immediately.
 * left/right steers toward ±max_run_speed.
 * opposite input brakes toward 0 at 2x, then accel the new way on a later interval.
 * no left/right input decays toward 0 at 1x.
 * always writes horizontal_move_buffer from jump_run_momentum.
 */
export function applyAirRun(
  input: InputInterpreter,
  runnerCtx: RunnerContext
): void {
  runnerCtx.air_run_update_count++;

  const left = input.isHeld(InputAction.MOVE_LEFT);
  const right = input.isHeld(InputAction.MOVE_RIGHT);
  const applyStep = shouldApplyAirRunStep(runnerCtx);
  const base = runnerCtx.run_accel_amount;
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

  runnerCtx.horizontal_move_buffer = runnerCtx.jump_run_momentum;
}
