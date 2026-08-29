import { InputAction, InputInterpreter } from '../input_interpreter';
import { StickRunner } from '../stick_runner';
import { RunnerContext } from '../runner_context';
import { RunnerState, RunnerStateName } from './runner_state';
import { RunnerFall } from './runner_fall';
import { RunnerJump } from './runner_jump';
import { RunnerRun } from './runner_run';
import { seedJumpRunMomentumFromRunAccel } from '../runner_air_run';
import { RunnerDecel, shouldEnterGroundDecel } from './runner_decel';

export class RunnerRunAccel implements RunnerState {
  readonly state_name = RunnerStateName.RUN_ACCEL;

  constructor(private readonly _initial_run_accel = 0) {}

  onEnter(runner: StickRunner, runnerCtx: RunnerContext): void {
    runner.playAnimationForState(
      this.state_name,
      runnerCtx.run_accel_animation_tick_per_frames
    );

    // idle → accel still starts at 0. fall → accel can pass jump_run_momentum in.
    runnerCtx.current_run_accel = Math.min(
      Math.max(0, this._initial_run_accel),
      runnerCtx.max_run_speed
    );

    // prime so the first fixed update applies a step immediately
    runnerCtx.run_accel_update_count =
      Math.max(1, runnerCtx.run_accel_interval) - 1;
  }

  onFixedUpdate(
    runner: StickRunner,
    input: InputInterpreter,
    runnerCtx: RunnerContext
  ): void {
    // leave ground → fall
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

    if (shouldEnterGroundDecel(input, runnerCtx)) {
      runner.queueNewState(new RunnerDecel());
      return;
    }

    const left = input.isHeld(InputAction.MOVE_LEFT);
    const right = input.isHeld(InputAction.MOVE_RIGHT);

    if (right && !left) {
      runnerCtx.is_facing_right_side = true;
    } else if (left && !right) {
      runnerCtx.is_facing_right_side = false;
    }

    const interval = Math.max(1, runnerCtx.run_accel_interval);
    runnerCtx.run_accel_update_count++;
    if (runnerCtx.run_accel_update_count >= interval) {
      runnerCtx.run_accel_update_count = 0;
      runnerCtx.current_run_accel += runnerCtx.run_accel_amount;
    }

    if (runnerCtx.current_run_accel >= runnerCtx.max_run_speed) {
      runnerCtx.current_run_accel = runnerCtx.max_run_speed;
      runner.queueNewState(new RunnerRun());
    }

    // only write intent — do not touch position here
    const dir = runnerCtx.is_facing_right_side ? 1 : -1;
    runnerCtx.horizontal_move_buffer = dir * runnerCtx.current_run_accel;
  }
}
