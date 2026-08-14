import { InputAction, InputInterpreter } from '../input_interpreter';
import { StickRunner } from '../stick_runner';
import { RunnerState, RunnerStateName } from './runner_state';
import { RunState } from './run_state';
import { JumpState } from './jump_state';

export class IdleState implements RunnerState {
  readonly name = RunnerStateName.Idle;

  enter(runner: StickRunner): void {
    runner.playAnimationForState(this.name);
  }

  update(runner: StickRunner, input: InputInterpreter): void {
    if (input.wasPressed(InputAction.JUMP)) {
      runner.setState(new JumpState());
      return;
    }

    if (input.isHeld(InputAction.MOVE_LEFT) || input.isHeld(InputAction.MOVE_RIGHT)) {
      runner.setState(new RunState());
    }
  }
}
