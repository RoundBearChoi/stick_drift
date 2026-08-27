import { InputAction, InputInterpreter } from '../input_interpreter';
import { StickRunner } from '../stick_runner';
import { RunnerContext } from '../runner_context';
import { RunnerState, RunnerStateName } from './runner_state';
import { RunnerFall } from './runner_fall';
import { RunnerIdle } from './runner_idle';

export class RunnerJump implements RunnerState {
  readonly state_name = RunnerStateName.JUMP;

  onEnter(runner: StickRunner, runnerCtx: RunnerContext): void {
    // for now jump reuses idle animation + idle tick rate
    runner.playAnimationForState(
      this.state_name,
      runnerCtx.idle_animation_tick_per_frames
    );

    // states should only write to upward energy
    runnerCtx.current_up_vector = runnerCtx.jump_start_momentum;
    // up wins — clear any residual fall so ascent starts clean
    runnerCtx.fall_acceleration = 0;
    runnerCtx.move_down_buffer = 0;
  }

  onFixedUpdate(
    runner: StickRunner,
    input: InputInterpreter,
    runnerCtx: RunnerContext
  ): void {
    // when upward energy is gone, hand off to fall (or idle if we somehow landed)
    if (runnerCtx.current_up_vector <= 0) {
      if (runnerCtx.is_grounded) {
        runner.queueNewState(new RunnerIdle());
      } else {
        runner.queueNewState(new RunnerFall());
      }
      return;
    }

    // air control — same horizontal intent as run
    const left = input.isHeld(InputAction.MOVE_LEFT);
    const right = input.isHeld(InputAction.MOVE_RIGHT);

    if (right && !left) {
      runnerCtx.is_facing_right_side = true;
      runnerCtx.horizontal_move_buffer = runnerCtx.run_speed;
    } else if (left && !right) {
      runnerCtx.is_facing_right_side = false;
      runnerCtx.horizontal_move_buffer = -runnerCtx.run_speed;
    }
  }
}
