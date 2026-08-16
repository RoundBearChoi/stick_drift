import { InputAction, InputInterpreter } from '../input_interpreter';
import { StickRunner } from '../stick_runner';
import { RunnerContext } from '../runner_context';
import { RunnerState, RunnerStateName } from './runner_state';
import { RunnerIdle } from './runner_idle';
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
    if (input.wasPressed(InputAction.JUMP)) {
      //runner.setState(new JumpState(), runnerCtx);
      //return;
    }

    if (!input.isHeld(InputAction.MOVE_LEFT) && !input.isHeld(InputAction.MOVE_RIGHT)) {
      runner.setState(new RunnerIdle(), runnerCtx);
      return;
    }

    const left = input.isHeld(InputAction.MOVE_LEFT);
    const right = input.isHeld(InputAction.MOVE_RIGHT);

    if (right && !left) {
      runner.setFacingRightSide(true);
    } else if (left && !right) {
      runner.setFacingRightSide(false);
    }

    const dir = runner.isFacingRightSide ? 1 : -1;
    runner.pos.x += dir * runnerCtx.run_speed;
  }
}
