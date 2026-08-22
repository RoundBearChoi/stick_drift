import { InputAction, InputInterpreter } from '../input_interpreter';
import { StickRunner } from '../stick_runner';
import { RunnerContext } from '../runner_context';
import { RunnerState, RunnerStateName } from './runner_state';
import { RunnerIdle } from './runner_idle';

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
      runner.setNewState(new RunnerIdle(), runnerCtx);
      return;
    }

    // air control — same horizontal intent as run / jump (temp)
    const left = input.isHeld(InputAction.MOVE_LEFT);
    const right = input.isHeld(InputAction.MOVE_RIGHT);

    if (right && !left) {
      runner.setFacingRightSide(true);
      runnerCtx.horizontal_move_buffer = runnerCtx.run_speed;
    } else if (left && !right) {
      runner.setFacingRightSide(false);
      runnerCtx.horizontal_move_buffer = -runnerCtx.run_speed;
    }
  }
}
