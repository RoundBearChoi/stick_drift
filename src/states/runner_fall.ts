import { InputAction, InputInterpreter } from '../input_interpreter';
import { StickRunner } from '../stick_runner';
import { RunnerContext } from '../runner_context';
import { RunnerState, RunnerStateName } from './runner_state';
import { RunnerIdle } from './runner_idle';
import { RunnerJump } from './runner_jump';


export class RunnerFall implements RunnerState {
  readonly state_name = RunnerStateName.FALL;

  onEnter(runner: StickRunner, runnerCtx: RunnerContext): void {
    runner.playAnimationForState(
      this.state_name,
      runnerCtx.fall_animation_tick_per_frames
    );
  }

  onFixedUpdate(
    runner: StickRunner,
    input: InputInterpreter,
    runnerCtx: RunnerContext
  ): void {

    if (runnerCtx.is_grounded) {
      // IMPORTANT: if jump is pressed right as runner is hitting ground, switch straight back to jump state instead of idle
      if (input.wasPressed(InputAction.JUMP)) {
        runner.queueNewState(new RunnerJump());
        return;
      }

      // return to idle if no jump is pressed
      runner.queueNewState(new RunnerIdle());
      return;
    }

    // air control — same horizontal intent as run / jump (temp)
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
