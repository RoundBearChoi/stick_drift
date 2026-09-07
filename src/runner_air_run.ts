import { InputAction, InputInterpreter } from './input_interpreter';
import { RunnerContext } from './runner_context';

/**
 * sole responsibility: signed horizontal momentum while airborne.
 * opposite input brakes at 2x that amount and does not cross 0 in that step.
 * wall-jump away-lock treats input as holding away and does not flip facing.
 */

export function seedJumpRunMomentumFromRunAccel(runnerCtx: RunnerContext): void {
  const dir = runnerCtx.is_facing_right_side ? 1 : -1;
  runnerCtx.current_air_run_accel =
    dir * Math.min(runnerCtx.current_run_accel, runnerCtx.max_run_speed);
}

export function seedJumpRunMomentumFromStandstill(runnerCtx: RunnerContext): void {
  runnerCtx.current_air_run_accel = 0;
}

/**
 * call from wall slide on jump press, before queueing RunnerJump('wall').
 * facing is still toward the wall. kick the other way and write the buffer
 * so this tick's resolve does not keep hugging the wall.
 */
export function seedWallJumpFromSlide(runnerCtx: RunnerContext): void {
  const awayDir = runnerCtx.is_facing_right_side ? -1 : 1;
  runnerCtx.is_facing_right_side = awayDir > 0;

  const speed = Math.min(
    runnerCtx.wall_jump_start_accel,
    runnerCtx.max_run_speed
  );
  runnerCtx.current_air_run_accel = awayDir * speed;
  runnerCtx.horizontal_move_buffer = runnerCtx.current_air_run_accel;
  runnerCtx.air_run_update_count = 0;
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
 * facing flips on input immediately unless wall-jump away-lock is live.
 * left/right steers toward ±max_run_speed.
 * opposite input brakes toward 0 at 2x, then accel the new way on a later interval.
 * no left/right input decays toward 0 at 1x.
 * always writes horizontal_move_buffer from current_air_run_accel.
 */
export function applyAirRun(
  input: InputInterpreter,
  runnerCtx: RunnerContext
): void {
  const awayLock = runnerCtx.wall_jump_away_ticks_remaining > 0;
  const left = input.isHeld(InputAction.MOVE_LEFT);
  const right = input.isHeld(InputAction.MOVE_RIGHT);
  const applyStep = shouldApplyAirRunStep(runnerCtx);
  runnerCtx.air_run_update_count++;

  const base = runnerCtx.jump_run_accel_amount;
  const brake = base * 2;

  let desiredDir = 0;
  if (awayLock) {
    desiredDir = runnerCtx.is_facing_right_side ? 1 : -1;
  } else if (right && !left) {
    desiredDir = 1;
  } else if (left && !right) {
    desiredDir = -1;
  }

  if (!awayLock) {
    if (desiredDir > 0) {
      runnerCtx.is_facing_right_side = true;
    } else if (desiredDir < 0) {
      runnerCtx.is_facing_right_side = false;
    }
  }

  if (desiredDir !== 0) {
    if (applyStep) {
      if (isOpposingCurrentMomentum(runnerCtx, desiredDir)) {
        decayJumpRunMomentum(runnerCtx, brake);
      } else {
        steerJumpRunMomentum(
          runnerCtx,
          desiredDir * runnerCtx.max_run_speed,
          base
        );
      }
    }
  } else if (applyStep) {
    decayJumpRunMomentum(runnerCtx, base);
  }

  if (runnerCtx.wall_jump_away_ticks_remaining > 0) {
    runnerCtx.wall_jump_away_ticks_remaining--;
  }

  runnerCtx.horizontal_move_buffer = runnerCtx.current_air_run_accel;
}
