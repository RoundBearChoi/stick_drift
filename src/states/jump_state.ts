import { InputInterpreter } from '../input_interpreter';
import { StickRunner } from '../stick_runner';
import { RunnerState, RunnerStateName } from './runner_state';

export class JumpState implements RunnerState {
  readonly name = RunnerStateName.JUMP;

  onEnter(runner: StickRunner): void {
    runner.playAnimationForState(this.name);
  }

  onFixedUpdate(_runner: StickRunner, _input: InputInterpreter): void {
  }
}
