import { InputInterpreter } from '../input_interpreter';
import { StickRunner } from '../stick_runner';
import { RunnerState, RunnerStateName } from './runner_state';

export class JumpState implements RunnerState {
  readonly state_name = RunnerStateName.JUMP;

  onEnter(runner: StickRunner): void {
    runner.playAnimationForState(this.state_name);
  }

  onFixedUpdate(_runner: StickRunner, _input: InputInterpreter): void {
  }
}
