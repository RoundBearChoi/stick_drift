import { InputInterpreter } from '../input_interpreter';
import { StickRunner } from '../stick_runner';

export enum RunnerStateName {
  IDLE = 'idle',
  RUN = 'run',
  JUMP = 'jump',
}

export interface RunnerState {
  readonly state_name: RunnerStateName;

  onEnter(runner: StickRunner): void;
  onFixedUpdate(runner: StickRunner, input: InputInterpreter): void;
  onExit?(runner: StickRunner): void;
}
