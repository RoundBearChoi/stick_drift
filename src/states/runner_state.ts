import { InputInterpreter } from '../input_interpreter';
import { StickRunner } from '../stick_runner';

export interface RunnerState {
  readonly name: string;

  enter(runner: StickRunner): void;
  update(runner: StickRunner, input: InputInterpreter): void;
  exit?(runner: StickRunner): void;
}
