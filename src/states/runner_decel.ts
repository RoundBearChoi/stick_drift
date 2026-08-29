import { InputAction, InputInterpreter } from '../input_interpreter';
import { StickRunner } from '../stick_runner';
import { RunnerContext } from '../runner_context';
import { RunnerState, RunnerStateName } from './runner_state';
import { RunnerIdle } from './runner_idle';
import { RunnerFall } from './runner_fall';
import { RunnerJump } from './runner_jump';
import { RunnerRunAccel } from './runner_run_accel';
import { seedJumpRunMomentumFromRunAccel } from '../runner_air_run';

export function shouldEnterGroundDecel(
  input: InputInterpreter,
  runnerCtx: RunnerContext
): boolean {
  const left = input.isHeld(InputAction.MOVE_LEFT);
  const right = input.isHeld(InputAction.MOVE_RIGHT);

  if (!left && !right) return true;
  if (left && right) return false; // both held: keep current run / accel

  const wantRight = right && !left;
  return wantRight !== runnerCtx.is_facing_right_side;
}

export class RunnerDecel implements RunnerState {
  readonly state_name = RunnerStateName.DECEL;

  onEnter(runner: StickRunner, runnerCtx: RunnerContext): void {
    runner.playAnimationForState(
      this.state_name,
      runnerCtx.decel_animation_tick_per_frames
    );

    // prime so the first fixed update applies a step immediately
    runnerCtx.ground_decel_update_count =
      Math.max(1, runnerCtx.ground_decel_interval) - 1;
  }

  onFixedUpdate(
    runner: StickRunner,
    input: InputInterpreter,
    runnerCtx: RunnerContext
  ): void {
    if (!runnerCtx.is_grounded) {
      seedJumpRunMomentumFromRunAccel(runnerCtx);
      runnerCtx.air_run_update_count = 0;
      runner.queueNewState(new RunnerFall());
      return;
    }

    if (input.wasPressed(InputAction.JUMP)) {
      seedJumpRunMomentumFromRunAccel(runnerCtx);
      runner.queueNewState(new RunnerJump());
      return;
    }

    const left = input.isHeld(InputAction.MOVE_LEFT);
    const right = input.isHeld(InputAction.MOVE_RIGHT);
    const exclusiveRight = right && !left;
    const exclusiveLeft = left && !right;

    // press the same way you were already moving → resume accel from current speed
    const sameDirection =
      (runnerCtx.is_facing_right_side && exclusiveRight) ||
      (!runnerCtx.is_facing_right_side && exclusiveLeft);

    if (sameDirection) {
      runner.queueNewState(new RunnerRunAccel(runnerCtx.current_run_accel));
      return;
    }

    const oppositeDirection =
      (runnerCtx.is_facing_right_side && exclusiveLeft) ||
      (!runnerCtx.is_facing_right_side && exclusiveRight);

    const interval = Math.max(1, runnerCtx.ground_decel_interval);
    runnerCtx.ground_decel_update_count++;
    if (runnerCtx.ground_decel_update_count >= interval) {
      runnerCtx.ground_decel_update_count = 0;

      const step = oppositeDirection
        ? runnerCtx.ground_decel_amount * 2
        : runnerCtx.ground_decel_amount;

      runnerCtx.current_run_accel = Math.max(
        0,
        runnerCtx.current_run_accel - step
      );
    }

    if (runnerCtx.current_run_accel <= 0) {
      runnerCtx.current_run_accel = 0;
      runner.queueNewState(new RunnerIdle());
      return;
    }

    // still sliding the original way
    // IMPORTANT: facing does not flip during decel
    const dir = runnerCtx.is_facing_right_side ? 1 : -1;
    runnerCtx.horizontal_move_buffer = dir * runnerCtx.current_run_accel;
  }
}
