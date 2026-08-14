import { InputAction, InputInterpreter } from '../input_interpreter';
import { StickRunner } from '../stick_runner';
import { RunnerState, RunnerStateName } from './runner_state';
import { RunnerRun } from './runner_run';
import { RunnerJump } from './runner_jump';

export class RunnerIdle implements RunnerState {
  readonly state_name = RunnerStateName.IDLE;

  onEnter(runner: StickRunner): void {
    runner.playAnimationForState(this.state_name);
  }

  onFixedUpdate(runner: StickRunner, input: InputInterpreter): void {
    if (input.wasPressed(InputAction.JUMP)) {
      //runner.setState(new JumpState());
      //return;
    }

    const leftPressed = input.wasPressed(InputAction.MOVE_LEFT);
    const rightPressed = input.wasPressed(InputAction.MOVE_RIGHT);
    const leftHeld = input.isHeld(InputAction.MOVE_LEFT);
    const rightHeld = input.isHeld(InputAction.MOVE_RIGHT);

    // trigger run on press *or* held for snappier response
    if (leftPressed || rightPressed || leftHeld || rightHeld) {
      // set facing immediately so the mirror is correct on the first run frame
      if (rightPressed || (rightHeld && !leftHeld)) {
        runner.setFacingRightSide(true);
      } else if (leftPressed || (leftHeld && !rightHeld)) {
        runner.setFacingRightSide(false);
      }
      // both pressed/held → keep current facing

      runner.setState(new RunnerRun());
    }
  }
}
