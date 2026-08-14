import { InputInterpreter } from '../input_interpreter';
import { StickRunner } from '../stick_runner';
import { RunnerState } from './runner_state';

export class JumpState implements RunnerState {
  readonly name = 'jump';

  enter(runner: StickRunner): void {
    runner.playAnimationForState(this.name);
  }

  update(_runner: StickRunner, _input: InputInterpreter): void {
  }
}
