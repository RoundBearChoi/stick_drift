import { InputAction, InputInterpreter } from '../input_interpreter';
import { StickRunner } from '../stick_runner';
import { RunnerContext } from '../runner_context';
import { RunnerState, RunnerStateName } from './runner_state';
import { RunnerIdle } from './runner_idle';
import { RunnerFall } from './runner_fall';
import { RunnerJump } from './runner_jump';

export class RunnerRun implements RunnerState {
  readonly state_name = RunnerStateName.RUN;

  onEnter(runner: StickRunner, runnerCtx: RunnerContext): void {
    runner.playAnimationForState(
      this.state_name,
      runnerCtx.run_animation_tick_per_frames
    );
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

    // only write intent — do not touch position here
    const dir = runnerCtx.is_facing_right_side ? 1 : -1;
    runnerCtx.horizontal_move_buffer = dir * runnerCtx.max_run_speed;
  }
}
