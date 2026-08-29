import { InputAction, InputInterpreter } from '../input_interpreter';
import { StickRunner } from '../stick_runner';
import { RunnerContext } from '../runner_context';
import { RunnerState, RunnerStateName } from './runner_state';
import { RunnerIdle } from './runner_idle';
import { RunnerFall } from './runner_fall';
import { RunnerJump } from './runner_jump';
import { RunnerRun } from './runner_run';
import { seedJumpRunMomentumFromRunAccel } from '../runner_air_run';

export class RunnerRunAccel implements RunnerState {
  readonly state_name = RunnerStateName.RUN_ACCEL;

  onEnter(runner: StickRunner, runnerCtx: RunnerContext): void {
    runner.playAnimationForState(
      this.state_name,
      runnerCtx.run_accel_animation_tick_per_frames
    );

    // start from a standstill every time we enter this state
    runnerCtx.current_run_accel = 0;
  }

  onFixedUpdate(
    runner: StickRunner,
    input: InputInterpreter,
    runnerCtx: RunnerContext
  ): void {
    // leave ground → fall
    if (!runnerCtx.is_grounded) {
      runner.queueNewState(new RunnerFall());
      return;
    }

    if (input.wasPressed(InputAction.JUMP)) {
      seedJumpRunMomentumFromRunAccel(runnerCtx);
      runner.queueNewState(new RunnerJump());
      return;
    }

    if (!input.isHeld(InputAction.MOVE_LEFT) && !input.isHeld(InputAction.MOVE_RIGHT)) {
      runner.queueNewState(new RunnerIdle());
      return;
    }

    const left = input.isHeld(InputAction.MOVE_LEFT);
    const right = input.isHeld(InputAction.MOVE_RIGHT);

    if (right && !left) {
      runnerCtx.is_facing_right_side = true;
    } else if (left && !right) {
      runnerCtx.is_facing_right_side = false;
    }

    runnerCtx.current_run_accel += runnerCtx.run_accel_per_update;

    if (runnerCtx.current_run_accel >= runnerCtx.max_run_speed) {
      runnerCtx.current_run_accel = runnerCtx.max_run_speed;
      runner.queueNewState(new RunnerRun());
    }

    // only write intent — do not touch position here
    const dir = runnerCtx.is_facing_right_side ? 1 : -1;
    runnerCtx.horizontal_move_buffer = dir * runnerCtx.current_run_accel;
  }
}
