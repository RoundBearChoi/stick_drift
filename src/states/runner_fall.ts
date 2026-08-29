import { InputAction, InputInterpreter } from '../input_interpreter';
import { StickRunner } from '../stick_runner';
import { RunnerContext } from '../runner_context';
import { RunnerState, RunnerStateName } from './runner_state';
import { RunnerIdle } from './runner_idle';
import { RunnerJump } from './runner_jump';
import { RunnerRunAccel } from './runner_run_accel';
import { applyAirRun, seedJumpRunMomentumFromStandstill } from '../runner_air_run';

export class RunnerFall implements RunnerState {
  readonly state_name = RunnerStateName.FALL;

  onEnter(runner: StickRunner, runnerCtx: RunnerContext): void {
    runner.playAnimationForState(
      this.state_name,
      runnerCtx.fall_animation_tick_per_frames
    );

    runnerCtx.fall_acceleration_counter = 0;
  }

  onFixedUpdate(
    runner: StickRunner,
    input: InputInterpreter,
    runnerCtx: RunnerContext
  ): void {
    if (runnerCtx.is_grounded) {
      runnerCtx.fall_acceleration = 0;
      runnerCtx.fall_acceleration_counter = 0;

      // IMPORTANT: if jump is pressed right as runner is hitting ground, switch straight back to jump state instead of idle
      if (input.wasPressed(InputAction.JUMP)) {
        seedJumpRunMomentumFromStandstill(runnerCtx);
        runner.queueNewState(new RunnerJump());
        return;
      }

      const left = input.isHeld(InputAction.MOVE_LEFT);
      const right = input.isHeld(InputAction.MOVE_RIGHT);

      // held left/right on land → run accel, keep air momentum instead of resetting through idle
      if (right !== left) {
        runnerCtx.is_facing_right_side = right;
        runner.queueNewState(
          new RunnerRunAccel(Math.abs(runnerCtx.jump_run_momentum))
        );
        return;
      }

      runner.queueNewState(new RunnerIdle());
      return;
    }

    // states write energy only — resolver copies into move_down_buffer
    runnerCtx.fall_acceleration_counter++;
    if (runnerCtx.fall_acceleration_counter >= runnerCtx.fall_acceleration_interval) {
      runnerCtx.fall_acceleration_counter = 0;
      runnerCtx.fall_acceleration = Math.min(
        runnerCtx.fall_acceleration + runnerCtx.fall_acceleration_step,
        runnerCtx.max_fall_acceleration
      );
    }

    applyAirRun(input, runnerCtx);
  }
}
