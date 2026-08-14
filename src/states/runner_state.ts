import { InputInterpreter } from '../input_interpreter';
import { StickRunner } from '../stick_runner';

export enum RunnerStateName {
  Idle = 'idle',
  Run = 'run',
  Jump = 'jump',
}

export interface RunnerState {
  readonly name: RunnerStateName;

  enter(runner: StickRunner): void;
  update(runner: StickRunner, input: InputInterpreter): void;
  exit?(runner: StickRunner): void;
}
