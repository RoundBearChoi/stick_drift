import { InputAction, InputInterpreter } from '../input_interpreter';
import { StickRunner } from '../stick_runner';
import { RunnerState, RunnerStateName } from './runner_state';
import { RunnerIdle } from './runner_idle';
import { RunnerJump } from './runner_jump';

export class RunnerRun implements RunnerState {
  readonly state_name = RunnerStateName.RUN;

  onEnter(runner: StickRunner): void {
    runner.playAnimationForState(this.state_name);
  }

  onFixedUpdate(runner: StickRunner, input: InputInterpreter): void {
    if (input.wasPressed(InputAction.JUMP)) {
      //runner.setState(new JumpState());
      //return;
    }

    if (!input.isHeld(InputAction.MOVE_LEFT) && !input.isHeld(InputAction.MOVE_RIGHT)) {
      runner.setState(new RunnerIdle());
      return;
    }

    // update facing from input (same animation, mirrored render)
    const left = input.isHeld(InputAction.MOVE_LEFT);
    const right = input.isHeld(InputAction.MOVE_RIGHT);

    if (right && !left) {
      runner.setFacingRightSide(true);
    } else if (left && !right) {
      runner.setFacingRightSide(false);
    }
    // both held → keep current facing
  }
}
