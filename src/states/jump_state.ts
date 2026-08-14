import { InputInterpreter } from '../input_interpreter';
import { StickRunner } from '../stick_runner';
import { RunnerState, RunnerStateName } from './runner_state';

export class JumpState implements RunnerState {
  readonly name = RunnerStateName.Jump;

  enter(runner: StickRunner): void {
    runner.playAnimationForState(this.name);
  }

  update(_runner: StickRunner, _input: InputInterpreter): void {
  }
}
